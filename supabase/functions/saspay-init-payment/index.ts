import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createSoftPayPayment, SasPayError } from "../_shared/saspay.ts";
import { getCorsHeaders, handlePreflight } from "../_shared/cors.ts";
const jsonResponse = (req, body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
});
const findValue = (value, keys) => {
    if (!value || typeof value !== "object")
        return null;
    for (const key of keys) {
        if (value[key] !== undefined && value[key] !== null)
            return String(value[key]);
    }
    for (const child of Object.values(value)) {
        const found = findValue(child, keys);
        if (found)
            return found;
    }
    return null;
};
serve(async (req) => {
    if (req.method === "OPTIONS")
        return handlePreflight(req);
    if (req.method !== "POST")
        return jsonResponse(req, { error: "Méthode non autorisée" }, 405);
    try {
        const body = await req.json();
        const { userId, orderId, amount, ...payment } = body;
        const numericAmount = Number(amount);
        if (!userId || !orderId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
            return jsonResponse(req, { error: "Les informations du paiement sont invalides." }, 400);
        }
        const payload = payment;
        if (!payload.currency || !payload.country || !payload.network || !payload.customer?.phone) {
            return jsonResponse(req, { error: "Le pays, le réseau et le numéro Mobile Money sont obligatoires." }, 400);
        }
        const data = await createSoftPayPayment({ ...payload, amount: numericAmount.toFixed(2) });
        const paymentReference = findValue(data, [
            "payment_id",
            "paymentId",
            "transaction_id",
            "transactionId",
            "reference",
            "id",
        ]);
        const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
        if (paymentReference) {
            const { error: transactionError } = await supabase.from("payment_transactions").insert({
                user_id: userId,
                order_id: orderId,
                provider_reference: paymentReference,
                amount: numericAmount,
                provider_payload: data,
            });
            if (transactionError) {
                console.error("Erreur d'enregistrement du paiement:", transactionError);
                return jsonResponse(req, { error: "Le paiement a été créé, mais son suivi n'a pas pu être enregistré." }, 500);
            }
        }
        else {
            console.warn("SasPay a lancé le paiement sans renvoyer de référence:", JSON.stringify(data));
        }
        return jsonResponse(req, { ...data, payment_reference: paymentReference || null, tracking_pending: !paymentReference });
    }
    catch (error) {
        const status = error instanceof SasPayError ? error.status : 500;
        const message = error instanceof Error ? error.message : "Erreur inconnue.";
        console.error("Erreur saspay-init-payment:", {
            status,
            message,
            details: error instanceof SasPayError ? error.details : undefined,
        });
        return jsonResponse(req, { error: { message, status } }, status);
    }
});
