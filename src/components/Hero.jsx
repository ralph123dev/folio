import React from 'react';

const Hero = ({ onStart }) => {
  return (
    <section className="py-5 mt-4 mt-lg-5 text-center">
      <div className="container">
        
        {/* Texts */}
        <div className="row justify-content-center mb-5">
          <div className="col-lg-8">
            <p className="text-uppercase fw-semibold tracking-wider mb-3 reveal" style={{ color: 'var(--folio-secondary-2)', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
              Analytics pour portfolios de développeurs
            </p>
            <h1 className="display-3 lh-sm mb-4 reveal reveal-delay-1">
              Comprends qui visite <br className="d-none d-md-block" />
              ton portfolio
            </h1>
            <p className="lead text-body-custom mb-5 mx-auto fs-5 reveal reveal-delay-2" style={{ maxWidth: '600px' }}>
              Ne navigue plus à l'aveugle. Suis le parcours de tes visiteurs, identifie les projets qui captivent, et transforme ton audience en opportunités.
            </p>
            <div className="reveal reveal-delay-3">
              <button type="button" onClick={onStart} className="btn btn-primary-custom btn-lg px-5 py-3 shadow-sm">
                Créer mon compte gratuitement
              </button>
            </div>
          </div>
        </div>

        {/* SVG Illustration - Parcours visiteur */}
        <div className="row justify-content-center mt-5 pt-3 reveal reveal-delay-4">
          <div className="col-12 col-xl-10 overflow-hidden">
            <svg 
              viewBox="0 0 800 250" 
              className="w-100" 
              style={{ maxWidth: '900px', height: 'auto' }}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Path */}
              <path 
                d="M 100 120 C 200 120, 200 70, 300 70 C 400 70, 400 170, 500 170 C 600 170, 600 120, 700 120" 
                stroke="var(--folio-secondary-1)" 
                strokeWidth="2" 
                strokeDasharray="8 8" 
                fill="none"
                className="path-line"
              />
              
              {/* Point 1: Accueil */}
              <circle cx="100" cy="120" r="6" fill="var(--folio-primary)" />
              <text x="100" y="155" fill="var(--folio-text)" fontSize="14" fontFamily="Inter" textAnchor="middle" fontWeight="500">
                Accueil
              </text>

              {/* Point 2: Projets */}
              <circle cx="300" cy="70" r="8" fill="var(--folio-primary)" />
              <text x="300" y="105" fill="var(--folio-text)" fontSize="14" fontFamily="Inter" textAnchor="middle" fontWeight="500">
                Projets
              </text>

              {/* Point 3: Image projet */}
              <circle cx="500" cy="170" r="10" fill="var(--folio-primary)" />
              <text x="500" y="205" fill="var(--folio-text)" fontSize="14" fontFamily="Inter" textAnchor="middle" fontWeight="500">
                Image projet
              </text>

              {/* Point 4: Contact */}
              <circle cx="700" cy="120" r="12" fill="var(--folio-primary)" />
              <text x="700" y="155" fill="var(--folio-title)" fontSize="15" fontFamily="Inter" textAnchor="middle" fontWeight="600">
                Contact
              </text>
            </svg>
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default Hero;
