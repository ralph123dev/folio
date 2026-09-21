import Link from 'next/link';

export default function Header() {
  return (
    <header className="site-header">
      <div className="seo-container site-header__inner">
        <Link href="/" className="site-brand" aria-label="Folio, accueil">
          <span className="site-brand__mark" aria-hidden="true">F</span>
          <span>Folio</span>
        </Link>
        <nav aria-label="Navigation principale" className="site-nav">
          <Link href="/freelancers">Trouver un freelance</Link>
          <Link href="/#comment-ca-marche">Comment ça marche</Link>
          <Link href="/espace?auth=login">Connexion</Link>
          <Link href="/espace?auth=signup" className="site-button site-button--small">Créer mon profil</Link>
        </nav>
      </div>
    </header>
  );
}
