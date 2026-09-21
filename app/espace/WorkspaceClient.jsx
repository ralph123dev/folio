'use client';

import dynamic from 'next/dynamic';

const LegacyWorkspace = dynamic(() => import('../../src/App.jsx'), {
  ssr: false,
  loading: () => <div className="legacy-loading" role="status">Chargement de votre espace Folio…</div>,
});

export default function WorkspaceClient() {
  return <LegacyWorkspace />;
}
