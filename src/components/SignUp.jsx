import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getAuthRedirectUrl } from '../authRedirect';
import googleLogo from '../assets/google.jpg';
import './auth.css';

export default function SignUp({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) return;

    const handleCredentialResponse = async (response) => {
      setServerError('');
      setLoading(true);
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });
      if (error) {
        setServerError(error.message || 'Inscription impossible pour le moment.');
        setLoading(false);
      }
    };

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCredentialResponse,
        });
        const container = document.getElementById('google-signin-btn-signup');
        if (container) {
          container.innerHTML = '';
          window.google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signup_with',
            shape: 'rectangular',
          });
        }
        window.google.accounts.id.prompt();
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    }
  }, [googleClientId]);

  const handleOAuth = async () => {
    setServerError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
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
          {googleClientId ? (
            <div id="google-signin-btn-signup" className="d-flex justify-content-center"></div>
          ) : (
            <button type="button" className="folio-social-btn py-2.5" onClick={handleOAuth} disabled={loading}>
              <img src={googleLogo} alt="" width="20" height="20" /> S'inscrire avec Google
            </button>
          )}
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
