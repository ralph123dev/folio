import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';
import verifieBadge from '../assets/verifie.png';
import orangeBadge from '../assets/orange.png';
import { uploadToCloudinary } from '../lib/cloudinary';
import { analyzePortfolioWithGemini, AVAILABLE_MODELS } from '../lib/gemini';
import './auth.css';
import MyProfilesModal from './MyProfilesModal';
export default function Dashboard({ userData, onLogout, onGoFreelancer }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [showRechargeModal, setShowRechargeModal] = useState(false);
    const [showOptimModal, setShowOptimModal] = useState(false);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [showMyProfilesModal, setShowMyProfilesModal] = useState(false);
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [showProMaxModal, setShowProMaxModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showSearchDetectionModal, setShowSearchDetectionModal] = useState(false);
    const [showBlogMaxModal, setShowBlogMaxModal] = useState(false);
    const [showAiAnalysisModal, setShowAiAnalysisModal] = useState(false);
    const [showBoostContactsSheet, setShowBoostContactsSheet] = useState(false);
    const [showProspectingModal, setShowProspectingModal] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);
    const [referralCopied, setReferralCopied] = useState(false);
    const referralCode = userData?.id
        ? 'FOLIO-' + userData.id.replace(/-/g, '').substring(0, 8).toUpperCase()
        : '';
    const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : '';
    const handleCopyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
        }
        catch {
            const el = document.createElement('textarea');
            el.value = referralLink;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setReferralCopied(true);
        setTimeout(() => setReferralCopied(false), 3000);
    };
    const handleShareReferralWhatsApp = () => {
        const msg = encodeURIComponent(`🎓 Rejoins-moi sur Folio — la plateforme freelance en Afrique !\n\nInscris-toi gratuitement avec mon lien :\n👉 ${referralLink}\n\nCode : ${referralCode}`);
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    };
    const handleInviteFriends = async () => {
        await handleCopyReferralLink();
        setShowReferralModal(true);
    };
    const [prospectingBatch, setProspectingBatch] = useState([]);
    const [prospectingSeenKeys, setProspectingSeenKeys] = useState(new Set());
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [visits, setVisits] = useState([]);
    const [portfolioUrl, setPortfolioUrl] = useState('');
    const [profileData, setProfileData] = useState(null);
    const [dailyEmailOptedIn, setDailyEmailOptedIn] = useState(false);
    const [dailyEmailPreferenceLoading, setDailyEmailPreferenceLoading] = useState(true);
    const [dailyEmailPreferenceSaving, setDailyEmailPreferenceSaving] = useState(false);
    const [dailyEmailPreferenceError, setDailyEmailPreferenceError] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [boostContacts, setBoostContacts] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(`folio-boost-contacts-${userData.id}`)) || [];
        }
        catch {
            return [];
        }
    });
    const [boostDetails, setBoostDetails] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(`folio-boost-details-${userData.id}`)) || null;
        }
        catch {
            return null;
        }
    });
    const [boostContactsError, setBoostContactsError] = useState('');
    const [searchStats, setSearchStats] = useState([]);
    const isUserVerified = useMemo(() => {
        return Boolean(profileData?.is_verified &&
            profileData?.verified_until &&
            new Date(profileData.verified_until) > new Date());
    }, [profileData]);
    const isProMax = useMemo(() => {
        return Boolean(profileData?.is_promax &&
            (!profileData?.promax_until || new Date(profileData.promax_until) > new Date()));
    }, [profileData]);
    const badgeColorClass = useMemo(() => {
        if (isProMax || profileData?.badge_color === 'orange')
            return 'badge-orange-img';
        return '';
    }, [isProMax, profileData]);
    const userBadgeImg = useMemo(() => {
        if (isProMax || profileData?.badge_color === 'orange')
            return orangeBadge;
        return verifieBadge;
    }, [isProMax, profileData]);
    const handleOpenAiAnalysis = () => {
        if (!isProMax) {
            setShowProMaxModal(true);
            return;
        }
        setShowAiAnalysisModal(true);
    };
    const getRandomUniqueProspectingBatch = (contacts, seenKeys, limit = 10) => {
        const available = contacts.filter((contact) => !seenKeys.has(getBoostContactKey(contact)));
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(limit, shuffled.length));
    };
    const handleOpenProspectingModal = () => {
        if (!boostContacts || boostContacts.length === 0) {
            return;
        }
        const initialBatch = getRandomUniqueProspectingBatch(boostContacts, new Set(), 10);
        setProspectingSeenKeys(new Set(initialBatch.map((contact) => getBoostContactKey(contact))));
        setProspectingBatch(initialBatch);
        setShowProspectingModal(true);
    };
    const handleNextProspectingBatch = () => {
        if (!boostContacts || boostContacts.length === 0) {
            return;
        }
        const nextBatch = getRandomUniqueProspectingBatch(boostContacts, prospectingSeenKeys, 10);
        if (nextBatch.length === 0) {
            setProspectingSeenKeys(new Set());
            const freshBatch = getRandomUniqueProspectingBatch(boostContacts, new Set(), 10);
            setProspectingBatch(freshBatch);
            setProspectingSeenKeys(new Set(freshBatch.map((contact) => getBoostContactKey(contact))));
            return;
        }
        const nextSeen = new Set(prospectingSeenKeys);
        nextBatch.forEach((contact) => nextSeen.add(getBoostContactKey(contact)));
        setProspectingSeenKeys(nextSeen);
        setProspectingBatch(nextBatch);
    };
    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profils')
                .select('*')
                .eq('id', userData.id)
                .maybeSingle();
            if (error)
                throw error;
            if (data) {
                setProfileData(data);
                if (data.portfolio_url) {
                    setPortfolioUrl(data.portfolio_url);
                }
            }
        }
        catch (err) {
            console.error('Erreur lors du chargement du profil:', err);
        }
        finally {
            setLoadingProfile(false);
        }
    };
    useEffect(() => {
        fetchProfile();
        const channel = supabase
            .channel(`profil-paiement-${userData.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profils', filter: `id=eq.${userData.id}` }, (payload) => {
            setProfileData((previous) => ({ ...previous, ...payload.new }));
        })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [userData.id]);
    useEffect(() => {
        let active = true;
        const loadDailyEmailPreference = async () => {
            const { data, error } = await supabase
                .from('daily_account_email_preferences')
                .select('opted_in')
                .eq('user_id', userData.id)
                .maybeSingle();
            if (!active)
                return;
            if (error) {
                console.error('Impossible de charger la préférence d’e-mail quotidien :', error);
                setDailyEmailPreferenceError('Préférence indisponible pour le moment.');
            }
            else {
                setDailyEmailOptedIn(Boolean(data?.opted_in));
                setDailyEmailPreferenceError('');
            }
            setDailyEmailPreferenceLoading(false);
        };
        void loadDailyEmailPreference();
        return () => { active = false; };
    }, [userData.id]);
    const handleDailyEmailPreferenceChange = async (event) => {
        const optedIn = event.target.checked;
        setDailyEmailPreferenceSaving(true);
        setDailyEmailPreferenceError('');
        const { error } = await supabase.rpc('set_daily_account_email_preference', {
            p_opted_in: optedIn,
        });
        if (error) {
            console.error('Impossible de mettre à jour la préférence d’e-mail quotidien :', error);
            setDailyEmailPreferenceError('Enregistrement impossible. Réessaie plus tard.');
        }
        else {
            setDailyEmailOptedIn(optedIn);
        }
        setDailyEmailPreferenceSaving(false);
    };
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
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
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
            if (mounted && data)
                setVisits(data);
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
    const [chartMetric, setMetric] = useState('visits');
    const [freelancerProfiles, setFreelancerProfiles] = useState([]);
    const [selectedProfileId, setSelectedProfileId] = useState('all');
    const [ratingsList, setRatingsList] = useState([]);
    const [clientRequests, setClientRequests] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    useEffect(() => {
        let mounted = true;
        const fetchClientRequests = async () => {
            const { data } = await supabase
                .from('client_requests')
                .select('*')
                .order('created_at', { ascending: false });
            if (mounted && data) {
                setClientRequests(data);
            }
        };
        fetchClientRequests();
        const channel = supabase
            .channel('client_requests_dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'client_requests' }, () => {
            fetchClientRequests();
        })
            .subscribe();
        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, []);
    const getVisitorKey = (user) => {
        if (user?.id)
            return `user_${user.id}`;
        let vk = localStorage.getItem('folio_visitor_key');
        if (!vk) {
            vk = 'visitor_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
            localStorage.setItem('folio_visitor_key', vk);
        }
        return vk;
    };
    const handleOpenClientModal = async (client) => {
        setSelectedClient(client);
        try {
            const visitorKey = getVisitorKey(userData);
            const { data: newViewsTotal, error } = await supabase.rpc('record_client_request_view', {
                p_request_id: client.id,
                p_viewer_key: visitorKey,
            });
            if (!error && typeof newViewsTotal === 'number') {
                setClientRequests(prev => prev.map(c => c.id === client.id ? { ...c, views_count: newViewsTotal } : c));
                setSelectedClient(prev => prev && prev.id === client.id ? { ...prev, views_count: newViewsTotal } : prev);
            }
        }
        catch (err) {
            console.error("Erreur lors de l'enregistrement de la vue client:", err);
        }
    };
    useEffect(() => {
        let active = true;
        const syncPendingPayments = async () => {
            try {
                const { data: pendingTxs } = await supabase
                    .from('payment_transactions')
                    .select('provider_reference, user_id')
                    .eq('user_id', userData.id)
                    .eq('status', 'pending');
                if (pendingTxs && pendingTxs.length > 0) {
                    for (const tx of pendingTxs) {
                        if (!active)
                            break;
                        if (tx.provider_reference) {
                            await supabase.functions.invoke('saspay-verify-payment', {
                                body: { paymentId: tx.provider_reference, userId: userData.id },
                            });
                        }
                    }
                    await fetchProfile();
                }
            }
            catch (err) {
                console.error('Erreur lors de la synchronisation des paiements en arrière-plan:', err);
            }
        };
        syncPendingPayments();
        return () => { active = false; };
    }, [userData.id]);
    useEffect(() => {
        let isMounted = true;
        const fetchFreelancersAndRatings = async () => {
            const { data: profiles } = await supabase
                .from('freelancers')
                .select('*')
                .eq('user_id', userData.id);
            if (!isMounted)
                return;
            if (profiles && profiles.length > 0) {
                setFreelancerProfiles(profiles);
                const profileIds = profiles.map(p => p.id);
                const { data: ratings } = await supabase
                    .from('freelancer_ratings')
                    .select('*')
                    .in('freelancer_id', profileIds);
                if (isMounted && ratings) {
                    setRatingsList(ratings);
                }
            }
        };
        fetchFreelancersAndRatings();
        const channel = supabase
            .channel(`ratings-dashboard-${userData.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'freelancer_ratings' }, () => {
            fetchFreelancersAndRatings();
        })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'freelancers', filter: `user_id=eq.${userData.id}` }, () => {
            fetchFreelancersAndRatings();
        })
            .subscribe();
        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [userData.id]);
    const filteredRatings = useMemo(() => {
        if (selectedProfileId === 'all')
            return ratingsList;
        return ratingsList.filter(r => r.freelancer_id === selectedProfileId);
    }, [ratingsList, selectedProfileId]);
    const weeklyRatings = useMemo(() => {
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - (6 - index));
            return date;
        });
        return days.map((date) => {
            const dayRatings = filteredRatings.filter((r) => new Date(r.created_at).toDateString() === date.toDateString());
            const sum = dayRatings.reduce((acc, curr) => acc + curr.rating, 0);
            const avg = dayRatings.length > 0 ? (sum / dayRatings.length).toFixed(1) : 0;
            return {
                label: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
                count: dayRatings.length,
                avgRating: Number(avg),
                value: dayRatings.length,
            };
        });
    }, [filteredRatings]);
    const currentChartData = chartMetric === 'visits' ? weeklyVisits : weeklyRatings;
    const chartPoints = useMemo(() => {
        const max = Math.max(...currentChartData.map((day) => day.value), 1);
        return currentChartData.map((day, index) => `${index * 100},${90 - (day.value / max) * 70}`).join(' ');
    }, [currentChartData]);
    const handleAnalysis = (event) => {
        event.preventDefault();
        if (!portfolioUrl.trim())
            return;
        setShowAnalysisModal(true);
    };
    const handleBoostPurchase = async ({ secteur, tier }) => {
        const { data, error } = await supabase.rpc('subscribe_contact_boost', {
            target_user_id: userData.id,
            target_sector: secteur.label,
            contact_count: tier.contactCount,
            boost_cost: tier.price,
        });
        if (error)
            throw error;
        if (!data?.success)
            throw new Error(data?.message || 'Impossible de souscrire ce forfait.');
        const details = { secteur: secteur.label, count: tier.contactCount, price: tier.price };
        await fetchBoostContacts(details);
        setBoostDetails(details);
        localStorage.setItem(`folio-boost-details-${userData.id}`, JSON.stringify(details));
        await fetchProfile();
        setShowAnalysisModal(false);
        triggerFireworks();
    };
    const fetchBoostContacts = async (details) => {
        if (!details?.secteur || !details?.count)
            return;
        setBoostContactsError('');
        const { data, error } = await supabase.functions.invoke('get-contact-boost-contacts', {
            body: {
                sector: details.secteur,
                count: details.count,
            },
        });
        if (error) {
            console.error('Erreur lors du chargement des contacts boost:', error);
            setBoostContactsError('Impossible de charger les contacts pour le moment. Réessaie dans quelques instants.');
            return;
        }
        const contacts = (data?.contacts || []).map((contact) => ({
            ...contact,
            whatsappPhone: contact.whatsappPhone || contact.whatsapp_phone || '',
        }));
        setBoostContacts(contacts);
        localStorage.setItem(`folio-boost-contacts-${userData.id}`, JSON.stringify(contacts));
    };
    useEffect(() => {
        let active = true;
        const restoreContactBoost = async () => {
            const { data, error } = await supabase.rpc('get_my_contact_boost_subscription');
            if (!active)
                return;
            const subscription = Array.isArray(data) ? data[0] : data;
            if (!error && subscription?.sector && subscription?.contact_count) {
                const details = {
                    secteur: subscription.sector,
                    count: subscription.contact_count,
                    price: subscription.boost_cost || null,
                };
                setBoostDetails(details);
                localStorage.setItem(`folio-boost-details-${userData.id}`, JSON.stringify(details));
                return;
            }
        };
        restoreContactBoost();
        return () => { active = false; };
    }, [userData.id]);
    useEffect(() => {
        if (boostDetails)
            fetchBoostContacts(boostDetails);
    }, [boostDetails]);
    const fetchSearchStats = async () => {
        const { data, error } = await supabase.rpc('get_search_detection_stats', { target_user_id: userData.id });
        if (!error)
            setSearchStats(data || []);
    };
    const openSearchDetection = async () => {
        await fetchSearchStats();
        setShowSearchDetectionModal(true);
    };
    useEffect(() => {
        if (!showSearchDetectionModal)
            return undefined;
        const channel = supabase
            .channel(`search-detection-${userData.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'freelancer_search_events', filter: `profile_owner_id=eq.${userData.id}` }, fetchSearchStats)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [showSearchDetectionModal, userData.id]);
    const handleLogout = async () => {
        await supabase.auth.signOut();
        onLogout();
    };
    return (_jsxs("div", { className: "dashboard-shell min-vh-100", style: { backgroundColor: 'var(--folio-bg)' }, children: [_jsx("nav", { className: "dashboard-nav navbar navbar-expand-lg py-3", style: { backgroundColor: 'white', borderBottom: '1px solid rgba(38, 33, 92, 0.08)' }, children: _jsxs("div", { className: "container-fluid px-4", children: [_jsx("div", { className: "dashboard-brand-group", children: _jsxs("span", { className: "navbar-brand font-serif fs-4 mb-0", style: { color: 'var(--folio-title)' }, children: [_jsx("i", { className: "bi bi-grid-1x2 me-2", style: { color: 'var(--folio-primary)' } }), "Folio"] }) }), _jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsxs("div", { className: "dropdown", children: [_jsx("button", { className: "btn btn-link p-0 text-title", type: "button", id: "profileDropdown", "data-bs-toggle": "dropdown", "aria-expanded": "false", onClick: fetchProfile, style: { fontSize: '1.6rem', color: 'var(--folio-primary)' }, children: _jsx("i", { className: "bi bi-person-circle" }) }), _jsxs("ul", { className: "dropdown-menu dropdown-menu-end shadow border-0 dashboard-profile-dropdown", "aria-labelledby": "profileDropdown", style: { minWidth: '290px', borderRadius: '12px', padding: '10px' }, children: [_jsxs("li", { className: "px-3 py-2 border-bottom mb-2", children: [_jsxs("div", { className: "d-flex align-items-center gap-1", children: [_jsx("p", { className: "fw-bold mb-0 text-title", style: { fontSize: '0.95rem' }, children: userData.nom_complet || 'Utilisateur' }), isUserVerified && (_jsx("img", { src: userBadgeImg, alt: "V\u00E9rifi\u00E9", title: "les profils verifier son ceux que nous avons verifier personellement", style: { width: '18px', height: '18px', objectFit: 'contain', cursor: 'pointer' } }))] }), _jsx("p", { className: "text-muted mb-0", style: { fontSize: '0.8rem' }, children: userData.email })] }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2 text-primary fw-medium", onClick: () => setShowRechargeModal(true), children: [_jsx("i", { className: "bi bi-wallet2 me-2" }), _jsx("span", { children: profileData?.solde > 0 ? 'Mon solde' : 'Recharger mon compte' }), _jsxs("span", { className: "ms-2 fw-bold", style: { color: 'var(--folio-primary)' }, children: [Number(profileData?.solde || 0).toLocaleString('fr-FR'), " F CFA"] })] }) }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2 d-flex justify-content-between align-items-center", onClick: () => setShowVerificationModal(true), children: [_jsxs("span", { children: [_jsx("img", { src: userBadgeImg, alt: "Badge", title: "les profils verifier son ceux que nous avons verifier personellement", className: "me-2", style: { width: '18px', height: '18px', objectFit: 'contain' } }), _jsx("span", { className: "fw-medium text-title", children: "Badge de v\u00E9rification" })] }), isUserVerified ? (_jsx("span", { className: "badge bg-success-subtle text-success border border-success-subtle rounded-pill", style: { fontSize: '0.7rem' }, children: "Actif" })) : (_jsx("span", { className: "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill", style: { fontSize: '0.7rem' }, children: "500 F/mois" }))] }) }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2 d-flex justify-content-between align-items-center", onClick: () => setShowProMaxModal(true), children: [_jsxs("span", { children: [_jsx("i", { className: "bi bi-rocket-takeoff-fill me-2", style: { color: '#FF7A00' } }), _jsx("span", { className: "fw-bold text-title", style: { color: isProMax ? '#FF7A00' : 'inherit' }, children: "Freelancer ProMax" })] }), isProMax ? (_jsx("span", { className: "badge rounded-pill", style: { backgroundColor: '#FF7A00', color: 'white', fontSize: '0.7rem' }, children: "Actif \uD83D\uDE80" })) : (_jsx("span", { className: "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill", style: { fontSize: '0.7rem' }, children: "250 F/mois" }))] }) }), _jsx("li", { children: _jsx("hr", { className: "dropdown-divider" }) }), _jsxs("li", { className: "px-3 py-2", children: [_jsxs("div", { className: "form-check form-switch mb-1", children: [_jsx("input", { id: "daily-account-email-opt-in", className: "form-check-input", type: "checkbox", role: "switch", checked: dailyEmailOptedIn, disabled: dailyEmailPreferenceLoading || dailyEmailPreferenceSaving, onChange: handleDailyEmailPreferenceChange }), _jsx("label", { className: "form-check-label text-body-custom small", htmlFor: "daily-account-email-opt-in", children: "Recevoir des missions par e-mail" })] }), _jsx("p", { className: "text-muted mb-0", style: { fontSize: '0.75rem' }, children: "Envoi d\u00E8s 20 h 30 (heure de Douala), par ordre de connexion r\u00E9cente. D\u00E9sinscription depuis chaque e-mail." }), dailyEmailPreferenceError && _jsx("p", { className: "text-danger small mt-2 mb-0", role: "alert", children: dailyEmailPreferenceError })] }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2 text-primary fw-medium", onClick: () => setShowOptimModal(true), children: [_jsx("i", { className: "bi bi-lightning-charge me-2" }), "Optimiser mon Portfolio"] }) }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2 fw-medium", style: { color: '#8b5cf6' }, onClick: handleOpenAiAnalysis, children: [_jsx("i", { className: "bi bi-magic me-2", style: { color: '#8b5cf6' } }), "Analyser par IA (Gemini)"] }) }), _jsx("li", { children: _jsx("hr", { className: "dropdown-divider" }) }), isProMax && (_jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2", onClick: () => setShowBlogMaxModal(true), children: [_jsx("i", { className: "bi bi-journal-richtext me-2 text-muted" }), "Blog Max"] }) })), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2", onClick: () => setShowMyProfilesModal(true), children: [_jsx("i", { className: "bi bi-person-vcard me-2 text-muted" }), "Mes Profils"] }) }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2", onClick: onGoFreelancer, children: [_jsx("i", { className: "bi bi-briefcase me-2 text-muted" }), "Devenir Freelancer"] }) }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2", onClick: openSearchDetection, children: [_jsx("i", { className: "bi bi-search me-2 text-muted" }), "D\u00E9tecter les recherches"] }) }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2", onClick: handleInviteFriends, children: [_jsx("i", { className: "bi bi-gift me-2 text-muted", style: { color: '#16a34a' } }), _jsx("span", { className: "fw-medium", children: "Inviter des amis" }), _jsx("span", { className: "ms-2 badge bg-success-subtle text-success border border-success-subtle rounded-pill", style: { fontSize: '0.65rem' }, children: "+50 F/ami" })] }) }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2", onClick: handleOpenProspectingModal, children: [_jsx("i", { className: "bi bi-people me-2 text-muted" }), "Trouver des contacts \u00E0 qui vendre"] }) }), _jsx("li", { children: _jsxs("button", { className: "dropdown-item py-2", onClick: () => setShowReportModal(true), children: [_jsx("i", { className: "bi bi-flag me-2 text-muted" }), "Signaler un probl\u00E8me"] }) })] })] }), _jsxs("button", { className: "btn btn-outline-custom btn-sm px-3", onClick: handleLogout, children: [_jsx("i", { className: "bi bi-box-arrow-right me-1" }), "D\u00E9connexion"] })] })] }) }), _jsxs("div", { className: "container-fluid px-4 py-4", children: [_jsxs("div", { className: "mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2", children: [_jsxs("div", { children: [_jsxs("h1", { className: "font-serif mb-1 d-flex align-items-center gap-2", style: { color: 'var(--folio-title)', fontSize: '1.75rem' }, children: [_jsxs("span", { children: ["Bienvenue, ", userData.nom_complet || 'Développeur'] }), isUserVerified && (_jsx("img", { src: userBadgeImg, alt: "Compte v\u00E9rifi\u00E9", title: "les profils verifier son ceux que nous avons verifier personellement", style: { width: '26px', height: '26px', objectFit: 'contain', cursor: 'pointer' } })), _jsx("span", { style: { fontSize: '1.5rem' }, children: "\uD83D\uDC4B" })] }), _jsx("p", { className: "text-body-custom mb-0", children: "Voici ton espace personnel Folio." })] }), freelancerProfiles.length > 0 && (_jsx("div", { className: "d-flex align-items-center gap-2", children: _jsxs("span", { className: "badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill", children: [_jsx("i", { className: "bi bi-person-check-fill me-1" }), freelancerProfiles.length, " profil", freelancerProfiles.length > 1 ? 's' : '', " Freelancer actif", freelancerProfiles.length > 1 ? 's' : ''] }) }))] }), _jsxs("div", { className: "row g-3 mb-4", children: [_jsx("div", { className: "col-md-6 col-lg-3", children: _jsx("div", { className: "bg-white rounded-3 p-4", style: { border: '1px solid rgba(38, 33, 92, 0.08)' }, children: _jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsx("div", { className: "d-flex align-items-center justify-content-center rounded-3", style: { width: '44px', height: '44px', backgroundColor: '#EEEDFE' }, children: _jsx("i", { className: "bi bi-person fs-5", style: { color: 'var(--folio-primary)' } }) }), _jsxs("div", { children: [_jsx("p", { className: "text-body-custom mb-0", style: { fontSize: '0.8rem', opacity: 0.7 }, children: "Nom" }), _jsx("p", { className: "fw-medium mb-0", style: { color: 'var(--folio-title)', fontSize: '0.95rem' }, children: userData.nom_complet || '—' })] })] }) }) }), _jsx("div", { className: "col-md-6 col-lg-3", children: _jsx("div", { className: "bg-white rounded-3 p-4", style: { border: '1px solid rgba(38, 33, 92, 0.08)' }, children: _jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsx("div", { className: "d-flex align-items-center justify-content-center rounded-3", style: { width: '44px', height: '44px', backgroundColor: '#EEEDFE' }, children: _jsx("i", { className: "bi bi-envelope fs-5", style: { color: 'var(--folio-primary)' } }) }), _jsxs("div", { children: [_jsx("p", { className: "text-body-custom mb-0", style: { fontSize: '0.8rem', opacity: 0.7 }, children: "Email" }), _jsx("p", { className: "fw-medium mb-0", style: { color: 'var(--folio-title)', fontSize: '0.95rem' }, children: userData.email || '—' })] })] }) }) }), _jsx("div", { className: "col-md-6 col-lg-3", children: _jsx("div", { className: "bg-white rounded-3 p-4", style: { border: '1px solid rgba(38, 33, 92, 0.08)' }, children: _jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsx("div", { className: "d-flex align-items-center justify-content-center rounded-3", style: { width: '44px', height: '44px', backgroundColor: '#EEEDFE' }, children: _jsx("i", { className: "bi bi-globe-americas fs-5", style: { color: 'var(--folio-primary)' } }) }), _jsxs("div", { children: [_jsx("p", { className: "text-body-custom mb-0", style: { fontSize: '0.8rem', opacity: 0.7 }, children: "Pays" }), _jsx("p", { className: "fw-medium mb-0", style: { color: 'var(--folio-title)', fontSize: '0.95rem' }, children: userData.pays || '—' })] })] }) }) }), _jsx("div", { className: "col-md-6 col-lg-3", children: _jsx("div", { className: "bg-white rounded-3 p-4", style: { border: '1px solid rgba(38, 33, 92, 0.08)' }, children: _jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsx("div", { className: "d-flex align-items-center justify-content-center rounded-3", style: { width: '44px', height: '44px', backgroundColor: '#EEEDFE' }, children: _jsx("i", { className: "bi bi-telephone fs-5", style: { color: 'var(--folio-primary)' } }) }), _jsxs("div", { children: [_jsx("p", { className: "text-body-custom mb-0", style: { fontSize: '0.8rem', opacity: 0.7 }, children: "T\u00E9l\u00E9phone" }), _jsx("p", { className: "fw-medium mb-0", style: { color: 'var(--folio-title)', fontSize: '0.95rem' }, children: userData.telephone || '—' })] })] }) }) })] }), _jsxs("div", { className: "row g-3", children: [_jsx("div", { className: "col-lg-8", children: _jsxs("div", { className: "bg-white rounded-3 p-4", style: { border: '1px solid rgba(38, 33, 92, 0.08)' }, children: [_jsxs("div", { className: "d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2", children: [_jsx("div", { className: "d-flex align-items-center gap-2", children: _jsxs("div", { className: "btn-group", role: "group", "aria-label": "Choisir la m\u00E9trique du graphique", children: [_jsxs("button", { type: "button", className: `btn btn-sm ${chartMetric === 'visits' ? 'btn-primary-custom' : 'btn-outline-custom'}`, onClick: () => setMetric('visits'), children: [_jsx("i", { className: "bi bi-graph-up me-1" }), "Visiteurs"] }), _jsxs("button", { type: "button", className: `btn btn-sm ${chartMetric === 'stars' ? 'btn-primary-custom' : 'btn-outline-custom'}`, onClick: () => setMetric('stars'), children: [_jsx("i", { className: "bi bi-star-fill text-warning me-1" }), "\u00C9toiles re\u00E7ues \u2B50"] }), _jsxs("button", { type: "button", className: `btn btn-sm ${chartMetric === 'clients' ? 'btn-primary-custom' : 'btn-outline-custom'}`, onClick: () => setMetric('clients'), children: [_jsx("i", { className: "bi bi-briefcase-fill text-info me-1" }), "Demandes Clients \uD83D\uDCBC"] })] }) }), chartMetric === 'stars' && freelancerProfiles.length > 0 && (_jsxs("div", { className: "d-flex align-items-center gap-2", children: [_jsx("label", { htmlFor: "select-profile-filter", className: "small text-muted mb-0 fw-medium", children: "Profil :" }), _jsxs("select", { id: "select-profile-filter", className: "form-select form-select-sm", style: { maxWidth: '200px', borderRadius: '8px' }, value: selectedProfileId, onChange: (e) => setSelectedProfileId(e.target.value), children: [_jsxs("option", { value: "all", children: ["Tous mes profils (", freelancerProfiles.length, ")"] }), freelancerProfiles.map(p => (_jsx("option", { value: p.id, children: p.nom_freelancer }, p.id)))] })] })), _jsx("span", { className: "badge rounded-pill", style: { backgroundColor: '#EEEDFE', color: 'var(--folio-primary)', fontSize: '0.8rem' }, children: chartMetric === 'visits' ? (`${visits.length} visite${visits.length > 1 ? 's' : ''} cette semaine`) : chartMetric === 'stars' ? (`${filteredRatings.length} avis / étoile${filteredRatings.length > 1 ? 's' : ''} en temps réel`) : (`${clientRequests.length} demande${clientRequests.length > 1 ? 's' : ''} client${clientRequests.length > 1 ? 's' : ''}`) })] }), chartMetric === 'clients' ? (_jsxs("div", { className: "rounded-3 p-3", style: { backgroundColor: '#FAFAFE', border: '1px solid rgba(38, 33, 92, 0.08)' }, children: [_jsxs("h6", { className: "fw-bold font-serif mb-3 text-title d-flex align-items-center justify-content-between", children: [_jsxs("span", { children: [_jsx("i", { className: "bi bi-person-workspace text-primary me-2" }), "Clients ayant postul\u00E9 pour des projets"] }), _jsxs("span", { className: "badge bg-primary rounded-pill small", children: [clientRequests.length, " au total"] })] }), clientRequests.length === 0 ? (_jsxs("p", { className: "text-center text-muted small py-4 mb-0", children: [_jsx("i", { className: "bi bi-folder2-open d-block fs-3 mb-2 opacity-50" }), "Aucune demande client pour le moment. Les projets publi\u00E9s par les clients appara\u00EEtront ici."] })) : (_jsx("div", { className: "d-flex flex-column gap-2", style: clientRequests.length > 4
                                                        ? { maxHeight: '420px', overflowY: 'auto', paddingRight: '4px', scrollbarGutter: 'stable' }
                                                        : {}, children: clientRequests.map((client) => (_jsxs("div", { className: "p-3 bg-white rounded-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between border", style: { cursor: 'pointer', transition: 'all 0.2s ease' }, onClick: () => handleOpenClientModal(client), children: [_jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsx("div", { className: "rounded-circle text-info d-flex align-items-center justify-content-center fw-bold fs-5", style: { width: '44px', height: '44px', backgroundColor: '#e0f2fe', color: '#0369a1' }, children: client.prenom ? client.prenom.charAt(0).toUpperCase() : 'C' }), _jsxs("div", { children: [_jsxs("button", { type: "button", className: "btn btn-link p-0 fw-bold text-dark text-decoration-none text-start fs-6 mb-0", onClick: (e) => { e.stopPropagation(); handleOpenClientModal(client); }, children: [client.prenom, " ", client.nom] }), _jsxs("div", { className: "d-flex flex-wrap align-items-center gap-2 text-muted small mt-1", style: { fontSize: '0.78rem' }, children: [_jsxs("span", { children: [_jsx("i", { className: "bi bi-geo-alt me-1 text-danger" }), client.pays] }), _jsx("span", { children: "\u2022" }), _jsx("span", { className: "badge text-bg-light border", children: client.preference_freelance === 'local' ? 'Freelancer Local' : client.preference_freelance === 'externe' ? 'Freelancer Externe' : 'Tout profil' }), _jsx("span", { children: "\u2022" }), _jsxs("span", { className: "badge text-bg-primary-subtle text-primary border border-primary-subtle fw-semibold", children: [_jsx("i", { className: "bi bi-eye me-1" }), client.views_count || 0, " vue", (client.views_count || 0) > 1 ? 's' : ''] })] })] })] }), _jsxs("div", { className: "d-flex align-items-center gap-2 mt-2 mt-sm-0", children: [_jsx("span", { className: "text-muted small", style: { fontSize: '0.75rem' }, children: new Date(client.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }), _jsxs("button", { type: "button", className: "btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-medium", style: { fontSize: '0.78rem' }, onClick: (e) => { e.stopPropagation(); handleOpenClientModal(client); }, children: [_jsx("i", { className: "bi bi-eye me-1" }), "D\u00E9tails"] })] })] }, client.id))) }))] })) : (_jsxs("div", { className: "visitors-chart rounded-3 p-3", style: { backgroundColor: '#FAFAFE', border: '1px solid rgba(38, 33, 92, 0.08)' }, children: [_jsxs("svg", { viewBox: "0 0 600 120", className: "w-100", role: "img", "aria-label": "Courbe du tableau de bord", children: [_jsx("polyline", { points: chartPoints, fill: "none", stroke: chartMetric === 'stars' ? '#f59e0b' : 'var(--folio-primary)', strokeWidth: "4", strokeLinecap: "round", strokeLinejoin: "round" }), currentChartData.map((day, index) => (_jsx("circle", { cx: index * 100, cy: 90 - (day.value / Math.max(...currentChartData.map((item) => item.value), 1)) * 70, r: "5", fill: "white", stroke: chartMetric === 'stars' ? '#f59e0b' : 'var(--folio-primary)', strokeWidth: "3" }, day.label)))] }), _jsx("div", { className: "d-flex justify-content-between text-muted small px-1 mt-2", children: currentChartData.map((day) => (_jsxs("div", { className: "text-center", children: [_jsx("span", { className: "d-block fw-bold", style: { fontSize: '0.75rem' }, children: day.label }), _jsx("span", { className: "d-block text-muted", style: { fontSize: '0.7rem' }, children: chartMetric === 'stars' ? (day.value > 0 ? `+${day.value} ⭐` : '0') : day.value })] }, day.label))) }), chartMetric === 'visits' && !visits.length && (_jsx("p", { className: "text-center text-body-custom small mt-3 mb-0", children: "Les visites appara\u00EEtront ici d\u00E8s qu'un visiteur ouvrira ton portfolio." })), chartMetric === 'stars' && !filteredRatings.length && (_jsxs("p", { className: "text-center text-body-custom small mt-3 mb-0", children: [_jsx("i", { className: "bi bi-star me-1 text-warning" }), "Aucune \u00E9toile re\u00E7ue pour le moment sur ", selectedProfileId === 'all' ? 'tes profils' : 'ce profil', ". Tes \u00E9toiles appara\u00EEtront en temps r\u00E9el d\u00E8s qu'un utilisateur votera !"] }))] })), boostContacts.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "boost-contacts-desktop", children: _jsx(BoostContactsList, { contacts: boostContacts, details: boostDetails, userId: userData.id, instanceId: "desktop" }) }), _jsxs("button", { type: "button", className: "btn btn-primary-custom w-100 mt-3 boost-contacts-mobile-trigger", onClick: () => setShowBoostContactsSheet(true), children: [_jsx("i", { className: "bi bi-telephone-outbound me-2" }), "Appeler Prospects"] })] })), boostDetails && boostContacts.length === 0 && (_jsx("div", { className: "alert alert-info mt-3 mb-0", role: "status", children: boostContactsError || 'Les contacts de ton forfait seront affichés ici dès qu’ils seront disponibles.' }))] }) }), _jsxs("div", { className: "col-lg-4", children: [_jsxs("div", { className: "dashboard-panel bg-white rounded-3 p-4 mb-3", style: { border: '1px solid rgba(38, 33, 92, 0.08)' }, children: [_jsxs("h6", { className: "font-serif mb-3", style: { color: 'var(--folio-title)' }, children: [_jsx("i", { className: "bi bi-link-45deg me-2", style: { color: 'var(--folio-primary)' } }), "Lien vers votre portfolio"] }), _jsxs("form", { onSubmit: handleAnalysis, noValidate: true, children: [_jsx("label", { htmlFor: "portfolio-url", className: "form-label text-body-custom small", children: "Entrez le lien de votre portfolio" }), _jsx("input", { id: "portfolio-url", type: "url", className: "form-control", placeholder: "https://votreportfolio.com", value: portfolioUrl, onChange: (event) => setPortfolioUrl(event.target.value), required: true }), _jsx("button", { type: "submit", className: "btn btn-primary-custom w-100 mt-3", children: profileData?.portfolio_url ? (_jsxs(_Fragment, { children: [_jsx("i", { className: "bi bi-rocket-takeoff me-1" }), "Booster mon portfolio et trouver des clients"] })) : (_jsxs(_Fragment, { children: [_jsx("i", { className: "bi bi-bar-chart-line me-1" }), "Lancer l'analyse"] })) })] })] }), _jsxs("div", { className: "dashboard-panel bg-white rounded-3 p-4", style: { border: '1px solid rgba(38, 33, 92, 0.08)' }, children: [_jsxs("h6", { className: "font-serif mb-3", style: { color: 'var(--folio-title)' }, children: [_jsx("i", { className: "bi bi-briefcase me-2", style: { color: 'var(--folio-primary)' } }), "Ton profil"] }), loadingProfile ? (_jsx("div", { className: "text-center py-4", children: _jsx("div", { className: "spinner-border spinner-border-sm text-primary", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Chargement..." }) }) })) : (_jsxs("div", { children: [_jsxs("div", { className: "d-flex flex-column align-items-center text-center mb-3", children: [profileData?.profile_photo_url ? (_jsx("img", { src: profileData.profile_photo_url, alt: "Avatar", className: "rounded-circle mb-2 shadow-sm", style: { width: '80px', height: '80px', objectFit: 'cover', border: '3px solid #EEEDFE' } })) : (_jsx("div", { className: "rounded-circle mb-2 d-flex align-items-center justify-content-center shadow-sm", style: { width: '80px', height: '80px', backgroundColor: '#EEEDFE', color: 'var(--folio-primary)' }, children: _jsx("i", { className: "bi bi-person fs-1" }) })), _jsx("h6", { className: "mb-0 text-title fw-bold", children: profileData?.nom_complet || userData.nom_complet }), _jsx("p", { className: "text-muted mb-0 small", children: profileData?.profession || userData.profession || 'Développeur' })] }), _jsxs("ul", { className: "list-unstyled mb-3", style: { fontSize: '0.85rem' }, children: [profileData?.portfolio_url && (_jsxs("li", { className: "d-flex align-items-center gap-2 py-2", style: { borderBottom: '1px solid rgba(38, 33, 92, 0.04)' }, children: [_jsx("i", { className: "bi bi-globe2 text-muted", title: "Portfolio" }), _jsx("a", { href: profileData.portfolio_url, target: "_blank", rel: "noopener noreferrer", className: "text-truncate text-decoration-none text-primary fw-medium", style: { maxWidth: '200px' }, children: profileData.portfolio_url.replace(/^https?:\/\//i, '') })] })), profileData?.whatsapp && (_jsxs("li", { className: "d-flex align-items-center gap-2 py-2", style: { borderBottom: '1px solid rgba(38, 33, 92, 0.04)' }, children: [_jsx("i", { className: "bi bi-whatsapp text-success", title: "WhatsApp" }), _jsx("span", { className: "text-title", children: profileData.whatsapp })] })), _jsxs("li", { className: "d-flex align-items-center gap-2 py-2", style: { borderBottom: '1px solid rgba(38, 33, 92, 0.04)' }, children: [_jsx("i", { className: "bi bi-geo-alt text-muted", title: "Pays" }), _jsx("span", { className: "text-title", children: profileData?.pays || userData.pays || 'Non renseigné' })] }), profileData?.description && (_jsxs("li", { className: "py-2", style: { borderBottom: '1px solid rgba(38, 33, 92, 0.04)' }, children: [_jsx("div", { className: "text-muted small mb-1", children: "Description" }), _jsx("p", { className: "mb-0 text-title", style: { fontSize: '0.8rem', lineHeight: '1.4', maxHeight: '100px', overflowY: 'auto' }, children: profileData.description })] }))] }), _jsxs("div", { className: "d-flex justify-content-center gap-2 mb-3", children: [profileData?.github_url && (_jsx("a", { href: profileData.github_url, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center", style: { width: '32px', height: '32px' }, title: "GitHub", children: _jsx("i", { className: "bi bi-github text-dark" }) })), profileData?.linkedin_url && (_jsx("a", { href: profileData.linkedin_url, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center", style: { width: '32px', height: '32px' }, title: "LinkedIn", children: _jsx("i", { className: "bi bi-linkedin text-primary" }) })), profileData?.facebook_url && (_jsx("a", { href: profileData.facebook_url, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center", style: { width: '32px', height: '32px' }, title: "Facebook", children: _jsx("i", { className: "bi bi-facebook text-primary" }) })), profileData?.tiktok_url && (_jsx("a", { href: profileData.tiktok_url, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center", style: { width: '32px', height: '32px' }, title: "TikTok", children: _jsx("i", { className: "bi bi-tiktok text-dark" }) })), profileData?.youtube_url && (_jsx("a", { href: profileData.youtube_url, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center", style: { width: '32px', height: '32px' }, title: "YouTube", children: _jsx("i", { className: "bi bi-youtube text-danger" }) }))] }), _jsxs("button", { className: "btn btn-outline-custom btn-sm w-100 py-1.5 mb-2", onClick: () => setShowOptimModal(true), children: [_jsx("i", { className: "bi bi-pencil-square me-1" }), "Modifier le profil"] }), _jsxs("button", { className: "btn btn-sm w-100 py-1.5 text-white", style: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }, onClick: handleOpenAiAnalysis, children: [_jsx("i", { className: "bi bi-magic me-1" }), "Analyser par IA"] })] }))] }), boostContacts.length > 0 && (_jsx("div", { className: "boost-contacts-desktop", children: _jsx(SeoResultsPanel, { portfolioUrl: profileData?.portfolio_url || portfolioUrl, profileData: profileData, details: boostDetails }) }))] })] })] }), showRechargeModal && (_jsx(RechargeModal, { userData: userData, profileData: profileData, onPaymentConfirmed: fetchProfile, onClose: () => setShowRechargeModal(false) })), showOptimModal && (_jsx(PortfolioOptimizationModal, { userId: userData.id, initialData: profileData, onClose: () => setShowOptimModal(false), onComplete: async () => {
                    setShowOptimModal(false);
                    await fetchProfile();
                    triggerFireworks();
                } })), showAnalysisModal && (_jsx(AnalysisModal, { portfolioUrl: portfolioUrl, profileData: profileData, onPurchase: handleBoostPurchase, onClose: () => setShowAnalysisModal(false) })), showAiAnalysisModal && (_jsx(AiAnalysisModal, { portfolioUrl: portfolioUrl, profileData: profileData, userData: userData, onClose: () => setShowAiAnalysisModal(false) })), showMyProfilesModal && (_jsx(MyProfilesModal, { userId: userData.id, userName: userData.nom_complet, isProMax: isProMax, onClose: () => setShowMyProfilesModal(false) })), selectedClient && (_jsx("div", { className: "modal fade show d-block", tabIndex: "-1", role: "dialog", style: { backgroundColor: 'rgba(38, 33, 92, 0.55)', backdropFilter: 'blur(5px)', zIndex: 1060 }, onClick: (e) => { if (e.target === e.currentTarget)
                    setSelectedClient(null); }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered modal-lg", children: _jsxs("div", { className: "modal-content border-0 shadow-lg", style: { borderRadius: '20px', overflow: 'hidden' }, children: [_jsxs("div", { className: "modal-header border-0 bg-light px-4 py-3", children: [_jsxs("h5", { className: "modal-title font-serif fw-bold text-title mb-0", children: [_jsx("i", { className: "bi bi-person-vcard text-primary me-2" }), "D\u00E9tails de la demande client"] }), _jsx("button", { type: "button", className: "btn-close", onClick: () => setSelectedClient(null) })] }), _jsxs("div", { className: "modal-body p-4", children: [_jsxs("div", { className: "d-flex align-items-center gap-3 mb-4 p-3 rounded-3", style: { backgroundColor: '#F4F4FD' }, children: [_jsx("div", { className: "rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4 shadow-sm", style: { width: '60px', height: '60px', backgroundColor: 'var(--folio-primary)' }, children: selectedClient.prenom ? selectedClient.prenom.charAt(0).toUpperCase() : 'C' }), _jsxs("div", { children: [_jsxs("h4", { className: "fw-bold text-dark mb-1", children: [selectedClient.prenom, " ", selectedClient.nom] }), _jsxs("div", { className: "d-flex flex-wrap align-items-center gap-2 text-muted small", children: [_jsxs("span", { children: [_jsx("i", { className: "bi bi-geo-alt-fill text-danger me-1" }), selectedClient.pays] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [_jsx("i", { className: "bi bi-clock me-1" }), "Publi\u00E9 le ", new Date(selectedClient.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { className: "badge bg-primary text-white rounded-pill px-2.5 py-1", children: [_jsx("i", { className: "bi bi-eye-fill me-1" }), selectedClient.views_count || 0, " vue", (selectedClient.views_count || 0) > 1 ? 's' : ''] })] })] })] }), _jsxs("div", { className: "row g-3 mb-4", children: [_jsx("div", { className: "col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 bg-white h-100 shadow-sm", children: [_jsxs("label", { className: "text-muted small fw-bold d-block mb-1", children: [_jsx("i", { className: "bi bi-telephone-fill text-success me-1" }), "T\u00E9l\u00E9phone / WhatsApp / Telegram"] }), _jsxs("div", { className: "d-flex flex-column gap-2 mt-2", children: [_jsx("span", { className: "fw-bold text-dark fs-6", children: selectedClient.telephone }), _jsxs("div", { className: "d-flex flex-wrap gap-2", children: [_jsxs("a", { href: `https://wa.me/${selectedClient.telephone.replace(/[^0-9]/g, '')}`, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-success rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1", children: [_jsx("i", { className: "bi bi-whatsapp" }), " WhatsApp"] }), _jsxs("a", { href: selectedClient.telephone.startsWith('http') ? selectedClient.telephone : `https://t.me/${selectedClient.telephone.replace('@', '')}`, target: "_blank", rel: "noopener noreferrer", className: "btn btn-sm btn-info text-white rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1", children: [_jsx("i", { className: "bi bi-telegram" }), " Telegram"] }), _jsxs("a", { href: `tel:${selectedClient.telephone.replace(/[^0-9+]/g, '')}`, className: "btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1", children: [_jsx("i", { className: "bi bi-telephone" }), " Appeler"] })] })] })] }) }), _jsx("div", { className: "col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 bg-white h-100 shadow-sm", children: [_jsxs("label", { className: "text-muted small fw-bold d-block mb-1", children: [_jsx("i", { className: "bi bi-geo text-primary me-1" }), "Pr\u00E9f\u00E9rence Freelancer"] }), _jsx("div", { className: "mt-2", children: _jsx("span", { className: "badge bg-primary-subtle text-primary border border-primary-subtle fs-6 px-3 py-2 rounded-pill fw-bold", children: selectedClient.preference_freelance === 'local' ? 'Freelancer Local (dans son pays)' : selectedClient.preference_freelance === 'externe' ? 'Freelancer Externe (Remote)' : 'N\'importe quel profil (Indifférent)' }) })] }) })] }), _jsxs("div", { className: "p-3 border rounded-3 bg-white shadow-sm", children: [_jsxs("label", { className: "text-muted small fw-bold d-block mb-2", children: [_jsx("i", { className: "bi bi-file-text text-warning me-1" }), "Description compl\u00E8te du projet"] }), _jsx("p", { className: "text-dark mb-0", style: { whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.95rem' }, children: selectedClient.description_projet })] })] }), _jsx("div", { className: "modal-footer border-0 bg-light px-4 py-3", children: _jsx("button", { type: "button", className: "btn btn-secondary rounded-pill px-4 fw-medium", onClick: () => setSelectedClient(null), children: "Fermer" }) })] }) }) })), showVerificationModal && (_jsx(VerificationModal, { userData: userData, profileData: profileData, onRefreshProfile: fetchProfile, onOpenRecharge: () => setShowRechargeModal(true), triggerFireworks: triggerFireworks, onClose: () => setShowVerificationModal(false) })), showProMaxModal && (_jsx(ProMaxModal, { userData: userData, profileData: profileData, onRefreshProfile: fetchProfile, onOpenRecharge: () => setShowRechargeModal(true), onClose: () => setShowProMaxModal(false) })), showReportModal && (_jsx(ReportProblemModal, { userId: userData.id, onClose: () => setShowReportModal(false) })), showSearchDetectionModal && (_jsx(SearchDetectionModal, { stats: searchStats, onRefresh: fetchSearchStats, onClose: () => setShowSearchDetectionModal(false) })), showProspectingModal && (_jsx("div", { className: "modal fade show d-block", tabIndex: "-1", role: "dialog", style: { backgroundColor: 'rgba(38, 33, 92, 0.55)', backdropFilter: 'blur(5px)', zIndex: 1060 }, onClick: (e) => { if (e.target === e.currentTarget) {
                    setShowProspectingModal(false);
                    setProspectingSeenKeys(new Set());
                    setProspectingBatch([]);
                } }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered modal-lg", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "modal-content border-0 shadow-lg", style: { borderRadius: '20px', overflow: 'hidden' }, children: [_jsxs("div", { className: "modal-header border-0 bg-light px-4 py-3", children: [_jsxs("h5", { className: "modal-title font-serif fw-bold text-title mb-0", children: [_jsx("i", { className: "bi bi-people-fill text-primary me-2" }), "Prospection cibl\u00E9e"] }), _jsx("button", { type: "button", className: "btn-close", onClick: () => { setShowProspectingModal(false); setProspectingSeenKeys(new Set()); setProspectingBatch([]); } })] }), _jsx("div", { className: "modal-body p-4", children: !boostContacts || boostContacts.length === 0 ? (_jsxs("div", { className: "text-center py-4", children: [_jsx("i", { className: "bi bi-exclamation-circle d-block fs-3 text-warning mb-2" }), _jsx("p", { className: "mb-3 text-body-custom", children: "Vous n\u2019avez pas encore acc\u00E8s aux contacts de prospection." }), _jsx("button", { type: "button", className: "btn btn-primary-custom", onClick: () => setShowProMaxModal(true), children: "Souscrire au programme" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [_jsxs("div", { children: [_jsx("h6", { className: "fw-bold text-title mb-1", children: "10 contacts \u00E0 viser" }), _jsx("p", { className: "small text-muted mb-0", children: "Des contacts non dupliqu\u00E9s, s\u00E9lectionn\u00E9s parmi vos prospects." })] }), _jsxs("span", { className: "badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle", children: [prospectingBatch.length, " / ", Math.min(10, boostContacts.length), " affich\u00E9s"] })] }), _jsx("div", { className: "row g-3", children: prospectingBatch.map((contact) => (_jsx("div", { className: "col-md-6", children: _jsxs("div", { className: "p-3 rounded-3 border h-100", style: { backgroundColor: '#FAFAFE' }, children: [_jsxs("div", { className: "d-flex align-items-center justify-content-between gap-2 mb-2", children: [_jsx("div", { className: "fw-bold text-title", children: contact.name }), _jsx("span", { className: "badge text-bg-light border", children: "Prospect" })] }), contact.email && (_jsxs("div", { className: "small text-muted mb-2", children: [_jsx("i", { className: "bi bi-envelope me-1" }), contact.email] })), contact.phone && (_jsxs("div", { className: "small text-muted mb-2", children: [_jsx("i", { className: "bi bi-whatsapp me-1 text-success" }), contact.phone] })), contact.whatsappPhone ? (_jsxs("a", { href: `https://wa.me/${contact.whatsappPhone}`, target: "_blank", rel: "noreferrer", className: "btn btn-sm btn-success w-100", children: [_jsx("i", { className: "bi bi-whatsapp me-1" }), "Contacter sur WhatsApp"] })) : (_jsxs("a", { href: `mailto:${contact.email}`, className: "btn btn-sm btn-outline-primary w-100", children: [_jsx("i", { className: "bi bi-envelope me-1" }), "Envoyer un email"] }))] }) }, `${getBoostContactKey(contact)}-${contact.name}`))) }), _jsxs("div", { className: "d-flex justify-content-between align-items-center mt-4 gap-2 flex-wrap", children: [_jsx("button", { type: "button", className: "btn btn-outline-custom", onClick: () => { setShowProspectingModal(false); setProspectingSeenKeys(new Set()); setProspectingBatch([]); }, children: "Fermer" }), _jsxs("button", { type: "button", className: "btn btn-primary-custom", onClick: handleNextProspectingBatch, children: [_jsx("i", { className: "bi bi-arrow-repeat me-1" }), "Autres contacts"] })] })] })) })] }) }) })), showBlogMaxModal && (isMobile ? (_jsx("div", { className: "mobile-bottom-sheet-overlay", onClick: (event) => { if (event.target === event.currentTarget)
                    setShowBlogMaxModal(false); }, children: _jsxs("div", { className: "mobile-bottom-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "blog-max-sheet-title", children: [_jsxs("div", { className: "mobile-bottom-sheet-header", children: [_jsxs("div", { className: "d-flex align-items-center gap-2", children: [_jsx("span", { className: "d-inline-flex align-items-center justify-content-center rounded-circle", style: { width: '36px', height: '36px', background: 'linear-gradient(135deg, #534AB7, #8B5CF6)', color: 'white' }, children: _jsx("i", { className: "bi bi-journal-richtext" }) }), _jsx("h2", { id: "blog-max-sheet-title", className: "h5 font-serif fw-bold text-title mb-0", children: "Blog Max" })] }), _jsx("button", { type: "button", className: "btn btn-link p-0 text-muted", onClick: () => setShowBlogMaxModal(false), "aria-label": "Fermer", children: _jsx("i", { className: "bi bi-x-lg" }) })] }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "rounded-4 p-3 mb-3", style: { background: 'linear-gradient(135deg, rgba(83,74,183,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(83,74,183,0.12)' }, children: [_jsx("div", { className: "small text-uppercase fw-bold", style: { letterSpacing: '0.08em', color: 'var(--folio-primary)' }, children: "Disponible \u00E0 partir du" }), _jsx("div", { className: "display-6 fw-bold text-title mt-2", children: "12 Novembre" })] }), _jsx("p", { className: "text-title fw-semibold mb-2", children: "Un espace blog pens\u00E9 pour les freelancers" }), _jsx("p", { className: "mb-3 text-body-custom", children: "Blog Max va permettre aux freelancers de publier des articles, partager leur expertise, renforcer leur visibilit\u00E9 et mieux propulser leur activit\u00E9." }), _jsx("p", { className: "mb-3 text-body-custom", children: "Cette fonctionnalit\u00E9 offrira aussi un espace de discussion direct avec leurs clients, sans jamais sortir du site, pour faciliter la conversion, la confiance et les \u00E9changes." }), _jsxs("div", { className: "d-flex align-items-center gap-2 rounded-3 p-3", style: { backgroundColor: '#F4F1FE' }, children: [_jsx("i", { className: "bi bi-chat-dots-fill fs-4", style: { color: 'var(--folio-primary)' } }), _jsxs("div", { children: [_jsx("div", { className: "fw-semibold text-title", children: "Chat client int\u00E9gr\u00E9" }), _jsx("small", { className: "text-muted", children: "\u00C9changes premium directement sur Folio" })] })] }), _jsx("button", { type: "button", className: "btn btn-primary-custom w-100 mt-4", onClick: () => setShowBlogMaxModal(false), children: "Compris" })] })] }) })) : (_jsx("div", { className: "modal fade show d-block blog-max-desktop-modal", tabIndex: "-1", role: "dialog", style: { backgroundColor: 'rgba(38, 33, 92, 0.45)', backdropFilter: 'blur(4px)', zIndex: 2050 }, onClick: (event) => { if (event.target === event.currentTarget)
                    setShowBlogMaxModal(false); }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered", role: "document", children: _jsxs("div", { className: "modal-content border-0 shadow", style: { borderRadius: '22px', overflow: 'hidden' }, children: [_jsx("div", { className: "p-4 pb-0", children: _jsxs("div", { className: "d-flex align-items-center justify-content-between mb-3", children: [_jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsx("span", { className: "d-inline-flex align-items-center justify-content-center rounded-circle", style: { width: '44px', height: '44px', background: 'linear-gradient(135deg, #534AB7, #8B5CF6)', color: 'white' }, children: _jsx("i", { className: "bi bi-journal-richtext fs-5" }) }), _jsxs("div", { children: [_jsx("div", { className: "small text-uppercase fw-bold", style: { letterSpacing: '0.08em', color: 'var(--folio-primary)' }, children: "Blog Max" }), _jsx("h5", { className: "modal-title font-serif fw-bold text-title mb-0", children: "Bient\u00F4t disponible" })] })] }), _jsx("button", { type: "button", className: "btn-close", onClick: () => setShowBlogMaxModal(false), "aria-label": "Fermer" })] }) }), _jsxs("div", { className: "modal-body px-4 py-3", children: [_jsxs("div", { className: "rounded-4 p-3 mb-3 text-center", style: { background: 'linear-gradient(135deg, rgba(83,74,183,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(83,74,183,0.12)' }, children: [_jsx("div", { className: "small text-uppercase fw-bold", style: { letterSpacing: '0.08em', color: 'var(--folio-primary)' }, children: "Disponible \u00E0 partir du" }), _jsx("div", { className: "display-6 fw-bold text-title mt-2", children: "12 Novembre" })] }), _jsx("p", { className: "text-title fw-semibold mb-2", children: "Un espace blog pens\u00E9 pour les freelancers" }), _jsx("p", { className: "mb-3 text-body-custom", children: "Blog Max permettra aux freelancers d\u2019avoir un espace blog pour publier des articles, partager leur expertise et mieux propulser leur activit\u00E9." }), _jsx("p", { className: "mb-0 text-body-custom", children: "Ils pourront aussi discuter directement avec leurs clients sur le site, sans jamais quitter la plateforme." })] }), _jsx("div", { className: "modal-footer border-0 px-4 pb-4 pt-0", children: _jsx("button", { type: "button", className: "btn btn-primary-custom w-100", onClick: () => setShowBlogMaxModal(false), children: "Fermer" }) })] }) }) }))), showBoostContactsSheet && (_jsx("div", { className: "mobile-bottom-sheet-overlay", onClick: (event) => { if (event.target === event.currentTarget)
                    setShowBoostContactsSheet(false); }, children: _jsxs("div", { className: "mobile-bottom-sheet dashboard-contacts-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "boost-contacts-sheet-title", children: [_jsxs("div", { className: "mobile-bottom-sheet-header", children: [_jsx("h2", { id: "boost-contacts-sheet-title", className: "h5 font-serif fw-bold text-title mb-0", children: "Tes prospects" }), _jsx("button", { type: "button", className: "btn btn-link p-0 text-muted", onClick: () => setShowBoostContactsSheet(false), "aria-label": "Fermer", children: _jsx("i", { className: "bi bi-x-lg" }) })] }), _jsx(BoostContactsList, { contacts: boostContacts, details: boostDetails, userId: userData.id, instanceId: "mobile" })] }) }))] }));
}
function SeoResultsPanel({ portfolioUrl, profileData, details }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const portfolioHost = portfolioUrl?.replace(/^https?:\/\//, '').replace(/\/.*$/, '') || '';
    const profession = profileData?.profession || details?.secteur || 'professionnel du digital';
    const analyzePortfolio = async () => {
        if (!portfolioUrl)
            return;
        setLoading(true);
        setError('');
        const { data, error: analysisError } = await supabase.functions.invoke('analyze-portfolio', {
            body: { portfolioUrl, name: profileData?.nom_complet, profession },
        });
        if (analysisError || data?.error) {
            let providerMessage = data?.error;
            if (!providerMessage && analysisError?.context?.json) {
                try {
                    const responseBody = await analysisError.context.json();
                    providerMessage = responseBody?.message || responseBody?.error;
                }
                catch {
                }
            }
            const rawMessage = providerMessage || analysisError?.message || '';
            setError(rawMessage.includes('not found') || rawMessage.includes('Failed to send')
                ? "L'analyse SEO n'est pas encore activée sur le serveur. La fonction Edge analyze-portfolio doit être déployée dans Supabase."
                : rawMessage || 'Analyse impossible pour le moment.');
        }
        else {
            setAnalysis(data);
        }
        setLoading(false);
    };
    useEffect(() => {
        analyzePortfolio();
    }, [portfolioUrl]);
    const metrics = analysis?.metrics;
    const seoCode = analysis?.headCode || '';
    return (_jsxs("div", { className: "dashboard-panel bg-white rounded-3 p-4 mt-3", style: { border: '1px solid rgba(38, 33, 92, 0.08)' }, children: [_jsxs("div", { className: "d-flex align-items-start justify-content-between gap-2 mb-3", children: [_jsxs("div", { children: [_jsxs("h6", { className: "font-serif mb-1", style: { color: 'var(--folio-title)' }, children: [_jsx("i", { className: "bi bi-bar-chart-line me-2", style: { color: 'var(--folio-primary)' } }), "Analyse SEO"] }), _jsxs("p", { className: "small text-muted mb-0", children: ["Analyse r\u00E9elle de ", portfolioHost, " et recommandations personnalis\u00E9es."] })] }), analysis && _jsxs("span", { className: "badge text-bg-success", children: ["Score ", analysis.score, "/100"] })] }), loading && _jsxs("div", { className: "text-center py-4", children: [_jsx("span", { className: "spinner-border spinner-border-sm text-primary me-2" }), "Analyse du portfolio en cours..."] }), error && _jsxs("div", { className: "alert alert-warning py-2 px-3 small", children: [_jsx("i", { className: "bi bi-exclamation-triangle me-1" }), error] }), metrics && _jsxs("div", { className: "row g-2 mb-3", children: [_jsx("div", { className: "col-6", children: _jsxs("div", { className: "p-2 rounded-2", style: { backgroundColor: '#F4F1FE' }, children: [_jsx("div", { className: "small text-muted", children: "Titre" }), _jsx("strong", { className: "text-title", children: metrics.title ? 'Présent' : 'Absent' })] }) }), _jsx("div", { className: "col-6", children: _jsxs("div", { className: "p-2 rounded-2", style: { backgroundColor: '#E8F5EC' }, children: [_jsx("div", { className: "small text-muted", children: "Description" }), _jsx("strong", { className: "text-title", children: metrics.description ? `${metrics.description.length} caractères` : 'Absente' })] }) }), _jsx("div", { className: "col-6", children: _jsxs("div", { className: "p-2 rounded-2", style: { backgroundColor: '#FFF7E6' }, children: [_jsx("div", { className: "small text-muted", children: "H1 / images sans alt" }), _jsxs("strong", { className: "text-title", children: [metrics.h1Count, " / ", metrics.imagesWithoutAlt] })] }) }), _jsx("div", { className: "col-6", children: _jsxs("div", { className: "p-2 rounded-2", style: { backgroundColor: '#EEF1FB' }, children: [_jsx("div", { className: "small text-muted", children: "Contenu visible" }), _jsxs("strong", { className: "text-title", children: [metrics.textLength, " caract\u00E8res"] })] }) })] }), analysis?.recommendations?.length > 0 && _jsx("ul", { className: "small text-body-custom ps-3 mb-3", children: analysis.recommendations.map((recommendation) => _jsx("li", { children: recommendation }, recommendation)) }), analysis && !analysis.recommendations?.length && _jsxs("p", { className: "small text-success", children: [_jsx("i", { className: "bi bi-check-circle me-1" }), "Aucune am\u00E9lioration prioritaire d\u00E9tect\u00E9e."] }), _jsxs("label", { className: "small text-muted fw-semibold mb-1", htmlFor: "seo-head-code", children: ["Code \u00E0 coller dans le <head> de ", portfolioHost] }), _jsx("textarea", { id: "seo-head-code", className: "form-control font-monospace small", rows: "6", readOnly: true, value: seoCode || 'Le code apparaîtra après l’analyse.', onFocus: (event) => event.target.select() }), _jsxs("div", { className: "d-flex justify-content-between align-items-center gap-2 mt-2", children: [_jsxs("p", { className: "small text-muted mb-0", children: [_jsx("i", { className: "bi bi-info-circle me-1" }), "Colle ce code dans le <head> de ta page HTML."] }), _jsxs("button", { type: "button", className: "btn btn-sm btn-outline-custom flex-shrink-0", onClick: analyzePortfolio, disabled: loading, children: [_jsx("i", { className: "bi bi-arrow-clockwise me-1" }), "Analyser"] })] })] }));
}
function SearchDetectionModal({ stats, onRefresh, onClose }) {
    const totalSearches = stats.reduce((sum, item) => sum + Number(item.search_count || 0), 0);
    return (_jsx("div", { className: "modal fade show d-block", tabIndex: "-1", role: "dialog", style: { backgroundColor: 'rgba(38, 33, 92, 0.45)', backdropFilter: 'blur(4px)', zIndex: 2050 }, onClick: (event) => { if (event.target === event.currentTarget)
            onClose(); }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered", role: "document", children: _jsxs("div", { className: "modal-content border-0 shadow", style: { borderRadius: '16px' }, children: [_jsxs("div", { className: "modal-header border-0 pb-0 px-4 pt-4", children: [_jsxs("h5", { className: "modal-title font-serif fw-bold text-title", children: [_jsx("i", { className: "bi bi-search me-2" }), "D\u00E9tection de recherche"] }), _jsx("button", { type: "button", className: "btn-close", onClick: onClose, "aria-label": "Fermer" })] }), _jsxs("div", { className: "modal-body px-4 py-4", children: [_jsxs("div", { className: "rounded-3 p-3 mb-3", style: { backgroundColor: '#F4F1FE' }, children: [_jsx("div", { className: "small text-muted", children: "Personnes estim\u00E9es ayant recherch\u00E9 tes profils" }), _jsx("div", { className: "display-6 fw-bold text-title", children: totalSearches }), _jsx("div", { className: "small text-muted", children: "Mise \u00E0 jour en temps r\u00E9el \u00E0 chaque recherche enregistr\u00E9e." })] }), stats.length ? (_jsx("div", { className: "list-group list-group-flush", children: stats.map((item) => (_jsxs("div", { className: "list-group-item px-0 d-flex justify-content-between align-items-center", children: [_jsxs("div", { children: [_jsx("strong", { className: "text-title", children: item.profession || 'Métier non précisé' }), _jsxs("div", { className: "small text-muted", children: ["Recherche : \u201C", item.search_query, "\u201D"] })] }), _jsx("span", { className: "badge rounded-pill text-bg-primary", children: item.search_count })] }, `${item.profession}-${item.search_query}`))) })) : _jsx("p", { className: "text-muted small mb-0", children: "Aucune recherche enregistr\u00E9e pour le moment. Les r\u00E9sultats appara\u00EEtront quand un visiteur cherchera ton nom ou ton m\u00E9tier." })] }), _jsxs("div", { className: "modal-footer border-0 px-4 pb-4", children: [_jsxs("button", { type: "button", className: "btn btn-outline-custom", onClick: onRefresh, children: [_jsx("i", { className: "bi bi-arrow-clockwise me-1" }), "Actualiser"] }), _jsx("button", { type: "button", className: "btn btn-primary-custom", onClick: onClose, children: "Fermer" })] })] }) }) }));
}
function VerificationModal({ userData, profileData, onRefreshProfile, onOpenRecharge, triggerFireworks, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const isVerified = Boolean(profileData?.is_verified &&
        profileData?.verified_until &&
        new Date(profileData.verified_until) > new Date());
    const handleSubscribe = async () => {
        setLoading(true);
        setError(null);
        const solde = Number(profileData?.solde || 0);
        if (solde < 500) {
            setError("Solde insuffisant ! Vous disposez de " + solde.toLocaleString('fr-FR') + " F CFA. Il vous faut au moins 500 F CFA pour activer le badge.");
            setLoading(false);
            return;
        }
        try {
            const { data, error: rpcError } = await supabase.rpc('subscribe_verification_badge', {
                target_user_id: userData.id
            });
            if (rpcError) {
                const currentExp = profileData?.verified_until && new Date(profileData.verified_until) > new Date()
                    ? new Date(profileData.verified_until)
                    : new Date();
                currentExp.setDate(currentExp.getDate() + 30);
                const { error: updateError } = await supabase
                    .from('profils')
                    .update({
                    solde: solde - 500,
                    is_verified: true,
                    verified_until: currentExp.toISOString()
                })
                    .eq('id', userData.id);
                if (updateError)
                    throw updateError;
            }
            else if (data && !data.success) {
                throw new Error(data.message);
            }
            setSuccessMsg("Votre Badge de vérification est maintenant actif pour 30 jours !");
            await onRefreshProfile();
            triggerFireworks();
        }
        catch (err) {
            console.error("Erreur d'activation du badge:", err);
            setError(err?.message || "Une erreur est survenue lors de l'activation.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "modal fade show d-block", tabIndex: "-1", role: "dialog", style: { backgroundColor: 'rgba(38, 33, 92, 0.45)', backdropFilter: 'blur(4px)', zIndex: 1050 }, onClick: (e) => { if (e.target === e.currentTarget && !loading)
            onClose(); }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered", role: "document", children: _jsxs("div", { className: "modal-content border-0 shadow", style: { borderRadius: '16px', overflow: 'hidden' }, children: [_jsxs("div", { className: "modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center", children: [_jsxs("h5", { className: "modal-title font-serif fw-bold fs-4 text-title d-flex align-items-center gap-2", children: [_jsx("img", { src: verifieBadge, alt: "Badge", style: { width: '28px', height: '28px', objectFit: 'contain' } }), "Badge de v\u00E9rification"] }), _jsx("button", { type: "button", className: "btn-close", onClick: onClose, "aria-label": "Fermer", disabled: loading })] }), _jsx("div", { className: "modal-body py-4 px-4", children: successMsg ? (_jsxs("div", { className: "text-center py-3", children: [_jsx("i", { className: "bi bi-patch-check-fill text-success", style: { fontSize: '3.5rem' } }), _jsx("h4", { className: "font-serif fw-bold text-title mt-2", children: "F\u00E9licitations !" }), _jsx("p", { className: "text-body-custom", children: successMsg }), _jsx("p", { className: "small text-muted mb-4", children: "Le badge s'affiche d\u00E9sormais \u00E0 c\u00F4t\u00E9 de votre nom et sur tous vos profils freelancers." }), _jsx("button", { type: "button", className: "btn btn-primary-custom w-100", onClick: onClose, children: "Fermer" })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "text-center mb-4 p-3 rounded-3", style: { backgroundColor: '#F4F1FE' }, children: [_jsx("img", { src: isVerified && profileData?.badge_color === 'orange' ? orangeBadge : verifieBadge, alt: "V\u00E9rifi\u00E9", className: "mb-2 shadow-sm rounded-circle p-1 bg-white", style: { width: '64px', height: '64px', objectFit: 'contain' } }), _jsx("h6", { className: "fw-bold text-title mb-1", children: "Certifiez votre identit\u00E9 sur Folio" }), _jsx("p", { className: "small text-muted mb-0", children: "Le badge de v\u00E9rification renforce la confiance des clients et augmente vos opportunit\u00E9s." })] }), _jsxs("div", { className: "border rounded-3 p-3 mb-4 bg-white", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [_jsx("span", { className: "text-body-custom", children: "Tarif mensuel" }), _jsx("strong", { className: "fs-5 text-primary", children: "500 F CFA / mois" })] }), _jsxs("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [_jsx("span", { className: "text-body-custom", children: "Votre solde actuel" }), _jsxs("strong", { className: Number(profileData?.solde || 0) >= 500 ? 'text-success' : 'text-danger', children: [Number(profileData?.solde || 0).toLocaleString('fr-FR'), " F CFA"] })] }), _jsxs("div", { className: "d-flex justify-content-between align-items-center", children: [_jsx("span", { className: "text-body-custom", children: "Port\u00E9e du badge" }), _jsx("span", { className: "badge text-bg-light border", children: "Par utilisateur (tous profils)" })] })] }), isVerified && (_jsxs("div", { className: "alert alert-success py-2 px-3 small mb-3", children: [_jsx("i", { className: "bi bi-check-circle-fill me-2" }), "Votre badge est actuellement actif jusqu'au ", new Date(profileData.verified_until).toLocaleDateString('fr-FR'), ". Cliquez ci-dessous pour prolonger de 30 jours suppl\u00E9mentaires."] })), error && (_jsxs("div", { className: "alert alert-danger py-2 px-3 small mb-3", children: [_jsx("i", { className: "bi bi-exclamation-triangle-fill me-2" }), error, Number(profileData?.solde || 0) < 500 && (_jsx("div", { className: "mt-2", children: _jsxs("button", { type: "button", className: "btn btn-sm btn-primary-custom", onClick: () => { onClose(); onOpenRecharge(); }, children: [_jsx("i", { className: "bi bi-wallet2 me-1" }), "Recharger mon solde"] }) }))] })), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { type: "button", className: "btn btn-outline-custom w-50 py-2", onClick: onClose, disabled: loading, children: "Annuler" }), _jsxs("button", { type: "button", className: "btn btn-primary-custom w-50 py-2", onClick: handleSubscribe, disabled: loading, children: [loading ? _jsx("span", { className: "spinner-border spinner-border-sm me-2" }) : _jsx("i", { className: "bi bi-patch-check me-1" }), isVerified ? 'Prolonger (500 F)' : 'Activer (500 F)'] })] })] })) })] }) }) }));
}
const PACKS = [
    { id: 'test', label: 'Mode Débutant', title: 'Mode Débutant', desc: 'Accès de test aux fonctionnalités premium', amount: 500 },
    { id: 'starter', label: 'Mode Starter', title: 'Mode Starter', desc: 'SEO portfolio et traqueur de clics', amount: 800 },
    { id: 'pro', label: 'Mode Boost', title: 'Mode Boost', desc: 'Recommandations et prospection', amount: 15000 },
];
const FALLBACK_PAYMENT_COUNTRIES = [
    {
        code: 'CI',
        name: "Côte d'Ivoire",
        networks: [
            { value: 'mtn_ci', label: "MTN Côte d'Ivoire" },
            { value: 'orange_ci', label: "Orange Côte d'Ivoire" },
            { value: 'moov_ci', label: 'Moov Money Côte d’Ivoire' },
            { value: 'wave_ci', label: 'Wave Côte d’Ivoire' },
        ],
    },
    {
        code: 'BJ',
        name: 'Bénin',
        networks: [
            { value: 'mtn_bj', label: 'MTN Bénin' },
            { value: 'moov_bj', label: 'Moov Money Bénin' },
        ],
    },
    {
        code: 'SN',
        name: 'Sénégal',
        networks: [
            { value: 'orange_sn', label: 'Orange Sénégal' },
            { value: 'wave_sn', label: 'Wave Sénégal' },
            { value: 'free_sn', label: 'Free Money Sénégal' },
        ],
    },
    {
        code: 'TG',
        name: 'Togo',
        networks: [
            { value: 'togocel_tg', label: 'Togocel Togo' },
            { value: 'moov_tg', label: 'Moov Money Togo' },
        ],
    },
    {
        code: 'CM',
        name: 'Cameroun',
        networks: [
            { value: 'mtn_cm', label: 'MTN Cameroun' },
            { value: 'orange_cm', label: 'Orange Cameroun' },
        ],
    },
    {
        code: 'BF',
        name: 'Burkina Faso',
        networks: [
            { value: 'orange_bf', label: 'Orange Money Burkina Faso' },
            { value: 'moov_bf', label: 'Moov Money Burkina Faso' },
        ],
    },
    {
        code: 'ML',
        name: 'Mali',
        networks: [
            { value: 'orange_ml', label: 'Orange Money Mali' },
            { value: 'moov_ml', label: 'Moov Money Mali' },
        ],
    },
    {
        code: 'NE',
        name: 'Niger',
        networks: [
            { value: 'airtel_ne', label: 'Airtel Money Niger' },
            { value: 'moov_ne', label: 'Moov Money Niger' },
        ],
    },
    {
        code: 'CD',
        name: 'République démocratique du Congo',
        networks: [
            { value: 'airtel_cd', label: 'Airtel Money RDC' },
            { value: 'orange_cd', label: 'Orange Money RDC' },
            { value: 'vodacom_cd', label: 'Vodacom M-Pesa RDC' },
        ],
    },
];
const normalizePaymentCountries = (payload) => {
    const entries = Array.isArray(payload)
        ? payload
        : payload?.countries || payload?.data || payload?.results || [];
    return entries.map((entry) => {
        const code = entry.code || entry.country_code || entry.iso_code || entry.country?.code;
        const rawNetworks = entry.networks || entry.operators || entry.methods || entry.payment_methods || [];
        const networkEntries = Array.isArray(rawNetworks)
            ? rawNetworks
            : Object.entries(rawNetworks).map(([value, label]) => ({ value, label }));
        const networks = networkEntries.map((item) => {
            if (typeof item === 'string')
                return { value: item, label: item };
            const value = item.code || item.value || item.id || item.slug;
            return { value, label: item.name || item.label || item.display_name || value };
        }).filter((item) => item.value);
        return {
            code,
            name: entry.name || entry.country_name || entry.country?.name || code,
            currency: entry.currency || entry.currency_code || entry.country?.currency || null,
            networks,
        };
    }).filter((item) => item.code && item.networks.length > 0);
};
const COUNTRY_CURRENCIES = {
    CI: 'XOF', BJ: 'XOF', SN: 'XOF', TG: 'XOF', BF: 'XOF', ML: 'XOF', NE: 'XOF',
    CM: 'XAF', GA: 'XAF', TD: 'XAF', CD: 'CDF', NG: 'NGN', MA: 'MAD',
};
const mergePaymentCountries = (remoteCountries) => {
    const countriesByCode = new Map(FALLBACK_PAYMENT_COUNTRIES.map((item) => [item.code, item]));
    remoteCountries.forEach((item) => countriesByCode.set(item.code, item));
    return Array.from(countriesByCode.values());
};
function RechargeModal({ userData, profileData, onPaymentConfirmed, onClose }) {
    const [selectedPack, setSelectedPack] = useState(null);
    const [paymentStep, setPaymentStep] = useState(1);
    const [paymentCountries, setPaymentCountries] = useState(FALLBACK_PAYMENT_COUNTRIES);
    const [country, setCountry] = useState('CI');
    const [phone, setPhone] = useState(profileData?.whatsapp || '');
    const [network, setNetwork] = useState('mtn_ci');
    const [loading, setLoading] = useState(false);
    const [networksLoading, setNetworksLoading] = useState(true);
    const [error, setError] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('idle');
    const selectedCountry = paymentCountries.find((item) => item.code === country) || paymentCountries[0];
    const selectedCurrency = selectedCountry?.currency || COUNTRY_CURRENCIES[selectedCountry?.code] || 'XOF';
    useEffect(() => {
        let active = true;
        const loadPaymentCountries = async () => {
            const { data, error: networksError } = await supabase.functions.invoke('saspay-networks');
            const countries = normalizePaymentCountries(data);
            if (!active)
                return;
            if (!networksError && countries.length > 0) {
                const availableCountries = mergePaymentCountries(countries);
                setPaymentCountries(availableCountries);
                const firstCountry = availableCountries.find((item) => item.code === country) || availableCountries[0];
                setCountry(firstCountry.code);
                setNetwork(firstCountry.networks[0].value);
            }
            setNetworksLoading(false);
        };
        loadPaymentCountries();
        return () => { active = false; };
    }, []);
    const handleCountryChange = (event) => {
        const nextCountry = paymentCountries.find((item) => item.code === event.target.value) || paymentCountries[0];
        setCountry(nextCountry.code);
        setNetwork(nextCountry.networks[0].value);
        setError(null);
    };
    const waitForPayment = (paymentId) => new Promise((resolve) => {
        const completedStatuses = ['completed', 'success', 'succeeded', 'successful', 'paid', 'payment_success'];
        const failedStatuses = ['failed', 'failure', 'cancelled', 'canceled', 'payment_failed'];
        let settled = false;
        let channel;
        let timeoutId;
        const cleanup = () => {
            if (timeoutId)
                window.clearTimeout(timeoutId);
            if (channel)
                void supabase.removeChannel(channel);
        };
        const finish = async (status) => {
            if (settled || !status || status === 'pending')
                return;
            settled = true;
            cleanup();
            if (completedStatuses.includes(status)) {
                await onPaymentConfirmed();
                setPaymentStatus('success');
                setLoading(false);
                resolve(true);
                return;
            }
            if (failedStatuses.includes(status)) {
                setPaymentStatus('failed');
                setError('Le paiement a été refusé ou annulé. Aucun montant n’a été ajouté à ton solde.');
                setLoading(false);
                resolve(false);
            }
        };
        const transactionStatus = async () => {
            const { data, error: transactionError } = await supabase
                .from('payment_transactions')
                .select('status')
                .eq('provider_reference', paymentId)
                .eq('user_id', userData.id)
                .maybeSingle();
            if (!transactionError && data?.status)
                await finish(String(data.status).toLowerCase());
        };
        channel = supabase
            .channel(`payment-${paymentId}`)
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'payment_transactions',
            filter: `provider_reference=eq.${paymentId}`,
        }, (payload) => {
            void finish(String(payload.new?.status || '').toLowerCase());
        })
            .subscribe();
        void transactionStatus();
        timeoutId = window.setTimeout(async () => {
            if (settled)
                return;
            await transactionStatus();
            if (settled)
                return;
            settled = true;
            cleanup();
            setLoading(false);
            setPaymentStatus('pending');
            setError('Le paiement a bien été envoyé à SasPay, mais sa confirmation prend plus de temps que prévu. Ne relance pas le paiement : ton solde sera crédité dès la confirmation.');
            resolve(false);
        }, 120000);
    });
    const handlePayment = async () => {
        if (!selectedPack)
            return;
        if (selectedPack.amount < 200) {
            setError('Le montant minimum de recharge est de 200 F CFA.');
            return;
        }
        if (!country || !network) {
            setError('Veuillez choisir votre pays et votre moyen de paiement.');
            return;
        }
        if (!phone.trim()) {
            setError('Veuillez entrer votre numéro de téléphone mobile money.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const orderId = `FOLIO-${userData.id.substring(0, 8)}-${Date.now()}`;
            const nameParts = (userData.nom_complet || 'Utilisateur Folio').trim().split(/\s+/);
            const { data, error: fnError } = await supabase.functions.invoke('saspay-init-payment', {
                body: {
                    amount: selectedPack.amount.toFixed(2),
                    currency: selectedCurrency,
                    country,
                    network,
                    description: `Folio ${selectedPack.label} — ${selectedPack.title}`,
                    customer: {
                        email: userData.email,
                        first_name: nameParts[0] || 'Utilisateur',
                        last_name: nameParts.slice(1).join(' ') || 'Folio',
                        phone: phone.trim(),
                    },
                    orderId,
                    userId: userData.id,
                },
            });
            if (fnError) {
                console.error('Supabase function error:', fnError);
                let providerError = data?.error?.message || data?.message;
                if (!providerError && fnError.context?.json) {
                    try {
                        const errorBody = await fnError.context.json();
                        providerError = errorBody?.error?.message || errorBody?.message;
                    }
                    catch {
                    }
                }
                if (providerError?.includes('no_route_available') || providerError?.toLowerCase().includes('aucun fournisseur disponible')) {
                    providerError = 'Ce moyen de paiement est temporairement indisponible chez SasPay. Choisis un autre réseau puis réessaie.';
                }
                if (providerError?.toLowerCase().includes('passerelle') || providerError?.toLowerCase().includes('bad gateway')) {
                    providerError = 'SasPay est temporairement indisponible. Réessaie dans quelques instants ou choisis un autre réseau.';
                }
                setError(providerError
                    ? `Erreur SasPay : ${providerError}`
                    : `Erreur réseau : ${fnError.message || 'Impossible de joindre le serveur.'}`);
                return;
            }
            if (data?.error) {
                console.error('SasPay API error:', data.error);
                setError(`Erreur SasPay : ${data.error.message || JSON.stringify(data.error)}`);
                return;
            }
            const checkoutUrl = data?.checkout_url;
            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            }
            else if (data?.payment_reference) {
                setPaymentStatus('pending');
                await waitForPayment(data.payment_reference);
            }
            else {
                setError('Le paiement a été envoyé, mais SasPay n’a pas fourni de référence pour suivre sa confirmation.');
            }
        }
        catch (err) {
            console.error('Payment error:', err);
            setError(`Erreur inattendue : ${err.message}`);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "modal fade show d-block", tabIndex: "-1", role: "dialog", style: { backgroundColor: 'rgba(38, 33, 92, 0.45)', backdropFilter: 'blur(4px)', zIndex: 1050 }, onClick: (e) => { if (e.target === e.currentTarget && !loading)
            onClose(); }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered", role: "document", children: _jsxs("div", { className: "modal-content border-0 shadow", style: { borderRadius: '16px', overflow: 'hidden' }, children: [_jsxs("div", { className: "modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center", children: [_jsx("h5", { className: "modal-title font-serif fw-bold fs-4 text-title", children: "Recharger mon compte" }), _jsx("button", { type: "button", className: "btn-close", onClick: onClose, "aria-label": "Fermer", disabled: loading })] }), _jsxs("div", { className: "modal-body py-4 px-4", children: [paymentStatus === 'success' ? (_jsxs("div", { className: "text-center py-4", children: [_jsx("i", { className: "bi bi-check-circle-fill text-success", style: { fontSize: '4rem' } }), _jsx("h4", { className: "font-serif fw-bold text-title mt-3", children: "Paiement r\u00E9ussi" }), _jsx("p", { className: "text-body-custom mb-2", children: "Ton compte a \u00E9t\u00E9 recharg\u00E9 avec succ\u00E8s." }), _jsxs("p", { className: "fw-bold text-success mb-4", children: ["+", selectedPack?.amount.toLocaleString('fr-FR'), " F CFA ajout\u00E9s \u00E0 ton solde"] }), _jsx("button", { type: "button", className: "btn btn-primary-custom w-100", onClick: onClose, children: "Fermer" })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-body-custom mb-4", style: { fontSize: '0.95rem' }, children: paymentStep === 1
                                            ? 'Choisis ton forfait pour recharger ton solde.'
                                            : 'Renseigne tes informations Mobile Money pour lancer le paiement.' }), _jsxs("div", { className: "d-flex align-items-center gap-2 mb-4", "aria-label": "\u00C9tapes du paiement", children: [_jsx("span", { className: `badge rounded-pill ${paymentStep === 1 ? 'text-bg-primary' : 'text-bg-success'}`, children: "1. Forfait" }), _jsx("div", { className: "flex-grow-1 border-top" }), _jsx("span", { className: `badge rounded-pill ${paymentStep === 2 ? 'text-bg-primary' : 'text-bg-secondary'}`, children: "2. Paiement" })] }), paymentStep === 1 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "d-flex flex-column gap-3 mb-4", children: PACKS.map((pack) => {
                                                    const isSelected = selectedPack?.id === pack.id;
                                                    return (_jsxs("button", { type: "button", className: "p-3 rounded-3 d-flex justify-content-between align-items-center text-start", style: {
                                                            border: isSelected ? '2px solid var(--folio-primary)' : '1.5px solid rgba(38,33,92,0.12)',
                                                            backgroundColor: isSelected ? '#F8F7FF' : 'white',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease',
                                                        }, onClick: () => { setSelectedPack(pack); setError(null); }, children: [_jsxs("span", { children: [_jsx("span", { className: "badge mb-1", style: { backgroundColor: isSelected ? 'var(--folio-primary)' : '#6c757d', color: 'white', fontSize: '0.75rem' }, children: pack.label }), _jsx("strong", { className: "d-block text-title", children: pack.title }), _jsx("small", { className: "text-muted d-block", children: pack.desc })] }), _jsxs("span", { className: "d-flex align-items-center gap-2", children: [_jsxs("strong", { className: "fs-5", style: { color: isSelected ? 'var(--folio-primary)' : 'var(--folio-title)' }, children: [pack.amount.toLocaleString('fr-FR'), " F"] }), isSelected && _jsx("i", { className: "bi bi-check-circle-fill", style: { color: 'var(--folio-primary)' } })] })] }, pack.id));
                                                }) }), _jsxs("button", { type: "button", className: "btn btn-primary-custom w-100 py-2", onClick: () => setPaymentStep(2), disabled: !selectedPack, children: ["Suivant ", _jsx("i", { className: "bi bi-arrow-right ms-2" })] })] })), paymentStep === 2 && (_jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "form-label text-body-custom small fw-medium", children: [_jsx("i", { className: "bi bi-globe2 me-1" }), "Pays"] }), _jsx("select", { className: "form-select", value: country, onChange: handleCountryChange, disabled: loading || networksLoading, children: paymentCountries.map((item) => _jsx("option", { value: item.code, children: item.name }, item.code)) }), networksLoading && _jsx("small", { className: "text-muted d-block mt-1", children: "Chargement des pays et moyens disponibles..." }), _jsxs("label", { className: "form-label text-body-custom small fw-medium mt-3", children: [_jsx("i", { className: "bi bi-phone me-1" }), "Num\u00E9ro Mobile Money"] }), _jsx("input", { type: "tel", className: "form-control", placeholder: country === 'CI' ? '+225 01 02 03 04 05' : 'Ton numéro Mobile Money', value: phone, onChange: (e) => { setPhone(e.target.value); setError(null); }, disabled: loading }), _jsxs("label", { className: "form-label text-body-custom small fw-medium mt-3", children: [_jsx("i", { className: "bi bi-wallet2 me-1" }), "Moyen de paiement"] }), _jsx("select", { className: "form-select", value: network, onChange: (e) => setNetwork(e.target.value), disabled: loading, children: selectedCountry.networks.map((item) => _jsx("option", { value: item.value, children: item.label }, item.value)) })] }))] })), error && (_jsxs("div", { className: "alert alert-danger py-2 px-3 mb-3", style: { fontSize: '0.85rem', borderRadius: '10px' }, children: [_jsx("i", { className: "bi bi-exclamation-triangle me-2" }), error] })), paymentStep === 2 && (_jsxs("div", { className: "d-flex gap-2", children: [_jsxs("button", { type: "button", className: "btn btn-outline-custom py-2", onClick: () => { setPaymentStep(1); setError(null); }, disabled: loading, children: [_jsx("i", { className: "bi bi-arrow-left me-1" }), "Retour"] }), _jsx("button", { type: "button", className: "btn btn-primary-custom flex-grow-1 py-2 font-sans", onClick: handlePayment, disabled: !selectedPack || !phone.trim() || loading, style: { fontSize: '1rem' }, children: _jsxs("span", { className: "d-inline-flex align-items-center justify-content-center", children: [loading ? _jsx("span", { className: "spinner-border spinner-border-sm me-2", role: "status", "aria-hidden": "true" }) : _jsx("i", { className: "bi bi-wallet2 me-2" }), _jsx("span", { children: loading ? 'Redirection en cours...' : `Payer ${selectedPack.amount.toLocaleString('fr-FR')} F CFA` })] }) })] }))] })] }) }) }));
}
function PortfolioOptimizationModal({ userId, initialData, onClose, onComplete }) {
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [dnsStatus, setDnsStatus] = useState('idle');
    const [dnsMessage, setDnsMessage] = useState('');
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
        if (field === 'portfolio_url') {
            setDnsStatus('idle');
            setDnsMessage('');
        }
    };
    const startsWithHttps = (value) => value.trim().length === 0 || /^https?:\/\//.test(value);
    const sanitizeWhatsApp = (value) => value.replace(/[^\d\s+]/g, '');
    const verifyPortfolioDns = async () => {
        let hostname;
        try {
            const url = new URL(formData.portfolio_url.trim());
            hostname = url.hostname;
            if (!hostname || hostname === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
                throw new Error('Le lien doit utiliser un nom de domaine public.');
            }
        }
        catch {
            setDnsStatus('invalid');
            setDnsMessage('Entre une URL valide avec un nom de domaine public.');
            return false;
        }
        setDnsStatus('checking');
        setDnsMessage('Vérification du domaine en cours...');
        try {
            const answers = await Promise.all(['A', 'AAAA', 'CNAME'].map(async (recordType) => {
                const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=${recordType}`, {
                    headers: { Accept: 'application/dns-json' },
                });
                if (!response.ok)
                    throw new Error('Le service DNS est indisponible.');
                const result = await response.json();
                return result.Answer || [];
            }));
            if (!answers.some((records) => records.length > 0)) {
                setDnsStatus('invalid');
                setDnsMessage('Ce domaine ne possède aucun enregistrement DNS public. Vérifie l’adresse saisie.');
                return false;
            }
            setDnsStatus('valid');
            setDnsMessage('Domaine trouvé. Le lien peut être utilisé.');
            return true;
        }
        catch (error) {
            setDnsStatus('invalid');
            setDnsMessage(error.message || 'Impossible de vérifier le domaine pour le moment.');
            return false;
        }
    };
    const nextStep = async () => {
        if (step === 1) {
            if (!formData.portfolio_url.trim() || !startsWithHttps(formData.portfolio_url)) {
                alert('Veuillez entrer un lien de portfolio valide commençant par https://');
                return;
            }
            if (dnsStatus !== 'valid' && !(await verifyPortfolioDns()))
                return;
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
            if (error)
                throw error;
            onComplete();
        }
        catch (err) {
            console.error(err);
            alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const renderStep = () => {
        switch (step) {
            case 1:
                return (_jsxs("div", { className: "optim-step-enter", children: [_jsx("div", { className: "optim-dots mb-4", children: Array.from({ length: totalSteps }).map((_, i) => (_jsx("div", { className: `optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}` }, i))) }), _jsx("h3", { className: "font-serif fw-bold text-title mb-2", children: "Lien de ton portfolio" }), _jsx("p", { className: "text-body-custom mb-4", style: { fontSize: '0.9rem' }, children: "Colle le lien vers ton portfolio pour commencer l'optimisation." }), _jsx("label", { className: "optim-label", children: "URL du portfolio" }), _jsx("input", { type: "url", className: "optim-form-control", placeholder: "https://votreportfolio.com", value: formData.portfolio_url, onChange: (e) => updateField('portfolio_url', e.target.value), required: true }), _jsxs("div", { className: "d-flex align-items-start gap-2 mt-2 mb-4", role: "status", "aria-live": "polite", children: [dnsStatus === 'checking' ? (_jsx("span", { className: "spinner-border spinner-border-sm text-primary mt-1", role: "status", "aria-label": "V\u00E9rification DNS en cours" })) : (_jsx("i", { className: `bi ${dnsStatus === 'valid' ? 'bi-check-circle-fill text-success' : dnsStatus === 'invalid' ? 'bi-x-circle-fill text-danger' : 'bi-shield-check'}` })), _jsxs("div", { children: [_jsx("strong", { className: "d-block", style: { fontSize: '0.86rem' }, children: "V\u00E9rification DNS" }), _jsx("span", { className: "text-body-custom", style: { fontSize: '0.8rem' }, children: dnsMessage || 'Nous vérifions que le domaine existe avant de continuer.' })] })] }), _jsxs("button", { className: "optim-btn-primary", onClick: nextStep, disabled: !startsWithHttps(formData.portfolio_url) || dnsStatus === 'checking', children: [dnsStatus === 'checking' ? 'Vérification...' : 'Suivant', " ", dnsStatus !== 'checking' && _jsx("i", { className: "bi bi-arrow-right ms-2" })] })] }));
            case 2:
                return (_jsxs("div", { className: "optim-step-enter", children: [_jsx("div", { className: "optim-dots mb-4", children: Array.from({ length: totalSteps }).map((_, i) => (_jsx("div", { className: `optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}` }, i))) }), _jsx("h3", { className: "font-serif fw-bold text-title mb-2", children: "Profil GitHub" }), _jsx("p", { className: "text-body-custom mb-4", style: { fontSize: '0.9rem' }, children: "As-tu un profil GitHub ? Si oui, renseigne-le. Sinon, tu peux passer cette \u00E9tape." }), _jsxs("div", { className: "d-flex gap-2 mb-3", children: [_jsx("button", { className: `optim-btn-outline flex-grow-1 ${!formData.has_github ? 'optim-btn-primary' : ''}`, onClick: () => { updateField('has_github', false); updateField('github_url', ''); }, children: "Non, passer" }), _jsx("button", { className: `optim-btn-outline flex-grow-1 ${formData.has_github ? 'optim-btn-primary' : ''}`, onClick: () => updateField('has_github', true), children: "Oui" })] }), formData.has_github && (_jsxs(_Fragment, { children: [_jsx("label", { className: "optim-label", children: "URL GitHub" }), _jsx("input", { type: "url", className: "optim-form-control mb-4", placeholder: "https://github.com/tonprofil", value: formData.github_url, onChange: (e) => updateField('github_url', e.target.value) })] })), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { className: "optim-btn-outline", onClick: prevStep, children: "Pr\u00E9c\u00E9dent" }), _jsxs("button", { className: "optim-btn-primary", onClick: nextStep, disabled: formData.has_github && !startsWithHttps(formData.github_url), children: ["Suivant ", _jsx("i", { className: "bi bi-arrow-right ms-2" })] })] })] }));
            case 3:
                return (_jsxs("div", { className: "optim-step-enter", children: [_jsx("div", { className: "optim-dots mb-4", children: Array.from({ length: totalSteps }).map((_, i) => (_jsx("div", { className: `optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}` }, i))) }), _jsx("h3", { className: "font-serif fw-bold text-title mb-2", children: "R\u00E9seaux sociaux" }), _jsx("p", { className: "text-body-custom mb-4", style: { fontSize: '0.9rem' }, children: "Ajoute au moins un profil sur Facebook, TikTok, YouTube ou LinkedIn." }), _jsx("label", { className: "optim-label", children: "Facebook" }), _jsx("input", { type: "url", className: "optim-form-control mb-3", placeholder: "https://facebook.com/tonprofil", value: formData.facebook_url, onChange: (e) => updateField('facebook_url', e.target.value) }), _jsx("label", { className: "optim-label", children: "TikTok" }), _jsx("input", { type: "url", className: "optim-form-control mb-3", placeholder: "https://tiktok.com/@tonprofil", value: formData.tiktok_url, onChange: (e) => updateField('tiktok_url', e.target.value) }), _jsx("label", { className: "optim-label", children: "YouTube" }), _jsx("input", { type: "url", className: "optim-form-control mb-3", placeholder: "https://youtube.com/@tonprofil", value: formData.youtube_url, onChange: (e) => updateField('youtube_url', e.target.value) }), _jsx("label", { className: "optim-label", children: "LinkedIn" }), _jsx("input", { type: "url", className: "optim-form-control mb-4", placeholder: "https://linkedin.com/in/tonprofil", value: formData.linkedin_url, onChange: (e) => updateField('linkedin_url', e.target.value) }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { className: "optim-btn-outline", onClick: prevStep, children: "Pr\u00E9c\u00E9dent" }), _jsxs("button", { className: "optim-btn-primary", onClick: nextStep, disabled: !['facebook_url', 'tiktok_url', 'youtube_url', 'linkedin_url'].some((key) => formData[key].trim().length > 0), children: ["Suivant ", _jsx("i", { className: "bi bi-arrow-right ms-2" })] })] })] }));
            case 4:
                return (_jsxs("div", { className: "optim-step-enter", children: [_jsx("div", { className: "optim-dots mb-4", children: Array.from({ length: totalSteps }).map((_, i) => (_jsx("div", { className: `optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}` }, i))) }), _jsx("h3", { className: "font-serif fw-bold text-title mb-2", children: "Description" }), _jsx("p", { className: "text-body-custom mb-4", style: { fontSize: '0.9rem' }, children: "R\u00E9dige une description de toi et de tes services (max 800 mots)." }), _jsx("label", { className: "optim-label", children: "Description" }), _jsx("textarea", { className: "optim-form-control mb-2", rows: "6", placeholder: "D\u00E9cris-toi, tes comp\u00E9tences, tes services...", value: formData.description, onChange: (e) => updateField('description', e.target.value), maxLength: 800 }), _jsxs("small", { className: "text-muted d-block mb-4", children: [formData.description.length, "/800 mots"] }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { className: "optim-btn-outline", onClick: prevStep, children: "Pr\u00E9c\u00E9dent" }), _jsxs("button", { className: "optim-btn-primary", onClick: nextStep, disabled: !formData.description.trim(), children: ["Suivant ", _jsx("i", { className: "bi bi-arrow-right ms-2" })] })] })] }));
            case 5:
                return (_jsxs("div", { className: "optim-step-enter", children: [_jsx("div", { className: "optim-dots mb-4", children: Array.from({ length: totalSteps }).map((_, i) => (_jsx("div", { className: `optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}` }, i))) }), _jsx("h3", { className: "font-serif fw-bold text-title mb-2", children: "Contact & Photo" }), _jsx("p", { className: "text-body-custom mb-4", style: { fontSize: '0.9rem' }, children: "Ajoute ton num\u00E9ro WhatsApp et le lien de ta photo de profil." }), _jsx("label", { className: "optim-label", children: "Num\u00E9ro WhatsApp" }), _jsx("input", { type: "tel", className: "optim-form-control mb-3", placeholder: "+221 77 000 00 00", value: formData.whatsapp, onChange: (e) => updateField('whatsapp', sanitizeWhatsApp(e.target.value)), required: true }), _jsx("label", { className: "optim-label", children: "Lien photo de profil" }), _jsx("input", { type: "url", className: "optim-form-control mb-4", placeholder: "https://votreportfolio.com/photo.jpg", value: formData.profile_photo_url, onChange: (e) => updateField('profile_photo_url', e.target.value), required: true }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { className: "optim-btn-outline", onClick: prevStep, children: "Pr\u00E9c\u00E9dent" }), _jsxs("button", { className: "optim-btn-primary", onClick: nextStep, disabled: !formData.whatsapp.trim() || !formData.profile_photo_url.trim(), children: ["Suivant ", _jsx("i", { className: "bi bi-arrow-right ms-2" })] })] })] }));
            case 6:
                return (_jsxs("div", { className: "optim-step-enter", children: [_jsx("div", { className: "optim-dots mb-4", children: Array.from({ length: totalSteps }).map((_, i) => (_jsx("div", { className: `optim-dot ${i + 1 === step ? 'active' : i + 1 < step ? 'done' : ''}` }, i))) }), _jsx("h3", { className: "font-serif fw-bold text-title mb-2", children: "R\u00E9capitulatif" }), _jsx("p", { className: "text-body-custom mb-4", style: { fontSize: '0.9rem' }, children: "V\u00E9rifie tes informations avant de valider." }), _jsxs("div", { className: "p-3 rounded-3 mb-4", style: { backgroundColor: '#FAFAFE', border: '1px solid rgba(38, 33, 92, 0.08)' }, children: [_jsxs("p", { className: "mb-2", children: [_jsx("strong", { children: "Portfolio:" }), " ", _jsx("a", { href: formData.portfolio_url, target: "_blank", rel: "noreferrer", style: { color: 'var(--folio-primary)' }, children: formData.portfolio_url })] }), formData.github_url && _jsxs("p", { className: "mb-2", children: [_jsx("strong", { children: "GitHub:" }), " ", _jsx("a", { href: formData.github_url, target: "_blank", rel: "noreferrer", style: { color: 'var(--folio-primary)' }, children: formData.github_url })] }), formData.facebook_url && _jsxs("p", { className: "mb-2", children: [_jsx("strong", { children: "Facebook:" }), " ", _jsx("a", { href: formData.facebook_url, target: "_blank", rel: "noreferrer", style: { color: 'var(--folio-primary)' }, children: formData.facebook_url })] }), formData.tiktok_url && _jsxs("p", { className: "mb-2", children: [_jsx("strong", { children: "TikTok:" }), " ", _jsx("a", { href: formData.tiktok_url, target: "_blank", rel: "noreferrer", style: { color: 'var(--folio-primary)' }, children: formData.tiktok_url })] }), formData.youtube_url && _jsxs("p", { className: "mb-2", children: [_jsx("strong", { children: "YouTube:" }), " ", _jsx("a", { href: formData.youtube_url, target: "_blank", rel: "noreferrer", style: { color: 'var(--folio-primary)' }, children: formData.youtube_url })] }), formData.linkedin_url && _jsxs("p", { className: "mb-2", children: [_jsx("strong", { children: "LinkedIn:" }), " ", _jsx("a", { href: formData.linkedin_url, target: "_blank", rel: "noreferrer", style: { color: 'var(--folio-primary)' }, children: formData.linkedin_url })] }), _jsxs("p", { className: "mb-2", children: [_jsx("strong", { children: "WhatsApp:" }), " ", formData.whatsapp] }), _jsxs("p", { className: "mb-0", children: [_jsx("strong", { children: "Photo:" }), " ", _jsx("a", { href: formData.profile_photo_url, target: "_blank", rel: "noreferrer", style: { color: 'var(--folio-primary)' }, children: formData.profile_photo_url })] })] }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { className: "optim-btn-outline", onClick: prevStep, children: "Pr\u00E9c\u00E9dent" }), _jsx("button", { className: "optim-btn-primary", onClick: handleSubmit, disabled: submitting, children: submitting ? 'Enregistrement...' : _jsxs(_Fragment, { children: ["Valider ", _jsx("i", { className: "bi bi-check-lg ms-2" })] }) })] })] }));
            default:
                return null;
        }
    };
    return (_jsx("div", { className: "optim-modal-overlay", onClick: (e) => { if (e.target === e.currentTarget)
            onClose(); }, children: _jsx("div", { className: "optim-modal-container", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-4", children: [_jsxs("span", { className: "text-body-custom small", children: ["\u00C9tape ", step, "/", totalSteps] }), _jsx("button", { className: "btn btn-link p-0 text-muted", onClick: onClose, style: { textDecoration: 'none' }, children: _jsx("i", { className: "bi bi-x-lg" }) })] }), _jsx("div", { className: "optim-progress-bar mb-4", children: _jsx("div", { className: "optim-progress-fill", style: { width: `${(step / totalSteps) * 100}%` } }) }), renderStep()] }) }) }));
}
const SECTEURS = [
    { id: 'dev-web', label: 'Dev Web', icon: 'bi-code-slash', color: '#6366f1' },
    { id: 'dev-mobile', label: 'Dev Mobile', icon: 'bi-phone', color: '#8b5cf6' },
    { id: 'dev-desktop', label: 'Dev Desktop', icon: 'bi-pc-display', color: '#7c3aed' },
    { id: 'dev-ios', label: 'Dev iOS', icon: 'bi-apple', color: '#5b21b6' },
    { id: 'design-web', label: 'Designer Web', icon: 'bi-palette', color: '#ec4899' },
    { id: 'design-mobile', label: 'Designer Mobile', icon: 'bi-phone-flip', color: '#f43f5e' },
    { id: 'pentest', label: 'Pentesteur', icon: 'bi-shield-lock', color: '#0ea5e9' },
    { id: 'hacker', label: 'Hacker', icon: 'bi-terminal', color: '#14b8a6' },
    { id: 'formateur', label: 'Formateur', icon: 'bi-mortarboard', color: '#f59e0b' },
    { id: 'trader', label: 'Trader', icon: 'bi-graph-up-arrow', color: '#10b981' },
    { id: 'youtubeur', label: 'Youtubeur', icon: 'bi-youtube', color: '#ef4444' },
    { id: 'autres', label: 'Autres métiers', icon: 'bi-grid', color: '#64748b' },
];
const TIERS = [
    { id: 't1', label: '300', sublabel: 'contacts prêts à visiter votre profil', count: '300', contactCount: 300, price: 100, color: '#6366f1' },
    { id: 't2', label: '1 300', sublabel: 'contacts prêts à visiter votre profil', count: '1 300', contactCount: 1300, price: 200, color: '#8b5cf6' },
    { id: 't3', label: '15 000', sublabel: 'contacts prêts à visiter votre profil', count: '15k', contactCount: 15000, price: 300, color: '#7c3aed' },
    { id: 't4', label: '31 000', sublabel: 'contacts prêts à visiter votre profil', count: '31k', contactCount: 31000, price: 1000, color: '#5b21b6' },
    { id: 't5', label: '100 000', sublabel: 'contacts prêts à visiter votre profil', count: '10k', contactCount: 10000, price: 2100, color: '#4c1d95' },
];
const getBoostContactKey = (contact) => {
    if (contact.whatsappPhone)
        return `whatsapp:${contact.whatsappPhone}`;
    return `email:${contact.email.trim().toLowerCase()}`;
};
function BoostContactsList({ contacts, details, userId, instanceId = 'default' }) {
    const [page, setPage] = useState(0);
    const [contactFilter, setContactFilter] = useState('all');
    const [usedContactKeys, setUsedContactKeys] = useState(() => new Set());
    const [usageError, setUsageError] = useState('');
    const pageSize = 8;
    const filteredContacts = useMemo(() => contacts.filter((contact) => {
        if (contactFilter === 'email')
            return Boolean(contact.email);
        if (contactFilter === 'whatsapp')
            return Boolean(contact.whatsappPhone);
        return true;
    }), [contactFilter, contacts]);
    const pageCount = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
    const visibleContacts = filteredContacts.slice(page * pageSize, (page + 1) * pageSize);
    const usedContactCount = contacts.filter((contact) => usedContactKeys.has(getBoostContactKey(contact))).length;
    useEffect(() => {
        let cancelled = false;
        const fetchUsedContacts = async () => {
            const { data, error } = await supabase
                .from('boost_contact_interactions')
                .select('contact_key')
                .eq('user_id', userId);
            if (cancelled)
                return;
            if (error) {
                console.error('Erreur lors du chargement des contacts utilisés:', error);
                return;
            }
            setUsedContactKeys((currentKeys) => new Set([
                ...currentKeys,
                ...(data || []).map((interaction) => interaction.contact_key),
            ]));
        };
        fetchUsedContacts();
        return () => { cancelled = true; };
    }, [userId]);
    const handleFilterChange = (event) => {
        setContactFilter(event.target.value);
        setPage(0);
    };
    const markContactAsUsed = async (contact) => {
        const contactKey = getBoostContactKey(contact);
        const wasAlreadyUsed = usedContactKeys.has(contactKey);
        if (wasAlreadyUsed)
            return;
        setUsageError('');
        setUsedContactKeys((currentKeys) => new Set(currentKeys).add(contactKey));
        const { error } = await supabase
            .from('boost_contact_interactions')
            .upsert({ user_id: userId, contact_key: contactKey, used_at: new Date().toISOString() }, { onConflict: 'user_id,contact_key' });
        if (error) {
            console.error('Erreur lors de l’enregistrement du contact utilisé:', error);
            setUsedContactKeys((currentKeys) => {
                const nextKeys = new Set(currentKeys);
                nextKeys.delete(contactKey);
                return nextKeys;
            });
            setUsageError('Le statut de ce contact n’a pas pu être enregistré. Réessaie avant de quitter la page.');
        }
    };
    return (_jsxs("div", { className: "mt-3 p-3 rounded-3", style: { border: '1px solid rgba(38, 33, 92, 0.08)', backgroundColor: '#fff' }, children: [_jsxs("div", { className: "d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3", children: [_jsxs("div", { children: [_jsx("h6", { className: "mb-1 text-title fw-bold", children: "Contacts de ton boost" }), _jsxs("p", { className: "small text-muted mb-0", children: [details?.count?.toLocaleString('fr-FR') || contacts.length.toLocaleString('fr-FR'), " contacts s\u00E9lectionn\u00E9s", details?.secteur ? ` pour ${details.secteur}` : '', usedContactCount > 0 ? ` · ${usedContactCount} déjà utilisé${usedContactCount > 1 ? 's' : ''}` : ''] })] }), _jsxs("div", { className: "d-flex flex-wrap align-items-end gap-2", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: `boost-contact-filter-${instanceId}`, className: "form-label small text-muted mb-1", children: "Afficher" }), _jsxs("select", { id: `boost-contact-filter-${instanceId}`, className: "form-select form-select-sm", value: contactFilter, onChange: handleFilterChange, children: [_jsx("option", { value: "all", children: "Tous les contacts" }), _jsx("option", { value: "email", children: "E-mails uniquement" }), _jsx("option", { value: "whatsapp", children: "Num\u00E9ros WhatsApp uniquement" })] })] }), pageCount > 1 && (_jsxs("div", { className: "d-flex gap-1", children: [_jsx("button", { type: "button", className: "btn btn-sm btn-outline-custom", onClick: () => setPage((current) => Math.max(0, current - 1)), disabled: page === 0, "aria-label": "Contacts pr\u00E9c\u00E9dents", children: _jsx("i", { className: "bi bi-chevron-left" }) }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-custom", onClick: () => setPage((current) => Math.min(pageCount - 1, current + 1)), disabled: page === pageCount - 1, "aria-label": "Contacts suivants", children: _jsx("i", { className: "bi bi-chevron-right" }) })] }))] })] }), usageError && _jsx("div", { className: "alert alert-danger py-2 small mb-3", role: "alert", children: usageError }), _jsx("div", { className: "row g-2", children: visibleContacts.map((contact) => {
                    const contactKey = getBoostContactKey(contact);
                    const isUsed = usedContactKeys.has(contactKey);
                    return (_jsx("div", { className: "col-12 col-md-6", children: _jsxs("div", { className: "d-flex align-items-center justify-content-between gap-2 p-2 rounded-2", style: { backgroundColor: '#FAFAFE' }, children: [_jsxs("div", { className: "min-width-0", children: [_jsx("div", { className: "fw-semibold text-title text-truncate", children: contact.name }), contactFilter !== 'whatsapp' && contact.email && _jsxs("div", { className: "small text-muted text-truncate", children: [_jsx("i", { className: "bi bi-envelope me-1" }), contact.email] }), contactFilter !== 'email' && contact.phone && _jsxs("div", { className: "small text-muted text-truncate", children: [_jsx("i", { className: "bi bi-whatsapp me-1 text-success" }), contact.phone] })] }), contact.whatsappPhone ? (_jsxs("a", { className: `btn btn-sm ${isUsed ? 'btn-danger' : 'btn-success'} flex-shrink-0`, href: `https://wa.me/${contact.whatsappPhone}`, target: "_blank", rel: "noreferrer", onClick: () => { markContactAsUsed(contact); }, "aria-label": `${isUsed ? 'Contact déjà utilisé : ' : 'Écrire à '}${contact.name} sur WhatsApp`, title: isUsed ? 'Contact déjà utilisé' : 'Écrire sur WhatsApp', children: [_jsx("i", { className: "bi bi-whatsapp me-1" }), isUsed ? 'Utilisé' : 'WhatsApp'] })) : _jsx("span", { className: "badge text-bg-light border", children: "E-mail" })] }) }, `${contact.whatsappPhone}-${contact.email}`));
                }) }), filteredContacts.length === 0 && _jsx("p", { className: "small text-muted text-center py-3 mb-0", children: "Aucun contact ne correspond \u00E0 ce filtre." }), pageCount > 1 && _jsxs("div", { className: "small text-muted text-center mt-2", children: ["Page ", page + 1, " / ", pageCount] })] }));
}
function AnalysisModal({ portfolioUrl, profileData, onClose, onPurchase }) {
    const [step, setStep] = useState(1);
    const [selectedSecteur, setSelectedSecteur] = useState(null);
    const [selectedTier, setSelectedTier] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const handleSecteurNext = () => {
        if (!selectedSecteur)
            return;
        setStep(2);
    };
    const handleTierNext = async () => {
        if (!selectedTier)
            return;
        setSubmitting(true);
        setError('');
        try {
            await onPurchase({ secteur: selectedSecteur, tier: selectedTier });
        }
        catch (purchaseError) {
            setError(purchaseError.message || 'Impossible de souscrire ce forfait.');
        }
        finally {
            setSubmitting(false);
        }
    };
    return (_jsx("div", { className: "optim-modal-overlay", onClick: (e) => { if (e.target === e.currentTarget)
            onClose(); }, style: { zIndex: 2000 }, children: _jsx("div", { className: "optim-modal-container", onClick: (e) => e.stopPropagation(), style: { maxWidth: '640px', width: '96vw' }, children: _jsxs("div", { className: "p-4 p-md-5", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [_jsx("div", { children: _jsxs("span", { className: "badge rounded-pill px-3 py-1 mb-2 d-inline-block", style: { backgroundColor: '#EEEDFE', color: 'var(--folio-primary)', fontSize: '0.75rem' }, children: [_jsx("i", { className: "bi bi-rocket-takeoff me-1" }), step === 1 ? 'Étape 1 sur 2' : 'Étape 2 sur 2'] }) }), _jsx("button", { className: "btn btn-link p-0 text-muted", onClick: onClose, style: { textDecoration: 'none', fontSize: '1.1rem' }, children: _jsx("i", { className: "bi bi-x-lg" }) })] }), _jsx("div", { className: "optim-progress-bar mb-4", children: _jsx("div", { className: "optim-progress-fill", style: { width: step === 1 ? '50%' : '100%' } }) }), step === 1 && (_jsxs("div", { className: "optim-step-enter", children: [_jsx("h3", { className: "font-serif fw-bold text-title mb-1", children: "Ton activit\u00E9 digitale" }), _jsx("p", { className: "text-body-custom mb-4", style: { fontSize: '0.9rem' }, children: "S\u00E9lectionne ton domaine pour cibler les bonnes personnes." }), _jsx("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                                    gap: '10px',
                                    maxHeight: '320px',
                                    overflowY: 'auto',
                                    paddingRight: '4px',
                                }, children: SECTEURS.map((s) => {
                                    const isSelected = selectedSecteur?.id === s.id;
                                    return (_jsxs("button", { onClick: () => setSelectedSecteur(s), style: {
                                            border: isSelected ? `2.5px solid ${s.color}` : '1.5px solid rgba(38,33,92,0.12)',
                                            borderRadius: '14px',
                                            padding: '14px 10px',
                                            backgroundColor: isSelected ? `${s.color}12` : 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.18s ease',
                                            transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                                            boxShadow: isSelected ? `0 4px 16px ${s.color}33` : 'none',
                                        }, children: [_jsx("div", { style: {
                                                    width: '42px', height: '42px',
                                                    borderRadius: '12px',
                                                    backgroundColor: `${s.color}20`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '1.2rem',
                                                    color: s.color,
                                                }, children: _jsx("i", { className: `bi ${s.icon}` }) }), _jsx("span", { style: { fontSize: '0.75rem', fontWeight: 600, color: isSelected ? s.color : 'var(--folio-title)', textAlign: 'center', lineHeight: '1.2' }, children: s.label }), isSelected && (_jsx("i", { className: "bi bi-check-circle-fill", style: { color: s.color, fontSize: '0.85rem' } }))] }, s.id));
                                }) }), _jsxs("button", { className: "btn btn-primary-custom w-100 mt-4 py-2", onClick: handleSecteurNext, disabled: !selectedSecteur, children: ["Suivant ", _jsx("i", { className: "bi bi-arrow-right ms-2" })] })] })), step === 2 && (_jsxs("div", { className: "optim-step-enter", children: [_jsxs("button", { className: "btn btn-link p-0 mb-3 text-muted", style: { fontSize: '0.85rem', textDecoration: 'none' }, onClick: () => setStep(1), children: [_jsx("i", { className: "bi bi-arrow-left me-1" }), " Retour"] }), _jsxs("div", { className: "d-flex align-items-center gap-2 mb-1", children: [_jsx("div", { style: {
                                            width: '36px', height: '36px',
                                            borderRadius: '10px',
                                            backgroundColor: `${selectedSecteur?.color}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: selectedSecteur?.color,
                                        }, children: _jsx("i", { className: `bi ${selectedSecteur?.icon}` }) }), _jsx("span", { className: "fw-semibold text-title", style: { fontSize: '0.9rem' }, children: selectedSecteur?.label })] }), _jsx("h3", { className: "font-serif fw-bold text-title mb-1 mt-2", children: "Combien de personnes veux-tu toucher ?" }), _jsx("p", { className: "text-body-custom mb-4", style: { fontSize: '0.88rem' }, children: "Nous avons ces contacts pr\u00EAts \u00E0 visiter votre profil. Choisissez votre volume." }), error && _jsx("div", { className: "alert alert-danger py-2 px-3 small", children: error }), _jsx("div", { className: "d-flex flex-column gap-3", children: TIERS.map((tier) => {
                                    const isSelected = selectedTier?.id === tier.id;
                                    return (_jsxs("button", { onClick: () => setSelectedTier(tier), style: {
                                            border: isSelected ? `2px solid ${tier.color}` : '1.5px solid rgba(38,33,92,0.12)',
                                            borderRadius: '14px',
                                            padding: '14px 18px',
                                            backgroundColor: isSelected ? `${tier.color}0d` : 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            transition: 'all 0.18s ease',
                                            boxShadow: isSelected ? `0 4px 18px ${tier.color}22` : 'none',
                                            textAlign: 'left',
                                            width: '100%',
                                        }, children: [_jsx("div", { style: {
                                                    width: '52px', height: '52px', flexShrink: 0,
                                                    borderRadius: '14px',
                                                    backgroundColor: `${tier.color}18`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    color: tier.color,
                                                    lineHeight: '1.1',
                                                    textAlign: 'center',
                                                }, children: tier.count }), _jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { fontWeight: 700, fontSize: '1rem', color: isSelected ? tier.color : 'var(--folio-title)' }, children: [tier.label, " personnes"] }), _jsx("div", { style: { fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }, children: tier.sublabel })] }), _jsxs("div", { className: "text-end", style: { minWidth: '90px' }, children: [_jsxs("strong", { style: { color: tier.color }, children: [tier.price.toLocaleString('fr-FR'), " F CFA"] }), _jsxs("div", { className: "small text-muted", children: ["Solde : ", Number(profileData?.solde || 0).toLocaleString('fr-FR'), " F"] })] }), _jsx("div", { style: {
                                                    width: '22px', height: '22px',
                                                    borderRadius: '50%',
                                                    border: isSelected ? `none` : '2px solid rgba(38,33,92,0.18)',
                                                    backgroundColor: isSelected ? tier.color : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                }, children: isSelected && _jsx("i", { className: "bi bi-check text-white", style: { fontSize: '0.75rem' } }) })] }, tier.id));
                                }) }), _jsxs("button", { className: "btn btn-primary-custom w-100 mt-4 py-2", onClick: handleTierNext, disabled: !selectedTier || submitting, style: { fontSize: '1rem' }, children: [submitting ? _jsx("span", { className: "spinner-border spinner-border-sm me-2" }) : _jsx("i", { className: "bi bi-wallet2 me-2" }), submitting ? 'Souscription...' : 'Souscrire le forfait'] })] }))] }) }) }));
}
function ReportProblemModal({ userId, onClose }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!title.trim() || !description.trim()) {
            setError('Renseigne un titre et une description pour ton signalement.');
            return;
        }
        setSubmitting(true);
        setError('');
        const { error: insertError } = await supabase.from('signal').insert({
            user_id: userId,
            titre: title.trim(),
            description: description.trim(),
        });
        if (insertError) {
            setError('Impossible d’envoyer ton signalement pour le moment. Réessaie dans quelques instants.');
        }
        else {
            setSubmitted(true);
        }
        setSubmitting(false);
    };
    return (_jsx("div", { className: "optim-modal-overlay", onClick: (event) => { if (event.target === event.currentTarget && !submitting)
            onClose(); }, style: { zIndex: 2100 }, children: _jsx("div", { className: "optim-modal-container", role: "dialog", "aria-modal": "true", "aria-labelledby": "report-problem-title", onClick: (event) => event.stopPropagation(), children: _jsxs("div", { className: "p-4 p-md-5", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-start gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "folio-auth-eyebrow mb-1", children: "Assistance Folio" }), _jsx("h2", { id: "report-problem-title", className: "font-serif fw-bold text-title mb-1", children: "Signaler un probl\u00E8me" }), _jsx("p", { className: "text-body-custom mb-0 small", children: "D\u00E9cris ce qui ne fonctionne pas afin que notre \u00E9quipe puisse t\u2019aider." })] }), _jsx("button", { type: "button", className: "btn btn-link p-0 text-muted", onClick: onClose, "aria-label": "Fermer", disabled: submitting, children: _jsx("i", { className: "bi bi-x-lg" }) })] }), submitted ? (_jsxs("div", { className: "text-center py-3", children: [_jsx("i", { className: "bi bi-check-circle-fill text-success", style: { fontSize: '3rem' } }), _jsx("h3", { className: "h5 font-serif fw-bold text-title mt-3", children: "Signalement envoy\u00E9" }), _jsx("p", { className: "text-muted small mb-4", children: "Merci. Notre \u00E9quipe va examiner ton probl\u00E8me." }), _jsx("button", { type: "button", className: "btn btn-primary-custom w-100", onClick: onClose, children: "Fermer" })] })) : (_jsxs("form", { onSubmit: handleSubmit, children: [error && _jsx("div", { className: "alert alert-danger py-2 px-3 small", role: "alert", children: error }), _jsx("label", { htmlFor: "report-title", className: "form-label text-body-custom small fw-medium", children: "Titre" }), _jsx("input", { id: "report-title", type: "text", className: "form-control mb-3", value: title, onChange: (event) => setTitle(event.target.value), maxLength: 120, placeholder: "Ex. Paiement non cr\u00E9dit\u00E9", disabled: submitting, required: true }), _jsx("label", { htmlFor: "report-description", className: "form-label text-body-custom small fw-medium", children: "Description" }), _jsx("textarea", { id: "report-description", className: "form-control mb-4", rows: "5", value: description, onChange: (event) => setDescription(event.target.value), maxLength: 3000, placeholder: "D\u00E9cris le probl\u00E8me rencontr\u00E9...", disabled: submitting, required: true }), _jsxs("button", { type: "submit", className: "btn btn-primary-custom w-100", disabled: submitting, children: [submitting ? _jsx("span", { className: "spinner-border spinner-border-sm me-2", role: "status" }) : _jsx("i", { className: "bi bi-send me-2" }), submitting ? 'Envoi...' : 'Envoyer'] })] }))] }) }) }));
}
function ProMaxModal({ userData, profileData, onRefreshProfile, onOpenRecharge, onClose }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [showConfigStep, setShowConfigStep] = useState(false);
    const [userProfileId, setUserProfileId] = useState(null);
    const [photoUrl, setPhotoUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [cvUrl, setCvUrl] = useState('');
    const [uploadingMedia, setUploadingMedia] = useState(false);
    const [configSaved, setConfigSaved] = useState(false);
    const isProMax = Boolean(profileData?.is_promax &&
        (!profileData?.promax_until || new Date(profileData.promax_until) > new Date()));
    const solde = Number(profileData?.solde || 0);
    const promaxCost = 15000;
    useEffect(() => {
        const loadFreelancerProfile = async () => {
            const { data } = await supabase.from('freelancers').select('*').eq('user_id', userData.id).limit(1).maybeSingle();
            if (data) {
                setUserProfileId(data.id);
                setPhotoUrl(data.photo_url || '');
                setVideoUrl(data.video_url || '');
                setCvUrl(data.cv_url || '');
            }
        };
        loadFreelancerProfile();
    }, [userData.id]);
    const handleSubscribe = async () => {
        if (solde < promaxCost) {
            setError("Solde insuffisant pour la souscription Freelancer ProMax (15000 F CFA). Veuillez recharger votre solde.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('subscribe_promax', {
                target_user_id: userData.id
            });
            if (rpcError) {
                const currentExp = profileData?.promax_until && new Date(profileData.promax_until) > new Date()
                    ? new Date(profileData.promax_until)
                    : new Date();
                currentExp.setDate(currentExp.getDate() + 30);
                const { error: updateError } = await supabase
                    .from('profils')
                    .update({
                    solde: solde - promaxCost,
                    is_promax: true,
                    promax_until: currentExp.toISOString(),
                    is_verified: true,
                    badge_color: 'orange'
                })
                    .eq('id', userData.id);
                if (updateError)
                    throw updateError;
            }
            else if (data && !data.success) {
                throw new Error(data.message);
            }
            setSuccessMsg("Félicitations ! Votre abonnement Freelancer ProMax est maintenant actif avec le badge Orange !");
            setShowConfigStep(true);
            await onRefreshProfile();
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        catch (err) {
            console.error("Erreur souscription ProMax:", err);
            setError(err?.message || "Une erreur est survenue lors de la souscription.");
        }
        finally {
            setLoading(false);
        }
    };
    const [videoProgress, setVideoProgress] = useState(0);
    const [cvProgress, setCvProgress] = useState(0);
    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadingMedia(true);
            setError(null);
            try {
                const url = await uploadToCloudinary(file, 'image');
                setPhotoUrl(url);
            }
            catch (err) {
                console.error("Erreur d'envoi photo:", err);
                setError("Erreur lors de l'envoi de la photo : " + (err.message || 'Échec'));
            }
            finally {
                setUploadingMedia(false);
            }
        }
    };
    const handleVideoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadingMedia(true);
            setVideoProgress(1);
            setError(null);
            try {
                const url = await uploadToCloudinary(file, 'video', (percent) => setVideoProgress(percent));
                setVideoUrl(url);
            }
            catch (err) {
                console.error("Erreur d'envoi vidéo:", err);
                setError("Erreur lors de l'envoi de la vidéo sur Cloudinary : " + (err.message || 'Échec'));
                setVideoProgress(0);
            }
            finally {
                setUploadingMedia(false);
            }
        }
    };
    const handleCvUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadingMedia(true);
            setCvProgress(1);
            setError(null);
            try {
                const url = await uploadToCloudinary(file, 'raw', (percent) => setCvProgress(percent));
                setCvUrl(url);
            }
            catch (err) {
                console.error("Erreur d'envoi CV:", err);
                setError("Erreur lors de l'envoi du CV sur Cloudinary : " + (err.message || 'Échec'));
                setCvProgress(0);
            }
            finally {
                setUploadingMedia(false);
            }
        }
    };
    const handleSaveConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            if (userProfileId) {
                const { error: updateErr } = await supabase.from('freelancers').update({
                    photo_url: photoUrl || null,
                    video_url: videoUrl || null,
                    cv_url: cvUrl || null,
                }).eq('id', userProfileId);
                if (updateErr)
                    throw updateErr;
            }
            else {
                const nameParts = (userData.nom_complet || 'Freelancer Pro').split(' ');
                const { error: insertErr } = await supabase.from('freelancers').insert({
                    user_id: userData.id,
                    nom: nameParts[0] || 'Nom',
                    prenom: nameParts.slice(1).join(' ') || 'Prénom',
                    nom_freelancer: userData.nom_complet || 'Mon Profil ProMax',
                    activite: 'Freelancer ProMax',
                    description: 'Profil d\'expert Freelancer ProMax',
                    photo_url: photoUrl || null,
                    video_url: videoUrl || null,
                    cv_url: cvUrl || null,
                });
                if (insertErr)
                    throw insertErr;
            }
            setConfigSaved(true);
            await onRefreshProfile();
        }
        catch (err) {
            console.error("Erreur enregistrement profil ProMax:", err);
            setError("Impossible d'enregistrer le profil. Assurez-vous d'avoir exécuté la mise à jour SQL dans Supabase SQL Editor. Erreur: " + (err.message || ''));
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "modal fade show d-block", tabIndex: "-1", role: "dialog", style: { backgroundColor: 'rgba(38, 33, 92, 0.45)', backdropFilter: 'blur(4px)', zIndex: 1050 }, onClick: (e) => { if (e.target === e.currentTarget && !loading)
            onClose(); }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered promax-bottom-sheet-dialog modal-lg", role: "document", children: _jsxs("div", { className: "modal-content border-0 shadow", style: { borderRadius: '20px', overflow: 'hidden' }, children: [_jsxs("div", { className: "modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center", style: { background: 'linear-gradient(135deg, #FFF6F0 0%, #FFF0E5 100%)' }, children: [_jsxs("h5", { className: "modal-title font-serif fw-bold fs-4 text-title d-flex align-items-center gap-2", children: [_jsx("i", { className: "bi bi-rocket-takeoff-fill fs-3", style: { color: '#FF7A00' } }), _jsxs("span", { children: ["Freelancer ", _jsx("span", { style: { color: '#FF7A00' }, children: "ProMax" })] })] }), _jsx("button", { type: "button", className: "btn-close", onClick: onClose, "aria-label": "Fermer", disabled: loading })] }), _jsx("div", { className: "modal-body py-4 px-4", children: showConfigStep ? (_jsxs("div", { className: "py-2", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("img", { src: orangeBadge, alt: "Badge Orange ProMax", style: { width: '64px', height: '64px', objectFit: 'contain' }, className: "mb-2" }), _jsx("h4", { className: "font-serif fw-bold text-title mb-1", children: "Configure ton profil ProMax \uD83D\uDE80" }), _jsx("p", { className: "text-muted small", children: "Ajoute ta vid\u00E9o de pr\u00E9sentation, ton CV et choisis ton m\u00E9dia de profil." })] }), configSaved && (_jsxs("div", { className: "alert alert-success py-2 px-3 small text-center mb-3", children: [_jsx("i", { className: "bi bi-check-circle-fill me-2" }), "Vos informations ont \u00E9t\u00E9 enregistr\u00E9es avec succ\u00E8s ! Vous pourrez les modifier \u00E0 tout moment dans \"Mes Profils\"."] })), _jsxs("div", { className: "row g-3 mb-4", children: [_jsx("div", { className: "col-12 col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 bg-white h-100 text-center", children: [_jsxs("h6", { className: "fw-bold text-title mb-2", children: [_jsx("i", { className: "bi bi-camera-reels text-warning me-2" }), "Photo ou Vid\u00E9o de Profil"] }), _jsx("div", { className: "mb-3 mx-auto", style: { width: '90px', height: '90px' }, children: videoUrl ? (_jsx("video", { src: videoUrl, autoPlay: true, loop: true, muted: true, playsInline: true, className: "rounded-circle shadow-sm", style: { width: '90px', height: '90px', objectFit: 'cover', border: '3px solid #FF7A00' } })) : photoUrl ? (_jsx("img", { src: photoUrl, alt: "Aper\u00E7u", className: "rounded-circle shadow-sm", style: { width: '90px', height: '90px', objectFit: 'cover', border: '3px solid #FF7A00' } })) : (_jsx("div", { className: "rounded-circle d-flex align-items-center justify-content-center shadow-sm", style: { width: '90px', height: '90px', backgroundColor: '#FFF0E5', color: '#FF7A00' }, children: _jsx("i", { className: "bi bi-person fs-1" }) })) }), videoProgress > 0 && videoProgress < 100 && (_jsxs("div", { className: "w-100 mt-3", children: [_jsxs("div", { className: "d-flex justify-content-between small text-title fw-bold mb-1", children: [_jsx("span", { children: "T\u00E9l\u00E9versement vid\u00E9o..." }), _jsxs("span", { children: [videoProgress, "%"] })] }), _jsx("div", { className: "progress", style: { height: '8px' }, children: _jsx("div", { className: "progress-bar progress-bar-striped progress-bar-animated bg-warning", style: { width: `${videoProgress}%` } }) })] })), _jsxs("div", { className: "d-flex flex-column gap-2 mt-3", children: [_jsxs("label", { className: "btn btn-sm btn-outline-custom", children: [_jsx("i", { className: "bi bi-image me-1" }), "Choisir une photo", _jsx("input", { type: "file", accept: "image/*", className: "d-none", onChange: handlePhotoUpload, disabled: loading || uploadingMedia })] }), _jsxs("label", { className: "btn btn-sm btn-outline-warning", style: { color: '#FF7A00', borderColor: '#FF7A00' }, children: [_jsx("i", { className: "bi bi-camera-video me-1" }), "Choisir une vid\u00E9o de pr\u00E9sentation", _jsx("input", { type: "file", accept: "video/*", className: "d-none", onChange: handleVideoUpload, disabled: loading || uploadingMedia })] })] })] }) }), _jsx("div", { className: "col-12 col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 bg-white h-100 text-center d-flex flex-column justify-content-between", children: [_jsxs("div", { children: [_jsxs("h6", { className: "fw-bold text-title mb-2", children: [_jsx("i", { className: "bi bi-file-earmark-pdf text-success me-2" }), "Ajouter son CV au profil"] }), _jsx("p", { className: "small text-muted mb-3", children: "T\u00E9l\u00E9verse ton CV au format PDF ou Word pour qu'il soit directement t\u00E9l\u00E9chargeable sur ta carte." }), cvProgress > 0 && cvProgress < 100 && (_jsxs("div", { className: "w-100 mb-3", children: [_jsxs("div", { className: "d-flex justify-content-between small text-title fw-bold mb-1", children: [_jsx("span", { children: "T\u00E9l\u00E9versement CV..." }), _jsxs("span", { children: [cvProgress, "%"] })] }), _jsx("div", { className: "progress", style: { height: '8px' }, children: _jsx("div", { className: "progress-bar progress-bar-striped progress-bar-animated bg-success", style: { width: `${cvProgress}%` } }) })] })), cvUrl ? (_jsxs("div", { className: "alert alert-success py-2 px-3 small mb-3", children: [_jsx("i", { className: "bi bi-check-circle-fill me-1" }), "CV joint avec succ\u00E8s !"] })) : (_jsxs("div", { className: "p-3 rounded-3 mb-3", style: { backgroundColor: '#F8F9FA', border: '1px dashed #CED4DA' }, children: [_jsx("i", { className: "bi bi-cloud-arrow-up fs-2 text-muted" }), _jsx("span", { className: "d-block small text-muted", children: "Aucun fichier choisi" })] }))] }), _jsxs("label", { className: "btn btn-sm btn-outline-success w-100", children: [_jsx("i", { className: "bi bi-file-earmark-plus me-1" }), cvUrl ? 'Changer de CV' : 'Téléverser mon CV (PDF/DOC)', _jsx("input", { type: "file", accept: ".pdf,.doc,.docx", className: "d-none", onChange: handleCvUpload, disabled: loading || uploadingMedia })] })] }) })] }), uploadingMedia && (_jsxs("div", { className: "text-center py-2 text-primary small", children: [_jsx("span", { className: "spinner-border spinner-border-sm me-2" }), "T\u00E9l\u00E9versement vers Cloudinary en cours..."] })), _jsxs("p", { className: "small text-muted text-center mb-3", children: ["\uD83D\uDCA1 Note : Vous pourrez modifier ces informations \u00E0 tout moment depuis le menu ", _jsx("strong", { children: "\"Mes Profils\"" }), "."] }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { type: "button", className: "btn btn-outline-custom w-50 py-2", onClick: onClose, disabled: loading, children: "Passer pour l'instant" }), _jsxs("button", { type: "button", className: "btn btn-primary-custom w-50 py-2", style: { backgroundColor: '#FF7A00', borderColor: '#FF7A00' }, onClick: handleSaveConfig, disabled: loading || uploadingMedia || (videoProgress > 0 && videoProgress < 100) || (cvProgress > 0 && cvProgress < 100), children: [loading ? _jsx("span", { className: "spinner-border spinner-border-sm me-2" }) : _jsx("i", { className: "bi bi-check-circle me-1" }), "Enregistrer mon profil"] })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "p-3 rounded-4 mb-4", style: { background: 'linear-gradient(135deg, #FF6B00 0%, #FF9E00 100%)', color: 'white' }, children: _jsxs("div", { className: "d-flex align-items-center justify-content-between", children: [_jsxs("div", { children: [_jsx("span", { className: "badge bg-white text-dark font-sans fw-bold px-3 py-1 rounded-pill mb-2", children: "Offre Exclusive" }), _jsx("h4", { className: "font-serif fw-bold mb-1", children: "Propulsez votre carri\u00E8re Freelance" }), _jsx("p", { className: "mb-0 small opacity-90", children: "Acc\u00E9dez \u00E0 toutes les fonctionnalit\u00E9s avanc\u00E9es et d\u00E9marquez-vous des autres freelances." })] }), _jsxs("div", { className: "text-end d-none d-sm-block", children: [_jsx("span", { className: "display-6 fw-bold", children: "15 000" }), _jsx("span", { className: "fs-6 d-block", children: "FCFA / mois" })] })] }) }), _jsx("h6", { className: "font-serif fw-bold text-title mb-3", children: "Toutes les fonctionnalit\u00E9s ProMax incluses :" }), _jsxs("div", { className: "row g-3 mb-4", children: [_jsx("div", { className: "col-12 col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 h-100 d-flex align-items-start gap-3 bg-white shadow-sm", children: [_jsx("div", { className: "rounded-3 p-2 d-flex align-items-center justify-content-center text-white", style: { backgroundColor: '#FF7A00', width: '40px', height: '40px', flexShrink: 0 }, children: _jsx("i", { className: "bi bi-camera-reels-fill fs-5" }) }), _jsxs("div", { children: [_jsx("h6", { className: "fw-bold text-title mb-1", style: { fontSize: '0.95rem' }, children: "Vid\u00E9o en photo de profil" }), _jsx("p", { className: "small text-muted mb-0", children: "Ajoutez une courte vid\u00E9o de pr\u00E9sentation dynamique directement sur votre photo de profil." })] })] }) }), _jsx("div", { className: "col-12 col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 h-100 d-flex align-items-start gap-3 bg-white shadow-sm", children: [_jsx("div", { className: "rounded-3 p-2 d-flex align-items-center justify-content-center text-white", style: { backgroundColor: '#FF7A00', width: '40px', height: '40px', flexShrink: 0 }, children: _jsx("i", { className: "bi bi-file-earmark-pdf-fill fs-5" }) }), _jsxs("div", { children: [_jsx("h6", { className: "fw-bold text-title mb-1", style: { fontSize: '0.95rem' }, children: "Ajouter son CV au profil" }), _jsx("p", { className: "small text-muted mb-0", children: "Attachez votre CV (PDF/DOC) pour que les recruteurs et clients puissent le consulter en 1 clic." })] })] }) }), _jsx("div", { className: "col-12 col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 h-100 d-flex align-items-start gap-3 bg-white shadow-sm", children: [_jsx("div", { className: "rounded-3 p-2 d-flex align-items-center justify-content-center text-white", style: { backgroundColor: '#FF7A00', width: '40px', height: '40px', flexShrink: 0 }, children: _jsx("i", { className: "bi bi-sort-numeric-down fs-5" }) }), _jsxs("div", { children: [_jsx("h6", { className: "fw-bold text-title mb-1", style: { fontSize: '0.95rem' }, children: "En t\u00EAte des recherches" }), _jsx("p", { className: "small text-muted mb-0", children: "Votre profil est automatiquement positionn\u00E9 tout en haut des r\u00E9sultats de recherche." })] })] }) }), _jsx("div", { className: "col-12 col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 h-100 d-flex align-items-start gap-3 bg-white shadow-sm", children: [_jsx("div", { className: "rounded-3 p-2 d-flex align-items-center justify-content-center text-white", style: { backgroundColor: '#FF7A00', width: '40px', height: '40px', flexShrink: 0 }, children: _jsx("i", { className: "bi bi-download fs-5" }) }), _jsxs("div", { children: [_jsx("h6", { className: "fw-bold text-title mb-1", style: { fontSize: '0.95rem' }, children: "T\u00E9l\u00E9charger des contacts" }), _jsx("p", { className: "small text-muted mb-0", children: "Acc\u00E9dez au t\u00E9l\u00E9chargement des listes de contacts d'entreprises et clients potentiels." })] })] }) }), _jsx("div", { className: "col-12", children: _jsxs("div", { className: "p-3 border rounded-3 d-flex align-items-center justify-content-between bg-white shadow-sm", style: { borderLeft: '5px solid #FF7A00' }, children: [_jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsx("img", { src: orangeBadge, alt: "Badge Orange", style: { width: '36px', height: '36px', objectFit: 'contain' } }), _jsxs("div", { children: [_jsx("h6", { className: "fw-bold text-title mb-0", style: { fontSize: '0.95rem' }, children: "Badge Offert Gratuitement (Couleur Orange) \uD83D\uDFE0" }), _jsx("p", { className: "small text-muted mb-0", children: "Votre badge certifi\u00E9 passe automatiquement du bleu \u00E0 l'orange vif !" })] })] }), _jsx("span", { className: "badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1", children: "Offert" })] }) })] }), _jsxs("div", { className: "border rounded-3 p-3 mb-4 bg-light", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [_jsx("span", { className: "text-body-custom", children: "Tarif de l'abonnement" }), _jsx("strong", { className: "fs-5", style: { color: '#FF7A00' }, children: "15 000 F CFA / mois" })] }), _jsxs("div", { className: "d-flex justify-content-between align-items-center", children: [_jsx("span", { className: "text-body-custom", children: "Votre solde actuel" }), _jsxs("strong", { className: solde >= promaxCost ? 'text-success' : 'text-danger', children: [solde.toLocaleString('fr-FR'), " F CFA"] })] })] }), isProMax && (_jsxs("div", { className: "alert alert-success py-2 px-3 small mb-3", children: [_jsx("i", { className: "bi bi-check-circle-fill me-2" }), "Vous \u00EAtes d\u00E9j\u00E0 abonn\u00E9 \u00E0 Freelancer ProMax (Actif jusqu'au ", new Date(profileData.promax_until).toLocaleDateString('fr-FR'), "). Cliquez ci-dessous pour prolonger de 30 jours ou configurer vos medias."] })), error && (_jsxs("div", { className: "alert alert-danger py-2 px-3 small mb-3", children: [_jsx("i", { className: "bi bi-exclamation-triangle-fill me-2" }), error, solde < promaxCost && (_jsx("div", { className: "mt-2", children: _jsxs("button", { type: "button", className: "btn btn-sm btn-primary-custom", onClick: () => { onClose(); onOpenRecharge(); }, children: [_jsx("i", { className: "bi bi-wallet2 me-1" }), "Recharger mon solde"] }) }))] })), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { type: "button", className: "btn btn-outline-custom w-50 py-2", onClick: onClose, disabled: loading, children: "Annuler" }), _jsxs("button", { type: "button", className: "btn btn-primary-custom w-50 py-2", style: { backgroundColor: '#FF7A00', borderColor: '#FF7A00' }, onClick: handleSubscribe, disabled: loading, children: [loading ? _jsx("span", { className: "spinner-border spinner-border-sm me-2" }) : _jsx("i", { className: "bi bi-rocket-takeoff me-1" }), isProMax ? 'Configurer / Prolongé' : 'Souscrire à l\'offre (15 000 F)'] })] })] })) })] }) }) }));
}
function AiAnalysisModal({ portfolioUrl, profileData, userData, onClose }) {
    const defaultUrl = profileData?.portfolio_url || portfolioUrl || '';
    const [urlInput, setUrlInput] = useState(defaultUrl);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash-lite');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [pendingModel, setPendingModel] = useState('gemini-3.5-flash-lite');
    const isOverloadedError = error && (error.toLowerCase().includes('high demand') || error.toLowerCase().includes('overload') || error.toLowerCase().includes('très sollicité'));
    const handleRunAnalysis = async (modelOverride) => {
        const modelToUse = modelOverride || selectedModel;
        if (!urlInput.trim()) {
            setError("Veuillez saisir l'URL de votre portfolio.");
            return;
        }
        setLoading(true);
        setError(null);
        setShowModelPicker(false);
        try {
            const res = await analyzePortfolioWithGemini({
                portfolioUrl: urlInput.trim(),
                name: userData?.nom_complet || profileData?.nom || 'Freelance',
                profession: profileData?.metier || profileData?.activite || 'Développeur Web',
                description: profileData?.description || '',
                selectedModel: modelToUse,
            });
            setAnalysis(res);
        }
        catch (err) {
            console.error("Erreur lors de l'analyse Gemini IA:", err);
            setError(err?.message || "Impossible d'effectuer l'analyse IA. Veuillez réessayer.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (defaultUrl && !analysis && !loading) {
            handleRunAnalysis();
        }
    }, []);
    const handleCopyHead = () => {
        if (analysis?.headCode) {
            navigator.clipboard.writeText(analysis.headCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };
    const getScoreColor = (score) => {
        if (score >= 80)
            return '#10b981';
        if (score >= 60)
            return '#f59e0b';
        return '#ef4444';
    };
    return (_jsx("div", { className: "optim-modal-overlay", onClick: (e) => { if (e.target === e.currentTarget && !loading)
            onClose(); }, style: { zIndex: 2200 }, children: _jsx("div", { className: "optim-modal-container modal-lg", onClick: (e) => e.stopPropagation(), style: { maxWidth: '850px' }, children: _jsxs("div", { className: "p-4 p-md-5", style: { maxHeight: '85vh', overflowY: 'auto' }, children: [_jsxs("div", { className: "d-flex justify-content-between align-items-start gap-3 mb-4", children: [_jsxs("div", { children: [_jsxs("span", { className: "badge rounded-pill text-white px-3 py-1 mb-2 d-inline-flex align-items-center gap-1", style: { background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }, children: [_jsx("i", { className: "bi bi-stars" }), " Folio IA"] }), _jsx("h2", { className: "font-serif fw-bold text-title mb-1", children: "Analyse SEO & Code Head par IA" }), _jsx("p", { className: "text-body-custom mb-0 small", children: "Obtenez un audit instantan\u00E9 par Gemini IA et g\u00E9n\u00E9rez le code HTML \u00E0 ins\u00E9rer dans le <head> de votre site." })] }), _jsx("button", { type: "button", className: "btn btn-link p-0 text-muted", onClick: onClose, "aria-label": "Fermer", disabled: loading, children: _jsx("i", { className: "bi bi-x-lg" }) })] }), _jsxs("div", { className: "p-3 rounded-3 mb-4", style: { backgroundColor: '#F8F9FE', border: '1px solid rgba(139, 92, 246, 0.15)' }, children: [_jsx("label", { className: "form-label text-title small fw-bold mb-1", children: "URL de votre portfolio \u00E0 analyser :" }), _jsxs("div", { className: "input-group", children: [_jsx("span", { className: "input-group-text bg-white text-muted", children: _jsx("i", { className: "bi bi-globe" }) }), _jsx("input", { type: "url", className: "form-control", placeholder: "https://votreportfolio.com", value: urlInput, onChange: (e) => setUrlInput(e.target.value), disabled: loading }), _jsxs("button", { type: "button", className: "btn text-white px-4 d-flex align-items-center gap-2", style: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }, onClick: handleRunAnalysis, disabled: loading, children: [loading ? _jsx("span", { className: "spinner-border spinner-border-sm", role: "status" }) : _jsx("i", { className: "bi bi-stars" }), loading ? 'Analyse en cours...' : 'Analyse IA'] })] })] }), error && (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "alert alert-danger py-2 px-3 small d-flex align-items-start gap-2 mb-2", children: [_jsx("i", { className: "bi bi-exclamation-triangle-fill mt-0.5 flex-shrink-0" }), _jsx("div", { className: "flex-grow-1", children: error })] }), isOverloadedError ? (_jsxs("div", { className: "p-3 rounded-3 border", style: { backgroundColor: '#faf5ff', borderColor: '#8b5cf640' }, children: [_jsxs("p", { className: "small fw-bold text-title mb-2", children: [_jsx("i", { className: "bi bi-cpu me-1", style: { color: '#8b5cf6' } }), "Le mod\u00E8le IA est tr\u00E8s sollicit\u00E9 en ce moment. Choisissez un autre mod\u00E8le pour relancer l'analyse :"] }), _jsx("div", { className: "d-flex flex-column gap-2 mb-3", children: AVAILABLE_MODELS.filter(m => m.id !== selectedModel).map(m => (_jsxs("label", { className: `d-flex align-items-center gap-2 p-2 rounded-3 border cursor-pointer ${pendingModel === m.id ? 'border-purple-500' : ''}`, style: { cursor: 'pointer', borderColor: pendingModel === m.id ? '#8b5cf6' : '#e5e7eb', backgroundColor: pendingModel === m.id ? '#f5f3ff' : 'white' }, children: [_jsx("input", { type: "radio", name: "model-picker", value: m.id, checked: pendingModel === m.id, onChange: () => setPendingModel(m.id), className: "form-check-input mt-0" }), _jsxs("div", { children: [_jsx("div", { className: "fw-semibold small text-title", children: m.label }), _jsx("div", { className: "text-muted", style: { fontSize: '0.75rem' }, children: m.description })] })] }, m.id))) }), _jsxs("button", { type: "button", className: "btn btn-sm text-white w-100", style: { backgroundColor: '#8b5cf6' }, onClick: () => { setSelectedModel(pendingModel); handleRunAnalysis(pendingModel); }, children: [_jsx("i", { className: "bi bi-arrow-clockwise me-1" }), "Relancer avec ce mod\u00E8le"] })] })) : (_jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger", onClick: () => handleRunAnalysis(), children: "R\u00E9essayer" }))] })), loading ? (_jsxs("div", { className: "text-center py-5", children: [_jsx("div", { className: "spinner-border mb-3", style: { width: '3rem', height: '3rem', color: '#8b5cf6' }, role: "status", children: _jsx("span", { className: "visually-hidden", children: "Chargement IA..." }) }), _jsx("h5", { className: "font-serif text-title mb-1", children: "Analyse en cours et attente de r\u00E9sultat..." }), _jsx("p", { className: "text-muted small mb-0", children: "Extraction des balises SEO, v\u00E9rification de l'ergonomie et g\u00E9n\u00E9ration du code <head>." })] })) : analysis ? (_jsxs("div", { className: "ai-analysis-results", children: [_jsxs("div", { className: "row g-3 mb-4", children: [_jsx("div", { className: "col-md-4", children: _jsxs("div", { className: "p-4 rounded-4 text-center h-100 d-flex flex-column align-items-center justify-content-center bg-white shadow-sm border", style: { borderColor: `${getScoreColor(analysis.score)}40` }, children: [_jsx("p", { className: "small text-muted mb-1 text-uppercase fw-bold", style: { letterSpacing: '0.05em' }, children: "Score IA Global" }), _jsx("div", { className: "d-flex align-items-center justify-content-center rounded-circle my-2 shadow-sm", style: {
                                                        width: '90px', height: '90px',
                                                        border: `6px solid ${getScoreColor(analysis.score)}`,
                                                        backgroundColor: `${getScoreColor(analysis.score)}10`
                                                    }, children: _jsx("span", { className: "fs-2 fw-bold", style: { color: getScoreColor(analysis.score) }, children: analysis.score }) }), _jsx("span", { className: "badge px-3 py-1 rounded-pill mt-1", style: { backgroundColor: `${getScoreColor(analysis.score)}20`, color: getScoreColor(analysis.score) }, children: analysis.score >= 80 ? 'Excellent SEO' : analysis.score >= 60 ? 'Bonne base' : 'À optimiser' })] }) }), _jsx("div", { className: "col-md-8", children: _jsxs("div", { className: "p-4 rounded-4 h-100 bg-white shadow-sm border", children: [_jsxs("h5", { className: "font-serif fw-bold text-title mb-2 d-flex align-items-center gap-2", children: [_jsx("i", { className: "bi bi-robot", style: { color: '#8b5cf6' } }), _jsx("span", { children: "Diagnostic de l'IA" })] }), _jsx("p", { className: "text-body-custom mb-0", style: { fontSize: '0.92rem', lineHeight: '1.6' }, children: analysis.diagnostic })] }) })] }), _jsxs("div", { className: "row g-3 mb-4", children: [_jsx("div", { className: "col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 h-100 bg-white shadow-sm", children: [_jsxs("h6", { className: "fw-bold text-success mb-3 d-flex align-items-center gap-2", style: { fontSize: '0.95rem' }, children: [_jsx("i", { className: "bi bi-check-circle-fill" }), " Forces d\u00E9tect\u00E9es (", analysis.strengths?.length || 0, ")"] }), _jsx("ul", { className: "list-unstyled mb-0 d-flex flex-column gap-2 small text-body-custom", children: analysis.strengths?.map((str, idx) => (_jsxs("li", { className: "d-flex align-items-start gap-2", children: [_jsx("i", { className: "bi bi-check2 text-success mt-0.5" }), _jsx("span", { children: str })] }, idx))) })] }) }), _jsx("div", { className: "col-md-6", children: _jsxs("div", { className: "p-3 border rounded-3 h-100 bg-white shadow-sm", children: [_jsxs("h6", { className: "fw-bold text-warning mb-3 d-flex align-items-center gap-2", style: { fontSize: '0.95rem' }, children: [_jsx("i", { className: "bi bi-exclamation-triangle-fill" }), " Points \u00E0 am\u00E9liorer (", analysis.weaknesses?.length || 0, ")"] }), _jsx("ul", { className: "list-unstyled mb-0 d-flex flex-column gap-2 small text-body-custom", children: analysis.weaknesses?.map((w, idx) => (_jsxs("li", { className: "d-flex align-items-start gap-2", children: [_jsx("i", { className: "bi bi-dot fs-5 text-warning lh-1" }), _jsx("span", { children: w })] }, idx))) })] }) })] }), _jsxs("div", { className: "p-4 rounded-4 bg-white shadow-sm border mb-4", children: [_jsxs("h5", { className: "font-serif fw-bold text-title mb-3 d-flex align-items-center gap-2", children: [_jsx("i", { className: "bi bi-lightbulb-fill text-warning" }), _jsx("span", { children: "Recommandations IA pour Booster votre Trafic" })] }), _jsx("div", { className: "d-flex flex-column gap-2", children: analysis.recommendations?.map((rec, idx) => (_jsxs("div", { className: "p-3 rounded-3 d-flex align-items-start gap-3", style: { backgroundColor: '#F8F9FE', borderLeft: '4px solid #8b5cf6' }, children: [_jsx("span", { className: "badge rounded-circle d-flex align-items-center justify-content-center text-white", style: { width: '24px', height: '24px', backgroundColor: '#8b5cf6', flexShrink: 0 }, children: idx + 1 }), _jsx("p", { className: "mb-0 text-title small fw-medium", children: rec })] }, idx))) })] }), _jsxs("div", { className: "p-4 rounded-4 bg-dark text-white shadow", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3", children: [_jsxs("div", { children: [_jsxs("h5", { className: "font-serif fw-bold mb-1 text-white d-flex align-items-center gap-2", children: [_jsx("i", { className: "bi bi-code-square text-info" }), _jsx("span", { children: "Code HTML \u00E0 copier dans le <head> de votre site" })] }), _jsx("p", { className: "text-white-50 mb-0 small", children: "G\u00E9n\u00E9r\u00E9 sur-mesure par Gemini IA pour optimiser votre r\u00E9f\u00E9rencement Google et r\u00E9seaux sociaux." })] }), _jsxs("button", { type: "button", className: `btn btn-sm ${copied ? 'btn-success' : 'btn-outline-light'} px-3 py-1.5 d-flex align-items-center gap-1.5`, onClick: handleCopyHead, children: [_jsx("i", { className: `bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}` }), _jsx("span", { children: copied ? 'Code copié !' : 'Copier le code <head>' })] })] }), _jsx("div", { className: "position-relative", children: _jsx("pre", { className: "p-3 rounded-3 bg-black text-info small mb-0 font-monospace", style: { maxHeight: '250px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid #334155' }, children: _jsx("code", { children: analysis.headCode }) }) }), _jsxs("small", { className: "text-white-50 d-block mt-2", style: { fontSize: '0.75rem' }, children: ["\uD83D\uDCA1 Collez ces balises directement entre ", _jsx("code", { children: "<head>" }), " et ", _jsx("code", { children: "</head>" }), " dans le fichier index.html de votre portfolio."] })] })] })) : null] }) }) }));
}
