const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const stripHtml = (html: string) => html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/\s+/g, " ")
  .trim();

const firstMatch = (html: string, pattern: RegExp) => html.match(pattern)?.[1]?.trim() || "";
const countMatches = (html: string, pattern: RegExp) => html.match(pattern)?.length || 0;
const escapeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const isPublicUrl = (value: string) => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return false;
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1") return false;
  if (/^(10\.|127\.|169\.254\.|192\.168\.)/.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
  return true;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée" }, 405);

  try {
    const { portfolioUrl, name = "", profession = "" } = await req.json();
    if (typeof portfolioUrl !== "string" || !isPublicUrl(portfolioUrl)) {
      return jsonResponse({ error: "L'URL du portfolio doit être une adresse publique en http ou https." }, 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    let response: Response;
    try {
      response = await fetch(portfolioUrl, {
        signal: controller.signal,
        headers: { Accept: "text/html,application/xhtml+xml", "User-Agent": "Folio-SEO-Analyzer/1.0" },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) return jsonResponse({ error: `Le portfolio a répondu avec le statut HTTP ${response.status}.` }, 502);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return jsonResponse({ error: "Cette adresse ne renvoie pas une page HTML analysable." }, 415);
    }

    const html = (await response.text()).slice(0, 2_000_000);
    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
    const canonical = firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i);
    const lang = firstMatch(html, /<html[^>]+lang=["']([^"']+)["']/i);
    const h1Count = countMatches(html, /<h1(?:\s|>)/gi);
    const imageCount = countMatches(html, /<img(?:\s|>)/gi);
    const imagesWithoutAlt = countMatches(html, /<img(?![^>]+\balt\s*=)[^>]*>/gi);
    const internalLinkCount = countMatches(html, /<a[^>]+href=["'][^"']*["'][^>]*>/gi);
    const textLength = stripHtml(html).length;
    const viewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const structuredData = /application\/ld\+json/i.test(html);
    const normalizedTitle = title || `${name || "Votre nom"} | ${profession || "Services professionnels"}`;
    const normalizedDescription = description || `Découvrez les services de ${profession || "ce professionnel"} ${name ? `de ${name}` : ""}. Contactez-moi pour vos projets.`.trim();
    const canonicalUrl = canonical || portfolioUrl;
    const recommendations: string[] = [];
    if (!title) recommendations.push("Ajoute une balise title unique avec ton nom et ton métier.");
    else if (title.length < 30 || title.length > 60) recommendations.push("Garde le title entre 30 et 60 caractères pour améliorer son affichage dans Google.");
    if (!description) recommendations.push("Ajoute une meta description claire de 120 à 160 caractères.");
    else if (description.length < 120 || description.length > 160) recommendations.push("Ajuste la meta description pour viser environ 120 à 160 caractères.");
    if (h1Count !== 1) recommendations.push(h1Count === 0 ? "Ajoute un seul titre H1 décrivant ton activité." : "Conserve un seul H1 principal sur la page.");
    if (imageCount && imagesWithoutAlt) recommendations.push(`Ajoute l'attribut alt à ${imagesWithoutAlt} image(s).`);
    if (!viewport) recommendations.push("Ajoute la meta viewport pour un affichage mobile correct.");
    if (!canonical) recommendations.push("Ajoute une URL canonical pour éviter les doublons d'URL.");
    if (!structuredData) recommendations.push("Ajoute des données structurées JSON-LD de type Person ou ProfessionalService.");
    if (textLength < 300) recommendations.push("Enrichis le contenu visible avec tes services, réalisations et zones d'intervention.");

    const score = Math.max(0, Math.min(100, 100 - recommendations.length * 10));
    const headCode = `<title>${escapeAttribute(normalizedTitle)}</title>\n<meta name="description" content="${escapeAttribute(normalizedDescription.slice(0, 160))}" />\n<meta name="robots" content="index, follow" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />`;

    return jsonResponse({
      url: portfolioUrl,
      score,
      analyzedAt: new Date().toISOString(),
      metrics: { title, description, h1Count, imageCount, imagesWithoutAlt, textLength, viewport, canonical, lang, structuredData, internalLinkCount },
      recommendations,
      headCode,
    });
  } catch (error) {
    console.error("Erreur analyse SEO:", error);
    const message = error instanceof DOMException && error.name === "AbortError"
      ? "Le portfolio n'a pas répondu dans le délai prévu."
      : "Impossible d'analyser ce portfolio pour le moment.";
    return jsonResponse({ error: message }, 502);
  }
});
