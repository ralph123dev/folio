import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';
import verifieBadge from '../assets/verifie.png';
import orangeBadge from '../assets/orange.png';
import { uploadToCloudinary } from '../lib/cloudinary';
import { analyzePortfolioWithGemini, AVAILABLE_MODELS } from '../lib/gemini';
import './auth.css';
import MyProfilesModal from './MyProfilesModal';
import FreeAccessCountdown from './FreeAccessCountdown';

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

  // Parrainage: code unique dérivé de l'ID (permanent)
  const referralCode = userData?.id
    ? 'FOLIO-' + userData.id.replace(/-/g, '').substring(0, 8).toUpperCase()
    : '';
  const referralLink = referralCode ? `${window.location.origin}?ref=${referralCode}` : '';

  const handleCopyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
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
    const msg = encodeURIComponent(
      `🎓 Rejoins-moi sur Folio — la plateforme freelance en Afrique !\n\nInscris-toi gratuitement avec mon lien :\n👉 ${referralLink}\n\nCode : ${referralCode}`
    );
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
  const [theme, setTheme] = useState(() => localStorage.getItem('folio-dashboard-theme') || 'light');
  const [profileData, setProfileData] = useState(null);
  const [dailyEmailOptedIn, setDailyEmailOptedIn] = useState(false);
  const [dailyEmailPreferenceLoading, setDailyEmailPreferenceLoading] = useState(true);
  const [dailyEmailPreferenceSaving, setDailyEmailPreferenceSaving] = useState(false);
  const [dailyEmailPreferenceError, setDailyEmailPreferenceError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [boostContacts, setBoostContacts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`folio-boost-contacts-${userData.id}`)) || [];
    } catch {
      return [];
    }
  });
  const [boostDetails, setBoostDetails] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(`folio-boost-details-${userData.id}`)) || null;
    } catch {
      return null;
    }
  });
  const [boostContactsError, setBoostContactsError] = useState('');
  const [searchStats, setSearchStats] = useState([]);

  const isUserVerified = useMemo(() => {
    return Boolean(
      profileData?.is_verified &&
      profileData?.verified_until &&
      new Date(profileData.verified_until) > new Date()
    );
  }, [profileData]);

  const isProMax = useMemo(() => {
    return Boolean(
      profileData?.is_promax &&
      (!profileData?.promax_until || new Date(profileData.promax_until) > new Date())
    );
  }, [profileData]);

  const badgeColorClass = useMemo(() => {
    if (isProMax || profileData?.badge_color === 'orange') return 'badge-orange-img';
    return '';
  }, [isProMax, profileData]);

  const userBadgeImg = useMemo(() => {
    if (isProMax || profileData?.badge_color === 'orange') return orangeBadge;
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
      if (error) throw error;
      if (data) {
        setProfileData(data);
        if (data.portfolio_url) {
          setPortfolioUrl(data.portfolio_url);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
    } finally {
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

      if (!active) return;
      if (error) {
        console.error('Impossible de charger la préférence d’e-mail quotidien :', error);
        setDailyEmailPreferenceError('Préférence indisponible pour le moment.');
      } else {
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
    } else {
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

  const [chartMetric, setMetric] = useState('visits'); // 'visits' | 'stars' | 'clients'
  const [freelancerProfiles, setFreelancerProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState('all');
  const [ratingsList, setRatingsList] = useState([]);
  const [clientRequests, setClientRequests] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  // Charger les demandes clients en temps réel
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
    if (user?.id) return `user_${user.id}`;
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
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la vue client:", err);
    }
  };

  // Auto-sync des paiements en attente en arrière-plan
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
            if (!active) break;
            if (tx.provider_reference) {
              await supabase.functions.invoke('saspay-verify-payment', {
                body: { paymentId: tx.provider_reference, userId: userData.id },
              });
            }
          }
          await fetchProfile();
        }
      } catch (err) {
        console.error('Erreur lors de la synchronisation des paiements en arrière-plan:', err);
      }
    };

    syncPendingPayments();
    return () => { active = false; };
  }, [userData.id]);

  // Récupérer les profils freelancers de l'utilisateur et leurs notes en temps réel
  useEffect(() => {
    let isMounted = true;

    const fetchFreelancersAndRatings = async () => {
      const { data: profiles } = await supabase
        .from('freelancers')
        .select('*')
        .eq('user_id', userData.id);

      if (!isMounted) return;
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

    // Abonnement Realtime pour la réception d'étoiles instantanées
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

  // Filtrer les notes selon le profil sélectionné
  const filteredRatings = useMemo(() => {
    if (selectedProfileId === 'all') return ratingsList;
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
        value: dayRatings.length, // pour la courbe
      };
    });
  }, [filteredRatings]);

  const currentChartData = chartMetric === 'visits' ? weeklyVisits : weeklyRatings;

  const chartPoints = useMemo(() => {
    const max = Math.max(...currentChartData.map((day) => day.value), 1);
    return currentChartData.map((day, index) => `${index * 100},${90 - (day.value / max) * 70}`).join(' ');
  }, [currentChartData]);

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
    localStorage.setItem('folio-dashboard-theme', nextTheme);
  };

  const handleAnalysis = (event) => {
    event.preventDefault();
    if (!portfolioUrl.trim()) return;
    setShowAnalysisModal(true);
  };

  const handleBoostPurchase = async ({ secteur, tier }) => {
    const { data, error } = await supabase.rpc('subscribe_contact_boost', {
      target_user_id: userData.id,
      target_sector: secteur.label,
      contact_count: tier.contactCount,
      boost_cost: tier.price,
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.message || 'Impossible de souscrire ce forfait.');

    const details = { secteur: secteur.label, count: tier.contactCount, price: tier.price };
    await fetchBoostContacts(details);
    setBoostDetails(details);
    localStorage.setItem(`folio-boost-details-${userData.id}`, JSON.stringify(details));
    await fetchProfile();
    setShowAnalysisModal(false);
    triggerFireworks();
  };

  const fetchBoostContacts = async (details) => {
    if (!details?.secteur || !details?.count) return;
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
      if (!active) return;

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
    if (boostDetails) fetchBoostContacts(boostDetails);
  }, [boostDetails]);

  const fetchSearchStats = async () => {
    const { data, error } = await supabase.rpc('get_search_detection_stats', { target_user_id: userData.id });
    if (!error) setSearchStats(data || []);
  };

  const openSearchDetection = async () => {
    await fetchSearchStats();
    setShowSearchDetectionModal(true);
  };

  useEffect(() => {
    if (!showSearchDetectionModal) return undefined;
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

  return (
    <div className="dashboard-shell min-vh-100" data-theme={theme} style={{ backgroundColor: 'var(--folio-bg)' }}>
      {/* Navbar du dashboard */}
      <nav className="dashboard-nav navbar navbar-expand-lg py-3" style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(38, 33, 92, 0.08)' }}>
        <div className="container-fluid px-4">
          <div className="dashboard-brand-group">
            <span className="navbar-brand font-serif fs-4 mb-0" style={{ color: 'var(--folio-title)' }}>
              <i className="bi bi-grid-1x2 me-2" style={{ color: 'var(--folio-primary)' }}></i>
              Folio
            </span>
            <div className="dashboard-countdown" aria-label="Compte à rebours de la période Freemium">
              <span className="dashboard-countdown-label">Freemium dans</span>
              <FreeAccessCountdown compact />
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {/* Menu Déroulant du Profil */}
            <div className="dropdown">
              <button 
                className="btn btn-link p-0 text-title" 
                type="button" 
                id="profileDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
                onClick={fetchProfile}
                style={{ fontSize: '1.6rem', color: 'var(--folio-primary)' }}
              >
                <i className="bi bi-person-circle"></i>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow border-0 dashboard-profile-dropdown" aria-labelledby="profileDropdown" style={{ minWidth: '290px', borderRadius: '12px', padding: '10px' }}>
                <li className="px-3 py-2 border-bottom mb-2">
                  <div className="d-flex align-items-center gap-1">
                    <p className="fw-bold mb-0 text-title" style={{ fontSize: '0.95rem' }}>{userData.nom_complet || 'Utilisateur'}</p>
                    {isUserVerified && (
                      <img src={userBadgeImg} alt="Vérifié" title="les profils verifier son ceux que nous avons verifier personellement" style={{ width: '18px', height: '18px', objectFit: 'contain', cursor: 'pointer' }} />
                    )}
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{userData.email}</p>
                </li>
                <li>
                  <button className="dropdown-item py-2 text-primary fw-medium" onClick={() => setShowRechargeModal(true)}>
                    <i className="bi bi-wallet2 me-2"></i>
                    <span>{profileData?.solde > 0 ? 'Mon solde' : 'Recharger mon compte'}</span>
                    <span className="ms-2 fw-bold" style={{ color: 'var(--folio-primary)' }}>
                      {Number(profileData?.solde || 0).toLocaleString('fr-FR')} F CFA
                    </span>
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2 d-flex justify-content-between align-items-center" onClick={() => setShowVerificationModal(true)}>
                    <span>
                      <img src={userBadgeImg} alt="Badge" title="les profils verifier son ceux que nous avons verifier personellement" className="me-2" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                      <span className="fw-medium text-title">Badge de vérification</span>
                    </span>
                    {isUserVerified ? (
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill" style={{ fontSize: '0.7rem' }}>Actif</span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill" style={{ fontSize: '0.7rem' }}>500 F/mois</span>
                    )}
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2 d-flex justify-content-between align-items-center" onClick={() => setShowProMaxModal(true)}>
                    <span>
                      <i className="bi bi-rocket-takeoff-fill me-2" style={{ color: '#FF7A00' }}></i>
                      <span className="fw-bold text-title" style={{ color: isProMax ? '#FF7A00' : 'inherit' }}>Freelancer ProMax</span>
                    </span>
                    {isProMax ? (
                      <span className="badge rounded-pill" style={{ backgroundColor: '#FF7A00', color: 'white', fontSize: '0.7rem' }}>Actif 🚀</span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill" style={{ fontSize: '0.7rem' }}>250 F/mois</span>
                    )}
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
                <li className="px-3 py-2">
                  <div className="form-check form-switch mb-1">
                    <input
                      id="daily-account-email-opt-in"
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      checked={dailyEmailOptedIn}
                      disabled={dailyEmailPreferenceLoading || dailyEmailPreferenceSaving}
                      onChange={handleDailyEmailPreferenceChange}
                    />
                    <label className="form-check-label text-body-custom small" htmlFor="daily-account-email-opt-in">
                      Recevoir des missions par e-mail
                    </label>
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                    Envoi dès 20 h 30 (heure de Douala), par ordre de connexion récente. Désinscription depuis chaque e-mail.
                  </p>
                  {dailyEmailPreferenceError && <p className="text-danger small mt-2 mb-0" role="alert">{dailyEmailPreferenceError}</p>}
                </li>
                <li>
                  <button className="dropdown-item py-2 text-primary fw-medium" onClick={() => setShowOptimModal(true)}>
                    <i className="bi bi-lightning-charge me-2"></i>Optimiser mon Portfolio
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2 fw-medium" style={{ color: '#8b5cf6' }} onClick={handleOpenAiAnalysis}>
                    <i className="bi bi-magic me-2" style={{ color: '#8b5cf6' }}></i>Analyser par IA (Gemini)
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
                {isProMax && (
                  <li>
                    <button className="dropdown-item py-2" onClick={() => setShowBlogMaxModal(true)}>
                      <i className="bi bi-journal-richtext me-2 text-muted"></i>Blog Max
                    </button>
                  </li>
                )}
                <li>
                  <button className="dropdown-item py-2" onClick={() => setShowMyProfilesModal(true)}>
                    <i className="bi bi-person-vcard me-2 text-muted"></i>Mes Profils
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={onGoFreelancer}>
                    <i className="bi bi-briefcase me-2 text-muted"></i>Devenir Freelancer
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={openSearchDetection}>
                    <i className="bi bi-search me-2 text-muted"></i>Détecter les recherches
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={handleInviteFriends}>
                    <i className="bi bi-gift me-2 text-muted" style={{ color: '#16a34a' }}></i>
                    <span className="fw-medium">Inviter des amis</span>
                    <span className="ms-2 badge bg-success-subtle text-success border border-success-subtle rounded-pill" style={{ fontSize: '0.65rem' }}>+50 F/ami</span>
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={handleOpenProspectingModal}>
                    <i className="bi bi-people me-2 text-muted"></i>Trouver des contacts à qui vendre
                  </button>
                </li>
                <li>
                  <button className="dropdown-item py-2" onClick={() => setShowReportModal(true)}>
                    <i className="bi bi-flag me-2 text-muted"></i>Signaler un problème
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
        <div className="mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h1 className="font-serif mb-1 d-flex align-items-center gap-2" style={{ color: 'var(--folio-title)', fontSize: '1.75rem' }}>
              <span>Bienvenue, {userData.nom_complet || 'Développeur'}</span>
              {isUserVerified && (
                <img src={userBadgeImg} alt="Compte vérifié" title="les profils verifier son ceux que nous avons verifier personellement" style={{ width: '26px', height: '26px', objectFit: 'contain', cursor: 'pointer' }} />
              )}
              <span style={{ fontSize: '1.5rem' }}>👋</span>
            </h1>
            <p className="text-body-custom mb-0">Voici ton espace personnel Folio.</p>
          </div>

          {freelancerProfiles.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill">
                <i className="bi bi-person-check-fill me-1"></i>{freelancerProfiles.length} profil{freelancerProfiles.length > 1 ? 's' : ''} Freelancer actif{freelancerProfiles.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
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
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="btn-group" role="group" aria-label="Choisir la métrique du graphique">
                    <button 
                      type="button" 
                      className={`btn btn-sm ${chartMetric === 'visits' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
                      onClick={() => setMetric('visits')}
                    >
                      <i className="bi bi-graph-up me-1"></i>Visiteurs
                    </button>
                    <button 
                      type="button" 
                      className={`btn btn-sm ${chartMetric === 'stars' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
                      onClick={() => setMetric('stars')}
                    >
                      <i className="bi bi-star-fill text-warning me-1"></i>Étoiles reçues ⭐
                    </button>
                    <button 
                      type="button" 
                      className={`btn btn-sm ${chartMetric === 'clients' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
                      onClick={() => setMetric('clients')}
                    >
                      <i className="bi bi-briefcase-fill text-info me-1"></i>Demandes Clients 💼
                    </button>
                  </div>
                </div>

                {chartMetric === 'stars' && freelancerProfiles.length > 0 && (
                  <div className="d-flex align-items-center gap-2">
                    <label htmlFor="select-profile-filter" className="small text-muted mb-0 fw-medium">Profil :</label>
                    <select
                      id="select-profile-filter"
                      className="form-select form-select-sm"
                      style={{ maxWidth: '200px', borderRadius: '8px' }}
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                    >
                      <option value="all">Tous mes profils ({freelancerProfiles.length})</option>
                      {freelancerProfiles.map(p => (
                        <option key={p.id} value={p.id}>{p.nom_freelancer}</option>
                      ))}
                    </select>
                  </div>
                )}

                <span className="badge rounded-pill" style={{ backgroundColor: '#EEEDFE', color: 'var(--folio-primary)', fontSize: '0.8rem' }}>
                  {chartMetric === 'visits' ? (
                    `${visits.length} visite${visits.length > 1 ? 's' : ''} cette semaine`
                  ) : chartMetric === 'stars' ? (
                    `${filteredRatings.length} avis / étoile${filteredRatings.length > 1 ? 's' : ''} en temps réel`
                  ) : (
                    `${clientRequests.length} demande${clientRequests.length > 1 ? 's' : ''} client${clientRequests.length > 1 ? 's' : ''}`
                  )}
                </span>
              </div>

              {chartMetric === 'clients' ? (
                <div className="rounded-3 p-3" style={{ backgroundColor: '#FAFAFE', border: '1px solid rgba(38, 33, 92, 0.08)' }}>
                  <h6 className="fw-bold font-serif mb-3 text-title d-flex align-items-center justify-content-between">
                    <span><i className="bi bi-person-workspace text-primary me-2"></i>Clients ayant postulé pour des projets</span>
                    <span className="badge bg-primary rounded-pill small">{clientRequests.length} au total</span>
                  </h6>

                  {clientRequests.length === 0 ? (
                    <p className="text-center text-muted small py-4 mb-0">
                      <i className="bi bi-folder2-open d-block fs-3 mb-2 opacity-50"></i>
                      Aucune demande client pour le moment. Les projets publiés par les clients apparaîtront ici.
                    </p>
                  ) : (
                    <div
                      className="d-flex flex-column gap-2"
                      style={
                        clientRequests.length > 4
                          ? { maxHeight: '420px', overflowY: 'auto', paddingRight: '4px', scrollbarGutter: 'stable' }
                          : { }
                      }
                    >
                      {clientRequests.map((client) => (
                        <div 
                          key={client.id}
                          className="p-3 bg-white rounded-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between border"
                          style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onClick={() => handleOpenClientModal(client)}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle text-info d-flex align-items-center justify-content-center fw-bold fs-5" style={{ width: '44px', height: '44px', backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                              {client.prenom ? client.prenom.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <button 
                                type="button" 
                                className="btn btn-link p-0 fw-bold text-dark text-decoration-none text-start fs-6 mb-0"
                                onClick={(e) => { e.stopPropagation(); handleOpenClientModal(client); }}
                              >
                                {client.prenom} {client.nom}
                              </button>
                              <div className="d-flex flex-wrap align-items-center gap-2 text-muted small mt-1" style={{ fontSize: '0.78rem' }}>
                                <span><i className="bi bi-geo-alt me-1 text-danger"></i>{client.pays}</span>
                                <span>•</span>
                                <span className="badge text-bg-light border">{client.preference_freelance === 'local' ? 'Freelancer Local' : client.preference_freelance === 'externe' ? 'Freelancer Externe' : 'Tout profil'}</span>
                                <span>•</span>
                                <span className="badge text-bg-primary-subtle text-primary border border-primary-subtle fw-semibold">
                                  <i className="bi bi-eye me-1"></i>{client.views_count || 0} vue{(client.views_count || 0) > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-2 mt-2 mt-sm-0">
                            <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                              {new Date(client.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                            <button 
                              type="button" 
                              className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-medium"
                              style={{ fontSize: '0.78rem' }}
                              onClick={(e) => { e.stopPropagation(); handleOpenClientModal(client); }}
                            >
                              <i className="bi bi-eye me-1"></i>Détails
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="visitors-chart rounded-3 p-3" style={{ backgroundColor: '#FAFAFE', border: '1px solid rgba(38, 33, 92, 0.08)' }}>
                  <svg viewBox="0 0 600 120" className="w-100" role="img" aria-label="Courbe du tableau de bord">
                    <polyline points={chartPoints} fill="none" stroke={chartMetric === 'stars' ? '#f59e0b' : 'var(--folio-primary)'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    {currentChartData.map((day, index) => (
                      <circle 
                        key={day.label} 
                        cx={index * 100} 
                        cy={90 - (day.value / Math.max(...currentChartData.map((item) => item.value), 1)) * 70} 
                        r="5" 
                        fill="white" 
                        stroke={chartMetric === 'stars' ? '#f59e0b' : 'var(--folio-primary)'} 
                        strokeWidth="3" 
                      />
                    ))}
                  </svg>
                  <div className="d-flex justify-content-between text-muted small px-1 mt-2">
                    {currentChartData.map((day) => (
                      <div key={day.label} className="text-center">
                        <span className="d-block fw-bold" style={{ fontSize: '0.75rem' }}>{day.label}</span>
                        <span className="d-block text-muted" style={{ fontSize: '0.7rem' }}>
                          {chartMetric === 'stars' ? (day.value > 0 ? `+${day.value} ⭐` : '0') : day.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {chartMetric === 'visits' && !visits.length && (
                    <p className="text-center text-body-custom small mt-3 mb-0">Les visites apparaîtront ici dès qu'un visiteur ouvrira ton portfolio.</p>
                  )}
                  {chartMetric === 'stars' && !filteredRatings.length && (
                    <p className="text-center text-body-custom small mt-3 mb-0">
                      <i className="bi bi-star me-1 text-warning"></i>
                      Aucune étoile reçue pour le moment sur {selectedProfileId === 'all' ? 'tes profils' : 'ce profil'}. Tes étoiles apparaîtront en temps réel dès qu'un utilisateur votera !
                    </p>
                  )}
                </div>
              )}
              {boostContacts.length > 0 && (
                <>
                  <div className="boost-contacts-desktop">
                    <BoostContactsList contacts={boostContacts} details={boostDetails} userId={userData.id} instanceId="desktop" />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary-custom w-100 mt-3 boost-contacts-mobile-trigger"
                    onClick={() => setShowBoostContactsSheet(true)}
                  >
                    <i className="bi bi-telephone-outbound me-2"></i>Appeler Prospects
                  </button>
                </>
              )}
              {boostDetails && boostContacts.length === 0 && (
                <div className="alert alert-info mt-3 mb-0" role="status">
                  {boostContactsError || 'Les contacts de ton forfait seront affichés ici dès qu’ils seront disponibles.'}
                </div>
              )}
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
                  {profileData?.portfolio_url ? (
                    <>
                      <i className="bi bi-rocket-takeoff me-1"></i>Booster mon portfolio et trouver des clients
                    </>
                  ) : (
                    <>
                      <i className="bi bi-bar-chart-line me-1"></i>Lancer l'analyse
                    </>
                  )}
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
                    className="btn btn-outline-custom btn-sm w-100 py-1.5 mb-2" 
                    onClick={() => setShowOptimModal(true)}
                  >
                    <i className="bi bi-pencil-square me-1"></i>Modifier le profil
                  </button>

                  <button 
                    className="btn btn-sm w-100 py-1.5 text-white" 
                    style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
                    onClick={handleOpenAiAnalysis}
                  >
                    <i className="bi bi-magic me-1"></i>Analyser par IA
                  </button>
                </div>
              )}
            </div>
            {boostContacts.length > 0 && (
              <div className="boost-contacts-desktop">
                <SeoResultsPanel portfolioUrl={profileData?.portfolio_url || portfolioUrl} profileData={profileData} details={boostDetails} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal de recharge */}
      {showRechargeModal && (
        <RechargeModal
          userData={userData}
          profileData={profileData}
          onPaymentConfirmed={fetchProfile}
          onClose={() => setShowRechargeModal(false)}
        />
      )}

      {/* Modal d'optimisation du portfolio */}
      {showOptimModal && (
        <PortfolioOptimizationModal
          userId={userData.id}
          initialData={profileData}
          onClose={() => setShowOptimModal(false)}
          onComplete={async () => {
            setShowOptimModal(false);
            await fetchProfile();
            triggerFireworks();
          }}
        />
      )}

      {/* Modal d'analyse / boost */}
      {showAnalysisModal && (
        <AnalysisModal
          portfolioUrl={portfolioUrl}
          profileData={profileData}
          onPurchase={handleBoostPurchase}
          onClose={() => setShowAnalysisModal(false)}
        />
      )}

      {/* Modal d'analyse IA Gemini */}
      {showAiAnalysisModal && (
        <AiAnalysisModal
          portfolioUrl={portfolioUrl}
          profileData={profileData}
          userData={userData}
          onClose={() => setShowAiAnalysisModal(false)}
        />
      )}

      {showMyProfilesModal && (
        <MyProfilesModal
          userId={userData.id}
          userName={userData.nom_complet}
          isProMax={isProMax}
          onClose={() => setShowMyProfilesModal(false)}
        />
      )}

      {/* Modal de détail d'un client */}
      {selectedClient && (
        <div 
          className="modal fade show d-block" 
          tabIndex="-1" 
          role="dialog" 
          style={{ backgroundColor: 'rgba(38, 33, 92, 0.55)', backdropFilter: 'blur(5px)', zIndex: 1060 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedClient(null); }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 bg-light px-4 py-3">
                <h5 className="modal-title font-serif fw-bold text-title mb-0">
                  <i className="bi bi-person-vcard text-primary me-2"></i>
                  Détails de la demande client
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedClient(null)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-3" style={{ backgroundColor: '#F4F4FD' }}>
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-4 shadow-sm" style={{ width: '60px', height: '60px', backgroundColor: 'var(--folio-primary)' }}>
                    {selectedClient.prenom ? selectedClient.prenom.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <h4 className="fw-bold text-dark mb-1">{selectedClient.prenom} {selectedClient.nom}</h4>
                    <div className="d-flex flex-wrap align-items-center gap-2 text-muted small">
                      <span><i className="bi bi-geo-alt-fill text-danger me-1"></i>{selectedClient.pays}</span>
                      <span>•</span>
                      <span><i className="bi bi-clock me-1"></i>Publié le {new Date(selectedClient.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="badge bg-primary text-white rounded-pill px-2.5 py-1">
                        <i className="bi bi-eye-fill me-1"></i>{selectedClient.views_count || 0} vue{(selectedClient.views_count || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 bg-white h-100 shadow-sm">
                      <label className="text-muted small fw-bold d-block mb-1">
                        <i className="bi bi-telephone-fill text-success me-1"></i>Téléphone / WhatsApp / Telegram
                      </label>
                      <div className="d-flex flex-column gap-2 mt-2">
                        <span className="fw-bold text-dark fs-6">{selectedClient.telephone}</span>
                        <div className="d-flex flex-wrap gap-2">
                          <a 
                            href={`https://wa.me/${selectedClient.telephone.replace(/[^0-9]/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-sm btn-success rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1"
                          >
                            <i className="bi bi-whatsapp"></i> WhatsApp
                          </a>
                          <a 
                            href={selectedClient.telephone.startsWith('http') ? selectedClient.telephone : `https://t.me/${selectedClient.telephone.replace('@', '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-sm btn-info text-white rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1"
                          >
                            <i className="bi bi-telegram"></i> Telegram
                          </a>
                          <a 
                            href={`tel:${selectedClient.telephone.replace(/[^0-9+]/g, '')}`} 
                            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1"
                          >
                            <i className="bi bi-telephone"></i> Appeler
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="p-3 border rounded-3 bg-white h-100 shadow-sm">
                      <label className="text-muted small fw-bold d-block mb-1">
                        <i className="bi bi-geo text-primary me-1"></i>Préférence Freelancer
                      </label>
                      <div className="mt-2">
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle fs-6 px-3 py-2 rounded-pill fw-bold">
                          {selectedClient.preference_freelance === 'local' ? 'Freelancer Local (dans son pays)' : selectedClient.preference_freelance === 'externe' ? 'Freelancer Externe (Remote)' : 'N\'importe quel profil (Indifférent)'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 border rounded-3 bg-white shadow-sm">
                  <label className="text-muted small fw-bold d-block mb-2">
                    <i className="bi bi-file-text text-warning me-1"></i>Description complète du projet
                  </label>
                  <p className="text-dark mb-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    {selectedClient.description_projet}
                  </p>
                </div>
              </div>

              <div className="modal-footer border-0 bg-light px-4 py-3">
                <button type="button" className="btn btn-secondary rounded-pill px-4 fw-medium" onClick={() => setSelectedClient(null)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVerificationModal && (
        <VerificationModal
          userData={userData}
          profileData={profileData}
          onRefreshProfile={fetchProfile}
          onOpenRecharge={() => setShowRechargeModal(true)}
          triggerFireworks={triggerFireworks}
          onClose={() => setShowVerificationModal(false)}
        />
      )}

      {showProMaxModal && (
        <ProMaxModal
          userData={userData}
          profileData={profileData}
          onRefreshProfile={fetchProfile}
          onOpenRecharge={() => setShowRechargeModal(true)}
          onClose={() => setShowProMaxModal(false)}
        />
      )}

      {showReportModal && (
        <ReportProblemModal
          userId={userData.id}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showSearchDetectionModal && (
        <SearchDetectionModal stats={searchStats} onRefresh={fetchSearchStats} onClose={() => setShowSearchDetectionModal(false)} />
      )}

      {showProspectingModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(38, 33, 92, 0.55)', backdropFilter: 'blur(5px)', zIndex: 1060 }} onClick={(e) => { if (e.target === e.currentTarget) { setShowProspectingModal(false); setProspectingSeenKeys(new Set()); setProspectingBatch([]); } }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px', overflow: 'hidden' }}>
              <div className="modal-header border-0 bg-light px-4 py-3">
                <h5 className="modal-title font-serif fw-bold text-title mb-0">
                  <i className="bi bi-people-fill text-primary me-2"></i>
                  Prospection ciblée
                </h5>
                <button type="button" className="btn-close" onClick={() => { setShowProspectingModal(false); setProspectingSeenKeys(new Set()); setProspectingBatch([]); }}></button>
              </div>

              <div className="modal-body p-4">
                {!boostContacts || boostContacts.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-exclamation-circle d-block fs-3 text-warning mb-2"></i>
                    <p className="mb-3 text-body-custom">Vous n’avez pas encore accès aux contacts de prospection.</p>
                    <button type="button" className="btn btn-primary-custom" onClick={() => setShowProMaxModal(true)}>
                      Souscrire au programme
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold text-title mb-1">10 contacts à viser</h6>
                        <p className="small text-muted mb-0">Des contacts non dupliqués, sélectionnés parmi vos prospects.</p>
                      </div>
                      <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle">
                        {prospectingBatch.length} / {Math.min(10, boostContacts.length)} affichés
                      </span>
                    </div>

                    <div className="row g-3">
                      {prospectingBatch.map((contact) => (
                        <div className="col-md-6" key={`${getBoostContactKey(contact)}-${contact.name}`}>
                          <div className="p-3 rounded-3 border h-100" style={{ backgroundColor: '#FAFAFE' }}>
                            <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                              <div className="fw-bold text-title">{contact.name}</div>
                              <span className="badge text-bg-light border">Prospect</span>
                            </div>

                            {contact.email && (
                              <div className="small text-muted mb-2">
                                <i className="bi bi-envelope me-1"></i>
                                {contact.email}
                              </div>
                            )}

                            {contact.phone && (
                              <div className="small text-muted mb-2">
                                <i className="bi bi-whatsapp me-1 text-success"></i>
                                {contact.phone}
                              </div>
                            )}

                            {contact.whatsappPhone ? (
                              <a
                                href={`https://wa.me/${contact.whatsappPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm btn-success w-100"
                              >
                                <i className="bi bi-whatsapp me-1"></i>Contacter sur WhatsApp
                              </a>
                            ) : (
                              <a
                                href={`mailto:${contact.email}`}
                                className="btn btn-sm btn-outline-primary w-100"
                              >
                                <i className="bi bi-envelope me-1"></i>Envoyer un email
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-4 gap-2 flex-wrap">
                      <button type="button" className="btn btn-outline-custom" onClick={() => { setShowProspectingModal(false); setProspectingSeenKeys(new Set()); setProspectingBatch([]); }}>
                        Fermer
                      </button>
                      <button type="button" className="btn btn-primary-custom" onClick={handleNextProspectingBatch}>
                        <i className="bi bi-arrow-repeat me-1"></i>Autres contacts
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showBlogMaxModal && (
        isMobile ? (
          <div className="mobile-bottom-sheet-overlay" onClick={(event) => { if (event.target === event.currentTarget) setShowBlogMaxModal(false); }}>
            <div className="mobile-bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="blog-max-sheet-title">
              <div className="mobile-bottom-sheet-header">
                <div className="d-flex align-items-center gap-2">
                  <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #534AB7, #8B5CF6)', color: 'white' }}>
                    <i className="bi bi-journal-richtext"></i>
                  </span>
                  <h2 id="blog-max-sheet-title" className="h5 font-serif fw-bold text-title mb-0">Blog Max</h2>
                </div>
                <button type="button" className="btn btn-link p-0 text-muted" onClick={() => setShowBlogMaxModal(false)} aria-label="Fermer">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="p-4">
                <div className="rounded-4 p-3 mb-3" style={{ background: 'linear-gradient(135deg, rgba(83,74,183,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(83,74,183,0.12)' }}>
                  <div className="small text-uppercase fw-bold" style={{ letterSpacing: '0.08em', color: 'var(--folio-primary)' }}>Disponible à partir du</div>
                  <div className="display-6 fw-bold text-title mt-2">12 Novembre</div>
                </div>
                <p className="text-title fw-semibold mb-2">Un espace blog pensé pour les freelancers</p>
                <p className="mb-3 text-body-custom">Blog Max va permettre aux freelancers de publier des articles, partager leur expertise, renforcer leur visibilité et mieux propulser leur activité.</p>
                <p className="mb-3 text-body-custom">Cette fonctionnalité offrira aussi un espace de discussion direct avec leurs clients, sans jamais sortir du site, pour faciliter la conversion, la confiance et les échanges.</p>
                <div className="d-flex align-items-center gap-2 rounded-3 p-3" style={{ backgroundColor: '#F4F1FE' }}>
                  <i className="bi bi-chat-dots-fill fs-4" style={{ color: 'var(--folio-primary)' }}></i>
                  <div>
                    <div className="fw-semibold text-title">Chat client intégré</div>
                    <small className="text-muted">Échanges premium directement sur Folio</small>
                  </div>
                </div>
                <button type="button" className="btn btn-primary-custom w-100 mt-4" onClick={() => setShowBlogMaxModal(false)}>Compris</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="modal fade show d-block blog-max-desktop-modal" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(38, 33, 92, 0.45)', backdropFilter: 'blur(4px)', zIndex: 2050 }} onClick={(event) => { if (event.target === event.currentTarget) setShowBlogMaxModal(false); }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content border-0 shadow" style={{ borderRadius: '22px', overflow: 'hidden' }}>
                <div className="p-4 pb-0">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <span className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #534AB7, #8B5CF6)', color: 'white' }}>
                        <i className="bi bi-journal-richtext fs-5"></i>
                      </span>
                      <div>
                        <div className="small text-uppercase fw-bold" style={{ letterSpacing: '0.08em', color: 'var(--folio-primary)' }}>Blog Max</div>
                        <h5 className="modal-title font-serif fw-bold text-title mb-0">Bientôt disponible</h5>
                      </div>
                    </div>
                    <button type="button" className="btn-close" onClick={() => setShowBlogMaxModal(false)} aria-label="Fermer"></button>
                  </div>
                </div>
                <div className="modal-body px-4 py-3">
                  <div className="rounded-4 p-3 mb-3 text-center" style={{ background: 'linear-gradient(135deg, rgba(83,74,183,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(83,74,183,0.12)' }}>
                    <div className="small text-uppercase fw-bold" style={{ letterSpacing: '0.08em', color: 'var(--folio-primary)' }}>Disponible à partir du</div>
                    <div className="display-6 fw-bold text-title mt-2">12 Novembre</div>
                  </div>
                  <p className="text-title fw-semibold mb-2">Un espace blog pensé pour les freelancers</p>
                  <p className="mb-3 text-body-custom">Blog Max permettra aux freelancers d’avoir un espace blog pour publier des articles, partager leur expertise et mieux propulser leur activité.</p>
                  <p className="mb-0 text-body-custom">Ils pourront aussi discuter directement avec leurs clients sur le site, sans jamais quitter la plateforme.</p>
                </div>
                <div className="modal-footer border-0 px-4 pb-4 pt-0">
                  <button type="button" className="btn btn-primary-custom w-100" onClick={() => setShowBlogMaxModal(false)}>Fermer</button>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {showBoostContactsSheet && (
        <div className="mobile-bottom-sheet-overlay" onClick={(event) => { if (event.target === event.currentTarget) setShowBoostContactsSheet(false); }}>
          <div className="mobile-bottom-sheet dashboard-contacts-sheet" role="dialog" aria-modal="true" aria-labelledby="boost-contacts-sheet-title">
            <div className="mobile-bottom-sheet-header">
              <h2 id="boost-contacts-sheet-title" className="h5 font-serif fw-bold text-title mb-0">Tes prospects</h2>
              <button type="button" className="btn btn-link p-0 text-muted" onClick={() => setShowBoostContactsSheet(false)} aria-label="Fermer">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <BoostContactsList contacts={boostContacts} details={boostDetails} userId={userData.id} instanceId="mobile" />
          </div>
        </div>
      )}
    </div>
  );
}

function SeoResultsPanel({ portfolioUrl, profileData, details }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const portfolioHost = portfolioUrl?.replace(/^https?:\/\//i, '').replace(/\/$/, '') || 'ton-portfolio.com';
  const profession = profileData?.profession || details?.secteur || 'professionnel du digital';

  const analyzePortfolio = async () => {
    if (!portfolioUrl) return;
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
        } catch {
          // La réponse peut être vide lorsque la fonction n'est pas déployée.
        }
      }
      const rawMessage = providerMessage || analysisError?.message || '';
      setError(rawMessage.includes('not found') || rawMessage.includes('Failed to send')
        ? "L'analyse SEO n'est pas encore activée sur le serveur. La fonction Edge analyze-portfolio doit être déployée dans Supabase."
        : rawMessage || 'Analyse impossible pour le moment.');
    } else {
      setAnalysis(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    analyzePortfolio();
  }, [portfolioUrl]);

  const metrics = analysis?.metrics;
  const seoCode = analysis?.headCode || '';

  return (
    <div className="dashboard-panel bg-white rounded-3 p-4 mt-3" style={{ border: '1px solid rgba(38, 33, 92, 0.08)' }}>
      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
        <div>
          <h6 className="font-serif mb-1" style={{ color: 'var(--folio-title)' }}><i className="bi bi-bar-chart-line me-2" style={{ color: 'var(--folio-primary)' }}></i>Analyse SEO</h6>
          <p className="small text-muted mb-0">Analyse réelle de {portfolioHost} et recommandations personnalisées.</p>
        </div>
        {analysis && <span className="badge text-bg-success">Score {analysis.score}/100</span>}
      </div>
      {loading && <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary me-2"></span>Analyse du portfolio en cours...</div>}
      {error && <div className="alert alert-warning py-2 px-3 small"><i className="bi bi-exclamation-triangle me-1"></i>{error}</div>}
      {metrics && <div className="row g-2 mb-3">
        <div className="col-6"><div className="p-2 rounded-2" style={{ backgroundColor: '#F4F1FE' }}><div className="small text-muted">Titre</div><strong className="text-title">{metrics.title ? 'Présent' : 'Absent'}</strong></div></div>
        <div className="col-6"><div className="p-2 rounded-2" style={{ backgroundColor: '#E8F5EC' }}><div className="small text-muted">Description</div><strong className="text-title">{metrics.description ? `${metrics.description.length} caractères` : 'Absente'}</strong></div></div>
        <div className="col-6"><div className="p-2 rounded-2" style={{ backgroundColor: '#FFF7E6' }}><div className="small text-muted">H1 / images sans alt</div><strong className="text-title">{metrics.h1Count} / {metrics.imagesWithoutAlt}</strong></div></div>
        <div className="col-6"><div className="p-2 rounded-2" style={{ backgroundColor: '#EEF1FB' }}><div className="small text-muted">Contenu visible</div><strong className="text-title">{metrics.textLength} caractères</strong></div></div>
      </div>}
      {analysis?.recommendations?.length > 0 && <ul className="small text-body-custom ps-3 mb-3">{analysis.recommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}</ul>}
      {analysis && !analysis.recommendations?.length && <p className="small text-success"><i className="bi bi-check-circle me-1"></i>Aucune amélioration prioritaire détectée.</p>}
      <label className="small text-muted fw-semibold mb-1" htmlFor="seo-head-code">Code à coller dans le &lt;head&gt; de {portfolioHost}</label>
      <textarea id="seo-head-code" className="form-control font-monospace small" rows="6" readOnly value={seoCode || 'Le code apparaîtra après l’analyse.'} onFocus={(event) => event.target.select()} />
      <div className="d-flex justify-content-between align-items-center gap-2 mt-2">
        <p className="small text-muted mb-0"><i className="bi bi-info-circle me-1"></i>Colle ce code dans le &lt;head&gt; de ta page HTML.</p>
        <button type="button" className="btn btn-sm btn-outline-custom flex-shrink-0" onClick={analyzePortfolio} disabled={loading}><i className="bi bi-arrow-clockwise me-1"></i>Analyser</button>
      </div>
    </div>
  );
}

function SearchDetectionModal({ stats, onRefresh, onClose }) {
  const totalSearches = stats.reduce((sum, item) => sum + Number(item.search_count || 0), 0);

  return (
    <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(38, 33, 92, 0.45)', backdropFilter: 'blur(4px)', zIndex: 2050 }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px' }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <h5 className="modal-title font-serif fw-bold text-title"><i className="bi bi-search me-2"></i>Détection de recherche</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Fermer"></button>
          </div>
          <div className="modal-body px-4 py-4">
            <div className="rounded-3 p-3 mb-3" style={{ backgroundColor: '#F4F1FE' }}>
              <div className="small text-muted">Personnes estimées ayant recherché tes profils</div>
              <div className="display-6 fw-bold text-title">{totalSearches}</div>
              <div className="small text-muted">Mise à jour en temps réel à chaque recherche enregistrée.</div>
            </div>
            {stats.length ? (
              <div className="list-group list-group-flush">
                {stats.map((item) => (
                  <div className="list-group-item px-0 d-flex justify-content-between align-items-center" key={`${item.profession}-${item.search_query}`}>
                    <div><strong className="text-title">{item.profession || 'Métier non précisé'}</strong><div className="small text-muted">Recherche : “{item.search_query}”</div></div>
                    <span className="badge rounded-pill text-bg-primary">{item.search_count}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted small mb-0">Aucune recherche enregistrée pour le moment. Les résultats apparaîtront quand un visiteur cherchera ton nom ou ton métier.</p>}
          </div>
          <div className="modal-footer border-0 px-4 pb-4">
            <button type="button" className="btn btn-outline-custom" onClick={onRefresh}><i className="bi bi-arrow-clockwise me-1"></i>Actualiser</button>
            <button type="button" className="btn btn-primary-custom" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
  MODAL DU BADGE DE VÉRIFICATION — 500 F CFA / Mois par Utilisateur
─────────────────────────────────────────────────────────────────── */
function VerificationModal({ userData, profileData, onRefreshProfile, onOpenRecharge, triggerFireworks, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const isVerified = Boolean(
    profileData?.is_verified &&
    profileData?.verified_until &&
    new Date(profileData.verified_until) > new Date()
  );

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
        // Fallback direct si la fonction RPC n'est pas encore rechargée sur PostgREST
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

        if (updateError) throw updateError;
      } else if (data && !data.success) {
        throw new Error(data.message);
      }

      setSuccessMsg("Votre Badge de vérification est maintenant actif pour 30 jours !");
      await onRefreshProfile();
      triggerFireworks();
    } catch (err) {
      console.error("Erreur d'activation du badge:", err);
      setError(err?.message || "Une erreur est survenue lors de l'activation.");
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
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
            <h5 className="modal-title font-serif fw-bold fs-4 text-title d-flex align-items-center gap-2">
              <img src={verifieBadge} alt="Badge" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
              Badge de vérification
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Fermer" disabled={loading}></button>
          </div>
          <div className="modal-body py-4 px-4">
            {successMsg ? (
              <div className="text-center py-3">
                <i className="bi bi-patch-check-fill text-success" style={{ fontSize: '3.5rem' }}></i>
                <h4 className="font-serif fw-bold text-title mt-2">Félicitations !</h4>
                <p className="text-body-custom">{successMsg}</p>
                <p className="small text-muted mb-4">Le badge s'affiche désormais à côté de votre nom et sur tous vos profils freelancers.</p>
                <button type="button" className="btn btn-primary-custom w-100" onClick={onClose}>Fermer</button>
              </div>
            ) : (
              <>
                <div className="text-center mb-4 p-3 rounded-3" style={{ backgroundColor: '#F4F1FE' }}>
                  <img src={isVerified && profileData?.badge_color === 'orange' ? orangeBadge : verifieBadge} alt="Vérifié" className="mb-2 shadow-sm rounded-circle p-1 bg-white" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                  <h6 className="fw-bold text-title mb-1">Certifiez votre identité sur Folio</h6>
                  <p className="small text-muted mb-0">Le badge de vérification renforce la confiance des clients et augmente vos opportunités.</p>
                </div>

                <div className="border rounded-3 p-3 mb-4 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-body-custom">Tarif mensuel</span>
                    <strong className="fs-5 text-primary">500 F CFA / mois</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-body-custom">Votre solde actuel</span>
                    <strong className={Number(profileData?.solde || 0) >= 500 ? 'text-success' : 'text-danger'}>
                      {Number(profileData?.solde || 0).toLocaleString('fr-FR')} F CFA
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-body-custom">Portée du badge</span>
                    <span className="badge text-bg-light border">Par utilisateur (tous profils)</span>
                  </div>
                </div>

                {isVerified && (
                  <div className="alert alert-success py-2 px-3 small mb-3">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Votre badge est actuellement actif jusqu'au {new Date(profileData.verified_until).toLocaleDateString('fr-FR')}. Cliquez ci-dessous pour prolonger de 30 jours supplémentaires.
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger py-2 px-3 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    {Number(profileData?.solde || 0) < 500 && (
                      <div className="mt-2">
                        <button type="button" className="btn btn-sm btn-primary-custom" onClick={() => { onClose(); onOpenRecharge(); }}>
                          <i className="bi bi-wallet2 me-1"></i>Recharger mon solde
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-custom w-50 py-2" onClick={onClose} disabled={loading}>
                    Annuler
                  </button>
                  <button type="button" className="btn btn-primary-custom w-50 py-2" onClick={handleSubscribe} disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-patch-check me-1"></i>}
                    {isVerified ? 'Prolonger (500 F)' : 'Activer (500 F)'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


/* ───────────────────────────────────────────────────────────────────
  MODAL DE RECHARGE — Paiement SasPay Mobile Money
─────────────────────────────────────────────────────────────────── */
const PACKS = [
  { id: 'test',    label: 'Mode Débutant', title: 'Mode Débutant', desc: 'Accès de test aux fonctionnalités premium', amount: 500 },
  { id: 'starter', label: 'Mode Starter', title: 'Mode Starter', desc: 'SEO portfolio et traqueur de clics', amount: 800 },
  { id: 'pro',     label: 'Mode Boost', title: 'Mode Boost', desc: 'Recommandations et prospection',     amount: 15000 },
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
      if (typeof item === 'string') return { value: item, label: item };
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
      if (!active) return;
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
      if (timeoutId) window.clearTimeout(timeoutId);
      if (channel) void supabase.removeChannel(channel);
    };

    const finish = async (status) => {
      if (settled || !status || status === 'pending') return;
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

      if (!transactionError && data?.status) await finish(String(data.status).toLowerCase());
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
      if (settled) return;
      await transactionStatus();
      if (settled) return;

      settled = true;
      cleanup();
      setLoading(false);
      setPaymentStatus('pending');
      setError('Le paiement a bien été envoyé à SasPay, mais sa confirmation prend plus de temps que prévu. Ne relance pas le paiement : ton solde sera crédité dès la confirmation.');
      resolve(false);
    }, 120000);
  });

  const handlePayment = async () => {
    if (!selectedPack) return;
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

      // Erreur Supabase (réseau, CORS, etc.)
      if (fnError) {
        console.error('Supabase function error:', fnError);
        let providerError = data?.error?.message || data?.message;
        if (!providerError && fnError.context?.json) {
          try {
            const errorBody = await fnError.context.json();
            providerError = errorBody?.error?.message || errorBody?.message;
          } catch {
            // La réponse peut ne pas être du JSON selon le service distant.
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

      // Erreur renvoyée par l'API SasPay via la Edge Function
      if (data?.error) {
        console.error('SasPay API error:', data.error);
        setError(`Erreur SasPay : ${data.error.message || JSON.stringify(data.error)}`);
        return;
      }

      // Succès → redirection vers la page de checkout ou confirmation du push USSD
      const checkoutUrl = data?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else if (data?.payment_reference) {
        setPaymentStatus('pending');
        await waitForPayment(data.payment_reference);
      } else {
        setError('Le paiement a été envoyé, mais SasPay n’a pas fourni de référence pour suivre sa confirmation.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(`Erreur inattendue : ${err.message}`);
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
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content border-0 shadow" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center">
            <h5 className="modal-title font-serif fw-bold fs-4 text-title">Recharger mon compte</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Fermer" disabled={loading}></button>
          </div>
          <div className="modal-body py-4 px-4">
            {paymentStatus === 'success' ? (
              <div className="text-center py-4">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                <h4 className="font-serif fw-bold text-title mt-3">Paiement réussi</h4>
                <p className="text-body-custom mb-2">Ton compte a été rechargé avec succès.</p>
                <p className="fw-bold text-success mb-4">+{selectedPack?.amount.toLocaleString('fr-FR')} F CFA ajoutés à ton solde</p>
                <button type="button" className="btn btn-primary-custom w-100" onClick={onClose}>Fermer</button>
              </div>
            ) : (
              <>
            <p className="text-body-custom mb-4" style={{ fontSize: '0.95rem' }}>
              {paymentStep === 1
                ? 'Choisis ton forfait pour recharger ton solde.'
                : 'Renseigne tes informations Mobile Money pour lancer le paiement.'}
            </p>

            <div className="d-flex align-items-center gap-2 mb-4" aria-label="Étapes du paiement">
              <span className={`badge rounded-pill ${paymentStep === 1 ? 'text-bg-primary' : 'text-bg-success'}`}>1. Forfait</span>
              <div className="flex-grow-1 border-top"></div>
              <span className={`badge rounded-pill ${paymentStep === 2 ? 'text-bg-primary' : 'text-bg-secondary'}`}>2. Paiement</span>
            </div>

            {paymentStep === 1 && (
              <>
                <div className="d-flex flex-column gap-3 mb-4">
                  {PACKS.map((pack) => {
                    const isSelected = selectedPack?.id === pack.id;
                    return (
                      <button
                        type="button"
                        key={pack.id}
                        className="p-3 rounded-3 d-flex justify-content-between align-items-center text-start"
                        style={{
                          border: isSelected ? '2px solid var(--folio-primary)' : '1.5px solid rgba(38,33,92,0.12)',
                          backgroundColor: isSelected ? '#F8F7FF' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onClick={() => { setSelectedPack(pack); setError(null); }}
                      >
                        <span>
                          <span className="badge mb-1" style={{ backgroundColor: isSelected ? 'var(--folio-primary)' : '#6c757d', color: 'white', fontSize: '0.75rem' }}>{pack.label}</span>
                          <strong className="d-block text-title">{pack.title}</strong>
                          <small className="text-muted d-block">{pack.desc}</small>
                        </span>
                        <span className="d-flex align-items-center gap-2">
                          <strong className="fs-5" style={{ color: isSelected ? 'var(--folio-primary)' : 'var(--folio-title)' }}>{pack.amount.toLocaleString('fr-FR')} F</strong>
                          {isSelected && <i className="bi bi-check-circle-fill" style={{ color: 'var(--folio-primary)' }}></i>}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="btn btn-primary-custom w-100 py-2" onClick={() => setPaymentStep(2)} disabled={!selectedPack}>
                  Suivant <i className="bi bi-arrow-right ms-2"></i>
                </button>
              </>
            )}

            {paymentStep === 2 && (
              <div className="mb-4">
                <label className="form-label text-body-custom small fw-medium">
                  <i className="bi bi-globe2 me-1"></i>Pays
                </label>
                <select className="form-select" value={country} onChange={handleCountryChange} disabled={loading || networksLoading}>
                  {paymentCountries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
                </select>
                {networksLoading && <small className="text-muted d-block mt-1">Chargement des pays et moyens disponibles...</small>}
                <label className="form-label text-body-custom small fw-medium mt-3">
                  <i className="bi bi-phone me-1"></i>Numéro Mobile Money
                </label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder={country === 'CI' ? '+225 01 02 03 04 05' : 'Ton numéro Mobile Money'}
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(null); }}
                  disabled={loading}
                />
                <label className="form-label text-body-custom small fw-medium mt-3">
                  <i className="bi bi-wallet2 me-1"></i>Moyen de paiement
                </label>
                <select className="form-select" value={network} onChange={(e) => setNetwork(e.target.value)} disabled={loading}>
                  {selectedCountry.networks.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </div>
            )}
              </>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: '0.85rem', borderRadius: '10px' }}>
                <i className="bi bi-exclamation-triangle me-2"></i>{error}
              </div>
            )}

            {paymentStep === 2 && (
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-custom py-2" onClick={() => { setPaymentStep(1); setError(null); }} disabled={loading}>
                  <i className="bi bi-arrow-left me-1"></i>Retour
                </button>
                <button type="button" className="btn btn-primary-custom flex-grow-1 py-2 font-sans" onClick={handlePayment} disabled={!selectedPack || !phone.trim() || loading} style={{ fontSize: '1rem' }}>
                  <span className="d-inline-flex align-items-center justify-content-center">
                    {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : <i className="bi bi-wallet2 me-2"></i>}
                    <span>{loading ? 'Redirection en cours...' : `Payer ${selectedPack.amount.toLocaleString('fr-FR')} F CFA`}</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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

  const startsWithHttps = (value) => value.trim().length === 0 || /^https:\/\//i.test(value.trim());

  const sanitizeWhatsApp = (value) => value.replace(/[^\d\s+]/g, '');

  const verifyPortfolioDns = async () => {
    let hostname;

    try {
      const url = new URL(formData.portfolio_url.trim());
      hostname = url.hostname;
      if (!hostname || hostname === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
        throw new Error('Le lien doit utiliser un nom de domaine public.');
      }
    } catch {
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
        if (!response.ok) throw new Error('Le service DNS est indisponible.');
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
    } catch (error) {
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
      if (dnsStatus !== 'valid' && !(await verifyPortfolioDns())) return;
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
              className="optim-form-control"
              placeholder="https://votreportfolio.com"
              value={formData.portfolio_url}
              onChange={(e) => updateField('portfolio_url', e.target.value)}
              required
            />
            <div className="d-flex align-items-start gap-2 mt-2 mb-4" role="status" aria-live="polite">
              {dnsStatus === 'checking' ? (
                <span className="spinner-border spinner-border-sm text-primary mt-1" role="status" aria-label="Vérification DNS en cours"></span>
              ) : (
                <i className={`bi ${dnsStatus === 'valid' ? 'bi-check-circle-fill text-success' : dnsStatus === 'invalid' ? 'bi-x-circle-fill text-danger' : 'bi-shield-check'}`}></i>
              )}
              <div>
                <strong className="d-block" style={{ fontSize: '0.86rem' }}>Vérification DNS</strong>
                <span className="text-body-custom" style={{ fontSize: '0.8rem' }}>
                  {dnsMessage || 'Nous vérifions que le domaine existe avant de continuer.'}
                </span>
              </div>
            </div>
            <button className="optim-btn-primary" onClick={nextStep} disabled={!startsWithHttps(formData.portfolio_url) || dnsStatus === 'checking'}>
              {dnsStatus === 'checking' ? 'Vérification...' : 'Suivant'} {dnsStatus !== 'checking' && <i className="bi bi-arrow-right ms-2"></i>}
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
    <div className="optim-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
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

/* ───────────────────────────────────────────────────────────────────
   MODAL D'ANALYSE — Choix du secteur & de l'audience cible
─────────────────────────────────────────────────────────────────── */
const SECTEURS = [
  { id: 'dev-web',      label: 'Dev Web',       icon: 'bi-code-slash',       color: '#6366f1' },
  { id: 'dev-mobile',   label: 'Dev Mobile',    icon: 'bi-phone',            color: '#8b5cf6' },
  { id: 'dev-desktop',  label: 'Dev Desktop',   icon: 'bi-pc-display',       color: '#7c3aed' },
  { id: 'dev-ios',      label: 'Dev iOS',       icon: 'bi-apple',            color: '#5b21b6' },
  { id: 'design-web',   label: 'Designer Web',  icon: 'bi-palette',          color: '#ec4899' },
  { id: 'design-mobile',label: 'Designer Mobile',icon: 'bi-phone-flip',      color: '#f43f5e' },
  { id: 'pentest',      label: 'Pentesteur',    icon: 'bi-shield-lock',      color: '#0ea5e9' },
  { id: 'hacker',       label: 'Hacker',        icon: 'bi-terminal',         color: '#14b8a6' },
  { id: 'formateur',    label: 'Formateur',     icon: 'bi-mortarboard',      color: '#f59e0b' },
  { id: 'trader',       label: 'Trader',        icon: 'bi-graph-up-arrow',   color: '#10b981' },
  { id: 'youtubeur',    label: 'Youtubeur',     icon: 'bi-youtube',          color: '#ef4444' },
  { id: 'autres',       label: 'Autres métiers',icon: 'bi-grid',             color: '#64748b' },
];

const TIERS = [
  { id: 't1', label: '300', sublabel: 'contacts prêts à visiter votre profil', count: '300', contactCount: 300, price: 100, color: '#6366f1' },
  { id: 't2', label: '1 300', sublabel: 'contacts prêts à visiter votre profil', count: '1 300', contactCount: 1300, price: 200, color: '#8b5cf6' },
  { id: 't3', label: '15 000', sublabel: 'contacts prêts à visiter votre profil', count: '15k', contactCount: 15000, price: 300, color: '#7c3aed' },
  { id: 't4', label: '31 000', sublabel: 'contacts prêts à visiter votre profil', count: '31k', contactCount: 31000, price: 1000, color: '#5b21b6' },
  { id: 't5', label: '100 000', sublabel: 'contacts prêts à visiter votre profil', count: '10k', contactCount: 10000, price: 2100, color: '#4c1d95' },
];

const getBoostContactKey = (contact) => {
  if (contact.whatsappPhone) return `whatsapp:${contact.whatsappPhone}`;
  return `email:${contact.email.trim().toLowerCase()}`;
};

function BoostContactsList({ contacts, details, userId, instanceId = 'default' }) {
  const [page, setPage] = useState(0);
  const [contactFilter, setContactFilter] = useState('all');
  const [usedContactKeys, setUsedContactKeys] = useState(() => new Set());
  const [usageError, setUsageError] = useState('');
  const pageSize = 8;
  const filteredContacts = useMemo(() => contacts.filter((contact) => {
    if (contactFilter === 'email') return Boolean(contact.email);
    if (contactFilter === 'whatsapp') return Boolean(contact.whatsappPhone);
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

      if (cancelled) return;
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

    if (wasAlreadyUsed) return;

    setUsageError('');
    setUsedContactKeys((currentKeys) => new Set(currentKeys).add(contactKey));

    const { error } = await supabase
      .from('boost_contact_interactions')
      .upsert(
        { user_id: userId, contact_key: contactKey, used_at: new Date().toISOString() },
        { onConflict: 'user_id,contact_key' },
      );

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

  return (
    <div className="mt-3 p-3 rounded-3" style={{ border: '1px solid rgba(38, 33, 92, 0.08)', backgroundColor: '#fff' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h6 className="mb-1 text-title fw-bold">Contacts de ton boost</h6>
          <p className="small text-muted mb-0">
            {details?.count?.toLocaleString('fr-FR') || contacts.length.toLocaleString('fr-FR')} contacts sélectionnés
            {details?.secteur ? ` pour ${details.secteur}` : ''}
            {usedContactCount > 0 ? ` · ${usedContactCount} déjà utilisé${usedContactCount > 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-end gap-2">
          <div>
            <label htmlFor={`boost-contact-filter-${instanceId}`} className="form-label small text-muted mb-1">Afficher</label>
            <select id={`boost-contact-filter-${instanceId}`} className="form-select form-select-sm" value={contactFilter} onChange={handleFilterChange}>
              <option value="all">Tous les contacts</option>
              <option value="email">E-mails uniquement</option>
              <option value="whatsapp">Numéros WhatsApp uniquement</option>
            </select>
          </div>
          {pageCount > 1 && (
            <div className="d-flex gap-1">
              <button type="button" className="btn btn-sm btn-outline-custom" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} aria-label="Contacts précédents"><i className="bi bi-chevron-left"></i></button>
              <button type="button" className="btn btn-sm btn-outline-custom" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={page === pageCount - 1} aria-label="Contacts suivants"><i className="bi bi-chevron-right"></i></button>
            </div>
          )}
        </div>
      </div>
      {usageError && <div className="alert alert-danger py-2 small mb-3" role="alert">{usageError}</div>}
      <div className="row g-2">
        {visibleContacts.map((contact) => {
          const contactKey = getBoostContactKey(contact);
          const isUsed = usedContactKeys.has(contactKey);

          return (
            <div className="col-12 col-md-6" key={`${contact.whatsappPhone}-${contact.email}`}>
              <div className="d-flex align-items-center justify-content-between gap-2 p-2 rounded-2" style={{ backgroundColor: '#FAFAFE' }}>
                <div className="min-width-0">
                  <div className="fw-semibold text-title text-truncate">{contact.name}</div>
                  {contactFilter !== 'whatsapp' && contact.email && <div className="small text-muted text-truncate"><i className="bi bi-envelope me-1"></i>{contact.email}</div>}
                  {contactFilter !== 'email' && contact.phone && <div className="small text-muted text-truncate"><i className="bi bi-whatsapp me-1 text-success"></i>{contact.phone}</div>}
                </div>
                {contact.whatsappPhone ? (
                  <a
                    className={`btn btn-sm ${isUsed ? 'btn-danger' : 'btn-success'} flex-shrink-0`}
                    href={`https://wa.me/${contact.whatsappPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => { markContactAsUsed(contact); }}
                    aria-label={`${isUsed ? 'Contact déjà utilisé : ' : 'Écrire à '}${contact.name} sur WhatsApp`}
                    title={isUsed ? 'Contact déjà utilisé' : 'Écrire sur WhatsApp'}
                  >
                    <i className="bi bi-whatsapp me-1"></i>{isUsed ? 'Utilisé' : 'WhatsApp'}
                  </a>
                ) : <span className="badge text-bg-light border">E-mail</span>}
              </div>
            </div>
          );
        })}
      </div>
      {filteredContacts.length === 0 && <p className="small text-muted text-center py-3 mb-0">Aucun contact ne correspond à ce filtre.</p>}
      {pageCount > 1 && <div className="small text-muted text-center mt-2">Page {page + 1} / {pageCount}</div>}
    </div>
  );
}

function AnalysisModal({ portfolioUrl, profileData, onClose, onPurchase }) {
  const [step, setStep] = useState(1); // 1 = secteur, 2 = audience
  const [selectedSecteur, setSelectedSecteur] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSecteurNext = () => {
    if (!selectedSecteur) return;
    setStep(2);
  };

  const handleTierNext = async () => {
    if (!selectedTier) return;
    setSubmitting(true);
    setError('');
    try {
      await onPurchase({ secteur: selectedSecteur, tier: selectedTier });
    } catch (purchaseError) {
      setError(purchaseError.message || 'Impossible de souscrire ce forfait.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="optim-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ zIndex: 2000 }}
    >
      <div
        className="optim-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '96vw' }}
      >
        <div className="p-4 p-md-5">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span
                className="badge rounded-pill px-3 py-1 mb-2 d-inline-block"
                style={{ backgroundColor: '#EEEDFE', color: 'var(--folio-primary)', fontSize: '0.75rem' }}
              >
                <i className="bi bi-rocket-takeoff me-1"></i>
                {step === 1 ? 'Étape 1 sur 2' : 'Étape 2 sur 2'}
              </span>
            </div>
            <button
              className="btn btn-link p-0 text-muted"
              onClick={onClose}
              style={{ textDecoration: 'none', fontSize: '1.1rem' }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Progress bar */}
          <div className="optim-progress-bar mb-4">
            <div className="optim-progress-fill" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>

          {/* ── STEP 1 : SECTEUR ── */}
          {step === 1 && (
            <div className="optim-step-enter">
              <h3 className="font-serif fw-bold text-title mb-1">Ton activité digitale</h3>
              <p className="text-body-custom mb-4" style={{ fontSize: '0.9rem' }}>
                Sélectionne ton domaine pour cibler les bonnes personnes.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '10px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {SECTEURS.map((s) => {
                  const isSelected = selectedSecteur?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSecteur(s)}
                      style={{
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
                      }}
                    >
                      <div
                        style={{
                          width: '42px', height: '42px',
                          borderRadius: '12px',
                          backgroundColor: `${s.color}20`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.2rem',
                          color: s.color,
                        }}
                      >
                        <i className={`bi ${s.icon}`}></i>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? s.color : 'var(--folio-title)', textAlign: 'center', lineHeight: '1.2' }}>
                        {s.label}
                      </span>
                      {isSelected && (
                        <i className="bi bi-check-circle-fill" style={{ color: s.color, fontSize: '0.85rem' }}></i>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                className="btn btn-primary-custom w-100 mt-4 py-2"
                onClick={handleSecteurNext}
                disabled={!selectedSecteur}
              >
                Suivant <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          )}

          {/* ── STEP 2 : AUDIENCE ── */}
          {step === 2 && (
            <div className="optim-step-enter">
              <button
                className="btn btn-link p-0 mb-3 text-muted"
                style={{ fontSize: '0.85rem', textDecoration: 'none' }}
                onClick={() => setStep(1)}
              >
                <i className="bi bi-arrow-left me-1"></i> Retour
              </button>

              <div className="d-flex align-items-center gap-2 mb-1">
                <div
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    backgroundColor: `${selectedSecteur?.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selectedSecteur?.color,
                  }}
                >
                  <i className={`bi ${selectedSecteur?.icon}`}></i>
                </div>
                <span className="fw-semibold text-title" style={{ fontSize: '0.9rem' }}>
                  {selectedSecteur?.label}
                </span>
              </div>

              <h3 className="font-serif fw-bold text-title mb-1 mt-2">Combien de personnes veux-tu toucher ?</h3>
              <p className="text-body-custom mb-4" style={{ fontSize: '0.88rem' }}>
                Nous avons ces contacts prêts à visiter votre profil. Choisissez votre volume.
              </p>

              {error && <div className="alert alert-danger py-2 px-3 small">{error}</div>}

              <div className="d-flex flex-column gap-3">
                {TIERS.map((tier) => {
                  const isSelected = selectedTier?.id === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier)}
                      style={{
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
                      }}
                    >
                      <div
                        style={{
                          width: '52px', height: '52px', flexShrink: 0,
                          borderRadius: '14px',
                          backgroundColor: `${tier.color}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: tier.color,
                          lineHeight: '1.1',
                          textAlign: 'center',
                        }}
                      >
                        {tier.count}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: isSelected ? tier.color : 'var(--folio-title)' }}>
                          {tier.label} personnes
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          {tier.sublabel}
                        </div>
                      </div>
                      <div className="text-end" style={{ minWidth: '90px' }}>
                        <strong style={{ color: tier.color }}>{tier.price.toLocaleString('fr-FR')} F CFA</strong>
                        <div className="small text-muted">Solde : {Number(profileData?.solde || 0).toLocaleString('fr-FR')} F</div>
                      </div>
                      <div
                        style={{
                          width: '22px', height: '22px',
                          borderRadius: '50%',
                          border: isSelected ? `none` : '2px solid rgba(38,33,92,0.18)',
                          backgroundColor: isSelected ? tier.color : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && <i className="bi bi-check text-white" style={{ fontSize: '0.75rem' }}></i>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                className="btn btn-primary-custom w-100 mt-4 py-2"
                onClick={handleTierNext}
                disabled={!selectedTier || submitting}
                style={{ fontSize: '1rem' }}
              >
                {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-wallet2 me-2"></i>}
                {submitting ? 'Souscription...' : 'Souscrire le forfait'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  return (
    <div
      className="optim-modal-overlay"
      onClick={(event) => { if (event.target === event.currentTarget && !submitting) onClose(); }}
      style={{ zIndex: 2100 }}
    >
      <div className="optim-modal-container" role="dialog" aria-modal="true" aria-labelledby="report-problem-title" onClick={(event) => event.stopPropagation()}>
        <div className="p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div>
              <p className="folio-auth-eyebrow mb-1">Assistance Folio</p>
              <h2 id="report-problem-title" className="font-serif fw-bold text-title mb-1">Signaler un problème</h2>
              <p className="text-body-custom mb-0 small">Décris ce qui ne fonctionne pas afin que notre équipe puisse t’aider.</p>
            </div>
            <button type="button" className="btn btn-link p-0 text-muted" onClick={onClose} aria-label="Fermer" disabled={submitting}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {submitted ? (
            <div className="text-center py-3">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
              <h3 className="h5 font-serif fw-bold text-title mt-3">Signalement envoyé</h3>
              <p className="text-muted small mb-4">Merci. Notre équipe va examiner ton problème.</p>
              <button type="button" className="btn btn-primary-custom w-100" onClick={onClose}>Fermer</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="alert alert-danger py-2 px-3 small" role="alert">{error}</div>}
              <label htmlFor="report-title" className="form-label text-body-custom small fw-medium">Titre</label>
              <input id="report-title" type="text" className="form-control mb-3" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Ex. Paiement non crédité" disabled={submitting} required />
              <label htmlFor="report-description" className="form-label text-body-custom small fw-medium">Description</label>
              <textarea id="report-description" className="form-control mb-4" rows="5" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} placeholder="Décris le problème rencontré..." disabled={submitting} required />
              <button type="submit" className="btn btn-primary-custom w-100" disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : <i className="bi bi-send me-2"></i>}
                {submitting ? 'Envoi...' : 'Envoyer'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
   MODAL FREELANCER PROMAX — 15000 F CFA / mois
─────────────────────────────────────────────────────────────────── */
function ProMaxModal({ userData, profileData, onRefreshProfile, onOpenRecharge, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [showConfigStep, setShowConfigStep] = useState(false);

  // Formulaire d'apprentissage post-souscription
  const [userProfileId, setUserProfileId] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  const isProMax = Boolean(
    profileData?.is_promax &&
    (!profileData?.promax_until || new Date(profileData.promax_until) > new Date())
  );

  const solde = Number(profileData?.solde || 0);
  const promaxCost = 15000;

  // Charger le premier profil freelancer s'il existe
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

        if (updateError) throw updateError;
      } else if (data && !data.success) {
        throw new Error(data.message);
      }

      setSuccessMsg("Félicitations ! Votre abonnement Freelancer ProMax est maintenant actif avec le badge Orange !");
      setShowConfigStep(true);
      await onRefreshProfile();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (err) {
      console.error("Erreur souscription ProMax:", err);
      setError(err?.message || "Une erreur est survenue lors de la souscription.");
    } finally {
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
      } catch (err) {
        console.error("Erreur d'envoi photo:", err);
        setError("Erreur lors de l'envoi de la photo : " + (err.message || 'Échec'));
      } finally {
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
      } catch (err) {
        console.error("Erreur d'envoi vidéo:", err);
        setError("Erreur lors de l'envoi de la vidéo sur Cloudinary : " + (err.message || 'Échec'));
        setVideoProgress(0);
      } finally {
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
      } catch (err) {
        console.error("Erreur d'envoi CV:", err);
        setError("Erreur lors de l'envoi du CV sur Cloudinary : " + (err.message || 'Échec'));
        setCvProgress(0);
      } finally {
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
        if (updateErr) throw updateErr;
      } else {
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
        if (insertErr) throw insertErr;
      }
      setConfigSaved(true);
      await onRefreshProfile();
    } catch (err) {
      console.error("Erreur enregistrement profil ProMax:", err);
      setError("Impossible d'enregistrer le profil. Assurez-vous d'avoir exécuté la mise à jour SQL dans Supabase SQL Editor. Erreur: " + (err.message || ''));
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
      <div className="modal-dialog modal-dialog-centered promax-bottom-sheet-dialog modal-lg" role="document">
        <div className="modal-content border-0 shadow" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #FFF6F0 0%, #FFF0E5 100%)' }}>
            <h5 className="modal-title font-serif fw-bold fs-4 text-title d-flex align-items-center gap-2">
              <i className="bi bi-rocket-takeoff-fill fs-3" style={{ color: '#FF7A00' }}></i>
              <span>Freelancer <span style={{ color: '#FF7A00' }}>ProMax</span></span>
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Fermer" disabled={loading}></button>
          </div>

          <div className="modal-body py-4 px-4">
            {showConfigStep ? (
              <div className="py-2">
                <div className="text-center mb-4">
                  <img src={orangeBadge} alt="Badge Orange ProMax" style={{ width: '64px', height: '64px', objectFit: 'contain' }} className="mb-2" />
                  <h4 className="font-serif fw-bold text-title mb-1">Configure ton profil ProMax 🚀</h4>
                  <p className="text-muted small">Ajoute ta vidéo de présentation, ton CV et choisis ton média de profil.</p>
                </div>

                {configSaved && (
                  <div className="alert alert-success py-2 px-3 small text-center mb-3">
                    <i className="bi bi-check-circle-fill me-2"></i>Vos informations ont été enregistrées avec succès ! Vous pourrez les modifier à tout moment dans "Mes Profils".
                  </div>
                )}

                <div className="row g-3 mb-4">
                  {/* Option photo ou vidéo de profil */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 border rounded-3 bg-white h-100 text-center">
                      <h6 className="fw-bold text-title mb-2"><i className="bi bi-camera-reels text-warning me-2"></i>Photo ou Vidéo de Profil</h6>
                      <div className="mb-3 mx-auto" style={{ width: '90px', height: '90px' }}>
                        {videoUrl ? (
                          <video src={videoUrl} autoPlay loop muted playsInline className="rounded-circle shadow-sm" style={{ width: '90px', height: '90px', objectFit: 'cover', border: '3px solid #FF7A00' }} />
                        ) : photoUrl ? (
                          <img src={photoUrl} alt="Aperçu" className="rounded-circle shadow-sm" style={{ width: '90px', height: '90px', objectFit: 'cover', border: '3px solid #FF7A00' }} />
                        ) : (
                          <div className="rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '90px', height: '90px', backgroundColor: '#FFF0E5', color: '#FF7A00' }}>
                            <i className="bi bi-person fs-1"></i>
                          </div>
                        )}
                      </div>
                      {videoProgress > 0 && videoProgress < 100 && (
                        <div className="w-100 mt-3">
                          <div className="d-flex justify-content-between small text-title fw-bold mb-1">
                            <span>Téléversement vidéo...</span>
                            <span>{videoProgress}%</span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div className="progress-bar progress-bar-striped progress-bar-animated bg-warning" style={{ width: `${videoProgress}%` }}></div>
                          </div>
                        </div>
                      )}
                      <div className="d-flex flex-column gap-2 mt-3">
                        <label className="btn btn-sm btn-outline-custom">
                          <i className="bi bi-image me-1"></i>Choisir une photo
                          <input type="file" accept="image/*" className="d-none" onChange={handlePhotoUpload} disabled={loading || uploadingMedia} />
                        </label>
                        <label className="btn btn-sm btn-outline-warning" style={{ color: '#FF7A00', borderColor: '#FF7A00' }}>
                          <i className="bi bi-camera-video me-1"></i>Choisir une vidéo de présentation
                          <input type="file" accept="video/*" className="d-none" onChange={handleVideoUpload} disabled={loading || uploadingMedia} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Ajouter son CV */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 border rounded-3 bg-white h-100 text-center d-flex flex-column justify-content-between">
                      <div>
                        <h6 className="fw-bold text-title mb-2"><i className="bi bi-file-earmark-pdf text-success me-2"></i>Ajouter son CV au profil</h6>
                        <p className="small text-muted mb-3">Téléverse ton CV au format PDF ou Word pour qu'il soit directement téléchargeable sur ta carte.</p>
                        {cvProgress > 0 && cvProgress < 100 && (
                          <div className="w-100 mb-3">
                            <div className="d-flex justify-content-between small text-title fw-bold mb-1">
                              <span>Téléversement CV...</span>
                              <span>{cvProgress}%</span>
                            </div>
                            <div className="progress" style={{ height: '8px' }}>
                              <div className="progress-bar progress-bar-striped progress-bar-animated bg-success" style={{ width: `${cvProgress}%` }}></div>
                            </div>
                          </div>
                        )}
                        {cvUrl ? (
                          <div className="alert alert-success py-2 px-3 small mb-3">
                            <i className="bi bi-check-circle-fill me-1"></i>CV joint avec succès !
                          </div>
                        ) : (
                          <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#F8F9FA', border: '1px dashed #CED4DA' }}>
                            <i className="bi bi-cloud-arrow-up fs-2 text-muted"></i>
                            <span className="d-block small text-muted">Aucun fichier choisi</span>
                          </div>
                        )}
                      </div>
                      <label className="btn btn-sm btn-outline-success w-100">
                        <i className="bi bi-file-earmark-plus me-1"></i>{cvUrl ? 'Changer de CV' : 'Téléverser mon CV (PDF/DOC)'}
                        <input type="file" accept=".pdf,.doc,.docx" className="d-none" onChange={handleCvUpload} disabled={loading || uploadingMedia} />
                      </label>
                    </div>
                  </div>
                </div>

                {uploadingMedia && (
                  <div className="text-center py-2 text-primary small">
                    <span className="spinner-border spinner-border-sm me-2"></span>Téléversement vers Cloudinary en cours...
                  </div>
                )}

                <p className="small text-muted text-center mb-3">
                  💡 Note : Vous pourrez modifier ces informations à tout moment depuis le menu <strong>"Mes Profils"</strong>.
                </p>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-custom w-50 py-2" onClick={onClose} disabled={loading}>
                    Passer pour l'instant
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary-custom w-50 py-2"
                    style={{ backgroundColor: '#FF7A00', borderColor: '#FF7A00' }}
                    onClick={handleSaveConfig}
                    disabled={loading || uploadingMedia || (videoProgress > 0 && videoProgress < 100) || (cvProgress > 0 && cvProgress < 100)}
                  >
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-1"></i>}
                    Enregistrer mon profil
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-4 mb-4" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FF9E00 100%)', color: 'white' }}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <span className="badge bg-white text-dark font-sans fw-bold px-3 py-1 rounded-pill mb-2">Offre Exclusive</span>
                      <h4 className="font-serif fw-bold mb-1">Propulsez votre carrière Freelance</h4>
                      <p className="mb-0 small opacity-90">Accédez à toutes les fonctionnalités avancées et démarquez-vous des autres freelances.</p>
                    </div>
                    <div className="text-end d-none d-sm-block">
                      <span className="display-6 fw-bold">15 000</span>
                      <span className="fs-6 d-block">FCFA / mois</span>
                    </div>
                  </div>
                </div>

                <h6 className="font-serif fw-bold text-title mb-3">Toutes les fonctionnalités ProMax incluses :</h6>
                
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <div className="p-3 border rounded-3 h-100 d-flex align-items-start gap-3 bg-white shadow-sm">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: '#FF7A00', width: '40px', height: '40px', flexShrink: 0 }}>
                        <i className="bi bi-camera-reels-fill fs-5"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-title mb-1" style={{ fontSize: '0.95rem' }}>Vidéo en photo de profil</h6>
                        <p className="small text-muted mb-0">Ajoutez une courte vidéo de présentation dynamique directement sur votre photo de profil.</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 border rounded-3 h-100 d-flex align-items-start gap-3 bg-white shadow-sm">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: '#FF7A00', width: '40px', height: '40px', flexShrink: 0 }}>
                        <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-title mb-1" style={{ fontSize: '0.95rem' }}>Ajouter son CV au profil</h6>
                        <p className="small text-muted mb-0">Attachez votre CV (PDF/DOC) pour que les recruteurs et clients puissent le consulter en 1 clic.</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 border rounded-3 h-100 d-flex align-items-start gap-3 bg-white shadow-sm">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: '#FF7A00', width: '40px', height: '40px', flexShrink: 0 }}>
                        <i className="bi bi-sort-numeric-down fs-5"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-title mb-1" style={{ fontSize: '0.95rem' }}>En tête des recherches</h6>
                        <p className="small text-muted mb-0">Votre profil est automatiquement positionné tout en haut des résultats de recherche.</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-3 border rounded-3 h-100 d-flex align-items-start gap-3 bg-white shadow-sm">
                      <div className="rounded-3 p-2 d-flex align-items-center justify-content-center text-white" style={{ backgroundColor: '#FF7A00', width: '40px', height: '40px', flexShrink: 0 }}>
                        <i className="bi bi-download fs-5"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-title mb-1" style={{ fontSize: '0.95rem' }}>Télécharger des contacts</h6>
                        <p className="small text-muted mb-0">Accédez au téléchargement des listes de contacts d'entreprises et clients potentiels.</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="p-3 border rounded-3 d-flex align-items-center justify-content-between bg-white shadow-sm" style={{ borderLeft: '5px solid #FF7A00' }}>
                      <div className="d-flex align-items-center gap-3">
                        <img src={orangeBadge} alt="Badge Orange" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                        <div>
                          <h6 className="fw-bold text-title mb-0" style={{ fontSize: '0.95rem' }}>Badge Offert Gratuitement (Couleur Orange) 🟠</h6>
                          <p className="small text-muted mb-0">Votre badge certifié passe automatiquement du bleu à l'orange vif !</p>
                        </div>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1">Offert</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-3 p-3 mb-4 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-body-custom">Tarif de l'abonnement</span>
                    <strong className="fs-5" style={{ color: '#FF7A00' }}>15 000 F CFA / mois</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-body-custom">Votre solde actuel</span>
                    <strong className={solde >= promaxCost ? 'text-success' : 'text-danger'}>
                      {solde.toLocaleString('fr-FR')} F CFA
                    </strong>
                  </div>
                </div>

                {isProMax && (
                  <div className="alert alert-success py-2 px-3 small mb-3">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Vous êtes déjà abonné à Freelancer ProMax (Actif jusqu'au {new Date(profileData.promax_until).toLocaleDateString('fr-FR')}). Cliquez ci-dessous pour prolonger de 30 jours ou configurer vos medias.
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger py-2 px-3 small mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    {solde < promaxCost && (
                      <div className="mt-2">
                        <button type="button" className="btn btn-sm btn-primary-custom" onClick={() => { onClose(); onOpenRecharge(); }}>
                          <i className="bi bi-wallet2 me-1"></i>Recharger mon solde
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-custom w-50 py-2" onClick={onClose} disabled={loading}>
                    Annuler
                  </button>
                  <button type="button" className="btn btn-primary-custom w-50 py-2" style={{ backgroundColor: '#FF7A00', borderColor: '#FF7A00' }} onClick={handleSubscribe} disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-rocket-takeoff me-1"></i>}
                    {isProMax ? 'Configurer / Prolongé' : 'Souscrire à l\'offre (15 000 F)'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────
   MODAL ANALYSE IA (GEMINI) — Audit SEO & Génération Code Head
─────────────────────────────────────────────────────────────────── */
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
    } catch (err) {
      console.error("Erreur lors de l'analyse Gemini IA:", err);
      setError(err?.message || "Impossible d'effectuer l'analyse IA. Veuillez réessayer.");
    } finally {
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
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div
      className="optim-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      style={{ zIndex: 2200 }}
    >
      <div className="optim-modal-container modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
        <div className="p-4 p-md-5" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
          <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
            <div>
              <span className="badge rounded-pill text-white px-3 py-1 mb-2 d-inline-flex align-items-center gap-1" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                <i className="bi bi-stars"></i> Folio IA
              </span>
              <h2 className="font-serif fw-bold text-title mb-1">Analyse SEO & Code Head par IA</h2>
              <p className="text-body-custom mb-0 small">Obtenez un audit instantané par Gemini IA et générez le code HTML à insérer dans le &lt;head&gt; de votre site.</p>
            </div>
            <button type="button" className="btn btn-link p-0 text-muted" onClick={onClose} aria-label="Fermer" disabled={loading}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Formulaire URL & Bouton Actualiser */}
          <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: '#F8F9FE', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
            <label className="form-label text-title small fw-bold mb-1">URL de votre portfolio à analyser :</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted"><i className="bi bi-globe"></i></span>
              <input
                type="url"
                className="form-control"
                placeholder="https://votreportfolio.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="btn text-white px-4 d-flex align-items-center gap-2"
                style={{ backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }}
                onClick={handleRunAnalysis}
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm" role="status" /> : <i className="bi bi-stars"></i>}
                {loading ? 'Analyse en cours...' : 'Analyse IA'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4">
              <div className="alert alert-danger py-2 px-3 small d-flex align-items-start gap-2 mb-2">
                <i className="bi bi-exclamation-triangle-fill mt-0.5 flex-shrink-0"></i>
                <div className="flex-grow-1">{error}</div>
              </div>
              {isOverloadedError ? (
                <div className="p-3 rounded-3 border" style={{ backgroundColor: '#faf5ff', borderColor: '#8b5cf640' }}>
                  <p className="small fw-bold text-title mb-2">
                    <i className="bi bi-cpu me-1" style={{ color: '#8b5cf6' }}></i>
                    Le modèle IA est très sollicité en ce moment. Choisissez un autre modèle pour relancer l'analyse :
                  </p>
                  <div className="d-flex flex-column gap-2 mb-3">
                    {AVAILABLE_MODELS.filter(m => m.id !== selectedModel).map(m => (
                      <label key={m.id} className={`d-flex align-items-center gap-2 p-2 rounded-3 border cursor-pointer ${ pendingModel === m.id ? 'border-purple-500' : '' }`} style={{ cursor: 'pointer', borderColor: pendingModel === m.id ? '#8b5cf6' : '#e5e7eb', backgroundColor: pendingModel === m.id ? '#f5f3ff' : 'white' }}>
                        <input
                          type="radio"
                          name="model-picker"
                          value={m.id}
                          checked={pendingModel === m.id}
                          onChange={() => setPendingModel(m.id)}
                          className="form-check-input mt-0"
                        />
                        <div>
                          <div className="fw-semibold small text-title">{m.label}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{m.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm text-white w-100"
                    style={{ backgroundColor: '#8b5cf6' }}
                    onClick={() => { setSelectedModel(pendingModel); handleRunAnalysis(pendingModel); }}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Relancer avec ce modèle
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleRunAnalysis()}>Réessayer</button>
              )}
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border mb-3" style={{ width: '3rem', height: '3rem', color: '#8b5cf6' }} role="status">
                <span className="visually-hidden">Chargement IA...</span>
              </div>
              <h5 className="font-serif text-title mb-1">Analyse en cours et attente de résultat...</h5>
              <p className="text-muted small mb-0">Extraction des balises SEO, vérification de l'ergonomie et génération du code &lt;head&gt;.</p>
            </div>
          ) : analysis ? (
            <div className="ai-analysis-results">
              {/* Carte Score + Diagnostic */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="p-4 rounded-4 text-center h-100 d-flex flex-column align-items-center justify-content-center bg-white shadow-sm border" style={{ borderColor: `${getScoreColor(analysis.score)}40` }}>
                    <p className="small text-muted mb-1 text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>Score IA Global</p>
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle my-2 shadow-sm"
                      style={{
                        width: '90px', height: '90px',
                        border: `6px solid ${getScoreColor(analysis.score)}`,
                        backgroundColor: `${getScoreColor(analysis.score)}10`
                      }}
                    >
                      <span className="fs-2 fw-bold" style={{ color: getScoreColor(analysis.score) }}>{analysis.score}</span>
                    </div>
                    <span className="badge px-3 py-1 rounded-pill mt-1" style={{ backgroundColor: `${getScoreColor(analysis.score)}20`, color: getScoreColor(analysis.score) }}>
                      {analysis.score >= 80 ? 'Excellent SEO' : analysis.score >= 60 ? 'Bonne base' : 'À optimiser'}
                    </span>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="p-4 rounded-4 h-100 bg-white shadow-sm border">
                    <h5 className="font-serif fw-bold text-title mb-2 d-flex align-items-center gap-2">
                      <i className="bi bi-robot" style={{ color: '#8b5cf6' }}></i>
                      <span>Diagnostic de l'IA</span>
                    </h5>
                    <p className="text-body-custom mb-0" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
                      {analysis.diagnostic}
                    </p>
                  </div>
                </div>
              </div>

              {/* Points Forts & Axes d'amélioration */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100 bg-white shadow-sm">
                    <h6 className="fw-bold text-success mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                      <i className="bi bi-check-circle-fill"></i> Forces détectées ({analysis.strengths?.length || 0})
                    </h6>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small text-body-custom">
                      {analysis.strengths?.map((str, idx) => (
                        <li key={idx} className="d-flex align-items-start gap-2">
                          <i className="bi bi-check2 text-success mt-0.5"></i>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 border rounded-3 h-100 bg-white shadow-sm">
                    <h6 className="fw-bold text-warning mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.95rem' }}>
                      <i className="bi bi-exclamation-triangle-fill"></i> Points à améliorer ({analysis.weaknesses?.length || 0})
                    </h6>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small text-body-custom">
                      {analysis.weaknesses?.map((w, idx) => (
                        <li key={idx} className="d-flex align-items-start gap-2">
                          <i className="bi bi-dot fs-5 text-warning lh-1"></i>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Recommandations Stratégiques */}
              <div className="p-4 rounded-4 bg-white shadow-sm border mb-4">
                <h5 className="font-serif fw-bold text-title mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-lightbulb-fill text-warning"></i>
                  <span>Recommandations IA pour Booster votre Trafic</span>
                </h5>
                <div className="d-flex flex-column gap-2">
                  {analysis.recommendations?.map((rec, idx) => (
                    <div key={idx} className="p-3 rounded-3 d-flex align-items-start gap-3" style={{ backgroundColor: '#F8F9FE', borderLeft: '4px solid #8b5cf6' }}>
                      <span className="badge rounded-circle d-flex align-items-center justify-content-center text-white" style={{ width: '24px', height: '24px', backgroundColor: '#8b5cf6', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <p className="mb-0 text-title small fw-medium">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section Code à mettre dans le <head> */}
              <div className="p-4 rounded-4 bg-dark text-white shadow">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <div>
                    <h5 className="font-serif fw-bold mb-1 text-white d-flex align-items-center gap-2">
                      <i className="bi bi-code-square text-info"></i>
                      <span>Code HTML à copier dans le &lt;head&gt; de votre site</span>
                    </h5>
                    <p className="text-white-50 mb-0 small">Généré sur-mesure par Gemini IA pour optimiser votre référencement Google et réseaux sociaux.</p>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-light'} px-3 py-1.5 d-flex align-items-center gap-1.5`}
                    onClick={handleCopyHead}
                  >
                    <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'}`}></i>
                    <span>{copied ? 'Code copié !' : 'Copier le code <head>'}</span>
                  </button>
                </div>

                <div className="position-relative">
                  <pre
                    className="p-3 rounded-3 bg-black text-info small mb-0 font-monospace"
                    style={{ maxHeight: '250px', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', border: '1px solid #334155' }}
                  >
                    <code>{analysis.headCode}</code>
                  </pre>
                </div>
                <small className="text-white-50 d-block mt-2" style={{ fontSize: '0.75rem' }}>
                  💡 Collez ces balises directement entre <code>&lt;head&gt;</code> et <code>&lt;/head&gt;</code> dans le fichier index.html de votre portfolio.
                </small>
              </div>
            </div>
          ) : null}
        </div>
      </div>

    </div>
  );
}


