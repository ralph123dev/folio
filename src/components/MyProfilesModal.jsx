import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { uploadToCloudinary, sanitizeMediaUrl } from '../lib/cloudinary';

const emptyForm = {
  nom: '',
  prenom: '',
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
  annees_experience: '',
};

export default function MyProfilesModal({ userId, userName, isProMax, onClose }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: fetchError } = await supabase
      .from('freelancers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message || 'Impossible de charger tes profils.');
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const startCreate = () => {
    setEditingProfile(null);
    setIsCreating(true);
    setFormData({ ...emptyForm, nom: userName || '' });
    setError('');
  };

  const startEdit = (profile) => {
    setEditingProfile(profile);
    setIsCreating(false);
    setFormData({
      nom: profile.nom || '',
      prenom: profile.prenom || '',
      nom_freelancer: profile.nom_freelancer || '',
      photo_url: profile.photo_url || '',
      video_url: profile.video_url || '',
      cv_url: profile.cv_url || '',
      age: profile.age || '',
      date_naissance: profile.date_naissance || '',
      whatsapp: profile.whatsapp || '',
      telegram: profile.telegram || '',
      facebook: profile.facebook || '',
      instagram: profile.instagram || '',
      linkedin: profile.linkedin || '',
      twitter: profile.twitter || '',
      reseaux_sociaux: Array.isArray(profile.reseaux_sociaux?.links)
        ? profile.reseaux_sociaux.links.join(', ')
        : '',
      site_web: profile.site_web || '',
      activite: profile.activite || '',
      description: profile.description || '',
      annees_experience: profile.annees_experience || '',
    });
    setError('');
  };

  const cancelForm = () => {
    setEditingProfile(null);
    setIsCreating(false);
    setFormData(emptyForm);
    setError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const [videoProgress, setVideoProgress] = useState(0);
  const [cvProgress, setCvProgress] = useState(0);

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("La photo ne doit pas dépasser 5 Mo.");
        return;
      }
      setSaving(true);
      try {
        const url = await uploadToCloudinary(file, 'image');
        setFormData(prev => ({ ...prev, photo_url: url }));
      } catch (err) {
        setError("Erreur d'envoi de la photo : " + (err.message || ''));
      } finally {
        setSaving(false);
      }
    }
  };

  const handleVideoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError("La vidéo ne doit pas dépasser 20 Mo.");
        return;
      }
      setSaving(true);
      setVideoProgress(1);
      try {
        const url = await uploadToCloudinary(file, 'video', (percent) => setVideoProgress(percent));
        setFormData(prev => ({ ...prev, video_url: url }));
      } catch (err) {
        setError("Erreur d'envoi de la vidéo : " + (err.message || ''));
        setVideoProgress(0);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCvFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Le CV ne doit pas dépasser 10 Mo.");
        return;
      }
      setSaving(true);
      setCvProgress(1);
      try {
        const url = await uploadToCloudinary(file, 'raw', (percent) => setCvProgress(percent));
        setFormData(prev => ({ ...prev, cv_url: url }));
      } catch (err) {
        setError("Erreur d'envoi du CV : " + (err.message || ''));
        setCvProgress(0);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const reseauxLinks = [
      formData.facebook,
      formData.instagram,
      formData.telegram,
      formData.linkedin,
      formData.twitter,
      ...(formData.reseaux_sociaux ? formData.reseaux_sociaux.split(',').map((link) => link.trim()) : [])
    ].filter(Boolean);

    const payload = {
      user_id: userId,
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      nom_freelancer: formData.nom_freelancer.trim(),
      photo_url: formData.photo_url.trim() || null,
      video_url: isProMax ? (formData.video_url.trim() || null) : null,
      cv_url: formData.cv_url.trim() || null,
      age: formData.age ? Number(formData.age) : null,
      date_naissance: formData.date_naissance || null,
      whatsapp: formData.whatsapp.trim() || null,
      telegram: formData.telegram.trim() || null,
      facebook: formData.facebook.trim() || null,
      instagram: formData.instagram.trim() || null,
      linkedin: formData.linkedin.trim() || null,
      twitter: formData.twitter.trim() || null,
      reseaux_sociaux: { links: reseauxLinks },
      site_web: formData.site_web.trim() || null,
      activite: formData.activite.trim(),
      description: formData.description.trim() || null,
      annees_experience: formData.annees_experience ? Number(formData.annees_experience) : 0,
    };

    const response = editingProfile
      ? await supabase.from('freelancers').update(payload).eq('id', editingProfile.id).eq('user_id', userId)
      : await supabase.from('freelancers').insert(payload);

    if (response.error) {
      setError(response.error.message || 'Impossible d’enregistrer ce profil.');
    } else {
      cancelForm();
      await fetchProfiles();
    }
    setSaving(false);
  };

  const handleDelete = async (profile) => {
    if (!window.confirm(`Supprimer le profil « ${profile.nom_freelancer} » ?`)) return;

    setError('');
    const { error: deleteError } = await supabase
      .from('freelancers')
      .delete()
      .eq('id', profile.id)
      .eq('user_id', userId);

    if (deleteError) {
      setError(deleteError.message || 'Impossible de supprimer ce profil.');
    } else {
      await fetchProfiles();
    }
  };

  const canCreate = profiles.length < 5;

  return (
    <div className="optim-modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="optim-modal-container my-profiles-modal" onClick={(event) => event.stopPropagation()}>
        <div className="p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div>
              <p className="folio-auth-eyebrow mb-1">Espace professionnel</p>
              <h2 className="font-serif fw-bold text-title mb-1">Mes profils</h2>
              <p className="text-body-custom mb-0 small">Gère et modifie les profils que tu publies sur Folio.</p>
            </div>
            <button type="button" className="btn btn-link p-0 text-muted" onClick={onClose} aria-label="Fermer">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {error && <div className="alert alert-danger py-2 px-3 small">{error}</div>}

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Chargement...</span></div></div>
          ) : editingProfile || isCreating || (!profiles.length && canCreate) ? (
            <ProfileForm
              formData={formData}
              saving={saving}
              videoProgress={videoProgress}
              cvProgress={cvProgress}
              isProMax={isProMax}
              isEditing={Boolean(editingProfile)}
              onChange={handleChange}
              onPhotoFileChange={handlePhotoFileChange}
              onVideoFileChange={handleVideoFileChange}
              onCvFileChange={handleCvFileChange}
              onSubmit={handleSubmit}
              onCancel={editingProfile || profiles.length ? cancelForm : onClose}
            />
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="small text-muted">{profiles.length}/5 profils publiés</span>
                <button type="button" className="btn btn-primary-custom btn-sm" onClick={startCreate} disabled={!canCreate}>
                  <i className="bi bi-plus-lg me-1"></i>Nouveau profil
                </button>
              </div>
              <div className="my-profiles-list">
                {profiles.map((profile) => (
                  <article key={profile.id} className="my-profile-item p-3 mb-3 border rounded-3 bg-white">
                    <div className="d-flex justify-content-between align-items-center gap-3">
                      <div className="d-flex align-items-center gap-3">
                        {profile.photo_url ? (
                          <img src={profile.photo_url} alt={profile.nom_freelancer} className="rounded-circle shadow-sm" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                        ) : (
                          <div className="my-profile-icon rounded-circle d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }}>
                            <i className="bi bi-briefcase-fill fs-5"></i>
                          </div>
                        )}
                        <div>
                          <h3 className="h6 fw-bold text-title mb-1">{profile.nom_freelancer}</h3>
                          <p className="small text-primary mb-0">{profile.activite}</p>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-light" onClick={() => startEdit(profile)} title="Modifier">
                          <i className="bi bi-pencil me-1"></i>Modifier
                        </button>
                        <button type="button" className="btn btn-sm btn-light text-danger" onClick={() => handleDelete(profile)} title="Supprimer">
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileForm({ formData, saving, videoProgress, cvProgress, isProMax, isEditing, onChange, onPhotoFileChange, onVideoFileChange, onCvFileChange, onSubmit, onCancel }) {
  const isUploadingMedia = (videoProgress > 0 && videoProgress < 100) || (cvProgress > 0 && cvProgress < 100);

  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        {/* Photo et Vidéo de profil & CV */}
        <div className="col-12 text-center mb-2">
          {formData.video_url ? (
            <video src={sanitizeMediaUrl(formData.video_url)} autoPlay loop muted playsInline className="rounded-circle shadow-sm mb-2" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '2px solid #FF7A00' }} />
          ) : formData.photo_url ? (
            <img src={sanitizeMediaUrl(formData.photo_url)} alt="Aperçu" className="rounded-circle shadow-sm mb-2" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '2px solid var(--folio-primary)' }} />
          ) : (
            <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm mx-auto mb-2" style={{ width: '80px', height: '80px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }}>
              <i className="bi bi-camera fs-3"></i>
            </div>
          )}

          {videoProgress > 0 && videoProgress < 100 && (
            <div className="w-100 my-2">
              <div className="d-flex justify-content-between small text-title fw-bold mb-1">
                <span>Téléversement vidéo...</span>
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
                <span>Téléversement CV...</span>
                <span>{cvProgress}%</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div className="progress-bar progress-bar-striped progress-bar-animated bg-success" style={{ width: `${cvProgress}%` }}></div>
              </div>
            </div>
          )}

          <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
            <label className="btn btn-sm btn-outline-custom">
              <i className="bi bi-image me-1"></i>Photo
              <input type="file" accept="image/*" className="d-none" onChange={onPhotoFileChange} disabled={saving || isUploadingMedia} />
            </label>
            {isProMax && (
              <label className="btn btn-sm btn-outline-warning" style={{ color: '#FF7A00', borderColor: '#FF7A00' }}>
                <i className="bi bi-camera-reels me-1"></i>Vidéo (ProMax)
                <input type="file" accept="video/*" className="d-none" onChange={onVideoFileChange} disabled={saving || isUploadingMedia} />
              </label>
            )}
            <label className="btn btn-sm btn-outline-success">
              <i className="bi bi-file-earmark-pdf me-1"></i>CV (ProMax)
              <input type="file" accept=".pdf,.doc,.docx" className="d-none" onChange={onCvFileChange} disabled={saving || isUploadingMedia} />
            </label>
          </div>
          {formData.cv_url && <small className="text-success d-block mt-1"><i className="bi bi-check-circle me-1"></i>CV joint</small>}
        </div>

        <div className="col-md-6">
          <label className="form-label text-body-custom small">Nom</label>
          <input type="text" name="nom" className="form-control" value={formData.nom} onChange={onChange} required disabled={saving} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-body-custom small">Prénom</label>
          <input type="text" name="prenom" className="form-control" value={formData.prenom} onChange={onChange} required disabled={saving} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-body-custom small">Nom du profil</label>
          <input type="text" name="nom_freelancer" className="form-control" value={formData.nom_freelancer} onChange={onChange} required disabled={saving} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-body-custom small">Activité / Spécialité</label>
          <input type="text" name="activite" className="form-control" value={formData.activite} onChange={onChange} required disabled={saving} />
        </div>

        <div className="col-md-4">
          <label className="form-label text-body-custom small">Âge</label>
          <input type="number" name="age" className="form-control" value={formData.age} onChange={onChange} disabled={saving} />
        </div>
        <div className="col-md-4">
          <label className="form-label text-body-custom small">Date de naissance</label>
          <input type="date" name="date_naissance" className="form-control" value={formData.date_naissance} onChange={onChange} disabled={saving} />
        </div>
        <div className="col-md-4">
          <label className="form-label text-body-custom small">Années d'expérience</label>
          <input type="number" name="annees_experience" className="form-control" value={formData.annees_experience} onChange={onChange} disabled={saving} />
        </div>

        {/* Contacts & Réseaux */}
        <div className="col-12 mt-3"><h6 className="font-serif fw-bold text-title mb-0"><i className="bi bi-chat-dots me-2 text-primary"></i>Contacts & Réseaux sociaux</h6></div>
        <div className="col-md-6">
          <label className="form-label text-body-custom small">WhatsApp</label>
          <input type="text" name="whatsapp" className="form-control" placeholder="+22507000000" value={formData.whatsapp} onChange={onChange} disabled={saving} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-body-custom small">Portfolio / Site web</label>
          <input type="url" name="site_web" className="form-control" placeholder="https://" value={formData.site_web} onChange={onChange} disabled={saving} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-body-custom small">Telegram</label>
          <input type="text" name="telegram" className="form-control" placeholder="@username" value={formData.telegram} onChange={onChange} disabled={saving} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-body-custom small">Facebook</label>
          <input type="url" name="facebook" className="form-control" placeholder="Lien profil" value={formData.facebook} onChange={onChange} disabled={saving} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-body-custom small">Instagram</label>
          <input type="text" name="instagram" className="form-control" placeholder="@username" value={formData.instagram} onChange={onChange} disabled={saving} />
        </div>
        <div className="col-md-6">
          <label className="form-label text-body-custom small">LinkedIn</label>
          <input type="url" name="linkedin" className="form-control" placeholder="Lien LinkedIn" value={formData.linkedin} onChange={onChange} disabled={saving} />
        </div>

        <div className="col-12">
          <label className="form-label text-body-custom small" htmlFor="profile-description">Description</label>
          <textarea id="profile-description" name="description" className="form-control" rows="4" value={formData.description} onChange={onChange} disabled={saving} />
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2 mt-4">
        <button type="button" className="btn btn-outline-custom" onClick={onCancel} disabled={saving || isUploadingMedia}>Annuler</button>
        <button type="submit" className="btn btn-primary-custom" disabled={saving || isUploadingMedia}>
          {saving ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : <i className="bi bi-check-lg me-1"></i>}
          {isEditing ? 'Enregistrer les modifications' : 'Publier le profil'}
        </button>
      </div>
    </form>
  );
}

