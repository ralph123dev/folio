import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Freelancers from './components/Freelancers';
import { useScrollReveal } from './hooks/useScrollReveal';
import { supabase } from './supabaseClient';

// Assets
import logoAnimate from './assets/logo_animate.mp4';

function App() {
  const [introFinished, setIntroFinished] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState(null);

  // État utilisateur et flux post-auth
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showFreelancers, setShowFreelancers] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useScrollReveal([introFinished, showAuth]);

  // Vérifier la session au chargement (après OAuth redirect)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const currentUser = session.user;
        setUser(currentUser);

        // Vérifier si l'onboarding est déjà fait
        const { data: profile } = await supabase
          .from('profils')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profile && profile.onboarding_termine) {
          // Onboarding déjà fait → aller directement au dashboard
          setDashboardData({
            id: currentUser.id,
            nom_complet: profile.nom_complet || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '',
            email: currentUser.email,
            pays: profile.pays || '',
            telephone: profile.telephone || '',
            profession: profile.profession || '',
            decouvert_via: profile.decouvert_via || '',
          });
          setShowDashboard(true);
          setShowAuth(false);
          setIntroFinished(true);
        } else {
          // Si le profil n'existe pas en base, on le crée
          if (!profile) {
            await supabase.from('profils').insert({
              id: currentUser.id,
              nom_complet: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '',
              email: currentUser.email,
              onboarding_termine: false
            });
          }
          // Nouvel utilisateur → onboarding
          setShowOnboarding(true);
          setShowAuth(false);
          setIntroFinished(true);
        }
      }
      setCheckingSession(false);
    };

    checkSession();

    // Écouter les changements de session (pour l'OAuth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
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
          setShowDashboard(true);
        } else {
          if (!profile) {
            await supabase.from('profils').insert({
              id: currentUser.id,
              nom_complet: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '',
              email: currentUser.email,
              onboarding_termine: false
            });
          }
          setShowOnboarding(true);
        }
        setShowAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pendant la vérification de session, on peut afficher un écran vide
  if (checkingSession) {
    return (
      <div className="vh-100 vw-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: 'var(--folio-bg)' }}>
        <div className="spinner-border" role="status" style={{ color: 'var(--folio-primary)' }}>
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  // Vidéo d'intro
  if (!introFinished) {
    return (
      <div className="vh-100 vw-100 d-flex justify-content-center align-items-center bg-white m-0 p-0 overflow-hidden">
        <video
          src={logoAnimate}
          autoPlay
          muted
          playsInline
          onEnded={() => setIntroFinished(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <button
          className="btn btn-light position-absolute bottom-0 end-0 m-4 shadow-sm"
          onClick={() => setIntroFinished(true)}
          style={{ zIndex: 100 }}
        >
          Passer <i className="bi bi-arrow-right"></i>
        </button>
      </div>
    );
  }

  // Dashboard (après onboarding)
  if (showDashboard && dashboardData) {
    return (
      <Dashboard
        userData={dashboardData}
        onLogout={() => {
          setUser(null);
          setShowDashboard(false);
          setDashboardData(null);
          setShowOnboarding(false);
          setShowAuth(false);
        }}
        onGoFreelancer={() => {
          setShowDashboard(false);
          setShowFreelancers(true);
        }}
      />
    );
  }

  // Onboarding (après auth, avant dashboard)
  if (showOnboarding && user) {
    return (
      <Onboarding
        user={{
          id: user.id,
          nom_complet: user.user_metadata?.full_name || user.user_metadata?.name || '',
          email: user.email,
        }}
        onComplete={(completedData) => {
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
        }}
      />
    );
  }

  // Page d'authentification
  if (showAuth) {
    return <AuthPage initialMode={authMode} onBack={() => setShowAuth(false)} />;
  }

  if (showFreelancers) {
    return (
      <div className="d-flex flex-column min-vh-100 fade-in">
        <Navbar
          isFreelancerPage={true}
          user={user}
          onHome={() => setShowFreelancers(false)}
          onFreelancers={() => setShowFreelancers(true)}
          onStart={() => { setAuthMode('signup'); setShowAuth(true); setShowFreelancers(false); }}
          onLogin={() => { setAuthMode('login'); setShowAuth(true); setShowFreelancers(false); }}
          onDashboard={() => { setShowFreelancers(false); setShowDashboard(true); }}
          onLogout={() => { 
            setUser(null); 
            setShowDashboard(false); 
            setDashboardData(null); 
            setShowOnboarding(false); 
            setShowAuth(false); 
            setShowFreelancers(false); 
            supabase.auth.signOut(); 
          }}
        />
        <Freelancers 
          user={user} 
          onStart={() => { setAuthMode('signup'); setShowAuth(true); setShowFreelancers(false); }} 
        />
      </div>
    );
  }

  // Landing page
  return (
    <div className="d-flex flex-column min-vh-100 fade-in">
      <Navbar
        user={user}
        onFreelancers={() => setShowFreelancers(true)}
        onStart={() => { setAuthMode(null); setShowAuth(true); }}
        onLogin={() => { setAuthMode('login'); setShowAuth(true); }}
        onDashboard={() => {
          if (dashboardData) {
            setShowDashboard(true);
          } else {
            setShowOnboarding(true);
          }
        }}
        onLogout={() => {
          setUser(null);
          setShowDashboard(false);
          setDashboardData(null);
          setShowOnboarding(false);
          setShowAuth(false);
          supabase.auth.signOut();
        }}
      />
      <main className="flex-grow-1">
        <Hero onStart={() => { setAuthMode('signup'); setShowAuth(true); }} />
        <HowItWorks />
        <Features />
        <CtaSection onStart={() => { setAuthMode('signup'); setShowAuth(true); }} />
      </main>
      <Footer />
    </div>
  );
}

export default App;
