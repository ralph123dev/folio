import { jsx as _jsx } from "react/jsx-runtime";
export default function JsonLd({ data }) {
    return (_jsx("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, '\\u003c') } }));
}
