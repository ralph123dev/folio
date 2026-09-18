import { useEffect, useRef, useState } from 'react';
import folioVideo from '../assets/folio.mp4';

const featureCards = [
  { visual: 'visual-track', icon: 'bi-activity', title: 'Suivi du trafic', description: "Colle un script sur ton portfolio et vois exactement quelles pages et quels projets retiennent l'attention." },
  { visual: 'visual-contact', icon: 'bi-whatsapp', title: 'Contact pour les prestations de services', description: 'Accède à des contacts WhatsApp intéressés pour présenter tes services directement et passer des appels commerciaux.' },
  { visual: 'visual-social', icon: 'bi-stars', title: 'Idées de contenu', description: 'Reçois chaque jour un titre, une description et des hashtags pour ta prochaine vidéo.' },
  { visual: 'visual-score', icon: 'bi-speedometer2', title: 'Score de visibilité', description: 'Une note simple qui résume la performance globale de ton portfolio, semaine après semaine.' },
  { visual: 'visual-alert', icon: 'bi-graph-up-arrow', title: 'Alertes de pic de trafic', description: "Sois prévenu dès qu'un afflux inhabituel de visiteurs arrive sur ton portfolio." },
];

const FeatureCarousel = () => {
  const trackRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startScroll: 0 });
  const [dragging, setDragging] = useState(false);

  const moveByCard = (direction) => {
    const card = trackRef.current?.querySelector('.folio-feature-card');
    if (!card) return;
    const gap = parseFloat(getComputedStyle(trackRef.current).gap) || 0;
    trackRef.current.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' });
  };

  const startDrag = (event) => {
    const point = event.touches?.[0] || event;
    dragRef.current = { active: true, startX: point.pageX, startScroll: trackRef.current.scrollLeft };
    setDragging(true);
  };

  const drag = (event) => {
    if (!dragRef.current.active) return;
    const point = event.touches?.[0] || event;
    trackRef.current.scrollLeft = dragRef.current.startScroll - (point.pageX - dragRef.current.startX);
  };

  const stopDrag = () => {
    dragRef.current.active = false;
    setDragging(false);
  };

  return (
    <section className="feature-carousel mt-5 pt-5 border-top reveal">
      <div className="text-center mb-4 px-3">
        <p className="text-uppercase fw-semibold mb-2" style={{ color: 'var(--folio-primary)', letterSpacing: '0.06em', fontSize: '0.8rem' }}>Fonctionnalités Folio</p>
        <h2 className="display-5 font-serif mb-0">Tout ce qu'il te faut pour comprendre et faire grandir ton portfolio</h2>
      </div>
      <div
        ref={trackRef}
        className={`feature-carousel-track ${dragging ? 'is-dragging' : ''}`}
        onMouseDown={startDrag}
        onMouseMove={drag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={startDrag}
        onTouchMove={drag}
        onTouchEnd={stopDrag}
      >
        {featureCards.map((card, index) => (
          <article className="folio-feature-card" key={card.title}>
            <div className={`feature-card-visual ${card.visual}`}>
              {index === 0 && <svg viewBox="0 0 260 170" aria-hidden="true"><path d="M 20 130 Q 90 60, 140 90 T 230 60" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" /><circle cx="20" cy="130" r="5" fill="white" /><circle cx="140" cy="90" r="4" fill="#C9C4F5" /><circle cx="230" cy="60" r="6" fill="#EE7B76" /></svg>}
              {index === 1 && <div className="mini-contact"><div><i className="bi bi-whatsapp"></i> Contact disponible</div><div><i className="bi bi-telephone"></i> Appel commercial</div><div><i className="bi bi-check-circle"></i> Service à proposer</div></div>}
              {index === 2 && <span className="mini-generate-btn"><i className="bi bi-stars"></i> Générer une idée</span>}
              {index === 3 && <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="#D6D3EF" strokeWidth="10" /><circle cx="50" cy="50" r="42" fill="none" stroke="#534AB7" strokeWidth="10" strokeDasharray="264" strokeDashoffset="70" strokeLinecap="round" transform="rotate(-90 50 50)" /><text x="50" y="56" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="22" fontWeight="600" fill="#26215C">74</text></svg>}
              {index === 4 && <svg width="150" height="90" viewBox="0 0 150 90" aria-hidden="true"><polyline points="10,70 40,55 70,60 100,30 140,20" fill="none" stroke="#3E9C5C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><circle cx="140" cy="20" r="5" fill="#3E9C5C" /></svg>}
            </div>
            <h3 className="feature-card-title">{card.title}</h3>
            <p className="feature-card-description">{card.description}</p>
            <a href="#pricing" className="feature-card-link">Apprendre encore plus <span aria-hidden="true">&#8594;</span></a>
          </article>
        ))}
      </div>
      <div className="feature-carousel-nav" aria-label="Navigation des fonctionnalités">
        <button type="button" className="feature-nav-btn" onClick={() => moveByCard(-1)} aria-label="Carte précédente">&#8592;</button>
        <button type="button" className="feature-nav-btn" onClick={() => moveByCard(1)} aria-label="Carte suivante">&#8594;</button>
      </div>
    </section>
  );
};

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

        <FeatureCarousel />

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
                <h3 className="font-serif h4 mb-3">Optimiser vos profils de Freelancer</h3>
                <p className="text-body-custom flex-grow-1 mb-4">
                  Créez un profil freelance bien optimisé pour le SEO et mettez mieux en valeur vos activités auprès des clients.
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
