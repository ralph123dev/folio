import React, { useEffect, useState } from 'react';
import logo from '../assets/logo.jpg';

const legalContent = {
  terms: {
    title: 'Conditions générales d’utilisation de Folio Dev',
    intro: 'Ces règles définissent le cadre d’utilisation de Folio Dev et les engagements de chaque utilisateur.',
    sections: [
      ['Les obligations des utilisateurs', 'Fournir des informations exactes, protéger ses identifiants et utiliser Folio Dev de manière loyale et responsable.'],
      ['Comment le site peut être utilisé', 'Folio Dev peut être utilisé pour présenter un portfolio, suivre son audience, développer sa visibilité et accéder aux fonctionnalités proposées sur le site.'],
      ['Ce qui est interdit', 'Il est interdit de contourner la sécurité, d’usurper une identité, de publier des contenus illégaux, de harceler ou de perturber le fonctionnement du service.'],
      ['Les règles concernant les comptes et contenus publiés', 'Chaque utilisateur est responsable de son compte et des contenus qu’il publie. Il doit disposer des droits nécessaires sur ses textes, images, vidéos et liens.'],
      ['Les responsabilités du site et des utilisateurs', 'Les utilisateurs restent responsables de leurs décisions et contenus. Folio Dev met en œuvre des moyens raisonnables pour maintenir le service, sans garantir une disponibilité permanente.'],
      ['Les règles juridiques applicables', 'Les présentes règles sont soumises au droit applicable au lieu d’établissement de Folio Dev. Toute question peut être adressée au support du site.'],
    ],
  },
  privacy: {
    title: 'Politique de confidentialité de Folio Dev',
    intro: 'Folio Dev respecte tes données et les utilise uniquement pour fournir, sécuriser et améliorer ses services.',
    sections: [
      ['Données collectées', 'Nous pouvons collecter les informations nécessaires à la création du compte, au profil, à l’analytics du portfolio et au support.'],
      ['Utilisation des données', 'Les données servent à authentifier les utilisateurs, afficher le tableau de bord, mesurer les visites et améliorer l’expérience Folio Dev.'],
      ['Partage et sous-traitants', 'Les données peuvent être traitées par les services techniques indispensables au fonctionnement de la plateforme, dans le respect des obligations applicables.'],
      ['Conservation et sécurité', 'Folio Dev applique des mesures raisonnables de sécurité et conserve les données uniquement pendant la durée nécessaire à ses finalités.'],
      ['Tes droits', 'Tu peux demander l’accès, la rectification ou la suppression de tes données en contactant Folio Dev via les canaux disponibles sur le site.'],
    ],
  },
};

const Footer = ({ onFormation }) => {
  const [openLegal, setOpenLegal] = useState(null);
  const activeLegal = openLegal ? legalContent[openLegal] : null;

  useEffect(() => {
    if (!activeLegal) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpenLegal(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeLegal]);

  return (
    <>
      <footer className="pt-5 pb-4" style={{ backgroundColor: 'white', borderTop: '1px solid rgba(38, 33, 92, 0.1)' }}>
      <div className="container pt-4">
        <div className="row gy-5 mb-5 reveal">
          <div className="col-lg-4 col-md-6 pe-lg-5 reveal-delay-1">
            <a className="navbar-brand d-flex align-items-center gap-3 fs-4 mb-4" href="#">
              <img src={logo} alt="Logo Folio Dev" width="32" height="32" className="rounded-circle" style={{ mixBlendMode: 'multiply' }} />
              Folio Dev
            </a>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.95rem' }}>
              Folio Dev est la plateforme d'analytics conçue pour les développeurs et les professionnels du digital. Comprends ton audience et développe ta marque personnelle.
            </p>
            <div className="d-flex gap-3">
              <a href="https://web.facebook.com/profile.php?id=61592481980652" target="_blank" rel="noopener noreferrer" className="text-body-custom text-decoration-none fs-5" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
              <a href="#" className="text-body-custom text-decoration-none fs-5" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="https://wa.me/237689476780" target="_blank" rel="noopener noreferrer" className="text-body-custom text-decoration-none fs-5" aria-label="WhatsApp"><i className="bi bi-whatsapp"></i></a>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-3 col-6 reveal-delay-2">
            <h6 className="font-serif fw-bold mb-4">Produit</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-3"><a href="#how-it-works" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Comment ça marche</a></li>
              <li className="mb-3"><a href="#features" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Fonctionnalités</a></li>
              <li className="mb-3"><a href="#features" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Tarifs et accès</a></li>
              <li className="mb-3"><a href="#partner-title" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Partenaire</a></li>
            </ul>
          </div>
          
          <div className="col-lg-2 col-md-3 col-6 reveal-delay-3">
            <h6 className="font-serif fw-bold mb-4">Ressources</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-3"><button type="button" className="footer-link-button" onClick={onFormation}>Formation</button></li>
              <li className="mb-3"><a href="#how-it-works" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Guide de démarrage</a></li>
              <li className="mb-3"><a href="#features" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Centre d'aide</a></li>
            </ul>
          </div>
          
          <div className="col-lg-4 col-md-12 reveal-delay-4">
            <h6 className="font-serif fw-bold mb-4">S'abonner</h6>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.95rem' }}>Les meilleures astuces pour ton portfolio chaque mois.</p>
            <div className="d-flex gap-2">
              <input type="email" className="form-control bg-light border-0 py-2 px-3" placeholder="Ton email" aria-label="Email" style={{ borderRadius: '8px' }} />
              <button className="btn btn-primary-custom px-4" type="button">Go</button>
            </div>
          </div>
        </div>
        
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center pt-4 mt-2 text-body-custom" style={{ opacity: 0.7, fontSize: '0.9rem', borderTop: '1px solid rgba(38, 33, 92, 0.1)' }}>
          <p className="mb-3 mb-md-0">&copy; {new Date().getFullYear()} Folio Dev. Tous droits réservés.</p>
          <div className="d-flex gap-4 flex-wrap justify-content-center">
            <button type="button" className="footer-link-button" onClick={() => setOpenLegal('terms')}>CGU</button>
            <button type="button" className="footer-link-button" onClick={() => setOpenLegal('privacy')}>Confidentialité</button>
          </div>
        </div>
      </div>
      </footer>

      {activeLegal && (
        <div className="legal-modal-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpenLegal(null); }}>
          <section className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
            <div className="legal-modal-header">
              <div>
                <p className="legal-modal-kicker">Folio Dev</p>
                <h2 id="legal-modal-title">{activeLegal.title}</h2>
              </div>
              <button type="button" className="legal-modal-close" onClick={() => setOpenLegal(null)} aria-label="Fermer la fenêtre">
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
            <div className="legal-modal-body">
              <p className="legal-modal-intro">{activeLegal.intro}</p>
              {activeLegal.sections.map(([heading, text]) => (
                <article className="legal-modal-section" key={heading}>
                  <h3>{heading}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default Footer;
