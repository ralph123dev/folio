import { createClient } from "npm:@supabase/supabase-js@2";
const PAGE_SIZE = 500;
const MAX_EMAILS_PER_RUN = 50;
const EMAIL_THROTTLE_MS = 650;
const EMAIL_TEXT = "Bonsoir, vous avez bien un compte sur foliodev, c'est genial profitez bien des activités .";
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
});
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
const getDoualaDate = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Douala",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(new Date());
    const part = (type) => parts.find((item) => item.type === type)?.value || "";
    return `${part("year")}-${part("month")}-${part("day")}`;
};
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
Deno.serve(async (req) => {
    if (req.method !== "POST")
        return jsonResponse({ error: "Méthode non autorisée." }, 405);
    const expectedSecret = Deno.env.get("DAILY_EMAIL_CRON_SECRET") || "";
    const providedSecret = req.headers.get("x-cron-secret") || "";
    if (!expectedSecret || !constantTimeEqual(providedSecret, expectedSecret)) {
        return jsonResponse({ error: "Authentification requise." }, 401);
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
        return jsonResponse({ error: "Configuration serveur incomplète." }, 500);
    }
    try {
        const admin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const today = getDoualaDate();
        const preferences = [];
        for (let offset = 0;; offset += PAGE_SIZE) {
            const { data, error } = await admin
                .from("daily_account_email_preferences")
                .select("user_id, unsubscribe_token, last_sent_on, last_attempt_on")
                .eq("opted_in", true)
                .order("user_id", { ascending: true })
                .range(offset, offset + PAGE_SIZE - 1);
            if (error)
                throw error;
            preferences.push(...(data || []));
            if (!data || data.length < PAGE_SIZE)
                break;
        }
        const confirmedUsers = new Map();
        for (let page = 1;; page += 1) {
            const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
            if (error)
                throw error;
            for (const user of data.users) {
                if (user.email && user.email_confirmed_at && !user.banned_until) {
                    confirmedUsers.set(user.id, {
                        email: user.email,
                        lastSignInAt: Date.parse(user.last_sign_in_at || "") || 0,
                    });
                }
            }
            if (data.users.length < PAGE_SIZE)
                break;
        }
        const recipients = preferences
            .filter((preference) => (preference.last_sent_on !== today
            && preference.last_attempt_on !== today
            && confirmedUsers.has(preference.user_id)))
            .sort((left, right) => (confirmedUsers.get(right.user_id).lastSignInAt - confirmedUsers.get(left.user_id).lastSignInAt
            || left.user_id.localeCompare(right.user_id)))
            .slice(0, MAX_EMAILS_PER_RUN);
        if (!recipients.length)
            return jsonResponse({ sent: 0, attempted: 0, date: today });
        const candidateIds = recipients.map((preference) => preference.user_id);
        const { data: claimedPreferences, error: claimError } = await admin
            .from("daily_account_email_preferences")
            .update({ last_attempt_on: today })
            .eq("opted_in", true)
            .or(`last_attempt_on.is.null,last_attempt_on.lt.${today}`)
            .in("user_id", candidateIds)
            .select("user_id");
        if (claimError)
            throw claimError;
        const claimedIds = new Set((claimedPreferences || []).map((preference) => preference.user_id));
        const sendQueue = recipients.filter((preference) => claimedIds.has(preference.user_id));
        const resendUrl = "https://api.resend.com/emails";
        let sent = 0;
        let failed = 0;
        for (let index = 0; index < sendQueue.length; index += 1) {
            const preference = sendQueue[index];
            const user = confirmedUsers.get(preference.user_id);
            const token = encodeURIComponent(preference.unsubscribe_token);
            const unsubscribeUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/daily-email-unsubscribe?token=${token}`;
            const response = await fetch(resendUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${resendApiKey}`,
                    "Content-Type": "application/json",
                    "Idempotency-Key": `daily-account-email-${today}-${preference.user_id}`,
                },
                body: JSON.stringify({
                    from: "Folio Dev <noreply@foliodev.site>",
                    to: [user.email],
                    subject: "Un message de Foliodev",
                    text: `${EMAIL_TEXT}\n\nSe désinscrire : ${unsubscribeUrl}`,
                    html: `<div style="font-family:Arial,sans-serif;color:#26215c;line-height:1.6"><p>${EMAIL_TEXT}</p><p><a href="${unsubscribeUrl}">Se désinscrire</a></p></div>`,
                    headers: {
                        "List-Unsubscribe": `<${unsubscribeUrl}>`,
                        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                    },
                }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !(result.id || result.data?.id)) {
                console.error("Échec d’un e-mail quotidien:", response.status, result.message || result.name || "Réponse invalide");
                failed += 1;
                if (response.status === 429 || response.status >= 500) {
                    const remainingIds = sendQueue.slice(index).map((item) => item.user_id);
                    await admin
                        .from("daily_account_email_preferences")
                        .update({ last_attempt_on: null })
                        .in("user_id", remainingIds);
                    return jsonResponse({ sent, attempted: index + 1, failed, retry: true }, 502);
                }
                await wait(EMAIL_THROTTLE_MS);
                continue;
            }
            const { error: updateError } = await admin
                .from("daily_account_email_preferences")
                .update({ last_sent_on: today })
                .eq("opted_in", true)
                .eq("user_id", preference.user_id);
            if (updateError)
                throw updateError;
            sent += 1;
            await wait(EMAIL_THROTTLE_MS);
        }
        return jsonResponse({ sent, attempted: sendQueue.length, failed, date: today });
    }
    catch (error) {
        console.error("Erreur d’envoi quotidien Foliodev:", error);
        return jsonResponse({ error: "L’envoi quotidien a échoué." }, 500);
    }
});
