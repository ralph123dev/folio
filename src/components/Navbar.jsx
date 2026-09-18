import React from 'react';
import logo from '../assets/logo.jpeg';

const Navbar = ({ isFreelancerPage, user, onStart, onLogin, onFreelancers, onHome, onDashboard, onLogout }) => {
  return (
    <nav className="navbar navbar-expand-lg py-4 sticky-top" style={{ backgroundColor: 'var(--folio-bg)' }}>
      <div className="container">
        <a className="navbar-brand d-flex align-items-center gap-3 fs-3" href="#" onClick={onHome}>
          <img src={logo} alt="Folio Logo" width="40" height="40" className="rounded-circle" style={{ mixBlendMode: 'multiply' }} />
          Folio
        </a>
        
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav" 
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            {isFreelancerPage ? (
              <li className="nav-item">
                <button type="button" className="nav-link text-body-custom px-4 border-0 bg-transparent" onClick={onHome}>Accueil</button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <a className="nav-link text-body-custom px-4" href="#how-it-works">Comment ça marche</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link text-body-custom px-4" href="#features">Fonctionnalités</a>
                </li>
                <li className="nav-item">
                  <button type="button" className="nav-link text-body-custom px-4 border-0 bg-transparent" onClick={onFreelancers}>Freelancers</button>
                </li>
              </>
            )}
          </ul>
          <div className="d-flex align-items-center gap-4 mt-3 mt-lg-0">
            {user ? (
              <>
                <button type="button" onClick={onDashboard} className="btn btn-link text-decoration-none text-title fw-medium">Tableau de bord</button>
                <button type="button" onClick={onLogout} className="btn btn-outline-custom px-4 py-2">
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={onLogin} className="btn btn-link text-decoration-none text-title fw-medium">Connexion</button>
                <button type="button" onClick={onStart} className="btn btn-outline-custom px-4 py-2">
                  Commencer
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
