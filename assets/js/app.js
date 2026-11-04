(() => {
  "use strict";
  const D = window.BLUNA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const catLabel = (id) => (D.categories.find((c) => c.id === id) || {}).label || id;

  document.documentElement.classList.add("js");

  /* ── Loader ───────────────────────────────────────── */
  const loader = $("#loader");
  const fill = $("#loader-fill");
  let p = 0;
  const tick = setInterval(() => { p = Math.min(p + 12 + Math.random() * 18, 92); fill.style.width = p + "%"; }, 90);
  const finish = () => { clearInterval(tick); fill.style.width = "100%"; setTimeout(() => loader.classList.add("done"), reduced ? 0 : 250); };
  if (document.readyState === "complete") finish(); else addEventListener("load", finish);
  setTimeout(finish, 2500); // ne jamais bloquer le site

  /* ── Statistiques du hero (calculées depuis data.js) ─ */
  const nWeb = D.projets.filter((x) => x.categorie === "web").length;
  const stats = [
    { n: D.projets.length, label: "projets présentés" },
    { n: nWeb, label: "sites & web apps" },
    { n: D.services.length, label: "métiers réunis" },
  ];
  $("#hero-stats").innerHTML = stats.map((s) => `<div><dt>${s.label}</dt><dd data-count="${s.n}">${s.n}</dd></div>`).join("");
  if (!reduced) {
    $$("[data-count]").forEach((el) => {
      const target = +el.dataset.count; const t0 = performance.now(); const dur = 1400;
      const step = (t) => { const k = Math.min((t - t0) / dur, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }

  /* ── Mot tournant du titre ────────────────────────── */
  const words = ["marques", "logos", "sites web", "affiches", "applications"];
  const rot = $("#rotator"); let wi = 0;
  if (!reduced) setInterval(() => {
    rot.classList.add("out");
    setTimeout(() => { wi = (wi + 1) % words.length; rot.textContent = words[wi]; rot.classList.remove("out"); }, 450);
  }, 2600);

  /* ── Bandeau défilant ─────────────────────────────── */
  const mq = ["Identité visuelle", "Logos", "Affiches", "Sites web", "Applications", "E-commerce", "Photographie", "Vidéo 9:16"];
  $("#marquee").innerHTML = [...mq, ...mq].map((t) => `<span>${t}</span>`).join("");

  /* ── Couvertures générées ─────────────────────────── */
  const initials = (t) => t.replace(/[^A-Za-zÀ-ÿ& ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  function cover(pr) {
    if (pr.image) return `<img src="${esc(pr.image)}" alt="${esc(pr.titre)}" loading="lazy">`;
    const [bg, fg] = pr.palette || ["#1c1c1f", "#f1f1f4"];
    const st = `style="--c-bg:${bg};--c-fg:${fg}"`;
    switch (pr.categorie) {
      case "web":
        return `<div class="cover cover-web" ${st}><div class="browser"><div class="browser-bar"><i></i><i></i><i></i><b>${esc(pr.slug)}.com</b></div>
          <div class="browser-body"><strong>${esc(pr.titre)}</strong><small>${esc(pr.resume)}</small><div class="ui"><span></span><span></span></div><div class="blocks"><span></span><span></span><span></span></div></div></div></div>`;
      case "identite":
        return `<div class="cover cover-logo" ${st}><div class="l-mark">${esc(initials(pr.titre))}</div><div class="l-name">${esc(pr.titre)}</div></div>`;
      case "video":
        return `<div class="cover cover-video" ${st}><div class="v-phone"><div class="v-play"></div></div><div class="v-label">9:16 · ${esc(pr.titre)}</div></div>`;
      case "photo":
        return `<div class="cover cover-photo" ${st}><span></span><span></span><span></span><b>${esc(pr.titre)}</b></div>`;
      default: {
        const w = pr.titre.split(" ");
        const t = w.length > 1 ? `${esc(w.slice(0, -1).join(" "))} <em>${esc(w.at(-1))}</em>` : `<em>${esc(pr.titre)}</em>`;
        return `<div class="cover cover-poster" ${st}><div class="p-shape"></div><div class="p-top"><span>${esc(catLabel(pr.categorie))}</span><span>${pr.annee || ""}</span></div><div class="p-title">${t}</div></div>`;
      }
    }
  }

  /* ── Filtres + grille ─────────────────────────────── */
  const grid = $("#grid");
  grid.innerHTML = D.projets.map((pr) => `
    <button class="card reveal" data-cat="${pr.categorie}" data-slug="${esc(pr.slug)}" data-cursor="Voir">
      <div class="card-media">${cover(pr)}</div>
      <div class="card-meta"><h3 class="card-title">${esc(pr.titre)}</h3><span class="mono">${esc(catLabel(pr.categorie))}</span></div>
      <p class="card-text">${esc(pr.resume)}</p>
    </button>`).join("");

  const counts = D.categories.reduce((a, c) => ((a[c.id] = c.id === "tout" ? D.projets.length : D.projets.filter((x) => x.categorie === c.id).length), a), {});
  const filters = $("#filters");
  filters.innerHTML = D.categories.filter((c) => counts[c.id]).map((c, i) =>
    `<button class="filter" role="tab" id="f-${c.id}" data-f="${c.id}" aria-selected="${i === 0}">${c.label}<sup>${counts[c.id]}</sup></button>`).join("");
  let currentFilter = "tout";
  try { const saved = localStorage.getItem("bluna-filter"); if (saved && counts[saved]) currentFilter = saved; } catch (e) {}
  function applyFilter(f, animate = true) {
    currentFilter = f;
    $$(".filter", filters).forEach((b) => b.setAttribute("aria-selected", b.dataset.f === f));
    $$(".card", grid).forEach((c, i) => {
      const show = f === "tout" || c.dataset.cat === f;
      c.classList.toggle("hide", !show);
      c.classList.remove("enter");
      if (show && animate && !reduced) { void c.offsetWidth; c.style.animationDelay = Math.min(i, 8) * 40 + "ms"; c.classList.add("enter"); }
    });
    try { localStorage.setItem("bluna-filter", f); } catch (e) {}
  }
  filters.addEventListener("click", (e) => { const b = e.target.closest(".filter"); if (b) applyFilter(b.dataset.f); });
  applyFilter(currentFilter, false);
  grid.addEventListener("click", (e) => { const c = e.target.closest(".card"); if (c) location.hash = "projet-" + c.dataset.slug; });

  /* ── Modale projet (lien partageable #projet-slug) ── */
  const modal = $("#modal");
  let lastFocus = null, openSlug = null;
  const visibleSlugs = () => $$(".card:not(.hide)", grid).map((c) => c.dataset.slug);
  function openModal(slug) {
    const pr = D.projets.find((x) => x.slug === slug); if (!pr) return closeModal();
    if (!openSlug) lastFocus = document.activeElement;
    openSlug = slug;
    $("#modal-cover").innerHTML = cover(pr);
    $("#modal-cat").textContent = `${catLabel(pr.categorie)}${pr.annee ? " · " + pr.annee : ""}`;
    $("#modal-title").textContent = pr.titre;
    $("#modal-desc").textContent = pr.description || pr.resume;
    $("#modal-tags").innerHTML = (pr.tags || []).map((t) => `<span>${esc(t)}</span>`).join("") + (pr.stack || []).map((t) => `<span class="stack">${esc(t)}</span>`).join("");
    const cta = $("#modal-cta");
    if (pr.lien) { cta.href = pr.lien; cta.target = "_blank"; cta.rel = "noopener"; cta.textContent = "Voir le site en ligne"; }
    else { cta.href = "#devis"; cta.removeAttribute("target"); cta.textContent = "Un projet similaire ?"; cta.dataset.service = pr.categorie; }
    modal.hidden = false; document.body.classList.add("locked");
    $(".modal-close", modal).focus({ preventScroll: true });
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true; document.body.classList.remove("locked"); openSlug = null;
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  function step(dir) {
    const list = visibleSlugs(); const i = list.indexOf(openSlug);
    const next = list[(i + dir + list.length) % list.length];
    if (next) history.replaceState(null, "", "#projet-" + next), openModal(next);
  }
  function route() {
    const h = location.hash.slice(1);
    if (h.startsWith("projet-")) openModal(h.slice(7));
    else closeModal();
  }
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) {
      history.replaceState(null, "", "#travaux"); closeModal();
    }
  });
  $("#modal-prev").addEventListener("click", () => step(-1));
  $("#modal-next").addEventListener("click", () => step(1));
  $("#modal-cta").addEventListener("click", (e) => {
    const s = e.currentTarget.dataset.service;
    if (!e.currentTarget.target) {
      closeModal();
      if (s) { const box = $(`#q-services input[value="${s === "photo" ? "video" : s}"]`); if (box && !box.checked) { box.checked = true; updateQuote(); } }
    }
  });
  addEventListener("keydown", (e) => {
    if (modal.hidden) return;
    if (e.key === "Escape") { history.replaceState(null, "", "#travaux"); closeModal(); }
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
  addEventListener("hashchange", route);

  /* ── Services & compétences ───────────────────────── */
  $("#services-list").innerHTML = D.services.map((s) => `
    <article class="service reveal">
      <h3>${esc(s.titre)}</h3><p>${esc(s.texte)}</p>
      <ul>${s.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <a class="service-link" href="#travaux" data-filter="${s.id}">Voir les exemples →</a>
    </article>`).join("");
  $("#services-list").addEventListener("click", (e) => {
    const a = e.target.closest("[data-filter]"); if (a) applyFilter(counts[a.dataset.filter] ? a.dataset.filter : "tout");
  });
  const skills = ["Illustrator", "Photoshop", "Canva", "Figma", "Next.js", "React", "Tailwind", "Android", "Montage vidéo", "Photographie"];
  $("#skills").innerHTML = skills.map((s) => `<li>${s}</li>`).join("");

  /* ── Configurateur de devis → WhatsApp ────────────── */
  const budgets = ["À définir ensemble", "Moins de 50 000 FCFA", "50 000 – 150 000 FCFA", "150 000 – 400 000 FCFA", "400 000 – 1 000 000 FCFA", "Plus de 1 000 000 FCFA"];
  const delais = ["Urgent (moins d'une semaine)", "Dans le mois", "Pas pressé"];
  const qServices = [
    { v: "identite", l: "Logo & identité" }, { v: "print", l: "Affiche / flyer" },
    { v: "web", l: "Site web" }, { v: "app", l: "Application" },
    { v: "video", l: "Photo / vidéo" }, { v: "social", l: "Visuels réseaux sociaux" },
  ];
  $("#q-services").innerHTML = qServices.map((s, i) => `<label class="chip"><input type="checkbox" id="qs-${s.v}" value="${s.v}" ${i === 0 ? "checked" : ""}><span>${s.l}</span></label>`).join("");
  $("#q-delai").innerHTML = delais.map((d, i) => `<label class="chip"><input type="radio" name="delai" id="qd-${i}" value="${i}" ${i === 1 ? "checked" : ""}><span>${d}</span></label>`).join("");
  const form = $("#quote");
  function buildMessage() {
    const sel = $$("#q-services input:checked").map((i) => qServices.find((s) => s.v === i.value).l);
    const nom = $("#q-nom").value.trim(); const ent = $("#q-entreprise").value.trim(); const msg = $("#q-message").value.trim();
    const d = delais[+($("#q-delai input:checked") || { value: 1 }).value];
    const b = budgets[+$("#q-budget").value];
    let t = nom ? `Bonjour Antoine, je suis ${nom}${ent ? ` (${ent})` : ""}.\n\n` : `Bonjour Antoine${ent ? `, je vous écris pour ${ent}` : ""}.\n\n`;
    t += `Je souhaite : ${sel.length ? sel.join(", ") : "en discuter avec vous"}.\n`;
    t += `Budget : ${b}\nDélai : ${d}\n`;
    if (msg) t += `\n${msg}\n`;
    t += `\nJ'ai vu votre portfolio. Pouvons-nous en parler ?`;
    return t;
  }
  function updateQuote() {
    $("#q-budget-out").textContent = budgets[+$("#q-budget").value];
    const t = buildMessage();
    $("#q-preview").textContent = t;
    $("#q-send").href = `https://wa.me/${D.profil.whatsapp}?text=${encodeURIComponent(t)}`;
    try { localStorage.setItem("bluna-devis", JSON.stringify({ nom: $("#q-nom").value, ent: $("#q-entreprise").value, msg: $("#q-message").value })); } catch (e) {}
  }
  try {
    const d = JSON.parse(localStorage.getItem("bluna-devis") || "null");
    if (d) { $("#q-nom").value = d.nom || ""; $("#q-entreprise").value = d.ent || ""; $("#q-message").value = d.msg || ""; }
  } catch (e) {}
  form.addEventListener("input", updateQuote);
  form.addEventListener("change", updateQuote);
  form.addEventListener("submit", (e) => e.preventDefault());
  $("#q-copy").addEventListener("click", () => {
    const t = buildMessage(); const hint = $("#q-hint");
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($("#q-preview")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); hint.textContent = "Texte sélectionné : copiez-le avec votre clavier ou un appui long."; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(() => { hint.textContent = "Message copié. Collez-le dans WhatsApp ou par e-mail."; }, fallback);
    } else fallback();
  });
  $("#q-send").addEventListener("click", () => { $("#q-hint").textContent = `WhatsApp s'ouvre avec votre message. S'il ne s'ouvre pas, écrivez au ${D.profil.telephone}.`; });
  updateQuote();

  /* ── Contact ──────────────────────────────────────── */
  const P = D.profil;
  $("#contact-grid").innerHTML = [
    { l: "WhatsApp", v: P.telephone, h: `https://wa.me/${P.whatsapp}` },
    { l: "E-mail", v: P.email },
    { l: "Instagram", v: P.instagram.label, h: P.instagram.url },
    { l: "TikTok", v: P.tiktok.label, h: P.tiktok.url },
  ].map((c) => `<div class="contact-item"><span class="label">${c.l}</span>${c.h ? `<a class="value" href="${c.h}" target="_blank" rel="noopener">${esc(c.v)}</a>` : `<span class="value">${esc(c.v)}</span>`}</div>`).join("");
  $("#year").textContent = new Date().getFullYear();

  /* ── En-tête, menu mobile, lien actif ─────────────── */
  const topbar = $("#topbar");
  const onScroll = () => topbar.classList.toggle("scrolled", scrollY > 20);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  const menuBtn = $("#menu-btn"), nav = $("#nav");
  const setMenu = (open) => { nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open); document.body.classList.toggle("locked", open); };
  menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  if ("IntersectionObserver" in window) {
    const links = $$(".nav a");
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    ["travaux", "services", "apropos", "devis"].forEach((id) => io.observe(document.getElementById(id)));

    /* Apparition douce : seuls les éléments encore hors écran sont décalés */
    if (!reduced) {
      const rv = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.remove("pending"); rv.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" });
      $$(".reveal").forEach((el) => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("pending"); rv.observe(el); } });
    }
  }

  /* ── Curseur, boutons magnétiques, inclinaison ────── */
  if (finePointer && !reduced) {
    const cur = $("#cursor"), lab = $("#cursor-label");
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; cur.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`; requestAnimationFrame(loop); })();
    document.addEventListener("mouseover", (e) => {
      const v = e.target.closest("[data-cursor]"); const h = e.target.closest("a, button, label, input, textarea");
      cur.classList.toggle("is-view", !!v); cur.classList.toggle("is-hover", !v && !!h); lab.textContent = v ? v.dataset.cursor : "";
    });
    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`; });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
    $$(".tilt").forEach((el) => {
      el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
      el.addEventListener("mousemove", (e) => { const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; el.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`; });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ── Poussière d'argent du hero (canvas) ──────────── */
  const cv = $("#hero-canvas");
  if (cv && !reduced) {
    const ctx = cv.getContext("2d"); let W, H, dpr, pts = [], mx = -999, my = -999, running = true, looping = false;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (W * H) / 14000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.4 + 0.3 }));
    };
    resize(); addEventListener("resize", resize);
    cv.parentElement.addEventListener("mousemove", (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    cv.parentElement.addEventListener("mouseleave", () => { mx = my = -999; });
    new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running && !looping) draw(); }).observe(cv);
    function draw() {
      if (!running) { looping = false; return; }
      looping = true;
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < 120) { p.x += dx / d * 1.2; p.y += dy / d * 1.2; }
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = "rgba(225,225,232,.7)"; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 110) { ctx.strokeStyle = `rgba(200,200,210,${0.14 * (1 - d / 110)})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      requestAnimationFrame(draw);
    }
  }

  route();
})();
