import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
export default function Header() {
    return (_jsx("header", { className: "site-header", children: _jsxs("div", { className: "seo-container site-header__inner", children: [_jsxs(Link, { href: "/", className: "site-brand", "aria-label": "Folio, accueil", children: [_jsx("span", { className: "site-brand__mark", "aria-hidden": "true", children: "F" }), _jsx("span", { children: "Folio" })] }), _jsxs("nav", { "aria-label": "Navigation principale", className: "site-nav", children: [_jsx(Link, { href: "/freelancers", children: "Trouver un freelance" }), _jsx(Link, { href: "/#comment-ca-marche", children: "Comment \u00E7a marche" }), _jsx(Link, { href: "/espace?auth=login", children: "Connexion" }), _jsx(Link, { href: "/espace?auth=signup", className: "site-button site-button--small", children: "Cr\u00E9er mon profil" })] })] }) }));
}
