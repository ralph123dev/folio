import { useEffect, useRef } from 'react';
import folioVideo from '../assets/folio.mp4';

const FolioVideo = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }, { threshold: 0.35 });

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="folio-video-section pt-5 mt-5 border-top reveal">
      <div className="row align-items-center g-4 g-lg-5">
        <div className="col-lg-5">
          <p className="text-uppercase fw-semibold mb-2" style={{ color: 'var(--folio-secondary-2)', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
            Découvre Folio
          </p>
          <h2 className="display-5 font-serif mb-3">Ton portfolio mérite d'être vu.</h2>
          <p className="lead text-body-custom mb-0">
            Une expérience claire pour comprendre ton audience et transformer chaque visite en opportunité.
          </p>
        </div>
        <div className="col-lg-7">
          <div className="folio-video-frame">
            <video
              ref={videoRef}
              className="w-100 d-block"
              src={folioVideo}
              muted
              playsInline
              preload="metadata"
              aria-label="Présentation de Folio"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

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

        <div id="pricing" className="pt-5 mt-5 border-top">
          <div className="text-center mb-5 reveal">
            <p className="text-uppercase fw-semibold mb-2" style={{ color: 'var(--folio-secondary-2)', letterSpacing: '0.1em', fontSize: '0.85rem' }}>
              Des offres pensées pour grandir
            </p>
            <h2 className="display-5 font-serif mb-3">Choisis ton accélérateur</h2>
            <p className="lead text-body-custom mx-auto mb-0" style={{ maxWidth: '650px' }}>
              Des outils simples et concrets pour trouver des clients, améliorer ta visibilité et développer ta présence en ligne.
            </p>
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-lg-4 reveal reveal-delay-1">
              <article className="pricing-card h-100 d-flex flex-column p-4 p-xl-5">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="pricing-icon"><i className="bi bi-people-fill"></i></div>
                  <span className="badge pricing-badge">Acquisition</span>
                </div>
                <h3 className="font-serif h4 mb-3">Trouver des clients</h3>
                <p className="text-body-custom flex-grow-1 mb-4">
                  Accède à un réseau de plus de 31 000 contacts qualifiés à prospecter ou à toucher avec tes campagnes publicitaires. Donne à ton business les bonnes opportunités pour décoller.
                </p>
                <div className="pricing-price mb-4">12 000 <small>F / mois</small></div>
                <button type="button" className="btn btn-outline-custom w-100">Choisir cette offre</button>
              </article>
            </div>

            <div className="col-lg-4 reveal reveal-delay-2">
              <article className="pricing-card pricing-card-featured h-100 d-flex flex-column p-4 p-xl-5">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="pricing-icon"><i className="bi bi-search-heart-fill"></i></div>
                  <span className="badge pricing-badge">Visibilité</span>
                </div>
                <h3 className="font-serif h4 mb-3">Booster ton SEO</h3>
                <p className="text-body-custom flex-grow-1 mb-4">
                  Analyse ton portfolio déjà en ligne, reçois un rapport simple et précis, et découvre exactement les pages visitées, les clics effectués et les contenus qui intéressent ton audience.
                </p>
                <div className="pricing-price mb-4">5 000 <small>F / mois</small></div>
                <button type="button" className="btn btn-primary-custom w-100">Choisir cette offre</button>
              </article>
            </div>

            <div className="col-lg-4 reveal reveal-delay-3">
              <article className="pricing-card h-100 d-flex flex-column p-4 p-xl-5">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div className="pricing-icon"><i className="bi bi-share-fill"></i></div>
                  <span className="badge pricing-badge">Réseaux</span>
                </div>
                <h3 className="font-serif h4 mb-3">Booster tes réseaux</h3>
                <p className="text-body-custom flex-grow-1 mb-4">
                  Développe une audience utile, sans abonnés fantômes. Reçois des stratégies concrètes, des idées de contenu et les hashtags adaptés pour attirer les bonnes personnes.
                </p>
                <div className="pricing-price mb-4">Dès 1 000 <small>F / mois</small></div>
                <button type="button" className="btn btn-outline-custom w-100">Choisir cette offre</button>
              </article>
            </div>
          </div>

          <FolioVideo />
        </div>
      </div>
    </section>
  );
};

export default Features;
