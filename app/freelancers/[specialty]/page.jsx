import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { notFound } from 'next/navigation';
import CategoryGrid from '../../../components/freelancers/CategoryGrid';
import FreelancerCard from '../../../components/freelancers/FreelancerCard';
import JsonLd from '../../../components/seo/JsonLd';
import Breadcrumbs from '../../../components/site/Breadcrumbs';
import Footer from '../../../components/site/Footer';
import Header from '../../../components/site/Header';
import { getCategories, getFreelancersByCategory } from '../../../lib/freelancers';
import { breadcrumbJsonLd, categoryMetadata } from '../../../lib/seo';
import { categoryPath, locationPath, PRIMARY_SPECIALTIES, slugify } from '../../../lib/site';
export const revalidate = 3600;
async function getCategoryPageData(specialty) {
    const categories = await getCategories();
    const category = categories.find((item) => item.slug === specialty);
    const fallbackLabel = PRIMARY_SPECIALTIES.find((label) => slugify(label) === specialty);
    const label = category?.label || fallbackLabel;
    if (!label)
        return null;
    const freelancers = await getFreelancersByCategory(specialty);
    return { category: category || { slug: specialty, label, count: freelancers.length, locations: [] }, freelancers };
}
export async function generateMetadata({ params }) {
    const { specialty } = await params;
    const data = await getCategoryPageData(specialty);
    if (!data)
        return { title: 'Catégorie introuvable', robots: { index: false, follow: false } };
    return categoryMetadata({ label: data.category.label, canonicalPath: categoryPath(specialty), count: data.freelancers.length });
}
export default async function SpecialtyPage({ params }) {
    const { specialty } = await params;
    const data = await getCategoryPageData(specialty);
    if (!data)
        notFound();
    const { category, freelancers } = data;
    const breadcrumbs = [{ name: 'Accueil', path: '/' }, { name: 'Freelancers', path: '/freelancers' }, { name: category.label, path: categoryPath(specialty) }];
    const locations = category.locations || [];
    return (_jsxs(_Fragment, { children: [_jsx(Header, {}), _jsx("main", { className: "category-page", children: _jsxs("div", { className: "seo-container", children: [_jsx(Breadcrumbs, { items: breadcrumbs }), _jsx(JsonLd, { data: breadcrumbJsonLd(breadcrumbs) }), _jsxs("section", { className: "category-intro", children: [_jsx("p", { className: "eyebrow", children: "Sp\u00E9cialit\u00E9" }), _jsxs("h1", { children: ["Freelances ", category.label] }), _jsxs("p", { children: ["Folio r\u00E9unit des ", category.label.toLocaleLowerCase('fr'), " pour les entreprises qui veulent concr\u00E9tiser un besoin pr\u00E9cis sans multiplier les interm\u00E9diaires. Comparez les profils, leurs exp\u00E9riences, leurs services et leurs moyens de contact avant de lancer la discussion."] }), _jsx("p", { children: "Cette page m\u00E9tier donne un point d\u2019entr\u00E9e clair aux d\u00E9cideurs qui recherchent une expertise cibl\u00E9e. Les profils peuvent pr\u00E9senter un portfolio, une note lorsqu\u2019elle est disponible, une zone d\u2019intervention et un tarif de d\u00E9part. Cette information facilite un premier tri raisonnable : vous savez quel savoir-faire est propos\u00E9, o\u00F9 l\u2019expert intervient et comment poursuivre l\u2019\u00E9change." }), _jsx("p", { children: "Le bon ind\u00E9pendant ne se r\u00E9sume pas \u00E0 une liste de technologies. Prenez le temps de lire la description de ses services, d\u2019\u00E9valuer son exp\u00E9rience et de v\u00E9rifier l\u2019ad\u00E9quation entre le probl\u00E8me \u00E0 r\u00E9soudre et la mani\u00E8re dont il travaille. Vous pouvez ensuite suivre les liens internes vers une localisation ou revenir \u00E0 l\u2019annuaire g\u00E9n\u00E9ral si votre besoin \u00E9volue. Pour les freelancers, cette cat\u00E9gorie est aussi une page de d\u00E9couverte durable : un prospect peut la partager \u00E0 son \u00E9quipe ou y revenir au moment opportun." })] }), locations.length > 0 && _jsxs("section", { className: "location-links", "aria-labelledby": "locations-title", children: [_jsxs("h2", { id: "locations-title", children: [category.label, " par localisation"] }), _jsx("div", { children: locations.map((location) => _jsx(Link, { href: locationPath(category.slug, location.slug), children: location.label }, location.slug)) })] }), _jsxs("section", { "aria-labelledby": "specialty-profiles-title", children: [_jsxs("h2", { id: "specialty-profiles-title", children: ["Profils ", category.label] }), freelancers.length ? _jsx("div", { className: "freelancer-grid", children: freelancers.map((freelancer) => _jsx(FreelancerCard, { freelancer: freelancer }, freelancer.id)) }) : _jsx("p", { className: "empty-state", children: "Les profils publi\u00E9s dans cette sp\u00E9cialit\u00E9 appara\u00EEtront ici prochainement." })] }), _jsx(CategoryGrid, { categories: [] })] }) }), _jsx(Footer, {})] }));
}
