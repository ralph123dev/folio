import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import './auth.css';
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
const allCountries = [...africanCountries, ...europeanCountries].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
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
        if (errors[name])
            setErrors((prev) => ({ ...prev, [name]: '' }));
    };
    const handleCountryChange = (e) => {
        const selectedCountry = e.target.value;
        const country = allCountries.find((c) => c.name === selectedCountry);
        setFormData((prev) => ({
            ...prev,
            country: selectedCountry,
            phoneCode: country ? country.code : '',
        }));
        if (errors.country)
            setErrors((prev) => ({ ...prev, country: '' }));
    };
    const validate = () => {
        const next = {};
        if (!formData.profession)
            next.profession = 'Choisis ton métier';
        if (!formData.country)
            next.country = 'Choisis ton pays';
        if (!formData.phone.trim())
            next.phone = 'Entre ton numéro de téléphone';
        if (!formData.discoveredVia)
            next.discoveredVia = 'Dis-nous comment tu nous as trouvé';
        setErrors(next);
        return Object.keys(next).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerError('');
        if (!validate())
            return;
        setLoading(true);
        try {
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
            if (error)
                throw error;
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const refCode = urlParams.get('ref');
                if (refCode) {
                    await supabase.rpc('apply_referral', {
                        p_referred_id: user.id,
                        p_referral_code: refCode,
                    });
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, '', cleanUrl);
                }
            }
            catch (refErr) {
                console.warn('Parrainage non appliqué:', refErr);
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
            onComplete({
                ...user,
                profession: formData.profession,
                pays: formData.country,
                telephone: `${formData.phoneCode} ${formData.phone}`,
                decouvert_via: formData.discoveredVia,
            });
        }
        catch (error) {
            setServerError(error.message || 'Une erreur est survenue. Réessaie.');
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "folio-auth-wrapper", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-4", children: _jsx("div", { className: "spinner-border", role: "status", style: { width: '3rem', height: '3rem', color: 'var(--folio-primary)' }, children: _jsx("span", { className: "visually-hidden", children: "Chargement..." }) }) }), _jsx("h2", { className: "folio-auth-title mb-3", style: { fontSize: '24px' }, children: "Cr\u00E9ation de ton tableau de bord..." }), _jsx("p", { className: "text-body-custom", children: "On pr\u00E9pare tout pour toi. Un instant." }), _jsxs("div", { className: "mt-4 d-flex justify-content-center gap-1", children: [_jsx("div", { className: "onboarding-dot", style: { animationDelay: '0s' } }), _jsx("div", { className: "onboarding-dot", style: { animationDelay: '0.2s' } }), _jsx("div", { className: "onboarding-dot", style: { animationDelay: '0.4s' } })] })] }) }));
    }
    return (_jsx("div", { className: "folio-auth-wrapper folio-auth-enter", children: _jsxs("div", { className: "folio-auth-card", style: { maxWidth: '520px' }, children: [_jsx("p", { className: "folio-auth-eyebrow folio-auth-item", children: "Derni\u00E8re \u00E9tape" }), _jsx("h1", { className: "folio-auth-title folio-auth-item", children: "Parle-nous de toi" }), _jsx("p", { className: "folio-auth-subtitle folio-auth-item", children: "Ces informations nous aident \u00E0 personnaliser ton exp\u00E9rience sur Folio." }), serverError && _jsx("div", { className: "folio-error-text mb-3", role: "alert", children: serverError }), _jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [_jsxs("div", { className: "mb-3 folio-auth-item", children: [_jsxs("label", { htmlFor: "profession", className: "folio-form-label d-block", children: [_jsx("i", { className: "bi bi-briefcase me-2", style: { color: 'var(--folio-primary)' } }), "Ton m\u00E9tier"] }), _jsxs("select", { id: "profession", name: "profession", className: `folio-form-control w-100 ${errors.profession ? 'is-invalid' : ''}`, value: formData.profession, onChange: handleChange, children: [_jsx("option", { value: "", children: "S\u00E9lectionne ton m\u00E9tier" }), professions.map((p) => (_jsx("option", { value: p, children: p }, p)))] }), errors.profession && _jsx("p", { className: "folio-error-text", children: errors.profession })] }), _jsxs("div", { className: "mb-3 folio-auth-item", children: [_jsxs("label", { htmlFor: "country", className: "folio-form-label d-block", children: [_jsx("i", { className: "bi bi-globe-americas me-2", style: { color: 'var(--folio-primary)' } }), "Ton pays"] }), _jsxs("select", { id: "country", name: "country", className: `folio-form-control w-100 ${errors.country ? 'is-invalid' : ''}`, value: formData.country, onChange: handleCountryChange, children: [_jsx("option", { value: "", children: "S\u00E9lectionne ton pays" }), _jsx("optgroup", { label: "Afrique", children: africanCountries.map((c) => (_jsx("option", { value: c.name, children: c.name }, c.name))) }), _jsx("optgroup", { label: "Europe", children: europeanCountries.map((c) => (_jsx("option", { value: c.name, children: c.name }, c.name))) })] }), errors.country && _jsx("p", { className: "folio-error-text", children: errors.country })] }), _jsxs("div", { className: "mb-3 folio-auth-item", children: [_jsxs("label", { htmlFor: "phone", className: "folio-form-label d-block", children: [_jsx("i", { className: "bi bi-telephone me-2", style: { color: 'var(--folio-primary)' } }), "Num\u00E9ro de t\u00E9l\u00E9phone"] }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("input", { type: "text", className: "folio-form-control text-center", value: formData.phoneCode, readOnly: true, style: { width: '80px', backgroundColor: '#F0EFF8' }, placeholder: "\u2014" }), _jsx("input", { type: "tel", id: "phone", name: "phone", className: `folio-form-control flex-grow-1 ${errors.phone ? 'is-invalid' : ''}`, placeholder: "Ton num\u00E9ro", value: formData.phone, onChange: handleChange })] }), errors.phone && _jsx("p", { className: "folio-error-text", children: errors.phone })] }), _jsxs("div", { className: "mb-4 folio-auth-item", children: [_jsxs("label", { className: "folio-form-label d-block mb-3", children: [_jsx("i", { className: "bi bi-megaphone me-2", style: { color: 'var(--folio-primary)' } }), "Comment as-tu connu Folio ?"] }), _jsx("div", { className: "d-flex flex-wrap gap-2", children: discoverySources.map((source) => (_jsxs("button", { type: "button", className: `btn d-inline-flex align-items-center gap-2 px-3 py-2 ${formData.discoveredVia === source.value
                                            ? 'btn-discovery-active'
                                            : 'btn-discovery'}`, onClick: () => {
                                            setFormData((prev) => ({ ...prev, discoveredVia: source.value }));
                                            if (errors.discoveredVia)
                                                setErrors((prev) => ({ ...prev, discoveredVia: '' }));
                                        }, children: [_jsx("i", { className: `bi ${source.icon}` }), source.label] }, source.value))) }), errors.discoveredVia && _jsx("p", { className: "folio-error-text mt-1", children: errors.discoveredVia })] }), _jsxs("button", { type: "submit", className: "folio-btn-primary mt-2 folio-auth-item", disabled: loading, children: [_jsx("i", { className: "bi bi-columns-gap me-2" }), "Cr\u00E9er mon tableau de bord"] })] })] }) }));
}
