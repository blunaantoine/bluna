const CATS = ["identite", "web", "photo"];
type Img = { src: string; alt: string; w: number; h: number };

export function projectData(b: Record<string, unknown>, creating = false) {
  const d: Record<string, unknown> = {};
  const s = (k: string, max = 4000) => typeof b[k] === "string" ? (b[k] as string).trim().slice(0, max) : undefined;
  const list = (k: string) => Array.isArray(b[k]) ? (b[k] as unknown[]).filter((x) => typeof x === "string").map((x) => (x as string).trim()).filter(Boolean) : undefined;

  for (const k of ["title", "client", "summary", "description", "link", "coverBg"]) { const v = s(k); if (v !== undefined) d[k] = v; }
  const slug = s("slug", 80);
  if (slug !== undefined) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { error: "L'adresse (slug) ne peut contenir que des minuscules, des chiffres et des tirets." };
    d.slug = slug;
  }
  if (b.category !== undefined) { if (!CATS.includes(b.category as string)) return { error: "Catégorie inconnue." }; d.category = b.category; }
  if (b.year !== undefined) { const y = Number(b.year); if (!Number.isInteger(y) || y < 2000 || y > 2100) return { error: "Année invalide." }; d.year = y; }
  for (const k of ["featured", "published"]) if (typeof b[k] === "boolean") d[k] = b[k];
  if (typeof b.order === "number") d.order = Math.round(b.order);
  const tags = list("tags"); if (tags) d.tags = JSON.stringify(tags);
  const stack = list("stack"); if (stack) d.stack = JSON.stringify(stack);
  if (Array.isArray(b.images)) {
    const imgs = (b.images as Img[]).filter((x) => x && typeof x.src === "string" && x.src.startsWith("/")).map((x) => ({ src: x.src, alt: String(x.alt || "").slice(0, 300), w: Number(x.w) || 1200, h: Number(x.h) || 900 }));
    d.images = JSON.stringify(imgs);
    if (imgs[0]) d.cover = imgs[0].src;
  }
  if (creating) {
    for (const k of ["slug", "title", "category", "summary"]) if (!d[k]) return { error: `Le champ « ${k} » est obligatoire.` };
    if (!d.cover) return { error: "Ajoutez au moins une image." };
    d.description ??= d.summary; d.year ??= new Date().getFullYear();
  }
  return { data: d as Record<string, string | number | boolean> & { slug?: string } };
}
