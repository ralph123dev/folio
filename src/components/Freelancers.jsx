import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        return (_jsx("video", { src: cleanVideo, autoPlay: true, loop: true, muted: true, playsInline: true, className: "rounded-circle mb-3 shadow-sm", style: { width: '90px', height: '90px', objectFit: 'cover', border: borderStyle }, onError: () => setVideoFailed(true) }));
    }
    if (cleanPhoto && !photoFailed) {
        return (_jsx("img", { src: cleanPhoto, alt: alt, className: "rounded-circle mb-3 shadow-sm", style: { width: '90px', height: '90px', objectFit: 'cover', border: borderStyle }, onError: () => setPhotoFailed(true) }));
    }
    return (_jsx("div", { className: "rounded-circle mb-3 d-flex align-items-center justify-content-center shadow-sm", style: { width: '90px', height: '90px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }, children: _jsx("i", { className: "bi bi-person fs-1" }) }));
}
function FreelancerSkeletonCard() {
    return (_jsxs("article", { className: "freelancer-skeleton-card", "aria-hidden": "true", children: [_jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-avatar" }), _jsxs("div", { className: "freelancer-skeleton-content", children: [_jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-title" }), _jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-subtitle" }), _jsxs("div", { className: "freelancer-skeleton-description", children: [_jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-line" }), _jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-line" }), _jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-line freelancer-skeleton-line-short" })] }), _jsxs("div", { className: "freelancer-skeleton-tags", children: [_jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-tag" }), _jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-tag" }), _jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-tag" })] }), _jsx("div", { className: "freelancer-skeleton-block freelancer-skeleton-button" })] })] }));
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
        if (!query || !freelancers.length)
            return undefined;
        const timer = setTimeout(async () => {
            const matches = freelancers.filter((freelancer) => {
                const searchable = [freelancer.nom_freelancer, freelancer.nom, freelancer.prenom, freelancer.activite]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                return searchable.includes(query);
            });
            if (!matches.length)
                return;
            const events = matches.map((freelancer) => ({
                visitor_id: visitorId,
                freelancer_id: freelancer.id,
                profile_owner_id: freelancer.user_id,
                search_query: query,
                profession: freelancer.activite || 'Métier non précisé',
                search_day: new Date().toISOString().slice(0, 10),
            }));
            const { error } = await supabase.from('freelancer_search_events').upsert(events, { onConflict: 'visitor_id,freelancer_id,search_query,search_day', ignoreDuplicates: true });
            if (error)
                console.error('Erreur enregistrement recherche:', error);
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
        }
        catch (err) {
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
            }
            else if (data) {
                setFreelancers(data);
            }
        }
        catch (error) {
            console.error('Erreur lors du chargement des freelancers:', error);
            setFetchError('Les profils freelancers ne peuvent pas être chargés pour le moment.');
        }
        finally {
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
        }
        else {
            onStart();
        }
    };
    const handleRate = async (freelancerId, rating) => {
        if (!user)
            return;
        setRatings(prev => ({ ...prev, [freelancerId]: rating }));
        const { error } = await supabase
            .from('freelancer_ratings')
            .upsert({ freelancer_id: freelancerId, rater_id: user.id, rating: rating }, { onConflict: 'freelancer_id, rater_id' });
        if (error) {
            console.error('Erreur lors de la notation:', error);
            fetchUserRatings();
        }
        else {
            fetchRatingCounts();
        }
    };
    const truncateWords = (str, numWords) => {
        if (!str || typeof str !== 'string')
            return '';
        const words = str.split(/\s+/);
        if (words.length <= numWords)
            return str;
        return words.slice(0, numWords).join(' ') + '...';
    };
    const professionOptions = useMemo(() => {
        const set = new Set(DEFAULT_PROFESSIONS);
        freelancers.forEach(f => {
            if (f.activite && f.activite.trim())
                set.add(f.activite.trim());
        });
        return Array.from(set);
    }, [freelancers]);
    const filteredAndSortedFreelancers = useMemo(() => {
        return freelancers
            .filter((freelancer) => {
            if (selectedProfession !== 'Tous les métiers' && freelancer.activite !== selectedProfession) {
                return false;
            }
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
            if (isProMaxA !== isProMaxB) {
                return isProMaxB ? 1 : -1;
            }
            if (b.avgRating !== a.avgRating) {
                return b.avgRating - a.avgRating;
            }
            if (b.ratingCount !== a.ratingCount) {
                return b.ratingCount - a.ratingCount;
            }
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }, [freelancers, selectedProfession, searchQuery, ratingCounts, ratingSums]);
    return (_jsxs("main", { className: "flex-grow-1 freelancers-page", children: [_jsx("section", { className: "py-5", children: _jsx("div", { className: "container py-5", children: _jsxs("div", { className: "row align-items-center g-5", children: [_jsxs("div", { className: "col-lg-7", children: [_jsx("p", { className: "text-uppercase fw-semibold mb-3", style: { color: 'var(--folio-primary)', letterSpacing: '0.1em', fontSize: '0.8rem' }, children: "Espace Freelancers" }), _jsx("h1", { className: "display-4 font-serif mb-4", children: "Fais de ton profil une vraie vitrine pour tes services." }), _jsx("p", { className: "lead text-body-custom mb-4", style: { maxWidth: '650px' }, children: "Cr\u00E9e un profil professionnel, optimis\u00E9 pour le SEO, et facilite le contact avec les clients qui veulent travailler avec toi." }), _jsxs("button", { type: "button", className: "btn btn-primary-custom px-4 py-3", onClick: handleCreateProfile, children: ["Cr\u00E9er mon profil freelance ", _jsx("i", { className: "bi bi-arrow-right ms-2" })] })] }), _jsx("div", { className: "col-lg-5", children: _jsxs("div", { className: "p-4 p-lg-5 rounded-4", style: { background: 'linear-gradient(135deg, #F4F1FE, #E8F5EC)' }, children: [_jsxs("div", { className: "d-flex align-items-center gap-3 mb-4", children: [_jsx("div", { className: "pricing-icon", children: _jsx("i", { className: "bi bi-briefcase-fill" }) }), _jsxs("div", { children: [_jsx("p", { className: "mb-1 text-body-custom small", children: "Ton profil" }), _jsx("h2", { className: "font-serif h4 mb-0", children: "Pr\u00EAt \u00E0 \u00EAtre trouv\u00E9" })] })] }), _jsxs("div", { className: "d-flex justify-content-between border-bottom py-3", children: [_jsx("span", { className: "text-body-custom", children: "Visibilit\u00E9 SEO" }), _jsx("strong", { className: "text-success", children: "Optimis\u00E9e" })] }), _jsxs("div", { className: "d-flex justify-content-between py-3", children: [_jsx("span", { className: "text-body-custom", children: "Contact client" }), _jsx("strong", { style: { color: 'var(--folio-primary)' }, children: "WhatsApp" })] })] }) })] }) }) }), _jsx("section", { className: "py-5 bg-white", children: _jsxs("div", { className: "container py-4", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("p", { className: "text-uppercase fw-semibold mb-2", style: { color: 'var(--folio-secondary-2)', letterSpacing: '0.1em', fontSize: '0.8rem' }, children: "Pour d\u00E9velopper ton activit\u00E9" }), _jsx("h2", { className: "display-6 font-serif mb-3", children: "Les Freelancers" })] }), _jsxs("div", { className: "row g-3 justify-content-center mb-5", children: [_jsx("div", { className: "col-md-6 col-lg-5", children: _jsxs("div", { className: "input-group input-group-lg shadow-sm rounded-3 overflow-hidden", style: { border: '1px solid rgba(38, 33, 92, 0.15)' }, children: [_jsx("span", { className: "input-group-text bg-white border-0 text-muted ps-3", children: _jsx("i", { className: "bi bi-search" }) }), _jsx("input", { type: "text", className: "form-control border-0 fs-6 ps-2", placeholder: "Ralph D\u00E9veloppeur", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }), searchQuery && (_jsx("button", { className: "btn bg-white border-0 text-muted", type: "button", onClick: () => setSearchQuery(''), children: _jsx("i", { className: "bi bi-x-lg" }) }))] }) }), _jsx("div", { className: "col-md-5 col-lg-4", children: _jsxs("div", { className: "input-group input-group-lg shadow-sm rounded-3 overflow-hidden", style: { border: '1px solid rgba(38, 33, 92, 0.15)' }, children: [_jsx("span", { className: "input-group-text bg-white border-0 text-muted ps-3", children: _jsx("i", { className: "bi bi-funnel" }) }), _jsx("select", { className: "form-select border-0 fs-6 ps-2 text-title", value: selectedProfession, onChange: (e) => setSelectedProfession(e.target.value), children: professionOptions.map((prof) => (_jsx("option", { value: prof, children: prof }, prof))) })] }) })] }), loading ? (_jsxs("div", { className: "row g-4", role: "status", "aria-live": "polite", "aria-label": "Chargement des profils freelancers", children: [Array.from({ length: 6 }, (_, index) => (_jsx("div", { className: "col-md-4", children: _jsx(FreelancerSkeletonCard, {}) }, index))), _jsx("span", { className: "visually-hidden", children: "Chargement des profils freelancers..." })] })) : fetchError ? (_jsxs("div", { className: "text-center text-muted", children: [_jsx("p", { children: fetchError }), _jsx("button", { className: "btn btn-outline-custom mt-3", onClick: fetchFreelancers, children: "R\u00E9essayer" })] })) : filteredAndSortedFreelancers.length === 0 ? (_jsxs("div", { className: "text-center text-muted py-4", children: [_jsx("i", { className: "bi bi-person-exclamation fs-1 d-block mb-2 text-muted" }), _jsx("p", { className: "fs-5", children: "Aucun profil freelancer ne correspond \u00E0 tes crit\u00E8res de recherche." }), _jsx("button", { className: "btn btn-outline-custom mt-2", onClick: () => { setSearchQuery(''); setSelectedProfession('Tous les métiers'); }, children: "R\u00E9initialiser la recherche" })] })) : (_jsx("div", { className: "row g-4", children: filteredAndSortedFreelancers.map((freelancer) => {
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
                                return (_jsx("div", { className: "col-md-4", children: _jsxs("article", { className: `h-100 p-4 border rounded-4 d-flex flex-column align-items-center text-center bg-white shadow-sm hover-shadow transition-all position-relative ${isProMax ? 'promax-card-highlight' : ''}`, children: [_jsx(FreelancerMediaAvatar, { videoUrl: freelancer.video_url, photoUrl: freelancer.photo_url, alt: freelancer.nom_freelancer, isProMax: isProMax }), _jsxs("div", { className: "d-flex align-items-center justify-content-center gap-1 mb-1", children: [_jsx("h3", { className: "font-serif h5 mb-0 text-title", children: freelancer.nom_freelancer }), isUserVerified && (_jsx("img", { src: cardBadgeImg, alt: "Badge v\u00E9rifi\u00E9", title: "les profils verifier son ceux que nous avons verifier personellement", style: { width: '20px', height: '20px', objectFit: 'contain', cursor: 'pointer' } }))] }), _jsx("p", { className: "text-muted small mb-2 fw-medium", children: freelancer.activite }), _jsx("p", { className: "text-body-custom mb-3", style: { fontSize: '0.9rem', flexGrow: 1 }, children: truncateWords(freelancer.description, 20) }), _jsxs("div", { className: "d-flex flex-wrap justify-content-center gap-2 mb-3 w-100", children: [whatsappUrl && (_jsxs("a", { href: whatsappUrl, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-outline-success rounded-pill px-3 py-1 d-flex align-items-center gap-1", style: { fontSize: '0.8rem' }, children: [_jsx("i", { className: "bi bi-whatsapp" }), " WhatsApp"] })), cvUrl && (_jsxs("button", { type: "button", className: "btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1 text-white", style: { fontSize: '0.8rem', backgroundColor: '#FF7A00', borderColor: '#FF7A00' }, title: "T\u00E9l\u00E9charger le CV", onClick: async () => {
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
                                                            }
                                                            catch (err) {
                                                                console.error('Erreur téléchargement CV:', err);
                                                                window.open(cvUrl, '_blank');
                                                            }
                                                        }, children: [_jsx("i", { className: "bi bi-file-earmark-pdf-fill" }), " T\u00E9l\u00E9charger CV"] })), portfolioUrl && (_jsxs("a", { href: portfolioUrl, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-outline-primary rounded-pill px-3 py-1 d-flex align-items-center gap-1", style: { fontSize: '0.8rem' }, children: [_jsx("i", { className: "bi bi-globe" }), " Portfolio"] })), telegramUrl && (_jsxs("a", { href: telegramUrl, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm rounded-pill px-3 py-1 d-flex align-items-center gap-1 text-white", style: { fontSize: '0.8rem', backgroundColor: '#229ED9', borderColor: '#229ED9' }, children: [_jsx("i", { className: "bi bi-telegram" }), " Telegram"] })), facebookUrl && (_jsx("a", { href: facebookUrl, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm", style: { width: '32px', height: '32px' }, title: "Facebook", children: _jsx("i", { className: "bi bi-facebook text-primary" }) })), instagramUrl && (_jsx("a", { href: instagramUrl, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm", style: { width: '32px', height: '32px' }, title: "Instagram", children: _jsx("i", { className: "bi bi-instagram text-danger" }) }))] }), user && (_jsxs("div", { className: "rating-container mt-auto pt-3 border-top w-100", children: [user.id === freelancer.user_id ? (_jsxs("p", { className: "small text-muted mb-2", children: [_jsx("i", { className: "bi bi-star-fill text-warning me-1" }), "Ton profil"] })) : (_jsx("p", { className: "small text-muted mb-2", children: "Notez ce freelancer" })), _jsx("div", { className: "d-flex justify-content-center gap-1", children: [1, 2, 3, 4, 5].map((star) => (_jsx("i", { className: `bi ${ratings[freelancer.id] >= star ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-5`, style: { cursor: user.id === freelancer.user_id ? 'default' : 'pointer', transition: 'color 0.2s', opacity: user.id === freelancer.user_id ? 0.6 : 1 }, onClick: () => {
                                                                if (user.id !== freelancer.user_id) {
                                                                    handleRate(freelancer.id, star);
                                                                }
                                                            } }, star))) }), _jsxs("p", { className: "small text-muted mt-2 mb-0 d-flex align-items-center justify-content-center gap-1", style: { fontSize: '0.75rem' }, children: [_jsx("i", { className: "bi bi-person-check" }), _jsxs("span", { children: [ratingCounts[freelancer.id] || 0, " avis"] }), freelancer.avgRating > 0 && (_jsxs("span", { className: "badge text-bg-warning ms-1", style: { fontSize: '0.7rem' }, children: ["\u2605 ", freelancer.avgRating.toFixed(1)] }))] })] }))] }) }, freelancer.id));
                            }) }))] }) }), showCreateModal && (_jsx(CreateFreelancerModal, { user: user, onClose: () => setShowCreateModal(false), onComplete: () => {
                    setShowCreateModal(false);
                    fetchFreelancers();
                } }))] }));
}
function CreateFreelancerModal({ user, onClose, onComplete }) {
    const [step, setStep] = useState('select_role');
    const safeName = (user?.user_metadata?.name || user?.user_metadata?.full_name || '');
    const splitName = safeName.split(' ');
    const defaultNom = splitName[0] || '';
    const defaultPrenom = splitName.slice(1).join(' ') || '';
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
            }
            catch (err) {
                console.error("Erreur d'envoi photo:", err);
                setError("Erreur d'envoi de la photo sur Cloudinary : " + (err.message || 'Échec'));
                setPhotoProgress(0);
            }
            finally {
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
            }
            catch (err) {
                console.error("Erreur d'envoi vidéo:", err);
                setError("Erreur d'envoi de la vidéo sur Cloudinary : " + (err.message || 'Échec'));
                setVideoProgress(0);
            }
            finally {
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
            }
            catch (err) {
                console.error("Erreur d'envoi CV:", err);
                setError("Erreur d'envoi du CV sur Cloudinary : " + (err.message || 'Échec'));
                setCvProgress(0);
            }
            finally {
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
            if (insertError)
                throw insertError;
            onComplete();
        }
        catch (err) {
            console.error("Erreur lors de la publication:", err);
            setError(err?.message || 'Une erreur est survenue lors de la publication.');
        }
        finally {
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
            if (insertError)
                throw insertError;
            setClientSuccess(true);
            setTimeout(() => {
                onComplete();
            }, 1500);
        }
        catch (err) {
            console.error("Erreur lors du dépôt de la demande client:", err);
            setError(err?.message || 'Une erreur est survenue lors de l\'enregistrement.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "modal fade show d-block", tabIndex: "-1", role: "dialog", style: { backgroundColor: 'rgba(38, 33, 92, 0.55)', backdropFilter: 'blur(5px)', zIndex: 1050 }, onClick: (e) => { if (e.target === e.currentTarget && !loading)
            onClose(); }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered modal-lg", role: "document", children: _jsxs("div", { className: "modal-content border-0 shadow-lg", style: { borderRadius: '20px', overflow: 'hidden' }, children: [_jsxs("div", { className: "modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center", children: [step !== 'select_role' ? (_jsxs("button", { type: "button", className: "btn btn-sm btn-light rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm", onClick: () => { setStep('select_role'); setError(null); }, disabled: loading, children: [_jsx("i", { className: "bi bi-arrow-left" }), " Retour"] })) : (_jsx("div", {})), _jsxs("h5", { className: "modal-title font-serif fw-bold fs-4 text-title text-center flex-grow-1 mb-0 ms-2", children: [step === 'select_role' && 'Quel est votre objectif ?', step === 'freelancer' && 'Créer mon profil Freelancer', step === 'client' && 'Publier ma demande de projet'] }), _jsx("button", { type: "button", className: "btn-close ms-2", onClick: onClose, "aria-label": "Fermer", disabled: loading })] }), _jsxs("div", { className: "modal-body py-4 px-4", style: { maxHeight: '80vh', overflowY: 'auto' }, children: [step === 'select_role' && (_jsxs("div", { children: [_jsx("p", { className: "text-center text-muted mb-4 fs-6", children: "Choisissez une option ci-dessous pour continuer :" }), _jsxs("div", { className: "row g-4 justify-content-center", children: [_jsx("div", { className: "col-md-6", children: _jsxs("div", { className: "card h-100 border-2 border-primary-subtle shadow-sm rounded-4 overflow-hidden", style: { cursor: 'pointer', transition: 'all 0.3s ease', backgroundColor: '#FAFAFE' }, onClick: () => setStep('freelancer'), children: [_jsxs("div", { className: "position-relative", style: { height: '180px', overflow: 'hidden' }, children: [_jsx("img", { src: freelancerImg, alt: "Je suis un Freelancer", className: "w-100 h-100", style: { objectFit: 'cover' } }), _jsx("span", { className: "badge bg-primary position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill shadow-sm fs-6", children: "Ind\u00E9pendant" })] }), _jsxs("div", { className: "card-body p-4 text-center d-flex flex-column justify-content-between", children: [_jsxs("div", { children: [_jsx("h5", { className: "fw-bold text-title mb-2", children: "Je suis un Freelancer" }), _jsx("p", { className: "text-muted small mb-3", children: "Proposez vos services, mettez en avant vos comp\u00E9tences et votre portfolio pour \u00EAtre contact\u00E9 par des clients et entreprises." })] }), _jsxs("button", { type: "button", className: "btn btn-primary-custom w-100 py-2 rounded-pill fw-bold shadow-sm", onClick: (e) => { e.stopPropagation(); setStep('freelancer'); }, children: [_jsx("i", { className: "bi bi-person-badge me-2" }), "Je suis un Freelancer"] })] })] }) }), _jsx("div", { className: "col-md-6", children: _jsxs("div", { className: "card h-100 border-2 border-info-subtle shadow-sm rounded-4 overflow-hidden", style: { cursor: 'pointer', transition: 'all 0.3s ease', backgroundColor: '#FAFAFE' }, onClick: () => setStep('client'), children: [_jsxs("div", { className: "position-relative", style: { height: '180px', overflow: 'hidden' }, children: [_jsx("img", { src: clientImg, alt: "Je suis un Client", className: "w-100 h-100", style: { objectFit: 'cover' } }), _jsx("span", { className: "badge bg-info text-dark position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill shadow-sm fs-6 fw-bold", children: "Client / Recruteur" })] }), _jsxs("div", { className: "card-body p-4 text-center d-flex flex-column justify-content-between", children: [_jsxs("div", { children: [_jsx("h5", { className: "fw-bold text-title mb-2", children: "Je suis un Client" }), _jsx("p", { className: "text-muted small mb-3", children: "Publiez votre besoin de projet et entrez directement en contact avec les meilleurs freelancers pour vos r\u00E9alisations." })] }), _jsxs("button", { type: "button", className: "btn btn-info text-white w-100 py-2 rounded-pill fw-bold shadow-sm", style: { backgroundColor: '#0284c7', borderColor: '#0284c7' }, onClick: (e) => { e.stopPropagation(); setStep('client'); }, children: [_jsx("i", { className: "bi bi-briefcase me-2" }), "Je suis un Client"] })] })] }) })] })] })), step === 'client' && (_jsx("div", { children: clientSuccess ? (_jsxs("div", { className: "text-center py-5", children: [_jsx("div", { className: "d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white mb-3", style: { width: '70px', height: '70px' }, children: _jsx("i", { className: "bi bi-check-lg fs-1" }) }), _jsx("h4", { className: "fw-bold text-success mb-2", children: "Demande publi\u00E9e avec succ\u00E8s !" }), _jsx("p", { className: "text-muted", children: "Votre projet est maintenant visible par les freelancers et dans le tableau de bord." })] })) : (_jsxs("form", { onSubmit: handleSubmitClient, children: [_jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label text-body-custom small fw-bold", children: "Nom *" }), _jsx("input", { type: "text", name: "nom", className: "form-control", placeholder: "Votre nom", value: clientForm.nom, onChange: handleClientChange, required: true, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label text-body-custom small fw-bold", children: "Pr\u00E9nom *" }), _jsx("input", { type: "text", name: "prenom", className: "form-control", placeholder: "Votre pr\u00E9nom", value: clientForm.prenom, onChange: handleClientChange, required: true, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { className: "form-label text-body-custom small fw-bold", children: [_jsx("i", { className: "bi bi-telephone text-primary me-1" }), "T\u00E9l\u00E9phone (WhatsApp ou Telegram) *"] }), _jsx("input", { type: "text", name: "telephone", className: "form-control", placeholder: "+225 0700000000 ou @pseudo", value: clientForm.telephone, onChange: handleClientChange, required: true, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { className: "form-label text-body-custom small fw-bold", children: [_jsx("i", { className: "bi bi-geo-alt text-danger me-1" }), "Pays *"] }), _jsx("input", { type: "text", name: "pays", className: "form-control", placeholder: "Ex: C\u00F4te d'Ivoire, S\u00E9n\u00E9gal, France...", value: clientForm.pays, onChange: handleClientChange, required: true, disabled: loading })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label text-body-custom small fw-bold", children: "Pr\u00E9f\u00E9rence de localisation du Freelancer *" }), _jsxs("select", { name: "preference_freelance", className: "form-select", value: clientForm.preference_freelance, onChange: handleClientChange, disabled: loading, children: [_jsx("option", { value: "any", children: "N'importe quel (Indiff\u00E9rent)" }), _jsx("option", { value: "local", children: "Freelancer Local (dans mon pays)" }), _jsx("option", { value: "externe", children: "Freelancer Externe (International / Remote)" })] })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label text-body-custom small fw-bold", children: "Description de votre projet / besoin *" }), _jsx("textarea", { name: "description_projet", className: "form-control", rows: "5", placeholder: "D\u00E9crivez votre besoin en d\u00E9tail : objectifs, comp\u00E9tences recherch\u00E9es, budget estim\u00E9, d\u00E9lais...", value: clientForm.description_projet, onChange: handleClientChange, required: true, disabled: loading })] })] }), error && (_jsxs("div", { className: "alert alert-danger mt-3 py-2 px-3 mb-0", style: { fontSize: '0.85rem', borderRadius: '10px' }, children: [_jsx("i", { className: "bi bi-exclamation-triangle me-2" }), error] })), _jsxs("button", { type: "submit", className: "btn btn-info text-white w-100 py-2 mt-4 fw-bold shadow-sm", style: { backgroundColor: '#0284c7', borderColor: '#0284c7' }, disabled: loading, children: [loading ? _jsx("span", { className: "spinner-border spinner-border-sm me-2", role: "status" }) : _jsx("i", { className: "bi bi-send me-2" }), "Publier ma demande de projet"] })] })) })), step === 'freelancer' && (_jsxs("form", { onSubmit: handleSubmitFreelancer, children: [_jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12 text-center mb-2", children: [_jsx("div", { className: "d-inline-block position-relative", children: formData.video_url ? (_jsx("video", { src: formData.video_url, autoPlay: true, loop: true, muted: true, playsInline: true, className: "rounded-circle shadow-sm", style: { width: '90px', height: '90px', objectFit: 'cover', border: '3px solid #FF7A00' } })) : formData.photo_url ? (_jsx("img", { src: formData.photo_url, alt: "Aper\u00E7u", className: "rounded-circle shadow-sm", style: { width: '90px', height: '90px', objectFit: 'cover', border: '3px solid var(--folio-primary)' } })) : (_jsx("div", { className: "rounded-circle d-flex align-items-center justify-content-center shadow-sm mx-auto", style: { width: '90px', height: '90px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }, children: _jsx("i", { className: "bi bi-camera fs-2" }) })) }), videoProgress > 0 && videoProgress < 100 && (_jsxs("div", { className: "w-100 my-2", children: [_jsxs("div", { className: "d-flex justify-content-between small text-title fw-bold mb-1", children: [_jsx("span", { children: "T\u00E9l\u00E9versement vid\u00E9o sur Cloudinary..." }), _jsxs("span", { children: [videoProgress, "%"] })] }), _jsx("div", { className: "progress", style: { height: '8px' }, children: _jsx("div", { className: "progress-bar progress-bar-striped progress-bar-animated bg-warning", style: { width: `${videoProgress}%` } }) })] })), cvProgress > 0 && cvProgress < 100 && (_jsxs("div", { className: "w-100 my-2", children: [_jsxs("div", { className: "d-flex justify-content-between small text-title fw-bold mb-1", children: [_jsx("span", { children: "T\u00E9l\u00E9versement CV sur Cloudinary..." }), _jsxs("span", { children: [cvProgress, "%"] })] }), _jsx("div", { className: "progress", style: { height: '8px' }, children: _jsx("div", { className: "progress-bar progress-bar-striped progress-bar-animated bg-success", style: { width: `${cvProgress}%` } }) })] })), _jsxs("div", { className: "mt-2 d-flex flex-wrap justify-content-center gap-2", children: [_jsxs("label", { className: "btn btn-sm btn-outline-custom", children: [_jsx("i", { className: "bi bi-image me-1" }), "Photo de profil", _jsx("input", { type: "file", accept: "image/*", className: "d-none", onChange: handlePhotoFileChange, disabled: loading || uploadingMedia })] }), _jsxs("label", { className: "btn btn-sm btn-outline-warning", style: { color: '#FF7A00', borderColor: '#FF7A00' }, children: [_jsx("i", { className: "bi bi-camera-reels me-1" }), "Vid\u00E9o de profil (ProMax)", _jsx("input", { type: "file", accept: "video/*", className: "d-none", onChange: handleVideoFileChange, disabled: loading || uploadingMedia })] }), _jsxs("label", { className: "btn btn-sm btn-outline-success", children: [_jsx("i", { className: "bi bi-file-earmark-pdf me-1" }), "Ajouter son CV (ProMax)", _jsx("input", { type: "file", accept: ".pdf,.doc,.docx", className: "d-none", onChange: handleCvFileChange, disabled: loading || uploadingMedia })] })] }), formData.cv_url && _jsxs("small", { className: "text-success d-block mt-1", children: [_jsx("i", { className: "bi bi-check-circle me-1" }), "CV joint avec succ\u00E8s (Stock\u00E9 sur Cloudinary)"] })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label text-body-custom small", children: "Nom" }), _jsx("input", { type: "text", name: "nom", className: "form-control", value: formData.nom, onChange: handleChange, required: true, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label text-body-custom small", children: "Pr\u00E9nom" }), _jsx("input", { type: "text", name: "prenom", className: "form-control", value: formData.prenom, onChange: handleChange, required: true, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label text-body-custom small", children: "Nom du profil / Nom de freelancer" }), _jsx("input", { type: "text", name: "nom_freelancer", className: "form-control", placeholder: "ex: John Dev", value: formData.nom_freelancer, onChange: handleChange, required: true, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsx("label", { className: "form-label text-body-custom small", children: "Activit\u00E9 / Sp\u00E9cialit\u00E9" }), _jsx("input", { type: "text", name: "activite", className: "form-control", placeholder: "ex: D\u00E9veloppeur Web Fullstack", value: formData.activite, onChange: handleChange, required: true, disabled: loading })] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label text-body-custom small", children: "\u00C2ge" }), _jsx("input", { type: "number", name: "age", className: "form-control", value: formData.age, onChange: handleChange, disabled: loading })] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label text-body-custom small", children: "Date de naissance" }), _jsx("input", { type: "date", name: "date_naissance", className: "form-control", value: formData.date_naissance, onChange: handleChange, disabled: loading })] }), _jsxs("div", { className: "col-md-4", children: [_jsx("label", { className: "form-label text-body-custom small", children: "Ann\u00E9es d'exp\u00E9rience" }), _jsx("input", { type: "number", name: "annees_experience", className: "form-control", value: formData.annees_experience, onChange: handleChange, disabled: loading })] }), _jsx("div", { className: "col-12 mt-4", children: _jsxs("h6", { className: "font-serif fw-bold text-title mb-0", children: [_jsx("i", { className: "bi bi-chat-dots me-2 text-primary" }), "Contacts & Portfolio"] }) }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { className: "form-label text-body-custom small", children: [_jsx("i", { className: "bi bi-whatsapp text-success me-1" }), "Num\u00E9ro WhatsApp"] }), _jsx("input", { type: "text", name: "whatsapp", className: "form-control", placeholder: "+22507000000", value: formData.whatsapp, onChange: handleChange, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { className: "form-label text-body-custom small", children: [_jsx("i", { className: "bi bi-globe text-primary me-1" }), "Portfolio / Site web"] }), _jsx("input", { type: "url", name: "site_web", className: "form-control", placeholder: "https://mon-portfolio.com", value: formData.site_web, onChange: handleChange, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { className: "form-label text-body-custom small", children: [_jsx("i", { className: "bi bi-telegram text-info me-1" }), "Telegram (Pseudo ou lien)"] }), _jsx("input", { type: "text", name: "telegram", className: "form-control", placeholder: "@mon_telegram", value: formData.telegram, onChange: handleChange, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { className: "form-label text-body-custom small", children: [_jsx("i", { className: "bi bi-facebook text-primary me-1" }), "Facebook (Lien)"] }), _jsx("input", { type: "url", name: "facebook", className: "form-control", placeholder: "https://facebook.com/monprofil", value: formData.facebook, onChange: handleChange, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { className: "form-label text-body-custom small", children: [_jsx("i", { className: "bi bi-instagram text-danger me-1" }), "Instagram (Lien ou pseudo)"] }), _jsx("input", { type: "text", name: "instagram", className: "form-control", placeholder: "@mon_insta", value: formData.instagram, onChange: handleChange, disabled: loading })] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { className: "form-label text-body-custom small", children: [_jsx("i", { className: "bi bi-linkedin text-primary me-1" }), "LinkedIn (Lien)"] }), _jsx("input", { type: "url", name: "linkedin", className: "form-control", placeholder: "https://linkedin.com/in/monprofil", value: formData.linkedin, onChange: handleChange, disabled: loading })] }), _jsxs("div", { className: "col-12 mt-3", children: [_jsx("label", { className: "form-label text-body-custom small", children: "Description" }), _jsx("textarea", { name: "description", className: "form-control", rows: "4", placeholder: "D\u00E9cris tes services, comp\u00E9tences et propositions de valeur...", value: formData.description, onChange: handleChange, required: true, disabled: loading })] })] }), error && (_jsxs("div", { className: "alert alert-danger mt-3 py-2 px-3 mb-0", style: { fontSize: '0.85rem', borderRadius: '10px' }, children: [_jsx("i", { className: "bi bi-exclamation-triangle me-2" }), error] })), _jsxs("button", { type: "submit", className: "btn btn-primary-custom w-100 py-2 mt-4", disabled: loading || uploadingMedia || (videoProgress > 0 && videoProgress < 100) || (cvProgress > 0 && cvProgress < 100), children: [loading ? _jsx("span", { className: "spinner-border spinner-border-sm me-2", role: "status" }) : _jsx("i", { className: "bi bi-upload me-2" }), uploadingMedia ? 'Téléversement des fichiers...' : 'Publier le profil'] })] }))] })] }) }) }));
}
