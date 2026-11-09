export const SITE_NAME = 'Folio';
export const DEFAULT_SITE_URL = 'https://folio.com';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL)
    .replace(/\/+$/, '');
export const PRIMARY_SPECIALTIES = [
    'Développeur web',
    'Développeur mobile',
    'Designer UI/UX',
    'Graphiste',
    'Spécialiste SEO',
    'Rédacteur web',
    'Community manager',
    'Monteur vidéo',
];
export function slugify(value) {
    const normalized = String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return normalized || 'en-ligne';
}
export function displayName(freelancer) {
    return freelancer?.nom_freelancer
        || [freelancer?.prenom, freelancer?.nom].filter(Boolean).join(' ')
        || 'Freelancer Folio';
}
export function specialtySlug(freelancer) {
    return freelancer?.specialite_slug || slugify(freelancer?.activite);
}
export function locationSlug(freelancer) {
    return freelancer?.localisation_slug || slugify(freelancer?.localisation || 'En ligne');
}
export function freelancerSlug(freelancer) {
    if (freelancer?.slug)
        return freelancer.slug;
    const suffix = freelancer?.id ? `-${String(freelancer.id).slice(0, 8)}` : '';
    return `${slugify(displayName(freelancer))}${suffix}`;
}
export function profilePath(freelancer) {
    return `/freelancers/${specialtySlug(freelancer)}/${locationSlug(freelancer)}/${freelancerSlug(freelancer)}`;
}
export function categoryPath(specialty) {
    return `/freelancers/${slugify(specialty)}`;
}
export function locationPath(specialty, location) {
    return `/freelancers/${slugify(specialty)}/${slugify(location)}`;
}
export function absoluteUrl(path = '/') {
    if (/^https?:\/\//.test(path))
        return path;
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
export function safeImageUrl(value) {
    if (!value || typeof value !== 'string' || value.startsWith('data:'))
        return null;
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
    }
    catch {
        return null;
    }
}
export function normalizeText(value, maxLength = 160) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength)
        return text;
    return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
