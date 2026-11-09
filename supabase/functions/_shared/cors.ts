const DEVELOPMENT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
];
const FALLBACK_ORIGINS = [
    "https://folio.com",
    "https://foliodev.site",
    "https://www.foliodev.site",
    "https://foliodev-kappa.vercel.app",
];
const getAllowedOrigins = () => {
    const env = Deno.env.get("ALLOWED_ORIGINS");
    const configuredOrigins = env
        ? env.split(",").map((o) => o.trim()).filter(Boolean)
        : FALLBACK_ORIGINS;
    return [...new Set([...configuredOrigins, ...DEVELOPMENT_ORIGINS])];
};
export const getCorsHeaders = (req, extra = {}) => {
    const origin = req.headers.get("Origin") ?? "";
    const allowed = getAllowedOrigins();
    const headers = {
        "Vary": "Origin",
        ...extra,
    };
    if (origin && allowed.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }
    return headers;
};
export const handlePreflight = (req, { allowHeaders = "authorization, x-client-info, apikey, content-type", allowMethods = "POST, OPTIONS", } = {}) => {
    const headers = getCorsHeaders(req, {
        "Access-Control-Allow-Headers": allowHeaders,
        "Access-Control-Allow-Methods": allowMethods,
        "Access-Control-Max-Age": "86400",
    });
    return new Response(null, { status: 204, headers });
};
