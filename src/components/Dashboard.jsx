import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';
import './auth.css';

export default function Dashboard({ userData, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [showOptimModal, setShowOptimModal] = useState(false);
  const [visits, setVisits] = useState([]);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('folio-dashboard-theme') || 'light');
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profils')
        .select('*')
        .eq('id', userData.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setProfileData(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [userData.id]);

  const triggerFireworks = () => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  useEffect(() => {
    let mounted = true;

    const loadVisits = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      const { data } = await supabase
        .from('visites')
        .select('created_at')
        .eq('profile_id', userData.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });
      if (mounted && data) setVisits(data);
    };

    loadVisits();
    const channel = supabase
      .channel(`visites-${userData.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visites', filter: `profile_id=eq.${userData.id}` }, (payload) => {
        setVisits((previous) => [...previous, payload.new]);
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [userData.id]);

  const weeklyVisits = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
    return days.map((date) => ({
      label: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      value: visits.filter((visit) => new Date(visit.created_at).toDateString() === date.toDateString()).length,
    }));
  }, [visits]);

  const chartPoints = useMemo(() => {
    const max = Math.max(...weeklyVisits.map((day) => day.value), 1);
    return weeklyVisits.map((day, index) => `${index * 100},${90 - (day.value / max) * 70}`).join(' ');
  }, [weeklyVisits]);

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem('folio-dashboard-theme', nextTheme);
  };

  const handleAnalysis = (event) => {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.classList.add('was-validated');
      return;
    }
    alert(`Analyse lancée pour ${portfolioUrl}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className="dashboard-shell min-vh-100" data-theme={theme} style={{ backgroundColor: 'var(--folio-bg)' }}>
      {/* Navbar du dashboard */}
      <nav className="dashboard-nav navbar navbar-expand-lg py-3" style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(38, 33, 92, 0.08)' }}>
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
                <li className="px-3 py-2">
                  <span className="d-block text-body-custom small mb-2">Mode du tableau de bord</span>
                  <div className="btn-group w-100" role="group" aria-label="Choisir le mode du tableau de bord">
                    <button type="button" className={`btn btn-sm ${theme === 'light' ? 'btn-primary-custom' : 'btn-outline-custom'}`} onClick={() => handleThemeChange('light')}>
                      <i className="bi bi-sun me-1"></i>Light
                    </button>
                    <button type="button" className={`btn btn-sm ${theme === 'dark' ? 'btn-primary-custom' : 'btn-outline-custom'}`} onClick={() => handleThemeChange('dark')}>
                      <i className="bi bi-moon me-1"></i>Dark
                    </button>
                  </div>
                </li>
                <li>
                  <button className="dropdown-item py-2 text-primary fw-medium" onClick={() => setShowOptimModal(true)}>
                    <i className="bi bi-lightning-charge me-2"></i>Optimiser mon Portfolio
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
                  {visits.length} visite{visits.length > 1 ? 's' : ''} cette semaine
                </span>
              </div>
              <div className="visitors-chart rounded-3 p-3" style={{ backgroundColor: '#FAFAFE', border: '1px solid rgba(38, 33, 92, 0.08)' }}>
                <svg viewBox="0 0 600 120" className="w-100" role="img" aria-label="Courbe des visiteurs des sept derniers jours">
                  <polyline points={chartPoints} fill="none" stroke="var(--folio-primary)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  {weeklyVisits.map((day, index) => <circle key={day.label} cx={index * 100} cy={90 - (day.value / Math.max(...weeklyVisits.map((item) => item.value), 1)) * 70} r="5" fill="white" stroke="var(--folio-primary)" strokeWidth="3" />)}
                </svg>
                <div className="d-flex justify-content-between text-muted small px-1">
                  {weeklyVisits.map((day) => <span key={day.label}>{day.label}</span>)}
                </div>
                {!visits.length && <p className="text-center text-body-custom small mt-3 mb-0">Les visites apparaîtront ici dès qu'un visiteur ouvrira ton portfolio.</p>}
              </div>
            </div>
          </div>

          {/* Colonne latérale */}
          <div className="col-lg-4">
            {/* Lien du portfolio */}
            <div className="dashboard-panel bg-white rounded-3 p-4 mb-3" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <h6 className="font-serif mb-3" style={{ color: 'var(--folio-title)' }}>
                <i className="bi bi-link-45deg me-2" style={{ color: 'var(--folio-primary)' }}></i>
                Lien vers votre portfolio
              </h6>
              <form onSubmit={handleAnalysis} noValidate>
                <label htmlFor="portfolio-url" className="form-label text-body-custom small">Entrez le lien de votre portfolio</label>
                <input id="portfolio-url" type="url" className="form-control" placeholder="https://votreportfolio.com" value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} required />
                <button type="submit" className="btn btn-primary-custom w-100 mt-3">
                  <i className="bi bi-bar-chart-line me-1"></i>Lancer l'analyse
                </button>
              </form>
            </div>

            {/* Profil rapide */}
            <div className="dashboard-panel bg-white rounded-3 p-4" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <h6 className="font-serif mb-3" style={{ color: 'var(--folio-title)' }}>
                <i className="bi bi-briefcase me-2" style={{ color: 'var(--folio-primary)' }}></i>
                Ton profil
              </h6>
              {loadingProfile ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="d-flex flex-column align-items-center text-center mb-3">
                    {profileData?.profile_photo_url ? (
                      <img 
                        src={profileData.profile_photo_url} 
                        alt="Avatar" 
                        className="rounded-circle mb-2 shadow-sm" 
                        style={{ width: '80px', height: '80px', objectFit: 'cover', border: '3px solid #EEEDFE' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle mb-2 d-flex align-items-center justify-content-center shadow-sm" 
                        style={{ width: '80px', height: '80px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }}
                      >
                        <i className="bi bi-person fs-1"></i>
                      </div>
                    )}
                    <h6 className="mb-0 text-title fw-bold">{profileData?.nom_complet || userData.nom_complet}</h6>
                    <p className="text-muted mb-0 small">{profileData?.profession || userData.profession || 'Développeur'}</p>
                  </div>

                  <ul className="list-unstyled mb-3" style={{ fontSize: '0.85rem' }}>
                    {profileData?.portfolio_url && (
                      <li className="d-flex align-items-center gap-2 py-2" style={{ borderBottom: '1px solid rgba(38, 33, 92, 0.04)' }}>
                        <i className="bi bi-globe2 text-muted" title="Portfolio"></i>
                        <a href={profileData.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-truncate text-decoration-none text-primary fw-medium" style={{ maxWidth: '200px' }}>
                          {profileData.portfolio_url.replace(/^https?:\/\//i, '')}
                        </a>
                      </li>
                    )}
                    {profileData?.whatsapp && (
                      <li className="d-flex align-items-center gap-2 py-2" style={{ borderBottom: '1px solid rgba(38, 33, 92, 0.04)' }}>
                        <i className="bi bi-whatsapp text-success" title="WhatsApp"></i>
                        <span className="text-title">{profileData.whatsapp}</span>
                      </li>
                    )}
                    <li className="d-flex align-items-center gap-2 py-2" style={{ borderBottom: '1px solid rgba(38, 33, 92, 0.04)' }}>
                      <i className="bi bi-geo-alt text-muted" title="Pays"></i>
                      <span className="text-title">{profileData?.pays || userData.pays || 'Non renseigné'}</span>
                    </li>
                    {profileData?.description && (
                      <li className="py-2" style={{ borderBottom: '1px solid rgba(38, 33, 92, 0.04)' }}>
                        <div className="text-muted small mb-1">Description</div>
                        <p className="mb-0 text-title" style={{ fontSize: '0.8rem', lineHeight: '1.4', maxHeight: '100px', overflowY: 'auto' }}>
                          {profileData.description}
                        </p>
                      </li>
                    )}
                  </ul>

                  {/* Réseaux sociaux */}
                  <div className="d-flex justify-content-center gap-2 mb-3">
                    {profileData?.github_url && (
                      <a href={profileData.github_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="GitHub">
                        <i className="bi bi-github text-dark"></i>
                      </a>
                    )}
                    {profileData?.linkedin_url && (
                      <a href={profileData.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="LinkedIn">
                        <i className="bi bi-linkedin text-primary"></i>
                      </a>
                    )}
                    {profileData?.facebook_url && (
                      <a href={profileData.facebook_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="Facebook">
                        <i className="bi bi-facebook text-primary"></i>
                      </a>
                    )}
                    {profileData?.tiktok_url && (
                      <a href={profileData.tiktok_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="TikTok">
                        <i className="bi bi-tiktok text-dark"></i>
                      </a>
                    )}
                    {profileData?.youtube_url && (
                      <a href={profileData.youtube_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} title="YouTube">
                        <i className="bi bi-youtube text-danger"></i>
                      </a>
                    )}
                  </div>

                  <button 
                    className="btn btn-outline-custom btn-sm w-100 py-1.5" 
                    onClick={() => setShowOptimModal(true)}
                  >
                    <i className="bi bi-pencil-square me-1"></i>Modifier le profil
                  </button>
                </div>
              )}
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

      {/* Modal d'optimisation du portfolio */}
      {showOptimModal && (
        <PortfolioOptimizationModal
          userId={userData.id}
          initialData={profileData}
          onClose={() => setShowOptimModal(false)}
          onComplete={() => {
            setShowOptimModal(false);
            fetchProfile();
            triggerFireworks();
          }}
        />
      )}
    </div>
  );
}

function PortfolioOptimizationModal({ userId, initialData, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    portfolio_url: initialData?.portfolio_url || '',
    github_url: initialData?.github_url || '',
    has_github: !!initialData?.github_url,
    facebook_url: initialData?.facebook_url || '',
    tiktok_url: initialData?.tiktok_url || '',
    youtube_url: initialData?.youtube_url || '',
    linkedin_url: initialData?.linkedin_url || '',
    description: initialData?.description || '',
    whatsapp: initialData?.whatsapp || '',
    profile_photo_url: initialData?.profile_photo_url || '',
  });

  const totalSteps = 6;

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const startsWithHttps = (value) => value.trim().length === 0 || /^https:\/\//i.test(value.trim());

  const sanitizeWhatsApp = (value) => value.replace(/[^\d\s+]/g, '');

  const nextStep = () => {
    if (step === 1) {
      if (!formData.portfolio_url.trim() || !startsWithHttps(formData.portfolio_url)) {
        alert('Veuillez entrer un lien de portfolio valide commençant par https://');
        return;
      }
    }

    if (step === 2) {
      if (formData.has_github && (!formData.github_url.trim() || !startsWithHttps(formData.github_url))) {
        alert('Veuillez entrer un lien GitHub valide commençant par https://');
        return;
      }
    }

    if (step === 3) {
      const hasSocial = ['facebook_url', 'tiktok_url', 'youtube_url', 'linkedin_url'].some((key) => formData[key].trim().length > 0);
      if (!hasSocial) {
        alert('Veuillez entrer au moins un lien de réseau social.');
        return;
      }
      const invalid = ['facebook_url', 'tiktok_url', 'youtube_url', 'linkedin_url'].find((key) => formData[key].trim() && !startsWithHttps(formData[key]));
      if (invalid) {
        alert('Chaque lien de réseau social doit commencer par https://');
        return;
      }
    }

    if (step === 4) {
      if (!formData.description.trim()) {
        alert('Veuillez entrer une description.');
        return;
      }
    }

    if (step === 5) {
      if (!formData.whatsapp.trim() || !formData.profile_photo_url.trim()) {
        alert('Veuillez remplir le numéro WhatsApp et le lien de la photo de profil.');
        return;
      }
      if (!startsWithHttps(formData.profile_photo_url)) {
        alert('Le lien de la photo de profil doit commencer par https://');
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profils')
        .update({
          portfolio_url: formData.portfolio_url,
          github_url: formData.has_github ? formData.github_url : null,
          facebook_url: formData.facebook_url || null,
          tiktok_url: formData.tiktok_url || null,
          youtube_url: formData.youtube_url || null,
          linkedin_url: formData.linkedin_url || null,
          description: formData.description,
          whatsapp: formData.whatsapp,
          profile_photo_url: formData.profile_photo_url,
          optimisation_termine: true,
        })
        .eq('id', userId);

      if (error) throw error;
      onComplete();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="optim-step-enter">
            <div className="optim-dots mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`} />
              ))}
            </div>
            <h3 className="font-serif fw-bold text-title mb-2">Lien de ton portfolio</h3>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.9rem' }}>Colle le lien vers ton portfolio pour commencer l'optimisation.</p>
            <label className="optim-label">URL du portfolio</label>
            <input
              type="url"
              className="optim-form-control mb-4"
              placeholder="https://votreportfolio.com"
              value={formData.portfolio_url}
              onChange={(e) => updateField('portfolio_url', e.target.value)}
              required
            />
            <button className="optim-btn-primary" onClick={nextStep} disabled={!startsWithHttps(formData.portfolio_url)}>
              Suivant <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>
        );

      case 2:
        return (
          <div className="optim-step-enter">
            <div className="optim-dots mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`} />
              ))}
            </div>
            <h3 className="font-serif fw-bold text-title mb-2">Profil GitHub</h3>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.9rem' }}>As-tu un profil GitHub ? Si oui, renseigne-le. Sinon, tu peux passer cette étape.</p>
            <div className="d-flex gap-2 mb-3">
              <button className={`optim-btn-outline flex-grow-1 ${!formData.has_github ? 'optim-btn-primary' : ''}`} onClick={() => { updateField('has_github', false); updateField('github_url', ''); }}>
                Non, passer
              </button>
              <button className={`optim-btn-outline flex-grow-1 ${formData.has_github ? 'optim-btn-primary' : ''}`} onClick={() => updateField('has_github', true)}>
                Oui
              </button>
            </div>
            {formData.has_github && (
              <>
                <label className="optim-label">URL GitHub</label>
                <input
                  type="url"
                  className="optim-form-control mb-4"
                  placeholder="https://github.com/tonprofil"
                  value={formData.github_url}
                  onChange={(e) => updateField('github_url', e.target.value)}
                />
              </>
            )}
            <div className="d-flex gap-2">
              <button className="optim-btn-outline" onClick={prevStep}>Précédent</button>
              <button className="optim-btn-primary" onClick={nextStep} disabled={formData.has_github && !startsWithHttps(formData.github_url)}>
                Suivant <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="optim-step-enter">
            <div className="optim-dots mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`} />
              ))}
            </div>
            <h3 className="font-serif fw-bold text-title mb-2">Réseaux sociaux</h3>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.9rem' }}>Ajoute au moins un profil sur Facebook, TikTok, YouTube ou LinkedIn.</p>
            
            <label className="optim-label">Facebook</label>
            <input
              type="url"
              className="optim-form-control mb-3"
              placeholder="https://facebook.com/tonprofil"
              value={formData.facebook_url}
              onChange={(e) => updateField('facebook_url', e.target.value)}
            />

            <label className="optim-label">TikTok</label>
            <input
              type="url"
              className="optim-form-control mb-3"
              placeholder="https://tiktok.com/@tonprofil"
              value={formData.tiktok_url}
              onChange={(e) => updateField('tiktok_url', e.target.value)}
            />

            <label className="optim-label">YouTube</label>
            <input
              type="url"
              className="optim-form-control mb-3"
              placeholder="https://youtube.com/@tonprofil"
              value={formData.youtube_url}
              onChange={(e) => updateField('youtube_url', e.target.value)}
            />

            <label className="optim-label">LinkedIn</label>
            <input
              type="url"
              className="optim-form-control mb-4"
              placeholder="https://linkedin.com/in/tonprofil"
              value={formData.linkedin_url}
              onChange={(e) => updateField('linkedin_url', e.target.value)}
            />

            <div className="d-flex gap-2">
              <button className="optim-btn-outline" onClick={prevStep}>Précédent</button>
              <button className="optim-btn-primary" onClick={nextStep} disabled={!['facebook_url', 'tiktok_url', 'youtube_url', 'linkedin_url'].some((key) => formData[key].trim().length > 0)}>
                Suivant <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="optim-step-enter">
            <div className="optim-dots mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`} />
              ))}
            </div>
            <h3 className="font-serif fw-bold text-title mb-2">Description</h3>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.9rem' }}>Rédige une description de toi et de tes services (max 800 mots).</p>
            <label className="optim-label">Description</label>
            <textarea
              className="optim-form-control mb-2"
              rows="6"
              placeholder="Décris-toi, tes compétences, tes services..."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              maxLength={800}
            />
            <small className="text-muted d-block mb-4">{formData.description.length}/800 mots</small>
            <div className="d-flex gap-2">
              <button className="optim-btn-outline" onClick={prevStep}>Précédent</button>
              <button className="optim-btn-primary" onClick={nextStep} disabled={!formData.description.trim()}>
                Suivant <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="optim-step-enter">
            <div className="optim-dots mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`} />
              ))}
            </div>
            <h3 className="font-serif fw-bold text-title mb-2">Contact & Photo</h3>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.9rem' }}>Ajoute ton numéro WhatsApp et le lien de ta photo de profil.</p>
            
            <label className="optim-label">Numéro WhatsApp</label>
            <input
              type="tel"
              className="optim-form-control mb-3"
              placeholder="+221 77 000 00 00"
              value={formData.whatsapp}
              onChange={(e) => updateField('whatsapp', sanitizeWhatsApp(e.target.value))}
              required
            />

            <label className="optim-label">Lien photo de profil</label>
            <input
              type="url"
              className="optim-form-control mb-4"
              placeholder="https://votreportfolio.com/photo.jpg"
              value={formData.profile_photo_url}
              onChange={(e) => updateField('profile_photo_url', e.target.value)}
              required
            />

            <div className="d-flex gap-2">
              <button className="optim-btn-outline" onClick={prevStep}>Précédent</button>
              <button className="optim-btn-primary" onClick={nextStep} disabled={!formData.whatsapp.trim() || !formData.profile_photo_url.trim()}>
                Suivant <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="optim-step-enter">
            <div className="optim-dots mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={`optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}`} />
              ))}
            </div>
            <h3 className="font-serif fw-bold text-title mb-2">Récapitulatif</h3>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.9rem' }}>Vérifie tes informations avant de valider.</p>
            
            <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: '#FAFAFE', border: '1px solid rgba(38, 33, 92, 0.08)' }}>
              <p className="mb-2"><strong>Portfolio:</strong> <a href={formData.portfolio_url} target="_blank" rel="noreferrer" style={{ color: 'var(--folio-primary)' }}>{formData.portfolio_url}</a></p>
              {formData.github_url && <p className="mb-2"><strong>GitHub:</strong> <a href={formData.github_url} target="_blank" rel="noreferrer" style={{ color: 'var(--folio-primary)' }}>{formData.github_url}</a></p>}
              {formData.facebook_url && <p className="mb-2"><strong>Facebook:</strong> <a href={formData.facebook_url} target="_blank" rel="noreferrer" style={{ color: 'var(--folio-primary)' }}>{formData.facebook_url}</a></p>}
              {formData.tiktok_url && <p className="mb-2"><strong>TikTok:</strong> <a href={formData.tiktok_url} target="_blank" rel="noreferrer" style={{ color: 'var(--folio-primary)' }}>{formData.tiktok_url}</a></p>}
              {formData.youtube_url && <p className="mb-2"><strong>YouTube:</strong> <a href={formData.youtube_url} target="_blank" rel="noreferrer" style={{ color: 'var(--folio-primary)' }}>{formData.youtube_url}</a></p>}
              {formData.linkedin_url && <p className="mb-2"><strong>LinkedIn:</strong> <a href={formData.linkedin_url} target="_blank" rel="noreferrer" style={{ color: 'var(--folio-primary)' }}>{formData.linkedin_url}</a></p>}
              <p className="mb-2"><strong>WhatsApp:</strong> {formData.whatsapp}</p>
              <p className="mb-0"><strong>Photo:</strong> <a href={formData.profile_photo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--folio-primary)' }}>{formData.profile_photo_url}</a></p>
            </div>

            <div className="d-flex gap-2">
              <button className="optim-btn-outline" onClick={prevStep}>Précédent</button>
              <button className="optim-btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Enregistrement...' : <>Valider <i className="bi bi-check-lg ms-2"></i></>}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="optim-modal-overlay" onClick={onClose}>
      <div className="optim-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <span className="text-body-custom small">Étape {step}/{totalSteps}</span>
            <button className="btn btn-link p-0 text-muted" onClick={onClose} style={{ textDecoration: 'none' }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="optim-progress-bar mb-4">
            <div className="optim-progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
