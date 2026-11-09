import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import Link from 'next/link';
import CategoryGrid from '../../components/freelancers/CategoryGrid';
import FreelancerCard from '../../components/freelancers/FreelancerCard';
import JsonLd from '../../components/seo/JsonLd';
import Breadcrumbs from '../../components/site/Breadcrumbs';
import Footer from '../../components/site/Footer';
import Header from '../../components/site/Header';
import { filterFreelancers, getCategories, getFreelancers } from '../../lib/freelancers';
import { breadcrumbJsonLd } from '../../lib/seo';
import { absoluteUrl, normalizeText } from '../../lib/site';
export const revalidate = 3600;
export async function generateMetadata({ searchParams }) {
    const params = await searchParams;
    const query = String(params?.q || '').trim();
    if (!query) {
        return {
            title: 'Annuaire des freelancers',
            description: 'Trouvez un freelance en développement, design, SEO et marketing digital sur Folio.',
            alternates: { canonical: absoluteUrl('/freelancers') },
        };
    }
    const safeQuery = normalizeText(query, 70);
    return {
        title: `Recherche de freelancers : ${safeQuery}`,
        description: `Résultats Folio pour « ${safeQuery} ». Explorez les profils et leurs services.`,
        alternates: { canonical: absoluteUrl('/freelancers') },
        robots: { index: false, follow: true },
    };
}
export default async function FreelancersPage({ searchParams }) {
    const params = await searchParams;
    const query = String(params?.q || '').trim();
    const [freelancers, categories] = await Promise.all([getFreelancers(), getCategories()]);
    const results = filterFreelancers(freelancers, query).slice(0, 60);
    const breadcrumbs = [{ name: 'Accueil', path: '/' }, { name: 'Freelancers', path: '/freelancers' }];
    return (_jsxs(_Fragment, { children: [_jsx(Header, {}), _jsx("main", { className: "directory-page", children: _jsxs("div", { className: "seo-container", children: [_jsx(Breadcrumbs, { items: breadcrumbs }), _jsx(JsonLd, { data: breadcrumbJsonLd(breadcrumbs) }), _jsxs("section", { className: "directory-intro", children: [_jsx("p", { className: "eyebrow", children: "Annuaire B2B" }), _jsx("h1", { children: "Trouvez un freelancer pour votre projet" }), _jsx("p", { children: "Parcourez des profils de d\u00E9veloppeurs, designers et sp\u00E9cialistes du digital. Pour les filtres principaux, utilisez les pages m\u00E9tier et localisation ci-dessous : elles ont une URL stable et partageable." }), _jsxs("form", { className: "directory-search", action: "/freelancers", method: "get", role: "search", children: [_jsx("label", { htmlFor: "freelancer-search", children: "Rechercher par nom, comp\u00E9tence ou localisation" }), _jsxs("div", { children: [_jsx("input", { id: "freelancer-search", name: "q", type: "search", defaultValue: query, placeholder: "Ex. d\u00E9veloppeur React \u00E0 Abidjan" }), _jsx("button", { type: "submit", className: "site-button", children: "Rechercher" })] })] })] }), query ? (_jsxs("section", { "aria-labelledby": "search-results-title", children: [_jsxs("h2", { id: "search-results-title", children: [results.length, " r\u00E9sultat", results.length > 1 ? 's' : '', " pour \u00AB ", query, " \u00BB"] }), results.length ? _jsx("div", { className: "freelancer-grid", children: results.map((freelancer) => _jsx(FreelancerCard, { freelancer: freelancer }, freelancer.id)) }) : _jsx("p", { className: "empty-state", children: "Aucun profil ne correspond encore \u00E0 cette recherche. Essayez un m\u00E9tier ou une localisation plus large." })] })) : (_jsxs("section", { "aria-labelledby": "directory-results-title", children: [_jsx("h2", { id: "directory-results-title", children: "Profils r\u00E9cemment publi\u00E9s" }), results.length ? _jsx("div", { className: "freelancer-grid", children: results.map((freelancer) => _jsx(FreelancerCard, { freelancer: freelancer }, freelancer.id)) }) : _jsxs("p", { className: "empty-state", children: ["Les premiers profils appara\u00EEtront ici d\u00E8s leur publication. ", _jsx(Link, { href: "/espace?auth=signup", children: "Cr\u00E9er un profil freelance" }), "."] })] })), _jsx(CategoryGrid, { categories: categories, title: "Affiner par sp\u00E9cialit\u00E9" })] }) }), _jsx(Footer, {})] }));
}
