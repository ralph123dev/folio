import { useState } from 'react';
import { supabase } from '../supabaseClient';
import googleLogo from '../assets/google.jpg';
import githubLogo from '../assets/github.jpg';
import './auth.css';

export default function Login({ onSignUp }) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleOAuth = async (provider) => {
    setServerError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
      },
    });
    if (error) {
      setServerError(error.message || 'Connexion impossible pour le moment.');
      setLoading(false);
    }
  };

  return (
    <div className="folio-auth-wrapper folio-auth-enter">
      <div className="folio-auth-card">
        <p className="folio-auth-eyebrow folio-auth-item">Folio</p>
        <h1 className="folio-auth-title folio-auth-item">Content de te revoir</h1>
        <p className="folio-auth-subtitle folio-auth-item">Connecte-toi pour retrouver le trafic de ton portfolio.</p>
        {serverError && <div className="folio-error-text mb-3" role="alert">{serverError}</div>}
        <div className="d-grid gap-2 folio-auth-item">
          <button type="button" className="folio-social-btn" onClick={() => handleOAuth('google')} disabled={loading}>
            <img src={googleLogo} alt="" width="20" height="20" /> Continuer avec Google
          </button>
          <button type="button" className="folio-social-btn" onClick={() => handleOAuth('github')} disabled={loading}>
            <img src={githubLogo} alt="" width="20" height="20" /> Continuer avec GitHub
          </button>
        </div>
        <p className="folio-auth-footer-text folio-auth-item">Pas encore de compte ? <button type="button" className="btn btn-link p-0 align-baseline" onClick={onSignUp}>Crée le tien</button></p>
      </div>
    </div>
  );
}
