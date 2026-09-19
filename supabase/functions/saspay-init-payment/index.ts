import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createSoftPayPayment, SasPayError, type CreatePaymentPayload } from "../_shared/saspay.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const findValue = (value: any, keys: string[]): string | null => {
  if (!value || typeof value !== "object") return null;
  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null) return String(value[key]);
  }
  for (const child of Object.values(value)) {
    const found = findValue(child, keys);
    if (found) return found;
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée" }, 405);

  try {
    const body = await req.json();
    const { userId, orderId, amount, ...payment } = body;
    const numericAmount = Number(amount);

    if (!userId || !orderId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return jsonResponse({ error: "Les informations du paiement sont invalides." }, 400);
    }

    const payload = payment as CreatePaymentPayload;
    if (!payload.currency || !payload.country || !payload.network || !payload.customer?.phone) {
      return jsonResponse({ error: "Le pays, le réseau et le numéro Mobile Money sont obligatoires." }, 400);
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
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
        return jsonResponse({ error: "Le paiement a été créé, mais son suivi n'a pas pu être enregistré." }, 500);
      }
    } else {
      console.warn("SasPay a lancé le paiement sans renvoyer de référence:", JSON.stringify(data));
    }

    return jsonResponse({ ...data, payment_reference: paymentReference || null, tracking_pending: !paymentReference });
  } catch (error) {
    const status = error instanceof SasPayError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return jsonResponse({ error: { message } }, status);
  }
});
