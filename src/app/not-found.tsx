import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap big-cta" style={{ minHeight: "70vh", alignContent: "center" }}>
      <p className="eyebrow">Erreur 404</p>
      <h1 className="display">Cette page <em className="silver">n'existe pas</em>.</h1>
      <div className="hero-actions"><Link href="/" className="btn">Retour à l'accueil</Link><Link href="/projets" className="btn btn-ghost">Voir les travaux</Link></div>
    </main>
  );
}
