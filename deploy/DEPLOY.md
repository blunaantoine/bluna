# Mettre OQUI en ligne sur oquitogo.com

VPS : **213.156.133.226** (le même que Socline et Sonafi). Rien ne change pour ces sites.

## 1. DNS chez LWS (zone de oquitogo.com)

| Type | Nom | Valeur | Action |
|---|---|---|---|
| A | `@` | `213.156.133.226` | **Modifier** l'enregistrement A existant (souvent sur la page 2) |
| AAAA | `@` | — | **Supprimer** s'il existe (sinon le HTTPS peut échouer) |
| CNAME | `www` | `@` | Déjà bon, ne rien changer |

Ne touchez pas aux lignes `mail`, `MX`, `imap`, `pop`, `smtp`, `TXT`, `send`, `NS`, `socline`, `sonafi` :
elles font marcher vos e-mails et vos autres sites.

Vérifier (depuis n'importe quel ordinateur) : `ping oquitogo.com` doit répondre `213.156.133.226`.
Le changement prend de quelques minutes à quelques heures.

## 2. Installation (en root sur le VPS)

```bash
git clone -b refonte-portfolio https://github.com/blunaantoine/bluna.git /opt/oqui
```

```bash
sudo bash /opt/oqui/deploy/deploy.sh
```

Le script demande le mot de passe de l'admin, trouve un port libre (à partir de 3010),
compile le site, crée le service `oqui` et le certificat HTTPS.

## 3. Mettre à jour plus tard

```bash
sudo bash /opt/oqui/deploy/deploy.sh --update
```

## Où sont les fichiers

- Code : `/opt/oqui`
- **Données à sauvegarder** : `/opt/oqui-data` (base `oqui.db`, images de l'admin, `.env`)
- Journal du site : `journalctl -u oqui -f`
- Après une modification du `.env` : `systemctl restart oqui`

## E-mail contact@oquitogo.com

Vos e-mails sont hébergés chez LWS (`mail.oquitogo.com`). Créez la boîte `contact@oquitogo.com`
dans l'espace client LWS (rubrique E-mails), puis mettez son mot de passe dans `SMTP_PASS`
du fichier `/opt/oqui-data/.env` pour recevoir les alertes de messages et de paiements.
