import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './auth.css';

// Liste des pays africains (30) avec indicatifs
const africanCountries = [
  { name: 'Afrique du Sud', code: '+27' },
  { name: 'Algérie', code: '+213' },
  { name: 'Angola', code: '+244' },
  { name: 'Bénin', code: '+229' },
  { name: 'Burkina Faso', code: '+226' },
  { name: 'Burundi', code: '+257' },
  { name: 'Cameroun', code: '+237' },
  { name: 'Congo (RDC)', code: '+243' },
  { name: 'Congo (République)', code: '+242' },
  { name: 'Côte d\'Ivoire', code: '+225' },
  { name: 'Égypte', code: '+20' },
  { name: 'Éthiopie', code: '+251' },
  { name: 'Gabon', code: '+241' },
  { name: 'Ghana', code: '+233' },
  { name: 'Guinée', code: '+224' },
  { name: 'Kenya', code: '+254' },
  { name: 'Madagascar', code: '+261' },
  { name: 'Mali', code: '+223' },
  { name: 'Maroc', code: '+212' },
  { name: 'Mozambique', code: '+258' },
  { name: 'Niger', code: '+227' },
  { name: 'Nigeria', code: '+234' },
  { name: 'Ouganda', code: '+256' },
  { name: 'Rwanda', code: '+250' },
  { name: 'Sénégal', code: '+221' },
  { name: 'Tanzanie', code: '+255' },
  { name: 'Tchad', code: '+235' },
  { name: 'Togo', code: '+228' },
  { name: 'Tunisie', code: '+216' },
  { name: 'Zimbabwe', code: '+263' },
];

// Liste des pays européens (30) avec indicatifs
const europeanCountries = [
  { name: 'Allemagne', code: '+49' },
  { name: 'Autriche', code: '+43' },
  { name: 'Belgique', code: '+32' },
  { name: 'Bulgarie', code: '+359' },
  { name: 'Croatie', code: '+385' },
  { name: 'Danemark', code: '+45' },
  { name: 'Espagne', code: '+34' },
  { name: 'Estonie', code: '+372' },
  { name: 'Finlande', code: '+358' },
  { name: 'France', code: '+33' },
  { name: 'Grèce', code: '+30' },
  { name: 'Hongrie', code: '+36' },
  { name: 'Irlande', code: '+353' },
  { name: 'Islande', code: '+354' },
  { name: 'Italie', code: '+39' },
  { name: 'Lettonie', code: '+371' },
  { name: 'Lituanie', code: '+370' },
  { name: 'Luxembourg', code: '+352' },
  { name: 'Norvège', code: '+47' },
  { name: 'Pays-Bas', code: '+31' },
  { name: 'Pologne', code: '+48' },
  { name: 'Portugal', code: '+351' },
  { name: 'République tchèque', code: '+420' },
  { name: 'Roumanie', code: '+40' },
  { name: 'Royaume-Uni', code: '+44' },
  { name: 'Serbie', code: '+381' },
  { name: 'Slovaquie', code: '+421' },
  { name: 'Slovénie', code: '+386' },
  { name: 'Suède', code: '+46' },
  { name: 'Suisse', code: '+41' },
];

// Tous les pays fusionnés et triés par ordre alphabétique
const allCountries = [...africanCountries, ...europeanCountries].sort((a, b) =>
  a.name.localeCompare(b.name, 'fr')
);

// Liste des métiers
const professions = [
  'Développeur web',
  'Développeur mobile',
  'Développeur desktop',
  'Pentesteur',
  'Designer',
  'Photographe',
  'Expert en marketing',
  'Créateur de contenu',
];

// Sources de découverte avec icônes Bootstrap
const discoverySources = [
  { value: 'facebook', label: 'Facebook', icon: 'bi-facebook' },
  { value: 'instagram', label: 'Instagram', icon: 'bi-instagram' },
  { value: 'tiktok', label: 'TikTok', icon: 'bi-tiktok' },
  { value: 'youtube', label: 'YouTube', icon: 'bi-youtube' },
  { value: 'bouche_a_oreille', label: 'Bouche à oreille', icon: 'bi-chat-dots' },
];

export default function Onboarding({ user, onComplete }) {
  const [formData, setFormData] = useState({
    profession: '',
    country: '',
    phoneCode: '',
    phone: '',
    discoveredVia: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Quand on sélectionne un pays, on met à jour l'indicatif automatiquement
  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    const country = allCountries.find((c) => c.name === selectedCountry);
    setFormData((prev) => ({
      ...prev,
      country: selectedCountry,
      phoneCode: country ? country.code : '',
    }));
    if (errors.country) setErrors((prev) => ({ ...prev, country: '' }));
  };

  const validate = () => {
    const next = {};
    if (!formData.profession) next.profession = 'Choisis ton métier';
    if (!formData.country) next.country = 'Choisis ton pays';
    if (!formData.phone.trim()) next.phone = 'Entre ton numéro de téléphone';
    if (!formData.discoveredVia) next.discoveredVia = 'Dis-nous comment tu nous as trouvé';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);

    try {
      // Sauvegarder les informations supplémentaires dans la table profils
      const { error } = await supabase
        .from('profils')
        .update({
          profession: formData.profession,
          pays: formData.country,
          telephone: `${formData.phoneCode} ${formData.phone}`,
          decouvert_via: formData.discoveredVia,
          onboarding_termine: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Attente de 5 secondes avec l'animation de chargement
      await new Promise((resolve) => setTimeout(resolve, 5000));

      onComplete({
        ...user,
        profession: formData.profession,
        pays: formData.country,
        telephone: `${formData.phoneCode} ${formData.phone}`,
        decouvert_via: formData.discoveredVia,
      });
    } catch (error) {
      setServerError(error.message || 'Une erreur est survenue. Réessaie.');
      setLoading(false);
    }
  };

  // Écran de chargement pendant la création du dashboard
  if (loading) {
    return (
      <div className="folio-auth-wrapper">
        <div className="text-center">
          <div className="mb-4">
            <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem', color: 'var(--folio-primary)' }}>
              <span className="visually-hidden">Chargement...</span>
            </div>
          </div>
          <h2 className="folio-auth-title mb-3" style={{ fontSize: '24px' }}>Création de ton tableau de bord...</h2>
          <p className="text-body-custom">On prépare tout pour toi. Un instant.</p>
          <div className="mt-4 d-flex justify-content-center gap-1">
            <div className="onboarding-dot" style={{ animationDelay: '0s' }}></div>
            <div className="onboarding-dot" style={{ animationDelay: '0.2s' }}></div>
            <div className="onboarding-dot" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="folio-auth-wrapper folio-auth-enter">
      <div className="folio-auth-card" style={{ maxWidth: '520px' }}>
        <p className="folio-auth-eyebrow folio-auth-item">Dernière étape</p>
        <h1 className="folio-auth-title folio-auth-item">Parle-nous de toi</h1>
        <p className="folio-auth-subtitle folio-auth-item">
          Ces informations nous aident à personnaliser ton expérience sur Folio.
        </p>

        {serverError && <div className="folio-error-text mb-3" role="alert">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Métier */}
          <div className="mb-3 folio-auth-item">
            <label htmlFor="profession" className="folio-form-label d-block">
              <i className="bi bi-briefcase me-2" style={{ color: 'var(--folio-primary)' }}></i>Ton métier
            </label>
            <select
              id="profession"
              name="profession"
              className={`folio-form-control w-100 ${errors.profession ? 'is-invalid' : ''}`}
              value={formData.profession}
              onChange={handleChange}
            >
              <option value="">Sélectionne ton métier</option>
              {professions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {errors.profession && <p className="folio-error-text">{errors.profession}</p>}
          </div>

          {/* Pays */}
          <div className="mb-3 folio-auth-item">
            <label htmlFor="country" className="folio-form-label d-block">
              <i className="bi bi-globe-americas me-2" style={{ color: 'var(--folio-primary)' }}></i>Ton pays
            </label>
            <select
              id="country"
              name="country"
              className={`folio-form-control w-100 ${errors.country ? 'is-invalid' : ''}`}
              value={formData.country}
              onChange={handleCountryChange}
            >
              <option value="">Sélectionne ton pays</option>
              <optgroup label="Afrique">
                {africanCountries.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="Europe">
                {europeanCountries.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </optgroup>
            </select>
            {errors.country && <p className="folio-error-text">{errors.country}</p>}
          </div>

          {/* Téléphone */}
          <div className="mb-3 folio-auth-item">
            <label htmlFor="phone" className="folio-form-label d-block">
              <i className="bi bi-telephone me-2" style={{ color: 'var(--folio-primary)' }}></i>Numéro de téléphone
            </label>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="folio-form-control text-center"
                value={formData.phoneCode}
                readOnly
                style={{ width: '80px', backgroundColor: '#F0EFF8' }}
                placeholder="—"
              />
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`folio-form-control flex-grow-1 ${errors.phone ? 'is-invalid' : ''}`}
                placeholder="Ton numéro"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            {errors.phone && <p className="folio-error-text">{errors.phone}</p>}
          </div>

          {/* Comment tu nous as connu */}
          <div className="mb-4 folio-auth-item">
            <label className="folio-form-label d-block mb-3">
              <i className="bi bi-megaphone me-2" style={{ color: 'var(--folio-primary)' }}></i>Comment as-tu connu Folio ?
            </label>
            <div className="d-flex flex-wrap gap-2">
              {discoverySources.map((source) => (
                <button
                  key={source.value}
                  type="button"
                  className={`btn d-inline-flex align-items-center gap-2 px-3 py-2 ${
                    formData.discoveredVia === source.value
                      ? 'btn-discovery-active'
                      : 'btn-discovery'
                  }`}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, discoveredVia: source.value }));
                    if (errors.discoveredVia) setErrors((prev) => ({ ...prev, discoveredVia: '' }));
                  }}
                >
                  <i className={`bi ${source.icon}`}></i>
                  {source.label}
                </button>
              ))}
            </div>
            {errors.discoveredVia && <p className="folio-error-text mt-1">{errors.discoveredVia}</p>}
          </div>

          <button type="submit" className="folio-btn-primary mt-2 folio-auth-item" disabled={loading}>
            <i className="bi bi-columns-gap me-2"></i>Créer mon tableau de bord
          </button>
        </form>
      </div>
    </div>
  );
}
