import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const emptyForm = {
  nom: '',
  prenom: '',
  nom_freelancer: '',
  photo_url: '',
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

export default function MyProfilesModal({ userId, userName, onClose }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
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
    setFormData({ ...emptyForm, nom: userName || '' });
    setError('');
  };

  const startEdit = (profile) => {
    setEditingProfile(profile);
    setFormData({
      nom: profile.nom || '',
      prenom: profile.prenom || '',
      nom_freelancer: profile.nom_freelancer || '',
      photo_url: profile.photo_url || '',
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
    setFormData(emptyForm);
    setError('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("La photo ne doit pas dépasser 2 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
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
          ) : editingProfile || (!profiles.length && canCreate) ? (
            <ProfileForm
              formData={formData}
              saving={saving}
              isEditing={Boolean(editingProfile)}
              onChange={handleChange}
              onPhotoFileChange={handlePhotoFileChange}
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

function ProfileForm({ formData, saving, isEditing, onChange, onPhotoFileChange, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        {/* Photo de profil */}
        <div className="col-12 text-center mb-2">
          {formData.photo_url ? (
            <img src={formData.photo_url} alt="Aperçu" className="rounded-circle shadow-sm mb-2" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '2px solid var(--folio-primary)' }} />
          ) : (
            <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm mx-auto mb-2" style={{ width: '80px', height: '80px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }}>
              <i className="bi bi-camera fs-3"></i>
            </div>
          )}
          <div>
            <label className="btn btn-sm btn-outline-custom me-2">
              <i className="bi bi-upload me-1"></i>Choisir une photo
              <input type="file" accept="image/*" className="d-none" onChange={onPhotoFileChange} disabled={saving} />
            </label>
          </div>
          <input type="url" name="photo_url" className="form-control form-control-sm text-center mx-auto mt-2" style={{ maxWidth: '350px' }} placeholder="ou URL de la photo" value={formData.photo_url} onChange={onChange} disabled={saving} />
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
        <button type="button" className="btn btn-outline-custom" onClick={onCancel} disabled={saving}>Annuler</button>
        <button type="submit" className="btn btn-primary-custom" disabled={saving}>
          {saving ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : <i className="bi bi-check-lg me-1"></i>}
          {isEditing ? 'Enregistrer les modifications' : 'Publier le profil'}
        </button>
      </div>
    </form>
  );
}

