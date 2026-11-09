import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { categoryPath } from '../../lib/site';
export default function CategoryGrid({ categories, title = 'Explorer par métier' }) {
    if (!categories?.length)
        return null;
    return (_jsxs("section", { className: "category-grid-section", "aria-labelledby": "category-grid-title", children: [_jsxs("div", { className: "section-heading", children: [_jsx("p", { className: "eyebrow", children: "Annuaire sp\u00E9cialis\u00E9" }), _jsx("h2", { id: "category-grid-title", children: title })] }), _jsx("div", { className: "category-grid", children: categories.map((category) => (_jsxs(Link, { className: "category-card", href: categoryPath(category.slug || category.label), children: [_jsx("span", { children: category.label }), _jsxs("small", { children: [category.count, " profil", category.count > 1 ? 's' : ''] })] }, category.slug || category.label))) })] }));
}
