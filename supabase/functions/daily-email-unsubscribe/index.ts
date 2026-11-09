import { createClient } from "npm:@supabase/supabase-js@2";
const htmlResponse = (html, status = 200) => new Response(html, {
    status,
    headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    },
});
const page = (title, message, token = "", showButton = false) => htmlResponse(`<!doctype html>
<html lang="fr">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
  <body style="margin:0;padding:32px 16px;background:#eef1fb;font-family:Arial,sans-serif;color:#26215c">
    <main style="max-width:520px;margin:48px auto;padding:32px;background:#fff;border-radius:12px">
      <h1 style="font-size:24px">${title}</h1>
      <p style="line-height:1.6">${message}</p>
      ${showButton ? `<form method="post"><input type="hidden" name="token" value="${token}"><button type="submit" style="padding:12px 18px;border:0;border-radius:6px;background:#534ab7;color:white;font-size:16px;cursor:pointer">Confirmer la désinscription</button></form>` : ""}
      <p><a href="https://foliodev.site" style="color:#534ab7">Retour sur Foliodev</a></p>
    </main>
  </body>
</html>`);
Deno.serve(async (req) => {
    if (req.method !== "GET" && req.method !== "POST") {
        return page("Méthode non autorisée", "Cette action n’est pas disponible.", "", false);
    }
    const url = new URL(req.url);
    let token = url.searchParams.get("token") || "";
    if (req.method === "POST" && !token) {
        const body = new URLSearchParams(await req.text());
        token = body.get("token") || "";
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
        return page("Lien invalide", "Ce lien de désinscription est invalide ou incomplet.", "", false);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey) {
        return page("Service indisponible", "La désinscription ne peut pas être traitée pour le moment.", "", false);
    }
    const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    if (req.method === "GET") {
        const { data, error } = await admin
            .from("daily_account_email_preferences")
            .select("opted_in")
            .eq("unsubscribe_token", token)
            .maybeSingle();
        if (error || !data)
            return page("Lien introuvable", "Ce lien de désinscription n’est plus valide.", "", false);
        if (!data.opted_in)
            return page("Déjà désinscrit", "Tu ne recevras plus les messages quotidiens de Foliodev.", "", false);
        return page("Gérer les e-mails Foliodev", "Confirme que tu ne souhaites plus recevoir le message quotidien.", token, true);
    }
    const { data, error } = await admin
        .from("daily_account_email_preferences")
        .update({ opted_in: false, updated_at: new Date().toISOString() })
        .eq("unsubscribe_token", token)
        .select("user_id")
        .maybeSingle();
    if (error || !data)
        return page("Lien introuvable", "Ce lien de désinscription n’est plus valide.", "", false);
    return page("Désinscription confirmée", "Tu ne recevras plus les messages quotidiens de Foliodev.", "", false);
});
