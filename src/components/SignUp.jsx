import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { supabase } from '../supabaseClient';
import githubLogo from '../assets/github.jpg';
import './auth.css';

export default function SignUp({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleOAuth = async (credentialResponse) => {
    setServerError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credentialResponse.credential,
    });
    if (error) {
      setServerError(error.message || 'Inscription impossible pour le moment.');
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    setServerError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
    if (error) {
      setServerError(error.message || 'Inscription GitHub impossible pour le moment.');
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
          <div className="folio-google-btn">
            <GoogleLogin
              onSuccess={handleOAuth}
              onError={() => { setServerError('Inscription Google impossible pour le moment.'); setLoading(false); }}
              useOneTap={false}
              text="signup_with"
              shape="rectangular"
              width="320"
            />
          </div>
          <button type="button" className="folio-social-btn" onClick={signInWithGithub} disabled={loading}>
            <img src={githubLogo} alt="" width="20" height="20" />
            S'inscrire avec GitHub
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
