import { useState } from 'react';
import { supabase } from '../supabaseClient';
import googleLogo from '../assets/google.jpg';
import './auth.css';

export default function SignUp({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleOAuth = async () => {
    setServerError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) {
      setServerError(error.message || 'Inscription impossible pour le moment.');
      setLoading(false);
    }
  };

  return (
    <div className="folio-auth-wrapper folio-auth-enter">
      <div className="folio-auth-card text-center">
        <p className="folio-auth-eyebrow folio-auth-item">Folio</p>
        <h1 className="folio-auth-title folio-auth-item">Crée ton compte</h1>
        <p className="folio-auth-subtitle folio-auth-item">Connecte ton portfolio et commence à suivre son trafic dès aujourd'hui.</p>
        
        {serverError && <div className="folio-error-text mb-3" role="alert">{serverError}</div>}

        <div className="d-grid gap-2 folio-auth-item mb-4">
          <button type="button" className="folio-social-btn py-2.5" onClick={handleOAuth} disabled={loading}>
            <img src={googleLogo} alt="" width="20" height="20" /> S'inscrire avec Google
          </button>
        </div>

        <p className="folio-auth-footer-text folio-auth-item mb-0">
          Déjà un compte ?{' '}
          <button type="button" className="btn btn-link p-0 align-baseline fw-medium text-primary text-decoration-none" onClick={onLogin}>
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
