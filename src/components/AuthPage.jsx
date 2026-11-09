import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import './auth.css';
const AuthPage = ({ onBack, initialMode = null }) => {
    const [mode, setMode] = useState(initialMode);
    if (mode === 'login') {
        return (_jsxs("div", { children: [_jsxs("button", { type: "button", onClick: onBack, className: "btn btn-link position-absolute top-0 start-0 m-4 auth-back z-1", children: [_jsx("span", { "aria-hidden": "true", children: "\u2190" }), " Accueil"] }), _jsx(Login, { onSignUp: () => setMode('signup') })] }));
    }
    if (mode === 'signup') {
        return (_jsxs("div", { children: [_jsxs("button", { type: "button", onClick: onBack, className: "btn btn-link position-absolute top-0 start-0 m-4 auth-back z-1", children: [_jsx("span", { "aria-hidden": "true", children: "\u2190" }), " Accueil"] }), _jsx(SignUp, { onLogin: () => setMode('login') })] }));
    }
    return (_jsx("main", { className: "auth-page min-vh-100 d-flex align-items-center py-5 folio-auth-enter", children: _jsx("div", { className: "container", children: _jsx("div", { className: "row justify-content-center", children: _jsxs("div", { className: "col-12 col-lg-9 col-xl-8", children: [_jsxs("div", { className: "text-center mb-4", children: [_jsx("p", { className: "folio-auth-eyebrow folio-auth-item", children: "Bienvenue sur Folio" }), _jsx("h1", { className: "folio-auth-title folio-auth-item", children: "Ton prochain chapitre commence ici." }), _jsx("p", { className: "folio-auth-subtitle folio-auth-item mb-0", children: "Cr\u00E9e ton espace ou retrouve ton compte pour continuer." })] }), _jsx("button", { type: "button", className: "folio-btn-primary mb-3 folio-auth-item", onClick: () => setMode('signup'), children: "Cr\u00E9er mon compte" }), _jsx("button", { type: "button", className: "btn btn-outline-custom w-100 folio-auth-item", onClick: () => setMode('login'), children: "Se connecter" }), _jsx("button", { type: "button", onClick: onBack, className: "btn btn-link mt-4 auth-back folio-auth-item", children: "Retour \u00E0 l'accueil" })] }) }) }) }));
};
export default AuthPage;
