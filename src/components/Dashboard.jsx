import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './auth.css';

export default function Dashboard({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: 'var(--folio-bg)' }}>
      {/* Navbar du dashboard */}
      <nav className="navbar navbar-expand-lg py-3" style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(38, 33, 92, 0.08)' }}>
        <div className="container-fluid px-4">
          <span className="navbar-brand font-serif fs-4" style={{ color: 'var(--folio-title)' }}>
            <i className="bi bi-grid-1x2 me-2" style={{ color: 'var(--folio-primary)' }}></i>
            Folio
          </span>
          <div className="d-flex align-items-center gap-3">
            {/* Menu Déroulant du Profil */}
            <div className="dropdown">
              <button 
                className="btn btn-link p-0 text-title" 
                type="button" 
                id="profileDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
                style={{ fontSize: '1.6rem', color: 'var(--folio-primary)' }}
              >
                <i className="bi bi-person-circle"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="profileDropdown" style={{ minWidth: '290px', borderRadius: '12px', padding: '10px' }}>
                <li className="px-3 py-2 border-bottom mb-2">
                  <p className="fw-bold mb-0 text-title" style={{ fontSize: '0.95rem' }}>{userData.nom_complet || 'Utilisateur'}</p>
                  <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{userData.email}</p>
                </li>
                <li>
                  <button className="dropdown-item py-2 text-primary fw-medium" onClick={() => setShowRechargeModal(true)}>
                    <i className="bi bi-wallet2 me-2"></i>Recharger mon compte (Dès 3500F)
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item py-2" onClick={() => alert('Optimisation du SEO de ton portfolio lancée...')}>
                    <i className="bi bi-search me-2 text-muted"></i>Optimiser le SEO de mon portfolio
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={() => alert('Détection des clics activée...')}>
                    <i className="bi bi-cursor me-2 text-muted"></i>Détecter les clics
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={() => alert('Boost des réseaux sociaux configuré...')}>
                    <i className="bi bi-graph-up-arrow me-2 text-muted"></i>Booster mes réseaux
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={() => alert('Recherche de contacts en cours...')}>
                    <i className="bi bi-people me-2 text-muted"></i>Trouver des contacts à qui vendre
                  </button>
                </li>
              </ul>
            </div>

            <button className="btn btn-outline-custom btn-sm px-3" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">
        {/* Message de bienvenue */}
        <div className="mb-4">
          <h1 className="font-serif mb-1" style={{ color: 'var(--folio-title)', fontSize: '1.75rem' }}>
            Bienvenue, {userData.nom_complet || 'Développeur'} <span style={{ fontSize: '1.5rem' }}>👋</span>
          </h1>
          <p className="text-body-custom mb-0">Voici ton espace personnel Folio.</p>
        </div>

        {/* Cards d'informations personnelles */}
        <div className="row g-3 mb-4">
          <div className="col-md-6 col-lg-3">
            <div className="bg-white rounded-3 p-4" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '44px', height: '44px', backgroundColor: '#EEEDFE' }}>
                  <i className="bi bi-person fs-5" style={{ color: 'var(--folio-primary)' }}></i>
                </div>
                <div>
                  <p className="text-body-custom mb-0" style={{ fontSize: '0.8rem', opacity: 0.7 }}>Nom</p>
                  <p className="fw-medium mb-0" style={{ color: 'var(--folio-title)', fontSize: '0.95rem' }}>{userData.nom_complet || '—'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="bg-white rounded-3 p-4" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '44px', height: '44px', backgroundColor: '#EEEDFE' }}>
                  <i className="bi bi-envelope fs-5" style={{ color: 'var(--folio-primary)' }}></i>
                </div>
                <div>
                  <p className="text-body-custom mb-0" style={{ fontSize: '0.8rem', opacity: 0.7 }}>Email</p>
                  <p className="fw-medium mb-0" style={{ color: 'var(--folio-title)', fontSize: '0.95rem' }}>{userData.email || '—'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="bg-white rounded-3 p-4" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '44px', height: '44px', backgroundColor: '#EEEDFE' }}>
                  <i className="bi bi-globe-americas fs-5" style={{ color: 'var(--folio-primary)' }}></i>
                </div>
                <div>
                  <p className="text-body-custom mb-0" style={{ fontSize: '0.8rem', opacity: 0.7 }}>Pays</p>
                  <p className="fw-medium mb-0" style={{ color: 'var(--folio-title)', fontSize: '0.95rem' }}>{userData.pays || '—'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-lg-3">
            <div className="bg-white rounded-3 p-4" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center justify-content-center rounded-3" style={{ width: '44px', height: '44px', backgroundColor: '#EEEDFE' }}>
                  <i className="bi bi-telephone fs-5" style={{ color: 'var(--folio-primary)' }}></i>
                </div>
                <div>
                  <p className="text-body-custom mb-0" style={{ fontSize: '0.8rem', opacity: 0.7 }}>Téléphone</p>
                  <p className="fw-medium mb-0" style={{ color: 'var(--folio-title)', fontSize: '0.95rem' }}>{userData.telephone || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section principale du dashboard */}
        <div className="row g-3">
          {/* Colonne principale */}
          <div className="col-lg-8">
            <div className="bg-white rounded-3 p-4" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="font-serif mb-0" style={{ color: 'var(--folio-title)' }}>
                  <i className="bi bi-graph-up me-2" style={{ color: 'var(--folio-primary)' }}></i>
                  Visiteurs cette semaine
                </h5>
                <span className="badge rounded-pill" style={{ backgroundColor: '#EEEDFE', color: 'var(--folio-primary)', fontSize: '0.8rem' }}>
                  En attente de données
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-center rounded-3 py-5" style={{ backgroundColor: '#FAFAFE', border: '1px dashed rgba(38, 33, 92, 0.12)' }}>
                <div className="text-center">
                  <i className="bi bi-code-slash display-4 d-block mb-3" style={{ color: 'var(--folio-secondary-2)', opacity: 0.5 }}></i>
                  <p className="text-body-custom mb-2" style={{ fontSize: '0.95rem' }}>Aucune donnée pour le moment</p>
                  <p className="text-body-custom mb-0" style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    Colle le script de tracking sur ton portfolio pour commencer à recevoir des données.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne latérale */}
          <div className="col-lg-4">
            {/* Script de tracking */}
            <div className="bg-white rounded-3 p-4 mb-3" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <h6 className="font-serif mb-3" style={{ color: 'var(--folio-title)' }}>
                <i className="bi bi-clipboard-code me-2" style={{ color: 'var(--folio-primary)' }}></i>
                Ton script de tracking
              </h6>
              <div className="rounded-3 p-3" style={{ backgroundColor: '#1E1B3A', fontFamily: 'monospace', fontSize: '0.8rem', color: '#A9A4E0', wordBreak: 'break-all' }}>
                &lt;script src="https://folio.dev/t/{userData.id?.slice(0, 8) || 'xxxxx'}.js"&gt;&lt;/script&gt;
              </div>
              <button className="btn btn-sm btn-outline-custom w-100 mt-3">
                <i className="bi bi-clipboard me-1"></i>Copier le script
              </button>
            </div>

            {/* Profil rapide */}
            <div className="bg-white rounded-3 p-4" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <h6 className="font-serif mb-3" style={{ color: 'var(--folio-title)' }}>
                <i className="bi bi-briefcase me-2" style={{ color: 'var(--folio-primary)' }}></i>
                Ton profil
              </h6>
              <ul className="list-unstyled mb-0">
                <li className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(38, 33, 92, 0.06)', fontSize: '0.9rem' }}>
                  <span className="text-body-custom" style={{ opacity: 0.7 }}>Métier</span>
                  <span className="fw-medium" style={{ color: 'var(--folio-title)' }}>{userData.profession || '—'}</span>
                </li>
                <li className="d-flex justify-content-between py-2" style={{ borderBottom: '1px solid rgba(38, 33, 92, 0.06)', fontSize: '0.9rem' }}>
                  <span className="text-body-custom" style={{ opacity: 0.7 }}>Source</span>
                  <span className="fw-medium" style={{ color: 'var(--folio-title)' }}>{userData.decouvert_via || '—'}</span>
                </li>
                <li className="d-flex justify-content-between py-2" style={{ fontSize: '0.9rem' }}>
                  <span className="text-body-custom" style={{ opacity: 0.7 }}>Membre depuis</span>
                  <span className="fw-medium" style={{ color: 'var(--folio-title)' }}>{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de recharge */}
      {showRechargeModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(38, 33, 92, 0.45)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div className="modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title font-serif fw-bold fs-4 text-title">Recharger mon compte</h5>
                <button type="button" className="btn-close" onClick={() => setShowRechargeModal(false)} aria-label="Fermer"></button>
              </div>
              <div className="modal-body py-4 px-4">
                <p className="text-body-custom mb-4" style={{ fontSize: '0.95rem' }}>
                  Accède à toutes les fonctionnalités premium de Folio. Choisis ton pack pour recharger ton solde (à partir de <strong>3500 F CFA</strong>).
                </p>
                
                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="p-3 rounded-3 d-flex justify-content-between align-items-center" style={{ border: '2px solid var(--folio-primary)', backgroundColor: '#F8F7FF', cursor: 'pointer' }}>
                    <div>
                      <span className="badge mb-1" style={{ backgroundColor: 'var(--folio-primary)', color: 'white', fontSize: '0.75rem' }}>Starter</span>
                      <h6 className="mb-0 fw-bold text-title">Optimisation SEO & Clics</h6>
                      <small className="text-muted d-block">SEO portfolio et traqueur de clics</small>
                    </div>
                    <span className="fw-bold fs-5" style={{ color: 'var(--folio-primary)' }}>3 500 F</span>
                  </div>
                  
                  <div className="p-3 rounded-3 border d-flex justify-content-between align-items-center" style={{ cursor: 'pointer' }}>
                    <div>
                      <span className="badge bg-secondary mb-1" style={{ fontSize: '0.75rem' }}>Pro</span>
                      <h6 className="mb-0 fw-bold text-title">Boost Réseaux & Contacts</h6>
                      <small className="text-muted d-block">Recommandations et prospection</small>
                    </div>
                    <span className="fw-bold fs-5 text-title">7 500 F</span>
                  </div>
                </div>

                <button className="btn btn-primary-custom w-100 py-2.5 font-sans" onClick={() => { alert('Redirection vers le service de paiement mobile...'); setShowRechargeModal(false); }}>
                  Recharger mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
