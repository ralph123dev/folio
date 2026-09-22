/**
 * Shared CORS helper for Supabase Edge Functions.
 *
 * Reads ALLOWED_ORIGINS from Deno.env (comma-separated).
 * Falls back to the hardcoded production + preview origins when the env var
 * is not set (local dev convenience).
 */

const DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const FALLBACK_ORIGINS = [
  "https://folio.com",
  "https://www.foliodev.site",
  "https://foliodev-kappa.vercel.app",
];

/** Returns the parsed list of allowed origins. */
const getAllowedOrigins = (): string[] => {
  const env = Deno.env.get("ALLOWED_ORIGINS");
  const configuredOrigins = env
    ? env.split(",").map((o) => o.trim()).filter(Boolean)
    : FALLBACK_ORIGINS;

  return [...new Set([...configuredOrigins, ...DEVELOPMENT_ORIGINS])];
};

/**
 * Build CORS response headers for the given request.
 *
 * - If the request's `Origin` is in the allow-list → mirror it back.
 * - Otherwise → omit `Access-Control-Allow-Origin` entirely (browser will
 *   block the response on the client side).
 * - Always adds `Vary: Origin` so caches/CDNs don't mix up responses.
 * - Never combines `Access-Control-Allow-Credentials: true` with a wildcard.
 */
export const getCorsHeaders = (
  req: Request,
  extra: Record<string, string> = {},
): Record<string, string> => {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = getAllowedOrigins();
  const headers: Record<string, string> = {
    "Vary": "Origin",
    ...extra,
  };

  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  // If origin is absent (server-to-server call) or not allowed, we
  // intentionally do NOT set Access-Control-Allow-Origin.

  return headers;
};

/**
 * Return a complete 204 preflight response for an OPTIONS request.
 *
 * Includes:
 * - Access-Control-Allow-Origin (dynamic, origin-checked)
 * - Access-Control-Allow-Headers (pass the list relevant to your function)
 * - Access-Control-Allow-Methods (pass the list relevant to your function)
 * - Access-Control-Max-Age: 86400 (cache preflight for 24 h)
 * - Vary: Origin
 */
export const handlePreflight = (
  req: Request,
  {
    allowHeaders = "authorization, x-client-info, apikey, content-type",
    allowMethods = "POST, OPTIONS",
  }: { allowHeaders?: string; allowMethods?: string } = {},
): Response => {
  const headers = getCorsHeaders(req, {
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Allow-Methods": allowMethods,
    "Access-Control-Max-Age": "86400",
  });

  return new Response(null, { status: 204, headers });
};
