import { profile } from "@/content/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <span>© {new Date().getFullYear()} {profile.studio} · {profile.name} · {profile.city}</span>
        <nav aria-label="Liens secondaires">
          <a href={profile.instagram.url} target="_blank" rel="noopener">Instagram</a>
          <a href={profile.tiktok.url} target="_blank" rel="noopener">TikTok</a>
          <a href={profile.github.url} target="_blank" rel="noopener">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
