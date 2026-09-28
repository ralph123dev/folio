import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import verifieBadge from '../assets/verifie.png';
import orangeBadge from '../assets/orange.png';
import freelancerImg from '../assets/freelancer.jpg';
import clientImg from '../assets/client.jpg';
import { uploadToCloudinary, getCloudinaryDownloadUrl, sanitizeMediaUrl } from '../lib/cloudinary';
import './auth.css';

const DEFAULT_PROFESSIONS = [
  'Tous les métiers',
  'Développeur Web',
  'Développeur Mobile',
  'Développeur de jeux vidéo',
  'Designer UI/UX',
  'Community Manager',
  'Rédacteur Web',
  'Monteur Vidéo',
  'Graphiste',
  'Spécialiste SEO',
];

function FreelancerMediaAvatar({ videoUrl, photoUrl, alt, isProMax }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);

  const cleanVideo = sanitizeMediaUrl(videoUrl);
  const cleanPhoto = sanitizeMediaUrl(photoUrl);

  const borderStyle = isProMax ? '3px solid #FF7A00' : '3px solid #EEEDFE';

  if (cleanVideo && !videoFailed) {
    return (
      <video
        src={cleanVideo}
        autoPlay
        loop
        muted
        playsInline
        className="rounded-circle mb-3 shadow-sm"
        style={{ width: '90px', height: '90px', objectFit: 'cover', border: borderStyle }}
        onError={() => setVideoFailed(true)}
      />
    );
  }

  if (cleanPhoto && !photoFailed) {
    return (
      <img
        src={cleanPhoto}
        alt={alt}
        className="rounded-circle mb-3 shadow-sm"
        style={{ width: '90px', height: '90px', objectFit: 'cover', border: borderStyle }}
        onError={() => setPhotoFailed(true)}
      />
    );
  }

  return (
    <div
      className="rounded-circle mb-3 d-flex align-items-center justify-content-center shadow-sm"
      style={{ width: '90px', height: '90px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }}
    >
      <i className="bi bi-person fs-1"></i>
    </div>
  );
}

function FreelancerSkeletonCard() {
  return (
    <article className="freelancer-skeleton-card" aria-hidden="true">
      <div className="freelancer-skeleton-block freelancer-skeleton-avatar" />
      <div className="freelancer-skeleton-content">
        <div className="freelancer-skeleton-block freelancer-skeleton-title" />
        <div className="freelancer-skeleton-block freelancer-skeleton-subtitle" />
        <div className="freelancer-skeleton-description">
          <div className="freelancer-skeleton-block freelancer-skeleton-line" />
          <div className="freelancer-skeleton-block freelancer-skeleton-line" />
          <div className="freelancer-skeleton-block freelancer-skeleton-line freelancer-skeleton-line-short" />
        </div>
        <div className="freelancer-skeleton-tags">
          <div className="freelancer-skeleton-block freelancer-skeleton-tag" />
          <div className="freelancer-skeleton-block freelancer-skeleton-tag" />
          <div className="freelancer-skeleton-block freelancer-skeleton-tag" />
        </div>
        <div className="freelancer-skeleton-block freelancer-skeleton-button" />
      </div>
    </article>
  );
}

export default function Freelancers({ user, onStart }) {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ratings, setRatings] = useState({});
  const [ratingCounts, setRatingCounts] = useState({});
  const [ratingSums, setRatingSums] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('Tous les métiers');
  const [verifiedUsers, setVerifiedUsers] = useState({});

  const visitorId = useMemo(() => {
    const storageKey = 'folio-search-visitor-id';
    let id = localStorage.getItem(storageKey);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(storageKey, id);
    }
    return id;
  }, []);

  useEffect(() => {
    fetchFreelancers();
    fetchRatingCounts();
    fetchVerifiedUsers();

    const channel = supabase
      .channel('public:freelancer_ratings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'freelancer_ratings' }, () => {
        fetchRatingCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserRatings();
    }
  }, [user]);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || !freelancers.length) return undefined;

    const timer = setTimeout(async () => {
      const matches = freelancers.filter((freelancer) => {
        const searchable = [freelancer.nom_freelancer, freelancer.nom, freelancer.prenom, freelancer.activite]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes(query);
      });

      if (!matches.length) return;
      const events = matches.map((freelancer) => ({
        visitor_id: visitorId,
        freelancer_id: freelancer.id,
        profile_owner_id: freelancer.user_id,
        search_query: query,
        profession: freelancer.activite || 'Métier non précisé',
        search_day: new Date().toISOString().slice(0, 10),
      }));
      const { error } = await supabase.from('freelancer_search_events').upsert(events, { onConflict: 'visitor_id,freelancer_id,search_query,search_day', ignoreDuplicates: true });
      if (error) console.error('Erreur enregistrement recherche:', error);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, freelancers, visitorId]);

  const fetchVerifiedUsers = async () => {
    try {
      const { data } = await supabase.rpc('get_public_verified_users');
      if (data) {
        const vMap = {};
        data.forEach((profile) => {
          vMap[profile.user_id] = {
            isVerified: profile.is_verified,
            isProMax: profile.is_promax,
            badgeColor: profile.badge_color || (profile.is_promax ? 'orange' : 'blue'),
          };
        });
        setVerifiedUsers(vMap);
      }
    } catch (err) {
      console.error('Erreur profil vérifié:', err);
    }
  };

  const fetchFreelancers = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data, error } = await supabase
        .from('freelancers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Erreur lors du chargement des freelancers:', error);
        setFetchError('Les profils freelancers ne peuvent pas être chargés pour le moment.');
      } else if (data) {
        setFreelancers(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des freelancers:', error);
      setFetchError('Les profils freelancers ne peuvent pas être chargés pour le moment.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingCounts = async () => {
    const { data, error } = await supabase
      .from('freelancer_ratings')
      .select('freelancer_id, rating');
    if (data) {
      const counts = {};
      const sums = {};
      data.forEach(r => {
        counts[r.freelancer_id] = (counts[r.freelancer_id] || 0) + 1;
        sums[r.freelancer_id] = (sums[r.freelancer_id] || 0) + r.rating;
      });
      setRatingCounts(counts);
      setRatingSums(sums);
    }
  };

  const fetchUserRatings = async () => {
    const { data, error } = await supabase
      .from('freelancer_ratings')
      .select('freelancer_id, rating')
      .eq('rater_id', user.id);
    if (data) {
      const newRatings = {};
      data.forEach(r => { newRatings[r.freelancer_id] = r.rating; });
      setRatings(newRatings);
    }
  };

  const handleCreateProfile = () => {
    if (user) {
      setShowCreateModal(true);
    } else {
      onStart();
    }
  };

  const handleRate = async (freelancerId, rating) => {
    if (!user) return;
    
    // Optimistic update
    setRatings(prev => ({...prev, [freelancerId]: rating}));

    const { error } = await supabase
      .from('freelancer_ratings')
      .upsert({ freelancer_id: freelancerId, rater_id: user.id, rating: rating }, { onConflict: 'freelancer_id, rater_id' });
    
    if (error) {
      console.error('Erreur lors de la notation:', error);
      fetchUserRatings(); // revert optimistic update
    } else {
      fetchRatingCounts();
    }
  };

  const truncateWords = (str, numWords) => {
    if (!str || typeof str !== 'string') return '';
    const words = str.split(/\s+/);
    if (words.length <= numWords) return str;
    return words.slice(0, numWords).join(' ') + '...';
  };

  // Extraire les métiers disponibles dynamiquement
  const professionOptions = useMemo(() => {
    const set = new Set(DEFAULT_PROFESSIONS);
    freelancers.forEach(f => {
      if (f.activite && f.activite.trim()) set.add(f.activite.trim());
    });
    return Array.from(set);
  }, [freelancers]);

  // Filtrer et trier les freelancers en fonction du métier, de la recherche et des étoiles obtenues
  const filteredAndSortedFreelancers = useMemo(() => {
    return freelancers
      .filter((freelancer) => {
        // Filtre Métier
        if (selectedProfession !== 'Tous les métiers' && freelancer.activite !== selectedProfession) {
          return false;
        }

        // Filtre Recherche Nom / Spécialité
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (freelancer.nom_freelancer || '').toLowerCase().includes(q);
          const matchNom = (freelancer.nom || '').toLowerCase().includes(q);
          const matchPrenom = (freelancer.prenom || '').toLowerCase().includes(q);
          const matchActivite = (freelancer.activite || '').toLowerCase().includes(q);
          if (!matchName && !matchNom && !matchPrenom && !matchActivite) {
            return false;
          }
        }

        return true;
      })
      .map((freelancer) => {
        const count = ratingCounts[freelancer.id] || 0;
        const sum = ratingSums[freelancer.id] || 0;
        const avg = count > 0 ? sum / count : 0;
        return { ...freelancer, avgRating: avg, ratingCount: count };
      })
      .sort((a, b) => {
        const vInfoA = verifiedUsers[a.user_id];
        const vInfoB = verifiedUsers[b.user_id];
        const isProMaxA = Boolean(vInfoA?.isProMax);
        const isProMaxB = Boolean(vInfoB?.isProMax);

        // Tri prioritaire des abonnés ProMax en premier
        if (isProMaxA !== isProMaxB) {
          return isProMaxB ? 1 : -1;
        }

        // Tri décroissant par moyenne des étoiles obtenues
        if (b.avgRating !== a.avgRating) {
          return b.avgRating - a.avgRating;
        }
        // En cas d'égalité, trier par nombre d'avis
        if (b.ratingCount !== a.ratingCount) {
          return b.ratingCount - a.ratingCount;
        }
        // Enfin trier par date de création récents en premier
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [freelancers, selectedProfession, searchQuery, ratingCounts, ratingSums]);

  return (
    <main className="flex-grow-1 freelancers-page">
      <section className="py-5">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <p className="text-uppercase fw-semibold mb-3" style={{ color: 'var(--folio-primary)', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
                Espace Freelancers
              </p>
              <h1 className="display-4 font-serif mb-4">Fais de ton profil une vraie vitrine pour tes services.</h1>
              <p className="lead text-body-custom mb-4" style={{ maxWidth: '650px' }}>
                Crée un profil professionnel, optimisé pour le SEO, et facilite le contact avec les clients qui veulent travailler avec toi.
              </p>
              <button type="button" className="btn btn-primary-custom px-4 py-3" onClick={handleCreateProfile}>
                Créer mon profil freelance <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
            <div className="col-lg-5">
              <div className="p-4 p-lg-5 rounded-4" style={{ background: 'linear-gradient(135deg, #F4F1FE, #E8F5EC)' }}>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="pricing-icon"><i className="bi bi-briefcase-fill"></i></div>
                  <div>
                    <p className="mb-1 text-body-custom small">Ton profil</p>
                    <h2 className="font-serif h4 mb-0">Prêt à être trouvé</h2>
                  </div>
                </div>
                <div className="d-flex justify-content-between border-bottom py-3">
                  <span className="text-body-custom">Visibilité SEO</span>
                  <strong className="text-success">Optimisée</strong>
                </div>
                <div className="d-flex justify-content-between py-3">
                  <span className="text-body-custom">Contact client</span>
                  <strong style={{ color: 'var(--folio-primary)' }}>WhatsApp</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center mb-4">
            <p className="text-uppercase fw-semibold mb-2" style={{ color: 'var(--folio-secondary-2)', letterSpacing: '0.1em', fontSize: '0.8rem' }}>Pour développer ton activité</p>
            <h2 className="display-6 font-serif mb-3">Les Freelancers</h2>
          </div>

          {/* Barre de Recherche et Filtre Métiers */}
          <div className="row g-3 justify-content-center mb-5">
            <div className="col-md-6 col-lg-5">
              <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden" style={{ border: '1px solid rgba(38, 33, 92, 0.15)' }}>
                <span className="input-group-text bg-white border-0 text-muted ps-3">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 fs-6 ps-2"
                  placeholder="Ralph Développeur"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="btn bg-white border-0 text-muted" type="button" onClick={() => setSearchQuery('')}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-5 col-lg-4">
              <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden" style={{ border: '1px solid rgba(38, 33, 92, 0.15)' }}>
                <span className="input-group-text bg-white border-0 text-muted ps-3">
                  <i className="bi bi-funnel"></i>
                </span>
                <select
                  className="form-select border-0 fs-6 ps-2 text-title"
                  value={selectedProfession}
                  onChange={(e) => setSelectedProfession(e.target.value)}
                >
                  {professionOptions.map((prof) => (
                    <option key={prof} value={prof}>
                      {prof}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="row g-4" role="status" aria-live="polite" aria-label="Chargement des profils freelancers">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="col-md-4" key={index}>
                  <FreelancerSkeletonCard />
                </div>
              ))}
              <span className="visually-hidden">Chargement des profils freelancers...</span>
            </div>
          ) : fetchError ? (
            <div className="text-center text-muted">
              <p>{fetchError}</p>
              <button className="btn btn-outline-custom mt-3" onClick={fetchFreelancers}>Réessayer</button>
            </div>
          ) : filteredAndSortedFreelancers.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-person-exclamation fs-1 d-block mb-2 text-muted"></i>
              <p className="fs-5">Aucun profil freelancer ne correspond à tes critères de recherche.</p>
              <button className="btn btn-outline-custom mt-2" onClick={() => { setSearchQuery(''); setSelectedProfession('Tous les métiers'); }}>
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {filteredAndSortedFreelancers.map((freelancer) => {
                const verifiedInfo = verifiedUsers[freelancer.user_id];
                const isUserVerified = Boolean(verifiedInfo?.isVerified || verifiedInfo?.isProMax || verifiedUsers[freelancer.user_id]);
                const isProMax = Boolean(verifiedInfo?.isProMax);
                const badgeColorClass = (isProMax || verifiedInfo?.badgeColor === 'orange') ? 'badge-orange-img' : '';

                const whatsappClean = freelancer.whatsapp ? freelancer.whatsapp.replace(/\D/g, '') : '';
                const whatsappUrl = whatsappClean ? `https://wa.me/${whatsappClean}` : null;
                const telegramClean = freelancer.telegram ? freelancer.telegram.replace(/^@/, '').trim() : '';
                const telegramUrl = telegramClean ? (telegramClean.startsWith('http') ? telegramClean : `https://t.me/${telegramClean}`) : null;
                const facebookUrl = freelancer.facebook ? (freelancer.facebook.startsWith('http') ? freelancer.facebook : `https://${freelancer.facebook}`) : null;
                const instagramClean = freelancer.instagram ? freelancer.instagram.replace(/^@/, '').trim() : '';
                const instagramUrl = instagramClean ? (instagramClean.startsWith('http') ? instagramClean : `https://instagram.com/${instagramClean}`) : null;
                const portfolioUrl = freelancer.site_web ? (freelancer.site_web.startsWith('http') ? freelancer.site_web : `https://${freelancer.site_web}`) : null;
                const cvUrl = freelancer.cv_url ? (freelancer.cv_url.startsWith('http') ? freelancer.cv_url : `https://${freelancer.cv_url}`) : null;

                const cardBadgeImg = (isProMax || verifiedInfo?.badgeColor === 'orange') ? orangeBadge : verifieBadge;

                return (
                <div className="col-md-4" key={freelancer.id}>
                  <article className={`h-100 p-4 border rounded-4 d-flex flex-column align-items-center text-center bg-white shadow-sm hover-shadow transition-all position-relative ${isProMax ? 'promax-card-highlight' : ''}`}>
                    <FreelancerMediaAvatar
                      videoUrl={freelancer.video_url}
                      photoUrl={freelancer.photo_url}
                      alt={freelancer.nom_freelancer}
                      isProMax={isProMax}
                    />

                    <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                      <h3 className="font-serif h5 mb-0 text-title">{freelancer.nom_freelancer}</h3>
                      {isUserVerified && (
                        <img 
                          src={cardBadgeImg} 
                          alt="Badge vérifié" 
                          title="les profils verifier son ceux que nous avons verifier personellement" 
                          style={{ width: '20px', height: '20px', objectFit: 'contain', cursor: 'pointer' }}
                        />
                      )}
                    </div>

                    <p className="text-muted small mb-2 fw-medium">{freelancer.activite}</p>
                    <p className="text-body-custom mb-3" style={{ fontSize: '0.9rem', flexGrow: 1 }}>
                      {truncateWords(freelancer.description, 20)}
                    </p>

                    {/* Boutons de contact direct et CV */}
                    <div className="d-flex flex-wrap justify-content-center gap-2 mb-3 w-100">
                      {whatsappUrl && (
                        <a 
                          href={whatsappUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 d-flex align-items-center gap-1"
                          style={{ fontSize: '0.8rem' }}
                        >
                          <i className="bi bi-whatsapp"></i> WhatsApp
                        </a>
                      )}
                      {cvUrl && (
                        <button 
                          type="button"
                          className="btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1 text-white"
                          style={{ fontSize: '0.8rem', backgroundColor: '#FF7A00', borderColor: '#FF7A00' }}
                          title="Télécharger le CV"
                          onClick={async () => {
                            try {
                              const downloadUrl = getCloudinaryDownloadUrl(cvUrl);
                              const response = await fetch(downloadUrl);
                              const blob = await response.blob();
                              const blobUrl = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = blobUrl;
                              a.download = `CV_${(freelancer.nom_freelancer || 'freelancer').replace(/\s+/g, '_')}.pdf`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(blobUrl);
                            } catch (err) {
                              console.error('Erreur téléchargement CV:', err);
                              window.open(cvUrl, '_blank');
                            }
                          }}
                        >
                          <i className="bi bi-file-earmark-pdf-fill"></i> Télécharger CV
                        </button>
                      )}
                      {portfolioUrl && (
                        <a 
                          href={portfolioUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 d-flex align-items-center gap-1"
                          style={{ fontSize: '0.8rem' }}
                        >
                          <i className="bi bi-globe"></i> Portfolio
                        </a>
                      )}
                      {telegramUrl && (
                        <a 
                          href={telegramUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1 text-white"
                          style={{ fontSize: '0.8rem', backgroundColor: '#229ED9', borderColor: '#229ED9' }}
                        >
                          <i className="bi bi-telegram"></i> Telegram
                        </a>
                      )}
                      {facebookUrl && (
                        <a 
                          href={facebookUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                          style={{ width: '32px', height: '32px' }}
                          title="Facebook"
                        >
                          <i className="bi bi-facebook text-primary"></i>
                        </a>
                      )}
                      {instagramUrl && (
                        <a 
                          href={instagramUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                          style={{ width: '32px', height: '32px' }}
                          title="Instagram"
                        >
                          <i className="bi bi-instagram text-danger"></i>
                        </a>
                      )}
                    </div>
                    
                    {user && (
                      <div className="rating-container mt-auto pt-3 border-top w-100">
                        {user.id === freelancer.user_id ? (
                           <p className="small text-muted mb-2"><i className="bi bi-star-fill text-warning me-1"></i>Ton profil</p>
                        ) : (
                           <p className="small text-muted mb-2">Notez ce freelancer</p>
                        )}
                        <div className="d-flex justify-content-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i 
                              key={star}
                              className={`bi ${ratings[freelancer.id] >= star ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-5`}
                              style={{ cursor: user.id === freelancer.user_id ? 'default' : 'pointer', transition: 'color 0.2s', opacity: user.id === freelancer.user_id ? 0.6 : 1 }}
                              onClick={() => {
                                if (user.id !== freelancer.user_id) {
                                  handleRate(freelancer.id, star);
                                }
                              }}
                            ></i>
                          ))}
                        </div>
                        <p className="small text-muted mt-2 mb-0 d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-person-check"></i>
                          <span>{ratingCounts[freelancer.id] || 0} avis</span>
                          {freelancer.avgRating > 0 && (
                            <span className="badge text-bg-warning ms-1" style={{ fontSize: '0.7rem' }}>
                              ★ {freelancer.avgRating.toFixed(1)}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </article>
                </div>
              )})}
            </div>
          )}
        </div>
      </section>

      {showCreateModal && (
        <CreateFreelancerModal 
          user={user} 
          onClose={() => setShowCreateModal(false)} 
          onComplete={() => {
            setShowCreateModal(false);
            fetchFreelancers();
          }} 
        />
      )}
    </main>
  );
}


function CreateFreelancerModal({ user, onClose, onComplete }) {
  const [step, setStep] = useState('select_role'); // 'select_role' | 'freelancer' | 'client'

  const safeName = (user?.user_metadata?.name || user?.user_metadata?.full_name || '');
  const splitName = safeName.split(' ');
  const defaultNom = splitName[0] || '';
  const defaultPrenom = splitName.slice(1).join(' ') || '';

  // État du formulaire Freelancer
  const [formData, setFormData] = useState({
    nom: defaultNom,
    prenom: defaultPrenom,
    nom_freelancer: '',
    photo_url: '',
    video_url: '',
    cv_url: '',
    age: '',
    date_naissance: '',
    whatsapp: '',
    telegram: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    reseaux_sociaux: '',
    site_web: '',
    activite: '',
    description: '',
    annees_experience: ''
  });

  // État du formulaire Client
  const [clientForm, setClientForm] = useState({
    nom: defaultNom,
    prenom: defaultPrenom,
    telephone: '',
    pays: "Côte d'Ivoire",
    preference_freelance: 'any',
    description_projet: ''
  });

  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [cvProgress, setCvProgress] = useState(0);
  const [error, setError] = useState(null);
  const [clientSuccess, setClientSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setClientForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("La photo ne doit pas dépasser 10 Mo.");
        return;
      }
      setUploadingMedia(true);
      setPhotoProgress(1);
      setError(null);
      try {
        const url = await uploadToCloudinary(file, 'image', (percent) => setPhotoProgress(percent));
        setFormData(prev => ({ ...prev, photo_url: url }));
      } catch (err) {
        console.error("Erreur d'envoi photo:", err);
        setError("Erreur d'envoi de la photo sur Cloudinary : " + (err.message || 'Échec'));
        setPhotoProgress(0);
      } finally {
        setUploadingMedia(false);
      }
    }
  };

  const handleVideoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError("La vidéo ne doit pas dépasser 100 Mo.");
        return;
      }
      setUploadingMedia(true);
      setVideoProgress(1);
      setError(null);
      try {
        const url = await uploadToCloudinary(file, 'video', (percent) => setVideoProgress(percent));
        setFormData(prev => ({ ...prev, video_url: url }));
      } catch (err) {
        console.error("Erreur d'envoi vidéo:", err);
        setError("Erreur d'envoi de la vidéo sur Cloudinary : " + (err.message || 'Échec'));
        setVideoProgress(0);
      } finally {
        setUploadingMedia(false);
      }
    }
  };

  const handleCvFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setError("Le CV ne doit pas dépasser 25 Mo.");
        return;
      }
      setUploadingMedia(true);
      setCvProgress(1);
      setError(null);
      try {
        const url = await uploadToCloudinary(file, 'raw', (percent) => setCvProgress(percent));
        setFormData(prev => ({ ...prev, cv_url: url }));
      } catch (err) {
        console.error("Erreur d'envoi CV:", err);
        setError("Erreur d'envoi du CV sur Cloudinary : " + (err.message || 'Échec'));
        setCvProgress(0);
      } finally {
        setUploadingMedia(false);
      }
    }
  };

  const handleSubmitFreelancer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const reseauxLinks = [
        formData.facebook,
        formData.instagram,
        formData.telegram,
        formData.linkedin,
        formData.twitter,
        ...(formData.reseaux_sociaux ? formData.reseaux_sociaux.split(',').map(l => l.trim()) : [])
      ].filter(Boolean);

      const { error: insertError } = await supabase.from('freelancers').insert({
        user_id: user?.id || null,
        nom: formData.nom,
        prenom: formData.prenom,
        nom_freelancer: formData.nom_freelancer,
        photo_url: formData.photo_url || null,
        video_url: formData.video_url || null,
        cv_url: formData.cv_url || null,
        age: formData.age ? parseInt(formData.age) : null,
        date_naissance: formData.date_naissance || null,
        whatsapp: formData.whatsapp || null,
        telegram: formData.telegram || null,
        facebook: formData.facebook || null,
        instagram: formData.instagram || null,
        linkedin: formData.linkedin || null,
        twitter: formData.twitter || null,
        reseaux_sociaux: { links: reseauxLinks },
        site_web: formData.site_web || null,
        activite: formData.activite,
        description: formData.description,
        annees_experience: formData.annees_experience ? parseInt(formData.annees_experience) : 0,
      });

      if (insertError) throw insertError;
      onComplete();
    } catch (err) {
      console.error("Erreur lors de la publication:", err);
      setError(err?.message || 'Une erreur est survenue lors de la publication.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClient = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from('client_requests').insert({
        user_id: user?.id || null,
        nom: clientForm.nom,
        prenom: clientForm.prenom,
        telephone: clientForm.telephone,
        description_projet: clientForm.description_projet,
        pays: clientForm.pays,
        preference_freelance: clientForm.preference_freelance
      });

      if (insertError) throw insertError;
      setClientSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error("Erreur lors du dépôt de la demande client:", err);
      setError(err?.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: 'rgba(38, 33, 92, 0.55)', backdropFilter: 'blur(5px)', zIndex: 1050 }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          
          {/* HEADER DYNAMIQUE */}
          <div className="modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
            {step !== 'select_role' ? (
              <button 
                type="button" 
                className="btn btn-sm btn-light rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
                onClick={() => { setStep('select_role'); setError(null); }}
                disabled={loading}
              >
                <i className="bi bi-arrow-left"></i> Retour
              </button>
            ) : (
              <div></div>
            )}

            <h5 className="modal-title font-serif fw-bold fs-4 text-title text-center flex-grow-1 mb-0 ms-2">
              {step === 'select_role' && 'Quel est votre objectif ?'}
              {step === 'freelancer' && 'Créer mon profil Freelancer'}
              {step === 'client' && 'Publier ma demande de projet'}
            </h5>

            <button type="button" className="btn-close ms-2" onClick={onClose} aria-label="Fermer" disabled={loading}></button>
          </div>

          <div className="modal-body py-4 px-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            
            {/* ETAPE 1: SELECTION DU ROLE */}
            {step === 'select_role' && (
              <div>
                <p className="text-center text-muted mb-4 fs-6">
                  Choisissez une option ci-dessous pour continuer :
                </p>

                <div className="row g-4 justify-content-center">
                  {/* CARTE FREELANCER */}
                  <div className="col-md-6">
                    <div 
                      className="card h-100 border-2 border-primary-subtle shadow-sm rounded-4 overflow-hidden"
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease', backgroundColor: '#FAFAFE' }}
                      onClick={() => setStep('freelancer')}
                    >
                      <div className="position-relative" style={{ height: '180px', overflow: 'hidden' }}>
                        <img 
                          src={freelancerImg} 
                          alt="Je suis un Freelancer" 
                          className="w-100 h-100" 
                          style={{ objectFit: 'cover' }} 
                        />
                        <span className="badge bg-primary position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill shadow-sm fs-6">
                          Indépendant
                        </span>
                      </div>
                      <div className="card-body p-4 text-center d-flex flex-column justify-content-between">
                        <div>
                          <h5 className="fw-bold text-title mb-2">Je suis un Freelancer</h5>
                          <p className="text-muted small mb-3">
                            Proposez vos services, mettez en avant vos compétences et votre portfolio pour être contacté par des clients et entreprises.
                          </p>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-primary-custom w-100 py-2 rounded-pill fw-bold shadow-sm"
                          onClick={(e) => { e.stopPropagation(); setStep('freelancer'); }}
                        >
                          <i className="bi bi-person-badge me-2"></i>Je suis un Freelancer
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CARTE CLIENT */}
                  <div className="col-md-6">
                    <div 
                      className="card h-100 border-2 border-info-subtle shadow-sm rounded-4 overflow-hidden"
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease', backgroundColor: '#FAFAFE' }}
                      onClick={() => setStep('client')}
                    >
                      <div className="position-relative" style={{ height: '180px', overflow: 'hidden' }}>
                        <img 
                          src={clientImg} 
                          alt="Je suis un Client" 
                          className="w-100 h-100" 
                          style={{ objectFit: 'cover' }} 
                        />
                        <span className="badge bg-info text-dark position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill shadow-sm fs-6 fw-bold">
                          Client / Recruteur
                        </span>
                      </div>
                      <div className="card-body p-4 text-center d-flex flex-column justify-content-between">
                        <div>
                          <h5 className="fw-bold text-title mb-2">Je suis un Client</h5>
                          <p className="text-muted small mb-3">
                            Publiez votre besoin de projet et entrez directement en contact avec les meilleurs freelancers pour vos réalisations.
                          </p>
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-info text-white w-100 py-2 rounded-pill fw-bold shadow-sm"
                          style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                          onClick={(e) => { e.stopPropagation(); setStep('client'); }}
                        >
                          <i className="bi bi-briefcase me-2"></i>Je suis un Client
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ETAPE 2: FORMULAIRE CLIENT */}
            {step === 'client' && (
              <div>
                {clientSuccess ? (
                  <div className="text-center py-5">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white mb-3" style={{ width: '70px', height: '70px' }}>
                      <i className="bi bi-check-lg fs-1"></i>
                    </div>
                    <h4 className="fw-bold text-success mb-2">Demande publiée avec succès !</h4>
                    <p className="text-muted">Votre projet est maintenant visible par les freelancers et dans le tableau de bord.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitClient}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label text-body-custom small fw-bold">Nom *</label>
                        <input 
                          type="text" 
                          name="nom" 
                          className="form-control" 
                          placeholder="Votre nom" 
                          value={clientForm.nom} 
                          onChange={handleClientChange} 
                          required 
                          disabled={loading} 
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-body-custom small fw-bold">Prénom *</label>
                        <input 
                          type="text" 
                          name="prenom" 
                          className="form-control" 
                          placeholder="Votre prénom" 
                          value={clientForm.prenom} 
                          onChange={handleClientChange} 
                          required 
                          disabled={loading} 
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-body-custom small fw-bold">
                          <i className="bi bi-telephone text-primary me-1"></i>Téléphone (WhatsApp ou Telegram) *
                        </label>
                        <input 
                          type="text" 
                          name="telephone" 
                          className="form-control" 
                          placeholder="+225 0700000000 ou @pseudo" 
                          value={clientForm.telephone} 
                          onChange={handleClientChange} 
                          required 
                          disabled={loading} 
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label text-body-custom small fw-bold">
                          <i className="bi bi-geo-alt text-danger me-1"></i>Pays *
                        </label>
                        <input 
                          type="text" 
                          name="pays" 
                          className="form-control" 
                          placeholder="Ex: Côte d'Ivoire, Sénégal, France..." 
                          value={clientForm.pays} 
                          onChange={handleClientChange} 
                          required 
                          disabled={loading} 
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label text-body-custom small fw-bold">
                          Préférence de localisation du Freelancer *
                        </label>
                        <select 
                          name="preference_freelance" 
                          className="form-select" 
                          value={clientForm.preference_freelance} 
                          onChange={handleClientChange}
                          disabled={loading}
                        >
                          <option value="any">N'importe quel (Indifférent)</option>
                          <option value="local">Freelancer Local (dans mon pays)</option>
                          <option value="externe">Freelancer Externe (International / Remote)</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label text-body-custom small fw-bold">
                          Description de votre projet / besoin *
                        </label>
                        <textarea 
                          name="description_projet" 
                          className="form-control" 
                          rows="5" 
                          placeholder="Décrivez votre besoin en détail : objectifs, compétences recherchées, budget estimé, délais..." 
                          value={clientForm.description_projet} 
                          onChange={handleClientChange} 
                          required 
                          disabled={loading}
                        ></textarea>
                      </div>
                    </div>

                    {error && (
                      <div className="alert alert-danger mt-3 py-2 px-3 mb-0" style={{ fontSize: '0.85rem', borderRadius: '10px' }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>{error}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="btn btn-info text-white w-100 py-2 mt-4 fw-bold shadow-sm" 
                      style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                      disabled={loading}
                    >
                      {loading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : <i className="bi bi-send me-2"></i>}
                      Publier ma demande de projet
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ETAPE 3: FORMULAIRE FREELANCER */}
            {step === 'freelancer' && (
              <form onSubmit={handleSubmitFreelancer}>
                <div className="row g-3">
                  {/* Aperçu / Photo et Vidéo de profil & CV */}
                  <div className="col-12 text-center mb-2">
                    <div className="d-inline-block position-relative">
                      {formData.video_url ? (
                        <video src={formData.video_url} autoPlay loop muted playsInline className="rounded-circle shadow-sm" style={{ width: '90px', height: '90px', objectFit: 'cover', border: '3px solid #FF7A00' }} />
                      ) : formData.photo_url ? (
                        <img src={formData.photo_url} alt="Aperçu" className="rounded-circle shadow-sm" style={{ width: '90px', height: '90px', objectFit: 'cover', border: '3px solid var(--folio-primary)' }} />
                      ) : (
                        <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm mx-auto" style={{ width: '90px', height: '90px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }}>
                          <i className="bi bi-camera fs-2"></i>
                        </div>
                      )}
                    </div>
                    {videoProgress > 0 && videoProgress < 100 && (
                      <div className="w-100 my-2">
                        <div className="d-flex justify-content-between small text-title fw-bold mb-1">
                          <span>Téléversement vidéo sur Cloudinary...</span>
                          <span>{videoProgress}%</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar progress-bar-striped progress-bar-animated bg-warning" style={{ width: `${videoProgress}%` }}></div>
                        </div>
                      </div>
                    )}

                    {cvProgress > 0 && cvProgress < 100 && (
                      <div className="w-100 my-2">
                        <div className="d-flex justify-content-between small text-title fw-bold mb-1">
                          <span>Téléversement CV sur Cloudinary...</span>
                          <span>{cvProgress}%</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div className="progress-bar progress-bar-striped progress-bar-animated bg-success" style={{ width: `${cvProgress}%` }}></div>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 d-flex flex-wrap justify-content-center gap-2">
                      <label className="btn btn-sm btn-outline-custom">
                        <i className="bi bi-image me-1"></i>Photo de profil
                        <input type="file" accept="image/*" className="d-none" onChange={handlePhotoFileChange} disabled={loading || uploadingMedia} />
                      </label>
                      <label className="btn btn-sm btn-outline-warning" style={{ color: '#FF7A00', borderColor: '#FF7A00' }}>
                        <i className="bi bi-camera-reels me-1"></i>Vidéo de profil (ProMax)
                        <input type="file" accept="video/*" className="d-none" onChange={handleVideoFileChange} disabled={loading || uploadingMedia} />
                      </label>
                      <label className="btn btn-sm btn-outline-success">
                        <i className="bi bi-file-earmark-pdf me-1"></i>Ajouter son CV (ProMax)
                        <input type="file" accept=".pdf,.doc,.docx" className="d-none" onChange={handleCvFileChange} disabled={loading || uploadingMedia} />
                      </label>
                    </div>
                    {formData.cv_url && <small className="text-success d-block mt-1"><i className="bi bi-check-circle me-1"></i>CV joint avec succès (Stocké sur Cloudinary)</small>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-body-custom small">Nom</label>
                    <input type="text" name="nom" className="form-control" value={formData.nom} onChange={handleChange} required disabled={loading} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-body-custom small">Prénom</label>
                    <input type="text" name="prenom" className="form-control" value={formData.prenom} onChange={handleChange} required disabled={loading} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-body-custom small">Nom du profil / Nom de freelancer</label>
                    <input type="text" name="nom_freelancer" className="form-control" placeholder="ex: John Dev" value={formData.nom_freelancer} onChange={handleChange} required disabled={loading} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-body-custom small">Activité / Spécialité</label>
                    <input type="text" name="activite" className="form-control" placeholder="ex: Développeur Web Fullstack" value={formData.activite} onChange={handleChange} required disabled={loading} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-body-custom small">Âge</label>
                    <input type="number" name="age" className="form-control" value={formData.age} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-body-custom small">Date de naissance</label>
                    <input type="date" name="date_naissance" className="form-control" value={formData.date_naissance} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label text-body-custom small">Années d'expérience</label>
                    <input type="number" name="annees_experience" className="form-control" value={formData.annees_experience} onChange={handleChange} disabled={loading} />
                  </div>

                  {/* Moyens de contact */}
                  <div className="col-12 mt-4"><h6 className="font-serif fw-bold text-title mb-0"><i className="bi bi-chat-dots me-2 text-primary"></i>Contacts & Portfolio</h6></div>
                  <div className="col-md-6">
                    <label className="form-label text-body-custom small"><i className="bi bi-whatsapp text-success me-1"></i>Numéro WhatsApp</label>
                    <input type="text" name="whatsapp" className="form-control" placeholder="+22507000000" value={formData.whatsapp} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-body-custom small"><i className="bi bi-globe text-primary me-1"></i>Portfolio / Site web</label>
                    <input type="url" name="site_web" className="form-control" placeholder="https://mon-portfolio.com" value={formData.site_web} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-body-custom small"><i className="bi bi-telegram text-info me-1"></i>Telegram (Pseudo ou lien)</label>
                    <input type="text" name="telegram" className="form-control" placeholder="@mon_telegram" value={formData.telegram} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-body-custom small"><i className="bi bi-facebook text-primary me-1"></i>Facebook (Lien)</label>
                    <input type="url" name="facebook" className="form-control" placeholder="https://facebook.com/monprofil" value={formData.facebook} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-body-custom small"><i className="bi bi-instagram text-danger me-1"></i>Instagram (Lien ou pseudo)</label>
                    <input type="text" name="instagram" className="form-control" placeholder="@mon_insta" value={formData.instagram} onChange={handleChange} disabled={loading} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-body-custom small"><i className="bi bi-linkedin text-primary me-1"></i>LinkedIn (Lien)</label>
                    <input type="url" name="linkedin" className="form-control" placeholder="https://linkedin.com/in/monprofil" value={formData.linkedin} onChange={handleChange} disabled={loading} />
                  </div>

                  <div className="col-12 mt-3">
                    <label className="form-label text-body-custom small">Description</label>
                    <textarea name="description" className="form-control" rows="4" placeholder="Décris tes services, compétences et propositions de valeur..." value={formData.description} onChange={handleChange} required disabled={loading}></textarea>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger mt-3 py-2 px-3 mb-0" style={{ fontSize: '0.85rem', borderRadius: '10px' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>{error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary-custom w-100 py-2 mt-4" disabled={loading || uploadingMedia || (videoProgress > 0 && videoProgress < 100) || (cvProgress > 0 && cvProgress < 100)}>
                  {loading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : <i className="bi bi-upload me-2"></i>}
                  {uploadingMedia ? 'Téléversement des fichiers...' : 'Publier le profil'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

