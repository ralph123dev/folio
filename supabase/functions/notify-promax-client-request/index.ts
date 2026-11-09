import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handlePreflight } from "../_shared/cors.ts";
const jsonResponse = (req, body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
});
const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
const constantTimeEqual = (left, right) => {
    const encoder = new TextEncoder();
    const leftBytes = encoder.encode(left);
    const rightBytes = encoder.encode(right);
    if (leftBytes.length !== rightBytes.length)
        return false;
    let difference = 0;
    for (let index = 0; index < leftBytes.length; index += 1) {
        difference |= leftBytes[index] ^ rightBytes[index];
    }
    return difference === 0;
};
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
Deno.serve(async (req) => {
    if (req.method === "OPTIONS")
        return handlePreflight(req);
    if (req.method !== "POST")
        return jsonResponse(req, { error: "Méthode non autorisée." }, 405);
    const expectedSecret = Deno.env.get("PROMAX_NOTIFICATION_SECRET") || "";
    const providedSecret = req.headers.get("x-cron-secret") || "";
    if (!expectedSecret || !constantTimeEqual(providedSecret, expectedSecret)) {
        return jsonResponse(req, { error: "Authentification requise." }, 401);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
        return jsonResponse(req, { error: "Configuration serveur incomplète." }, 500);
    }
    try {
        const body = await req.json();
        const requestId = typeof body?.request_id === "string" ? body.request_id : "";
        if (!requestId)
            return jsonResponse(req, { error: "Demande invalide." }, 400);
        const admin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: clientRequest, error: requestError } = await admin
            .from("client_requests")
            .select("id, user_id, nom, prenom, telephone, description_projet, pays, preference_freelance, created_at")
            .eq("id", requestId)
            .maybeSingle();
        if (requestError)
            throw requestError;
        if (!clientRequest)
            return jsonResponse(req, { error: "Demande introuvable." }, 404);
        const recipientIdSet = new Set();
        for (let offset = 0;; offset += 500) {
            const { data: profiles, error: profilesError } = await admin
                .from("freelancers")
                .select("user_id")
                .not("user_id", "is", null)
                .order("user_id", { ascending: true })
                .range(offset, offset + 499);
            if (profilesError)
                throw profilesError;
            for (const profile of profiles || []) {
                if (profile.user_id && profile.user_id !== clientRequest.user_id) {
                    recipientIdSet.add(profile.user_id);
                }
            }
            if (!profiles || profiles.length < 500)
                break;
        }
        const recipientIds = [...recipientIdSet];
        if (!recipientIds.length)
            return jsonResponse(req, { sent: 0, failed: 0 });
        const usersById = new Map();
        for (let page = 1;; page += 1) {
            const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
            if (error)
                throw error;
            for (const user of data.users) {
                if (recipientIdSet.has(user.id) && user.email && !user.banned_until) {
                    usersById.set(user.id, { email: user.email });
                }
            }
            if (usersById.size === recipientIds.length || data.users.length < 500)
                break;
        }
        const preferenceLabels = {
            any: "Indifférent",
            local: "Freelancer local",
            externe: "Freelancer externe / international",
        };
        const requestUrl = "https://foliodev.site";
        const requestHtml = `
      <div style="margin:0;background:#f4f6f8;padding:32px 16px;font-family:Arial,sans-serif;color:#263238;line-height:1.6">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
          <p style="margin:0 0 8px;color:#087f8c;font-weight:700">Folio Dev · Nouvelle opportunité</p>
          <h1 style="margin:0 0 20px;font-size:24px;color:#173b40">Un client recherche un freelancer</h1>
          <p><strong>Client :</strong> ${escapeHtml(`${clientRequest.prenom} ${clientRequest.nom}`)}</p>
          <p><strong>Pays :</strong> ${escapeHtml(clientRequest.pays)}</p>
          <p><strong>Localisation souhaitée :</strong> ${escapeHtml(preferenceLabels[clientRequest.preference_freelance] || preferenceLabels.any)}</p>
          <p><strong>Contact :</strong> ${escapeHtml(clientRequest.telephone)}</p>
          <p style="white-space:pre-wrap"><strong>Projet :</strong><br>${escapeHtml(clientRequest.description_projet)}</p>
          <a href="${requestUrl}" style="display:inline-block;margin-top:12px;padding:12px 18px;border-radius:6px;background:#087f8c;color:#ffffff;text-decoration:none;font-weight:700">Voir la demande</a>
        </div>
      </div>`;
        let sent = 0;
        let failed = 0;
        for (const userId of recipientIds) {
            const recipient = usersById.get(userId);
            if (!recipient)
                continue;
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                    "Idempotency-Key": `client-request-${clientRequest.id}-${userId}`,
                },
                body: JSON.stringify({
                    from: "Folio Dev <noreply@foliodev.site>",
                    to: [recipient.email],
                    subject: "Nouvelle demande client sur Folio Dev",
                    html: requestHtml,
                }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !(result.id || result.data?.id)) {
                console.error("Échec notification demande client:", userId, response.status, result.message || result.name || "Réponse invalide");
                failed += 1;
            }
            else {
                sent += 1;
            }
            await wait(550);
        }
        return jsonResponse(req, { sent, failed });
    }
    catch (error) {
        console.error("Erreur notification demande client Pro Max:", error);
        return jsonResponse(req, { error: "Les notifications n’ont pas pu être envoyées." }, 500);
    }
});
