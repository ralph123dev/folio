'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from 'next/dynamic';
const LegacyWorkspace = dynamic(() => import('../../src/App.jsx'), {
    ssr: false,
    loading: () => _jsx("div", { className: "legacy-loading", role: "status", children: "Chargement de votre espace Folio\u2026" }),
});
export default function WorkspaceClient() {
    return _jsx(LegacyWorkspace, {});
}
