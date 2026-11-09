import { jsx as _jsx } from "react/jsx-runtime";
import Link from 'next/link';
export default function Breadcrumbs({ items }) {
    return (_jsx("nav", { "aria-label": "Fil d\u2019Ariane", className: "breadcrumbs", children: _jsx("ol", { children: items.map((item, index) => (_jsx("li", { children: index === items.length - 1 ? _jsx("span", { "aria-current": "page", children: item.name }) : _jsx(Link, { href: item.path, children: item.name }) }, `${item.path}-${item.name}`))) }) }));
}
