import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import './auth.css';

export default function Freelancers({ user, onStart }) {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    fetchFreelancers();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserRatings();
    }
  }, [user]);

  const fetchFreelancers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('freelancers')
      .select('*, profils(profile_photo_url)')
      .order('created_at', { ascending: false });
    if (data) {
      setFreelancers(data);
    }
    setLoading(false);
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
    }
  };

  const truncateWords = (str, numWords) => {
    if (!str) return '';
    const words = str.split(/\s+/);
    if (words.length <= numWords) return str;
    return words.slice(0, numWords).join(' ') + '...';
  };

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
          <div className="text-center mb-5">
            <p className="text-uppercase fw-semibold mb-2" style={{ color: 'var(--folio-secondary-2)', letterSpacing: '0.1em', fontSize: '0.8rem' }}>Pour développer ton activité</p>
            <h2 className="display-6 font-serif">Les Freelancers</h2>
          </div>
          
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : freelancers.length === 0 ? (
            <div className="text-center text-muted">
              <p>Aucun profil freelancer pour le moment.</p>
              <button className="btn btn-outline-custom mt-3" onClick={handleCreateProfile}>Soyez le premier !</button>
            </div>
          ) : (
            <div className="row g-4">
              {freelancers.map((freelancer) => (
                <div className="col-md-4" key={freelancer.id}>
                  <article className="h-100 p-4 border rounded-3 d-flex flex-column align-items-center text-center">
                    {freelancer.profils?.profile_photo_url ? (
                      <img 
                        src={freelancer.profils.profile_photo_url} 
                        alt="Avatar" 
                        className="rounded-circle mb-3 shadow-sm" 
                        style={{ width: '80px', height: '80px', objectFit: 'cover', border: '3px solid #EEEDFE' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle mb-3 d-flex align-items-center justify-content-center shadow-sm" 
                        style={{ width: '80px', height: '80px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }}
                      >
                        <i className="bi bi-person fs-1"></i>
                      </div>
                    )}
                    <h3 className="font-serif h5 mb-1">{freelancer.nom_freelancer}</h3>
                    <p className="text-muted small mb-3 fw-medium">{freelancer.activite}</p>
                    <p className="text-body-custom mb-4" style={{ fontSize: '0.9rem', flexGrow: 1 }}>
                      {truncateWords(freelancer.description, 20)}
                    </p>
                    
                    {user && (
                      <div className="rating-container mt-auto pt-3 border-top w-100">
                        <p className="small text-muted mb-2">Notez ce freelancer</p>
                        <div className="d-flex justify-content-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i 
                              key={star}
                              className={`bi ${ratings[freelancer.id] >= star ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-5`}
                              style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                              onClick={() => handleRate(freelancer.id, star)}
                            ></i>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              ))}
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
  const [formData, setFormData] = useState({
    nom: user?.user_metadata?.name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || '',
    prenom: user?.user_metadata?.name?.split(' ').slice(1).join(' ') || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    nom_freelancer: '',
    age: '',
    date_naissance: '',
    whatsapp: '',
    reseaux_sociaux: '',
    site_web: '',
    activite: '',
    description: '',
    annees_experience: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const reseaux = { links: formData.reseaux_sociaux.split(',').map(l => l.trim()).filter(l => l) };
      
      const { error: insertError } = await supabase.from('freelancers').insert({
        user_id: user.id,
        nom: formData.nom,
        prenom: formData.prenom,
        nom_freelancer: formData.nom_freelancer,
        age: formData.age ? parseInt(formData.age) : null,
        date_naissance: formData.date_naissance || null,
        whatsapp: formData.whatsapp,
        reseaux_sociaux: reseaux,
        site_web: formData.site_web,
        activite: formData.activite,
        description: formData.description,
        annees_experience: formData.annees_experience ? parseInt(formData.annees_experience) : 0,
      });

      if (insertError) throw insertError;
      onComplete();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      style={{ backgroundColor: 'rgba(38, 33, 92, 0.45)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
            <h5 className="modal-title font-serif fw-bold fs-4 text-title">Créer mon profil Freelancer</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Fermer" disabled={loading}></button>
          </div>
          <div className="modal-body py-4 px-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-body-custom small">Nom</label>
                  <input type="text" name="nom" className="form-control" value={formData.nom} onChange={handleChange} required disabled={loading} />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-body-custom small">Prénom</label>
                  <input type="text" name="prenom" className="form-control" value={formData.prenom} onChange={handleChange} required disabled={loading} />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-body-custom small">Nom de freelancer</label>
                  <input type="text" name="nom_freelancer" className="form-control" value={formData.nom_freelancer} onChange={handleChange} required disabled={loading} />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-body-custom small">Activité / Spécialité</label>
                  <input type="text" name="activite" className="form-control" placeholder="ex: Développeur Web" value={formData.activite} onChange={handleChange} required disabled={loading} />
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
                <div className="col-md-6">
                  <label className="form-label text-body-custom small">Numéro WhatsApp</label>
                  <input type="text" name="whatsapp" className="form-control" value={formData.whatsapp} onChange={handleChange} disabled={loading} />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-body-custom small">Site web personnel</label>
                  <input type="url" name="site_web" className="form-control" placeholder="https://" value={formData.site_web} onChange={handleChange} disabled={loading} />
                </div>
                <div className="col-12">
                  <label className="form-label text-body-custom small">Réseaux sociaux (séparés par des virgules)</label>
                  <input type="text" name="reseaux_sociaux" className="form-control" placeholder="Liens LinkedIn, Twitter, etc." value={formData.reseaux_sociaux} onChange={handleChange} disabled={loading} />
                </div>
                <div className="col-12">
                  <label className="form-label text-body-custom small">Description</label>
                  <textarea name="description" className="form-control" rows="4" value={formData.description} onChange={handleChange} required disabled={loading}></textarea>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mt-3 py-2 px-3 mb-0" style={{ fontSize: '0.85rem', borderRadius: '10px' }}>
                  <i className="bi bi-exclamation-triangle me-2"></i>{error}
                </div>
              )}

              <button type="submit" className="btn btn-primary-custom w-100 py-2 mt-4" disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : <i className="bi bi-upload me-2"></i>}
                Publier
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
