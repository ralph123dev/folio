import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="seo-container site-footer__grid">
        <div>
          <Link href="/" className="site-brand"><span className="site-brand__mark" aria-hidden="true">F</span><span>Folio</span></Link>
          <p>La plateforme B2B pour trouver et présenter des services freelances en développement, design et acquisition digitale.</p>
        </div>
        <div>
          <h2>Explorer</h2>
          <Link href="/freelancers">Annuaire des freelancers</Link>
          <Link href="/freelancers/developpeur-web">Développeurs web</Link>
          <Link href="/freelancers/designer-ui-ux">Designers UI/UX</Link>
        </div>
        <div>
          <h2>Pour les freelancers</h2>
          <Link href="/espace?auth=signup">Créer mon profil</Link>
          <Link href="/espace?auth=login">Gérer mon espace</Link>
        </div>
      </div>
      <div className="seo-container site-footer__bottom">© {new Date().getFullYear()} Folio. Tous droits réservés.</div>
    </footer>
  );
}
