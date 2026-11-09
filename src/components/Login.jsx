import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { supabase } from '../supabaseClient';
import githubLogo from '../assets/github.jpg';
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
    const signInWithGithub = async () => {
        setServerError('');
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'github' });
        if (error) {
            setServerError(error.message || 'Connexion GitHub impossible pour le moment.');
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "folio-auth-wrapper folio-auth-enter", children: _jsxs("div", { className: "folio-auth-card text-center", children: [_jsx("p", { className: "folio-auth-eyebrow folio-auth-item", children: "Folio" }), _jsx("h1", { className: "folio-auth-title folio-auth-item", children: "Content de te revoir" }), _jsx("p", { className: "folio-auth-subtitle folio-auth-item", children: "Connecte-toi pour retrouver le trafic de ton portfolio." }), serverError && _jsx("div", { className: "folio-error-text mb-3", role: "alert", children: serverError }), _jsxs("div", { className: "d-grid gap-2 folio-auth-item mb-4", children: [_jsx("div", { className: "folio-google-btn", children: _jsx(GoogleLogin, { onSuccess: handleOAuth, onError: () => { setServerError('Connexion Google impossible pour le moment.'); setLoading(false); }, useOneTap: false, text: "continue_with", shape: "rectangular", width: "320" }) }), _jsxs("button", { type: "button", className: "folio-social-btn", onClick: signInWithGithub, disabled: loading, children: [_jsx("img", { src: githubLogo, alt: "", width: "20", height: "20" }), "Se connecter avec GitHub"] })] }), _jsxs("p", { className: "folio-auth-footer-text folio-auth-item mb-0", children: ["Pas encore de compte ?", ' ', _jsx("button", { type: "button", className: "btn btn-link p-0 align-baseline fw-medium text-primary text-decoration-none", onClick: onSignUp, children: "Cr\u00E9e le tien" })] })] }) }));
}
