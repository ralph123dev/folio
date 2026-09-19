import React from 'react';
import logo from '../assets/logo.jpeg';

const Footer = () => {
  return (
    <footer className="pt-5 pb-4" style={{ backgroundColor: 'white', borderTop: '1px solid rgba(38, 33, 92, 0.1)' }}>
      <div className="container pt-4">
        <div className="row gy-5 mb-5 reveal">
          <div className="col-lg-4 col-md-6 pe-lg-5 reveal-delay-1">
            <a className="navbar-brand d-flex align-items-center gap-3 fs-4 mb-4" href="#">
              <img src={logo} alt="Folio Logo" width="32" height="32" className="rounded-circle" style={{ mixBlendMode: 'multiply' }} />
              Folio
            </a>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.95rem' }}>
              La plateforme d'analytics conçue spécifiquement pour les développeurs et tout autres travailleurs dans le monde digital. Comprends ton audience et développe ta marque personnelle.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-body-custom text-decoration-none fs-5" aria-label="Facebook"><i className="bi bi-facebook"></i></a>
              <a href="#" className="text-body-custom text-decoration-none fs-5" aria-label="Instagram"><i className="bi bi-instagram"></i></a>
              <a href="https://wa.me/237689476780" className="text-body-custom text-decoration-none fs-5" aria-label="WhatsApp"><i className="bi bi-whatsapp"></i></a>
            </div>
          </div>
          
          <div className="col-lg-2 col-md-3 col-6 reveal-delay-2">
            <h6 className="font-serif fw-bold mb-4">Produit</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-3"><a href="#how-it-works" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Comment ça marche</a></li>
              <li className="mb-3"><a href="#features" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Fonctionnalités</a></li>
              <li className="mb-3"><a href="#pricing" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Tarifs</a></li>
              <li className="mb-3"><a href="#" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Changelog</a></li>
            </ul>
          </div>
          
          <div className="col-lg-2 col-md-3 col-6 reveal-delay-3">
            <h6 className="font-serif fw-bold mb-4">Ressources</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-3"><a href="#" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Blog</a></li>
              <li className="mb-3"><a href="#" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Guide</a></li>
              <li className="mb-3"><a href="#" className="text-body-custom text-decoration-none" style={{ opacity: 0.8 }}>Centre d'aide</a></li>
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
          <p className="mb-3 mb-md-0">&copy; {new Date().getFullYear()} Folio. Tous droits réservés.</p>
          <div className="d-flex gap-4">
            <a href="#" className="text-body-custom text-decoration-none">Légal</a>
            <a href="#" className="text-body-custom text-decoration-none">Confidentialité</a>
            <a href="#" className="text-body-custom text-decoration-none">CGU</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
