#!/usr/bin/env bash
# ============================================================
#  OQUI — installation / mise à jour sur le VPS (oquitogo.com)
#
#  Première installation (en root) :
#    git clone -b refonte-portfolio https://github.com/blunaantoine/bluna.git /opt/oquitogo
#    sudo bash /opt/oquitogo/deploy/deploy.sh
#
#  Mise à jour plus tard :
#    sudo bash /opt/oquitogo/deploy/deploy.sh --update
#
#  Ce script ne touche PAS aux autres sites du serveur (Socline, Sonafi…) :
#  il ajoute seulement un service « oquitogo » et un fichier Nginx dédié.
#  (/opt/oqui contient un autre projet, « Quoi » : on ne l'utilise pas.)
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/oquitogo}"
DATA_DIR="${DATA_DIR:-/opt/oquitogo-data}"     # base + images : jamais écrasés par une mise à jour
BRANCH="${BRANCH:-refonte-portfolio}"
DOMAIN="${DOMAIN:-oquitogo.com}"
EMAIL_LE="${EMAIL_LE:-blunaantoine@gmail.com}"   # e-mail pour le certificat HTTPS
UPDATE=0; [[ "${1:-}" == "--update" ]] && UPDATE=1

say()  { echo -e "\n\033[1;37m▶ $*\033[0m"; }
ok()   { echo -e "  \033[1;32m✔\033[0m $*"; }
fail() { echo -e "\n\033[1;31m✖ $*\033[0m"; exit 1; }
[[ $EUID -eq 0 ]] || fail "Lancez ce script en root : sudo bash $0"

# ── 1. Outils ────────────────────────────────────────────────
say "Vérification des outils"
command -v git >/dev/null || apt-get install -y git
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs
fi
command -v nginx >/dev/null || apt-get install -y nginx
command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx
ok "Node $(node -v), Nginx, Certbot"

# ── 2. Code ──────────────────────────────────────────────────
say "Récupération du code ($BRANCH)"
if [[ -d "$APP_DIR/.git" ]]; then
  remote=$(git -C "$APP_DIR" remote get-url origin 2>/dev/null || true)
  [[ "$remote" == *"blunaantoine/bluna"* ]] || fail "$APP_DIR contient un autre projet ($remote). Rien n'a été modifié. Choisissez un autre dossier : APP_DIR=/opt/autre-nom bash $0"
  git -C "$APP_DIR" fetch --depth 1 origin "$BRANCH" && git -C "$APP_DIR" checkout -q "$BRANCH" && git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
elif [[ -e "$APP_DIR" ]]; then
  fail "$APP_DIR existe déjà et n'est pas une copie de ce site. Rien n'a été modifié."
else
  git clone --depth 1 -b "$BRANCH" https://github.com/blunaantoine/bluna.git "$APP_DIR"
fi
ok "Code à jour dans $APP_DIR"
mkdir -p "$DATA_DIR/uploads"

# ── 3. Port libre (les ports 3000-3007 sont déjà pris sur ce serveur) ──
ENV_FILE="$APP_DIR/.env"
if [[ -f "$DATA_DIR/port" ]]; then PORT=$(cat "$DATA_DIR/port"); else
  PORT=3010; while ss -tln | grep -q ":$PORT "; do PORT=$((PORT+1)); done; echo "$PORT" > "$DATA_DIR/port"
fi
ok "OQUI utilisera le port interne $PORT"

# ── 4. Configuration (.env gardé dans $DATA_DIR) ──────────────
if [[ ! -f "$DATA_DIR/.env" ]]; then
  say "Création de la configuration"
  read -r -s -p "  Choisissez le mot de passe de l'espace admin : " ADMIN_PASS; echo
  [[ ${#ADMIN_PASS} -ge 10 ]] || fail "Mot de passe trop court (10 caractères minimum)."
  cat > "$DATA_DIR/.env" <<CONF
DATABASE_URL="file:$DATA_DIR/oquitogo.db"
UPLOAD_DIR="$DATA_DIR/uploads"
SITE_URL="https://$DOMAIN"
ADMIN_PASSWORD="$ADMIN_PASS"
SESSION_SECRET="$(openssl rand -hex 32)"

# Notifications (à remplir quand vous voulez, puis : systemctl restart oquitogo)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
SMTP_HOST="mail.$DOMAIN"
SMTP_PORT="465"
SMTP_USER="contact@$DOMAIN"
SMTP_PASS=""
NOTIFY_EMAIL="blunaantoine@gmail.com"

# Paiement FedaPay (laisser vide = transfert Mobile Money manuel uniquement)
FEDAPAY_SECRET_KEY=""
FEDAPAY_ENV="sandbox"
PAY_TMONEY_NUMBER="+228 71 99 81 55"
PAY_FLOOZ_NUMBER="+228 96 22 28 21"
CONF
  chmod 600 "$DATA_DIR/.env"
  ok "Configuration enregistrée dans $DATA_DIR/.env"
fi
ln -sf "$DATA_DIR/.env" "$ENV_FILE"

# ── 5. Dépendances, base, compilation ────────────────────────
say "Installation et compilation (quelques minutes)"
cd "$APP_DIR"
npm ci --no-audit --no-fund
npx prisma db push --skip-generate >/dev/null && npx prisma generate >/dev/null
npx tsx prisma/seed.ts
npm run build
ok "Application compilée"

# ── 6. Service systemd ───────────────────────────────────────
cat > /etc/systemd/system/oquitogo.service <<UNIT
[Unit]
Description=OQUI - oquitogo.com (Next.js, port $PORT)
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=$PORT
ExecStart=$(command -v npx) next start -p $PORT
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload && systemctl enable -q oquitogo && systemctl restart oquitogo
for i in $(seq 1 30); do curl -fs -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 1; done
curl -fs -o /dev/null "http://127.0.0.1:$PORT/" || fail "Le site ne démarre pas. Regardez : journalctl -u oquitogo -n 50"
ok "Service « oquitogo » actif"

[[ $UPDATE -eq 1 ]] && { echo -e "\n\033[1;32mMise à jour terminée : https://$DOMAIN\033[0m"; exit 0; }

# ── 7. Nginx + HTTPS ─────────────────────────────────────────
say "Nginx et certificat HTTPS pour $DOMAIN et www.$DOMAIN"
cat > /etc/nginx/conf.d/oquitogo.conf <<NGX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    client_max_body_size 20M;   # images ajoutées depuis l'admin

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGX
nginx -t && systemctl reload nginx
IP=$(curl -fs4 https://api.ipify.org || hostname -I | awk '{print $1}')
if [[ "$(getent ahostsv4 "$DOMAIN" | awk 'NR==1{print $1}')" != "$IP" ]]; then
  echo -e "\n\033[1;33m⚠ $DOMAIN ne pointe pas encore vers ce serveur ($IP).\033[0m"
  echo "  Modifiez l'enregistrement A « @ » chez LWS vers $IP, attendez quelques minutes, puis lancez :"
  echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN --redirect -m $EMAIL_LE --agree-tos -n"
  exit 0
fi
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --redirect -m "$EMAIL_LE" --agree-tos -n
echo -e "\n\033[1;32m✔ OQUI est en ligne : https://$DOMAIN   (admin : https://$DOMAIN/admin)\033[0m"
