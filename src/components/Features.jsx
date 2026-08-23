import React from 'react';

const Features = () => {
  return (
    <section id="features" className="py-5 bg-white">
      <div className="container py-5 my-3">
        <div className="text-center mb-5 pb-5 reveal">
          <h2 className="display-5 font-serif mb-4">Tout ce dont tu as besoin, sans le superflu</h2>
          <p className="lead text-body-custom mx-auto" style={{ maxWidth: '650px' }}>
            Folio se concentre sur l'essentiel pour t'apporter de la valeur, sans te noyer sous des graphiques incompréhensibles.
          </p>
        </div>

        <div className="row g-5">
          {/* Feature 1 */}
          <div className="col-md-6 col-lg-3 reveal reveal-delay-1">
            <div className="pe-xl-4">
              <div className="mb-4">
                <i className="bi bi-bullseye fs-1" style={{ color: 'var(--folio-primary)' }}></i>
              </div>
              <h5 className="font-serif h4 mb-3">Tracking précis</h5>
              <p className="text-body-custom">
                Mesure les clics sur tes boutons de contact, les téléchargements de ton CV et le temps passé sur chaque projet de ton portfolio.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="col-md-6 col-lg-3 reveal reveal-delay-2">
            <div className="pe-xl-4">
              <div className="mb-4">
                <i className="bi bi-envelope-paper fs-1" style={{ color: 'var(--folio-primary)' }}></i>
              </div>
              <h5 className="font-serif h4 mb-3">Rapport par email</h5>
              <p className="text-body-custom">
                Ne retourne plus jamais sur un dashboard complexe. Reçois l'essentiel directement dans ta boîte mail chaque semaine.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="col-md-6 col-lg-3 reveal reveal-delay-3">
            <div className="pe-xl-4">
              <div className="mb-4">
                <i className="bi bi-lightbulb fs-1" style={{ color: 'var(--folio-primary)' }}></i>
              </div>
              <h5 className="font-serif h4 mb-3">Idées de contenu</h5>
              <p className="text-body-custom">
                Notre système analyse ce qui fonctionne sur ton site et te suggère des idées de posts, des titres accrocheurs et les bons hashtags.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="col-md-6 col-lg-3 reveal reveal-delay-4">
            <div className="pe-xl-4">
              <div className="mb-4">
                <i className="bi bi-graph-up-arrow fs-1" style={{ color: 'var(--folio-primary)' }}></i>
              </div>
              <h5 className="font-serif h4 mb-3">Vue épurée</h5>
              <p className="text-body-custom">
                Pour les plus curieux, accède à un dashboard minimaliste en temps réel pour voir instantanément l'impact de tes actions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
