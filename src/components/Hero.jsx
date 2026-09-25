import React, { useEffect, useState } from 'react';

const FREE_ACCESS_END = Date.parse('2026-09-27T23:59:59Z');

const getTimeRemaining = () => Math.max(0, FREE_ACCESS_END - Date.now());

const formatTimeRemaining = (timeRemaining) => {
  const totalSeconds = Math.floor(timeRemaining / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const Hero = ({ onStart, onFormation }) => {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const countdown = formatTimeRemaining(timeRemaining);

  return (
    <section className="py-5 mt-4 mt-lg-5 text-center">
      <div className="container">
        
        {/* Texts */}
        <div className="row justify-content-center mb-5">
          <div className="col-lg-8">
            <p className="text-uppercase fw-semibold tracking-wider mb-3 reveal" style={{ color: 'var(--folio-secondary-2)', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
              Analytics pour portfolios & Formation Freelance Vendeur d'Élite
            </p>
            <h1 className="display-3 lh-sm mb-4 reveal reveal-delay-1">
              Comprends qui visite <br className="d-none d-md-block" />
              ton portfolio
            </h1>
            <p className="lead text-body-custom mb-5 mx-auto fs-5 reveal reveal-delay-2" style={{ maxWidth: '600px' }}>
              Ne navigue plus à l'aveugle. Suis le parcours de tes visiteurs, identifie les projets qui captivent, et apprends à vendre tes services à l'international.
            </p>
            <div className="free-access-countdown reveal reveal-delay-3" aria-live="polite">
              <div className="free-access-countdown-copy">
                <p className="mb-0">Une fois le compte à rebours terminé, les fonctionnalités Freemium seront disponibles.</p>
              </div>
              <div className="countdown-grid" aria-label="Temps restant de l'accès gratuit">
                {[
                  ['days', 'Jours'],
                  ['hours', 'Heures'],
                  ['minutes', 'Minutes'],
                  ['seconds', 'Secondes'],
                ].map(([unit, label]) => (
                  <div className="countdown-unit" key={unit}>
                    <strong>{String(countdown[unit]).padStart(2, '0')}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="d-flex flex-wrap justify-content-center gap-2 reveal reveal-delay-3">
              <button type="button" onClick={onStart} className="btn btn-primary-custom btn-lg px-5 py-3 shadow-sm">
                Créer mon compte gratuitement
              </button>
              <button type="button" onClick={onFormation} className="btn btn-outline-custom btn-lg px-4 py-3 shadow-sm fw-bold">
                <i className="bi bi-mortarboard-fill text-warning me-2"></i>Formation Freelance 🎓
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
