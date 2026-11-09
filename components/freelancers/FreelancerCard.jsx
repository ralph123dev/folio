import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from 'next/image';
import Link from 'next/link';
import { categoryPath, locationPath, profilePath, safeImageUrl } from '../../lib/site';
function makeWhatsAppUrl(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : null;
}
export default function FreelancerCard({ freelancer, headingLevel = 'h2' }) {
    const Heading = headingLevel;
    const image = safeImageUrl(freelancer.photo_url);
    const whatsappUrl = makeWhatsAppUrl(freelancer.whatsapp);
    return (_jsxs("article", { className: "freelancer-card", children: [_jsxs("div", { className: "freelancer-card__topline", children: [image ? (_jsx(Image, { src: image, alt: `Portrait de ${freelancer.name}`, width: 96, height: 96, sizes: "96px", loading: "lazy", className: "freelancer-card__avatar" })) : _jsx("div", { className: "freelancer-card__avatar freelancer-card__avatar--placeholder", "aria-hidden": "true", children: freelancer.name.charAt(0) }), _jsxs("div", { children: [_jsx(Heading, { className: "freelancer-card__name", children: _jsx(Link, { href: profilePath(freelancer), children: freelancer.name }) }), _jsx("p", { className: "freelancer-card__specialty", children: freelancer.activite }), _jsx("p", { className: "freelancer-card__location", children: freelancer.location })] })] }), freelancer.description && _jsx("p", { className: "freelancer-card__description", children: freelancer.description }), _jsxs("div", { className: "freelancer-card__facts", children: [freelancer.annees_experience ? _jsxs("span", { children: [freelancer.annees_experience, " an", freelancer.annees_experience > 1 ? 's' : '', " d\u2019exp\u00E9rience"] }) : null, freelancer.averageRating ? _jsxs("span", { "aria-label": `Note moyenne ${freelancer.averageRating} sur 5`, children: ["\u2605 ", freelancer.averageRating, "/5 (", freelancer.ratingCount, ")"] }) : null, Number(freelancer.prix_a_partir_de) > 0 ? _jsxs("span", { children: ["D\u00E8s ", Number(freelancer.prix_a_partir_de).toLocaleString('fr-FR'), " ", freelancer.devise || 'XAF'] }) : null] }), _jsxs("div", { className: "freelancer-card__links", children: [_jsx(Link, { href: profilePath(freelancer), className: "text-link", children: "Voir le profil" }), whatsappUrl ? _jsx("a", { href: whatsappUrl, target: "_blank", rel: "noopener noreferrer", className: "text-link", children: "Contacter" }) : null] }), _jsxs("p", { className: "freelancer-card__taxonomy", children: [_jsx(Link, { href: categoryPath(freelancer.activite), children: freelancer.activite }), _jsx("span", { "aria-hidden": "true", children: " \u00B7 " }), _jsx(Link, { href: locationPath(freelancer.activite, freelancer.location), children: freelancer.location })] })] }));
}
