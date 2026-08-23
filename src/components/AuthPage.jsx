import { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import './auth.css';

const AuthPage = ({ onBack, initialMode = null }) => {
  const [mode, setMode] = useState(initialMode);

  if (mode === 'login') {
    return (
      <div>
        <button type="button" onClick={onBack} className="btn btn-link position-absolute top-0 start-0 m-4 auth-back z-1">
          <span aria-hidden="true">&#8592;</span> Accueil
        </button>
        <Login onSignUp={() => setMode('signup')} />
      </div>
    );
  }

  if (mode === 'signup') {
    return (
      <div>
        <button type="button" onClick={onBack} className="btn btn-link position-absolute top-0 start-0 m-4 auth-back z-1">
          <span aria-hidden="true">&#8592;</span> Accueil
        </button>
        <SignUp onLogin={() => setMode('login')} />
      </div>
    );
  }

  return (
    <main className="auth-page min-vh-100 d-flex align-items-center py-5 folio-auth-enter">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-9 col-xl-8">
            <div className="text-center mb-4">
              <p className="folio-auth-eyebrow folio-auth-item">Bienvenue sur Folio</p>
              <h1 className="folio-auth-title folio-auth-item">Ton prochain chapitre commence ici.</h1>
              <p className="folio-auth-subtitle folio-auth-item mb-0">Crée ton espace ou retrouve ton compte pour continuer.</p>
            </div>
            <button type="button" className="folio-btn-primary mb-3 folio-auth-item" onClick={() => setMode('signup')}>Créer mon compte</button>
            <button type="button" className="btn btn-outline-custom w-100 folio-auth-item" onClick={() => setMode('login')}>Se connecter</button>
            <button type="button" onClick={onBack} className="btn btn-link mt-4 auth-back folio-auth-item">Retour à l'accueil</button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AuthPage;