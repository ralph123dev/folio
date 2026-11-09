import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import SupportedCountries from './components/SupportedCountries';
import Features from './components/Features';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Freelancers from './components/Freelancers';
import FormationLanding from './components/FormationLanding';
import FormationReader from './components/FormationReader';
import { useScrollReveal } from './hooks/useScrollReveal';
import { useAuthListener } from './hooks/useAuthListener';
import { supabase } from './supabaseClient';
import partenaireImage from './assets/partenaire/partenaire1.jpg';
import logoAnimate from './assets/logo_animate.mp4';
function App() {
    const [introFinished, setIntroFinished] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState(null);
    const [user, setUser] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);
    const [showFreelancers, setShowFreelancers] = useState(false);
    const [showFormationLanding, setShowFormationLanding] = useState(false);
    const [showFormationReader, setShowFormationReader] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [checkingSession, setCheckingSession] = useState(true);
    const [pendingFormation, setPendingFormation] = useState(() => {
        return localStorage.getItem('folio_pending_formation') === 'true';
    });
    useScrollReveal([introFinished, showAuth]);
    useAuthListener();
    const resetAllViews = () => {
        setShowFreelancers(false);
        setShowFormationLanding(false);
        setShowFormationReader(false);
        setShowDashboard(false);
        setShowOnboarding(false);
        setShowAuth(false);
    };
    const handleFormation = async () => {
        if (!user) {
            localStorage.setItem('folio_pending_formation', 'true');
            setPendingFormation(true);
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin }
            });
            return;
        }
        try {
            const { data } = await supabase
                .from('formation_access')
                .select('status')
                .eq('user_id', user.id)
                .maybeSingle();
            resetAllViews();
            if (data && data.status === 'active') {
                setShowFormationReader(true);
            }
            else {
                setShowFormationLanding(true);
            }
        }
        catch {
            resetAllViews();
            setShowFormationLanding(true);
        }
    };
    useEffect(() => {
        let active = true;
        let handledSessionId = null;
        const handleSession = async (session) => {
            if (!active)
                return;
            if (!session?.user) {
                setCheckingSession(false);
                return;
            }
            if (handledSessionId === session.user.id) {
                setCheckingSession(false);
                return;
            }
            handledSessionId = session.user.id;
            try {
                const currentUser = session.user;
                setUser(currentUser);
                const { data: profile } = await supabase
                    .from('profils')
                    .select('*')
                    .eq('id', currentUser.id)
                    .maybeSingle();
                if (profile && profile.onboarding_termine) {
                    setDashboardData({
                        id: currentUser.id,
                        nom_complet: profile.nom_complet || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '',
                        email: currentUser.email,
                        pays: profile.pays || '',
                        telephone: profile.telephone || '',
                        profession: profile.profession || '',
                        decouvert_via: profile.decouvert_via || '',
                    });
                    const wantsFormation = localStorage.getItem('folio_pending_formation') === 'true';
                    if (wantsFormation) {
                        localStorage.removeItem('folio_pending_formation');
                        setPendingFormation(false);
                        try {
                            const { data: fAccess } = await supabase
                                .from('formation_access')
                                .select('status')
                                .eq('user_id', currentUser.id)
                                .maybeSingle();
                            if (fAccess && fAccess.status === 'active') {
                                setShowFormationReader(true);
                            }
                            else {
                                setShowFormationLanding(true);
                            }
                        }
                        catch {
                            setShowFormationLanding(true);
                        }
                    }
                    else {
                        setShowDashboard(true);
                    }
                    setShowAuth(false);
                    setIntroFinished(true);
                }
                else {
                    if (!profile) {
                        await supabase.from('profils').insert({
                            id: currentUser.id,
                            nom_complet: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '',
                            email: currentUser.email,
                            onboarding_termine: false
                        });
                    }
                    const wantsFormationNew = localStorage.getItem('folio_pending_formation') === 'true';
                    if (wantsFormationNew) {
                        localStorage.removeItem('folio_pending_formation');
                        setPendingFormation(false);
                        setShowFormationLanding(true);
                    }
                    else {
                        setShowOnboarding(true);
                    }
                    setShowAuth(false);
                    setIntroFinished(true);
                }
            }
            catch (error) {
                console.error('Erreur lors du chargement de la session:', error);
                if (active) {
                    setShowAuth(true);
                    setIntroFinished(true);
                }
            }
            finally {
                if (active)
                    setCheckingSession(false);
            }
        };
        supabase.auth.getSession()
            .then(({ data: { session } }) => handleSession(session))
            .catch((error) => {
                console.error('Impossible de récupérer la session:', error);
                if (active) {
                    setShowAuth(true);
                    setIntroFinished(true);
                    setCheckingSession(false);
                }
            });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                void handleSession(session);
            }
            else if (event === 'SIGNED_OUT' && active) {
                handledSessionId = null;
                setUser(null);
                setDashboardData(null);
                setShowDashboard(false);
                setShowOnboarding(false);
            }
        });
        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);
    if (checkingSession) {
        return (_jsx("div", { className: "vh-100 vw-100 d-flex justify-content-center align-items-center", style: { backgroundColor: 'var(--folio-bg)' }, children: _jsx("div", { className: "spinner-border", role: "status", style: { color: 'var(--folio-primary)' }, children: _jsx("span", { className: "visually-hidden", children: "Chargement..." }) }) }));
    }
    if (!introFinished) {
        return (_jsxs("div", { className: "vh-100 vw-100 d-flex justify-content-center align-items-center bg-white m-0 p-0 overflow-hidden", children: [_jsx("video", { src: logoAnimate, autoPlay: true, muted: true, playsInline: true, onEnded: () => setIntroFinished(true), style: { width: '100%', height: '100%', objectFit: 'cover' } }), _jsxs("button", { className: "btn btn-light position-absolute bottom-0 end-0 m-4 shadow-sm", onClick: () => setIntroFinished(true), style: { zIndex: 100 }, children: ["Passer ", _jsx("i", { className: "bi bi-arrow-right" })] })] }));
    }
    if (showDashboard && dashboardData) {
        return (_jsx(Dashboard, {
            userData: dashboardData, onLogout: () => {
                setUser(null);
                setShowDashboard(false);
                setDashboardData(null);
                setShowOnboarding(false);
                setShowAuth(false);
            }, onGoFreelancer: () => {
                setShowDashboard(false);
                setShowFreelancers(true);
            }
        }));
    }
    if (showOnboarding && user) {
        return (_jsx(Onboarding, {
            user: {
                id: user.id,
                nom_complet: user.user_metadata?.full_name || user.user_metadata?.name || '',
                email: user.email,
            }, onComplete: (completedData) => {
                setDashboardData({
                    id: completedData.id,
                    nom_complet: completedData.nom_complet || completedData.full_name || '',
                    email: completedData.email,
                    pays: completedData.pays || '',
                    telephone: completedData.telephone || '',
                    profession: completedData.profession || '',
                    decouvert_via: completedData.decouvert_via || '',
                });
                setShowOnboarding(false);
                setShowDashboard(true);
            }
        }));
    }
    if (showAuth) {
        return _jsx(AuthPage, { initialMode: authMode, onBack: () => setShowAuth(false) });
    }
    if (showFormationReader && user) {
        return (_jsx(FormationReader, {
            user: user, onBackToHome: () => {
                resetAllViews();
            }
        }));
    }
    if (showFormationLanding) {
        return (_jsx(FormationLanding, {
            user: user, onBack: () => {
                resetAllViews();
            }, onOpenReader: () => {
                resetAllViews();
                setShowFormationReader(true);
            }, onGoogleLogin: () => {
                localStorage.setItem('folio_pending_formation', 'true');
                setPendingFormation(true);
                supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: window.location.origin }
                });
            }
        }));
    }
    if (showFreelancers) {
        return (_jsxs("div", {
            className: "d-flex flex-column min-vh-100 fade-in", children: [_jsx(Navbar, {
                isFreelancerPage: true, user: user, onHome: () => setShowFreelancers(false), onFreelancers: () => setShowFreelancers(true), onFormation: handleFormation, onStart: () => { setAuthMode('signup'); setShowAuth(true); setShowFreelancers(false); }, onLogin: () => { setAuthMode('login'); setShowAuth(true); setShowFreelancers(false); }, onDashboard: () => { setShowFreelancers(false); setShowDashboard(true); }, onLogout: () => {
                    setUser(null);
                    setShowDashboard(false);
                    setDashboardData(null);
                    setShowOnboarding(false);
                    setShowAuth(false);
                    setShowFreelancers(false);
                    supabase.auth.signOut();
                }
            }), _jsx(Freelancers, { user: user, onStart: () => { setAuthMode('signup'); setShowAuth(true); setShowFreelancers(false); } }), _jsx(Footer, { onFormation: handleFormation })]
        }));
    }
    return (_jsxs("div", {
        className: "d-flex flex-column min-vh-100 fade-in", children: [_jsx(Navbar, {
            user: user, onFreelancers: () => setShowFreelancers(true), onFormation: handleFormation, onStart: () => { setAuthMode(null); setShowAuth(true); }, onLogin: () => { setAuthMode('login'); setShowAuth(true); }, onDashboard: () => {
                if (dashboardData) {
                    setShowDashboard(true);
                }
                else {
                    setShowOnboarding(true);
                }
            }, onLogout: () => {
                setUser(null);
                setShowDashboard(false);
                setDashboardData(null);
                setShowOnboarding(false);
                setShowAuth(false);
                supabase.auth.signOut();
            }
        }), _jsxs("main", {
            className: "flex-grow-1", children: [_jsx(Hero, { onStart: () => { setAuthMode('signup'); setShowAuth(true); }, onFormation: handleFormation }), _jsx(HowItWorks, {}), _jsx(SupportedCountries, {}), _jsx(Features, {
                user: user, onStart: () => { setAuthMode('signup'); setShowAuth(true); }, onDashboard: () => {
                    if (dashboardData) {
                        setShowDashboard(true);
                    }
                    else {
                        setShowOnboarding(true);
                    }
                }
            }), _jsx("section", { className: "partner-section reveal", "aria-labelledby": "partner-title", children: _jsxs("div", { className: "partner-content", children: [_jsxs("div", { className: "partner-copy", children: [_jsx("p", { className: "partner-kicker", children: "Partenaire" }), _jsx("h2", { id: "partner-title", className: "display-5 font-serif", children: "Des talents qui construisent l'avenir." }), _jsx("p", { className: "text-body-custom mb-0", children: "D\u00E9couvre HokAy, une plateforme qui aide les talents \u00E0 montrer ce qu'ils savent faire, d\u00E9velopper leurs comp\u00E9tences et ouvrir de nouvelles opportunit\u00E9s." }), _jsxs("a", { className: "partner-link", href: "https://hokay.site", target: "_blank", rel: "noopener noreferrer", children: ["D\u00E9couvrir HokAy ", _jsx("span", { "aria-hidden": "true", children: "\u2197" })] })] }), _jsx("a", { className: "partner-image-link", href: "https://hokay.site", target: "_blank", rel: "noopener noreferrer", "aria-label": "D\u00E9couvrir le partenaire HokAy", children: _jsx("img", { src: partenaireImage, alt: "Pr\u00E9sentation de la plateforme HokAy", className: "partner-image" }) })] }) }), _jsx(CtaSection, { onStart: () => { setAuthMode('signup'); setShowAuth(true); }, onFormation: handleFormation })]
        }), _jsx(Footer, { onFormation: handleFormation })]
    }));
}
export default App;
