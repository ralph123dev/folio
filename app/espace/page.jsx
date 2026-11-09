import { jsx as _jsx } from "react/jsx-runtime";
import WorkspaceClient from './WorkspaceClient';
export const metadata = {
    title: 'Espace professionnel',
    description: 'Gérez votre compte et vos profils freelance Folio.',
    robots: { index: false, follow: false },
};
export default function WorkspacePage() {
    return _jsx(WorkspaceClient, {});
}
