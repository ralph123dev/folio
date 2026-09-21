const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');

export const getAuthRedirectUrl = () => configuredSiteUrl || window.location.origin;