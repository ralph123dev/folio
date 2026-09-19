import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const emptyForm = {
  nom: '',
  prenom: '',
  nom_freelancer: '',
  age: '',
  date_naissance: '',
  whatsapp: '',
  reseaux_sociaux: '',
  site_web: '',
  activite: '',
  description: '',
  annees_experience: '',
};

const fields = [
  ['nom', 'Nom', 'text', true],
  ['prenom', 'Prénom', 'text', true],
  ['nom_freelancer', 'Nom du profil', 'text', true],
  ['activite', 'Activité / spécialité', 'text', true],
  ['age', 'Âge', 'number', false],
  ['date_naissance', 'Date de naissance', 'date', false],
  ['annees_experience', "Années d'expérience", 'number', false],
  ['whatsapp', 'Numéro WhatsApp', 'tel', false],
  ['site_web', 'Site web personnel', 'url', false],
  ['reseaux_sociaux', 'Réseaux sociaux', 'text', false],
];

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
      age: profile.age || '',
      date_naissance: profile.date_naissance || '',
      whatsapp: profile.whatsapp || '',
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      user_id: userId,
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      nom_freelancer: formData.nom_freelancer.trim(),
      age: formData.age ? Number(formData.age) : null,
      date_naissance: formData.date_naissance || null,
      whatsapp: formData.whatsapp.trim() || null,
      reseaux_sociaux: {
        links: formData.reseaux_sociaux.split(',').map((link) => link.trim()).filter(Boolean),
      },
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
              <p className="text-body-custom mb-0 small">Gère les profils que tu publies sur Folio.</p>
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
              fields={fields}
              saving={saving}
              isEditing={Boolean(editingProfile)}
              onChange={handleChange}
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
                  <article key={profile.id} className="my-profile-item p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div className="d-flex gap-3">
                        <div className="my-profile-icon"><i className="bi bi-briefcase-fill"></i></div>
                        <div>
                          <h3 className="h6 fw-bold text-title mb-1">{profile.nom_freelancer}</h3>
                          <p className="small text-primary mb-1">{profile.activite}</p>
                          <p className="small text-muted mb-0">{profile.description || 'Aucune description renseignée.'}</p>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        <button type="button" className="btn btn-sm btn-light" onClick={() => startEdit(profile)} title="Modifier">
                          <i className="bi bi-pencil"></i>
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

function ProfileForm({ formData, fields, saving, isEditing, onChange, onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        {fields.map(([name, label, type, required]) => (
          <div className={name === 'reseaux_sociaux' || name === 'site_web' ? 'col-12' : 'col-md-6'} key={name}>
            <label className="form-label text-body-custom small" htmlFor={`profile-${name}`}>{label}</label>
            <input
              id={`profile-${name}`}
              type={type}
              name={name}
              className="form-control"
              value={formData[name]}
              onChange={onChange}
              required={required}
              disabled={saving}
            />
          </div>
        ))}
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
