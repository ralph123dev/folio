import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { supabase } from '../supabaseClient';
import './auth.css';

export default function Login({ onSignUp }) {
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
      setServerError(error.message || 'Connexion impossible pour le moment.');
      setLoading(false);
    }
  };

  return (
    <div className="folio-auth-wrapper folio-auth-enter">
      <div className="folio-auth-card text-center">
        <p className="folio-auth-eyebrow folio-auth-item">Folio</p>
        <h1 className="folio-auth-title folio-auth-item">Content de te revoir</h1>
        <p className="folio-auth-subtitle folio-auth-item">Connecte-toi pour retrouver le trafic de ton portfolio.</p>
        
        {serverError && <div className="folio-error-text mb-3" role="alert">{serverError}</div>}

        <div className="d-grid gap-2 folio-auth-item mb-4">
          <GoogleLogin
            onSuccess={handleOAuth}
            onError={() => { setServerError('Connexion Google impossible pour le moment.'); setLoading(false); }}
            useOneTap={false}
            text="continue_with"
            shape="rectangular"
            width="320"
          />
        </div>

        <p className="folio-auth-footer-text folio-auth-item mb-0">
          Pas encore de compte ?{' '}
          <button type="button" className="btn btn-link p-0 align-baseline fw-medium text-primary text-decoration-none" onClick={onSignUp}>
            Crée le tien
          </button>
        </p>
      </div>
    </div>
  );
}
