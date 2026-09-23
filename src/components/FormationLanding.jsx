import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import FormationPaymentModal from './FormationPaymentModal';

export default function FormationLanding({ user, onBack, onOpenReader, onGoogleLogin }) {
  const [hasPaidAccess, setHasPaidAccess] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkAccess = async () => {
      if (!user) {
        setLoadingAccess(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('formation_access')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (isMounted && data && data.status === 'active') {
          setHasPaidAccess(true);
        }
      } catch (err) {
        console.error("Erreur vérification accès formation:", err);
      } finally {
        if (isMounted) setLoadingAccess(false);
      }
    };

    checkAccess();
    return () => { isMounted = false; };
  }, [user]);

  const handleActionClick = () => {
    if (!user) {
      if (onGoogleLogin) {
        onGoogleLogin();
      } else {
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin }
        });
      }
      return;
    }

    if (hasPaidAccess) {
      onOpenReader();
    } else {
      setShowPaymentModal(true);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--folio-bg)' }}>
      {/* Header Bar */}
      <header className="py-4 border-bottom bg-white sticky-top shadow-sm">
        <div className="container d-flex justify-content-between align-items-center">
          <button 
            type="button" 
            className="btn btn-outline-secondary rounded-pill px-4 btn-sm d-flex align-items-center gap-2 fw-medium"
            onClick={onBack}
          >
            <i className="bi bi-arrow-left"></i> Retour à l'accueil
          </button>
          
          <span className="badge text-bg-warning rounded-pill px-3 py-2 font-monospace fw-bold">
            🎓 Formation Vendeur d'Élite 2026
          </span>
        </div>
      </header>

      {/* Main Hero Banner */}
      <main className="flex-grow-1 py-5">
        <div className="container">
          <div className="row justify-content-center text-center mb-5">
            <div className="col-lg-9">
              <span className="badge rounded-pill px-3 py-2 mb-3 fw-bold tracking-wider" style={{ backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }}>
                MANUEL OFFICIEL • PAR RALPH, CEO DE FOLIODEV
              </span>
              <h1 className="display-4 font-serif fw-bold text-title mb-4">
                Devenir un Freelance Vendeur d'Élite en 2026
              </h1>
              <p className="lead text-body-custom mx-auto mb-4 fs-5" style={{ maxWidth: '750px', lineHeight: '1.7' }}>
                L'art suprême de vendre tes compétences en ligne, localement ou à l'international. 
                Ne vends plus du code ou du design : apprends à vendre des <strong>résultats et des transformations</strong>.
              </p>

              <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                  <i className="bi bi-book text-primary me-1"></i>7 Modules d'Élite + Préface
                </span>
                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                  <i className="bi bi-check2-circle text-success me-1"></i>Quiz interactifs par module
                </span>
                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                  <i className="bi bi-globe2 text-info me-1"></i>Vente locale & International
                </span>
                <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">
                  <i className="bi bi-infinity text-warning me-1"></i>Accès illimité à vie
                </span>
              </div>

              {/* Call to action card */}
              <div className="p-4 p-md-5 rounded-4 shadow-lg border text-white text-center position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #26215C 0%, #1E1B4B 100%)' }}>
                <div className="position-relative z-1">
                  <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-3">
                    {hasPaidAccess ? 'ACCÈS ACTIVÉ ✅' : 'OFFRE DE LANCEMENT EXCLUSIVE'}
                  </span>

                  <h3 className="fw-bold font-serif mb-2">
                    {hasPaidAccess 
                      ? "Vous possédez déjà l'accès complet à la Formation !" 
                      : "Débloquez l'accès complet à la Formation"
                    }
                  </h3>

                  <p className="text-white-50 small mb-4 mx-auto" style={{ maxWidth: '550px' }}>
                    {hasPaidAccess 
                      ? "Reprenez votre apprentissage exactement là où vous vous êtes arrêté sur n'importe quel appareil." 
                      : "Un investissement unique de 9 000 F CFA pour transformer votre activité freelance et recevoir des clients réguliers."
                    }
                  </p>

                  {!hasPaidAccess && (
                    <div className="mb-4">
                      <span className="display-6 fw-bold text-warning">9 000 F CFA</span>
                      <span className="text-white-50 ms-2 text-decoration-line-through">25 000 F CFA</span>
                    </div>
                  )}

                  {loadingAccess ? (
                    <div className="spinner-border text-light" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      className="btn btn-warning-custom btn-lg px-5 py-3 fw-bold rounded-pill shadow-lg hover-scale"
                      onClick={handleActionClick}
                    >
                      {!user ? (
                        <>
                          <i className="bi bi-google me-2"></i>Se connecter avec Google pour continuer
                        </>
                      ) : hasPaidAccess ? (
                        <>
                          <i className="bi bi-play-fill me-2 fs-5"></i>Accéder à ma formation (Reprendre l'apprentissage)
                        </>
                      ) : (
                        <>
                          <i className="bi bi-credit-card me-2"></i>Payer la formation (9 000 F CFA)
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Sommaire & Aperçu des Modules */}
          <div className="row g-4 mt-4">
            <div className="col-12 text-center mb-2">
              <h3 className="font-serif fw-bold text-title">Au programme de la formation (Sommaire)</h3>
              <p className="text-muted">Découvrez le contenu détaillé des 7 modules d'élite</p>
            </div>

            {[
              { num: '0', title: 'Préface : Le constat brutal de 2026', desc: 'Pourquoi les clients n\'achètent plus des compétences, mais des transformations et des solutions.' },
              { num: '1', title: 'Module 1 : Le Mindset du Freelance d\'Élite', desc: 'Devenir le CEO de "Vous-même Inc.", dompter la valeur perçue et vaincre le syndrome de l\'imposteur.' },
              { num: '2', title: 'Module 2 : L\'Art de la Vente de Compétences', desc: 'Transformer un service en machine à cash, créer une offre irrésistible et comprendre la psychologie d\'achat.' },
              { num: '3', title: 'Module 3 : L\'Acquisition Client (4 Piliers)', desc: 'Le réseautage stratégique, le Personal Branding sur LinkedIn/X, la prospection à froid et les plateformes.' },
              { num: '4', title: 'Module 4 : La Vente à l\'International', desc: 'Conquérir les marchés USA, Europe et Australie depuis l\'Afrique, maitriser Wise, Payoneer et la communication.' },
              { num: '5', title: 'Module 5 : LA RÉVOLUTION FOLIODEV.SITE', desc: 'L\'inversion du marché : ne cherchez plus les clients, faites venir les clients à vous grâce à FolioDev.' },
              { num: '6', title: 'Module 6 : Le Closing', desc: 'Conclure la vente en 5 minutes, la règle des 3 questions et vaincre l\'objection "C\'est trop cher".' },
              { num: '7', title: 'Module 7 : Livraison & Fidélisation', desc: 'Offrir une expérience client digne d\'un palace, obtenir 5 étoiles et passer de Freelance solo à Agence.' },
            ].map(mod => (
              <div key={mod.num} className="col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm rounded-4 p-4 hover-shadow" style={{ backgroundColor: '#ffffff' }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <span className="badge rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: '40px', height: '40px', backgroundColor: 'var(--folio-primary)', fontSize: '1rem' }}>
                      {mod.num}
                    </span>
                    <h6 className="fw-bold text-title mb-0">{mod.title}</h6>
                  </div>
                  <p className="text-muted small mb-0">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* Modal de paiement */}
      {showPaymentModal && user && (
        <FormationPaymentModal 
          user={user}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            setHasPaidAccess(true);
            onOpenReader();
          }}
        />
      )}
    </div>
  );
}
