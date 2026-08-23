import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import { useScrollReveal } from './hooks/useScrollReveal';

// Assets
import logoAnimate from './assets/logo_animate.mp4';

function App() {
  const [introFinished, setIntroFinished] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  useScrollReveal(introFinished, showAuth);

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
        {/* Un bouton pour passer si la vidéo ne se lance pas ou si l'utilisateur veut aller plus vite */}
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

  if (showAuth) {
    return <AuthPage initialMode={authMode} onBack={() => setShowAuth(false)} />;
  }

  return (
    <div className="d-flex flex-column min-vh-100 fade-in">
      <Navbar onStart={() => { setAuthMode(null); setShowAuth(true); }} onLogin={() => { setAuthMode('login'); setShowAuth(true); }} />
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
