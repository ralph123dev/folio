import React from 'react';

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-5" style={{ backgroundColor: 'var(--folio-bg)' }}>
      <div className="container py-5 mt-4">
        <div className="text-center mb-5 pb-4 reveal">
          <h2 className="display-5 font-serif mb-4">La simplicité avant tout</h2>
          <p className="lead text-body-custom mx-auto" style={{ maxWidth: '700px' }}>
            Aucune configuration complexe. On a conçu Folio pour s'intégrer instantanément, te laissant plus de temps pour coder.
          </p>
        </div>

        <div className="row g-5 text-center mt-2">
          {/* Etape 1 */}
          <div className="col-md-4 reveal reveal-delay-1">
            <div className="px-3">
              <div className="mb-4">
                <i className="bi bi-code-slash display-4" style={{ color: 'var(--folio-primary)' }}></i>
              </div>
              <h4 className="font-serif h3 mb-3">1. Colle le script</h4>
              <p className="text-body-custom px-xl-3">
                Ajoute notre ligne de code sur ton site ou portfolio. Compatible avec toutes les plateformes (React, HTML, Webflow).
              </p>
            </div>
          </div>

          {/* Etape 2 */}
          <div className="col-md-4 reveal reveal-delay-2">
            <div className="px-3">
              <div className="mb-4">
                <i className="bi bi-envelope-paper display-4" style={{ color: 'var(--folio-primary)' }}></i>
              </div>
              <h4 className="font-serif h3 mb-3">2. Reçois ton rapport</h4>
              <p className="text-body-custom px-xl-3">
                Chaque lundi matin, un email clair et concis résume tes statistiques de visites et l'évolution de ton audience.
              </p>
            </div>
          </div>

          {/* Etape 3 */}
          <div className="col-md-4 reveal reveal-delay-3">
            <div className="px-3">
              <div className="mb-4">
                <i className="bi bi-share display-4" style={{ color: 'var(--folio-primary)' }}></i>
              </div>
              <h4 className="font-serif h3 mb-3">3. Perce sur les réseaux</h4>
              <p className="text-body-custom px-xl-3">
                Profite de nos suggestions de posts LinkedIn et Twitter basées sur les projets les plus consultés de ton portfolio.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
