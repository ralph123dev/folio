export const getAuthRedirectUrl = () => {
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') || '';
};
