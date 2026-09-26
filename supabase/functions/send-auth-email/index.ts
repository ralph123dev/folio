import { Resend } from "npm:resend@6.30.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handlePreflight } from "../_shared/cors.ts";

const jsonResponse = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
});

const escapeHtml = (value: string) => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const emailLayout = (title: string, content: string) => `
  <div style="margin:0;background:#eef1fb;padding:32px 16px;font-family:Arial,sans-serif;color:#3c3489;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:36px 32px;box-shadow:0 8px 28px rgba(38,33,92,.10);">
      <div style="margin-bottom:28px;color:#534ab7;font-size:22px;font-weight:700;">Folio Dev</div>
      <h1 style="margin:0 0 16px;color:#26215c;font-size:28px;line-height:1.2;">${title}</h1>
      ${content}
      <a href="https://foliodev.site" style="display:inline-block;margin-top:24px;padding:13px 20px;border-radius:8px;background:#534ab7;color:#ffffff;text-decoration:none;font-weight:700;">Accéder à Folio Dev</a>
      <p style="margin:32px 0 0;color:#77718f;font-size:12px;">Tu reçois cet email parce qu’une activité a été détectée sur ton compte Folio Dev.</p>
    </div>
  </div>
`;

const renderLocation = (value: unknown) => {
  if (!value || typeof value !== "object") return "";

  const location = value as Record<string, unknown>;
  const ip = typeof location.ip === "string" ? location.ip.trim().slice(0, 100) : "";
  const city = typeof location.city === "string" ? location.city.trim().slice(0, 100) : "";
  const country = typeof location.country_name === "string" ? location.country_name.trim().slice(0, 100) : "";
  const continent = typeof location.continent_name === "string" ? location.continent_name.trim().slice(0, 100) : "";

  if (!ip && !city && !country && !continent) return "";

  return `<div style="margin-top:24px;padding:16px 18px;border-radius:10px;background:#f5f4fc;color:#3c3489;font-size:14px;line-height:1.8;">
    <strong style="color:#26215c;">Informations de connexion</strong><br />
    Adresse IP : ${escapeHtml(ip || "Non disponible")}<br />
    Localisation : ${escapeHtml(city || "Non disponible")}, ${escapeHtml(country || "Non disponible")}<br />
    Continent : ${escapeHtml(continent || "Non disponible")}
  </div>`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflight(req);
  if (req.method !== "POST") return jsonResponse(req, { error: "Méthode non autorisée" }, 405);

  try {
    const authorization = req.headers.get("Authorization");
    const token = authorization?.replace(/^Bearer\s+/i, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!token || !supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(req, { error: "Authentification requise" }, 401);
    }
    if (!resendApiKey) {
      console.error("RESEND_API_KEY est absente de la configuration Supabase.");
      return jsonResponse(req, { error: "Service email indisponible" }, 503);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user?.email) return jsonResponse(req, { error: "Utilisateur non authentifié" }, 401);

    const body = await req.json();
    const type = body?.type;
    if (type !== "welcome" && type !== "login") {
      return jsonResponse(req, { error: "Type d’email invalide" }, 400);
    }

    const email = user.email;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const greeting = name ? `Bonjour ${escapeHtml(name)},` : "Bonjour,";
    const locationHtml = renderLocation(body?.location);
    const resend = new Resend(resendApiKey);

    if (type === "welcome") {
      const { error } = await resend.emails.send({
        from: "Folio Dev <noreply@foliodev.site>",
        to: [email],
        subject: "Bienvenue sur Folio Dev !",
        html: emailLayout("Bienvenue sur Folio Dev !", `<p style="font-size:16px;line-height:1.6;">${greeting}</p><p style="font-size:16px;line-height:1.6;">Tu viens de créer ton compte. Des nouvelles fonctionnalités arrivent très bientôt.</p>${locationHtml}`),
      });
      if (error) throw error;
    } else {
      const loginDate = new Date(body?.loginTime || Date.now());
      const formattedDate = new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Africa/Douala",
      }).format(loginDate);
      const { error } = await resend.emails.send({
        from: "Folio Dev <noreply@foliodev.site>",
        to: [email],
        subject: "Bon retour sur Folio Dev !",
        html: emailLayout("Bon retour !", `<p style="font-size:16px;line-height:1.6;">${greeting}</p><p style="font-size:16px;line-height:1.6;">Tu t’es connecté à Folio Dev le ${escapeHtml(formattedDate)}.</p>${locationHtml}`),
      });
      if (error) throw error;
    }

    return jsonResponse(req, { sent: true });
  } catch (error) {
    console.error("Erreur d’envoi Resend :", error);
    return jsonResponse(req, { error: "Email non envoyé" }, 502);
  }
});
