import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyWebhookSignature, SasPayError } from "../_shared/saspay.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-saspay-signature, x-webhook-signature",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée" }, 405);

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-saspay-signature")
      || req.headers.get("x-webhook-signature")
      || req.headers.get("x-signature")
      || req.headers.get("x-signature-256")
      || "";
    if (!await verifyWebhookSignature(rawBody, signature)) {
      return jsonResponse({ error: "Signature invalide" }, 401);
    }

    const event = JSON.parse(rawBody);
    const payload = event?.data || event;
    const reference = findValue(event, ["payment_id", "paymentId", "transaction_id", "transactionId", "reference", "id"]);
    const providerStatus = String(findValue(event, ["status", "payment_status", "paymentStatus"]) || "PENDING").toUpperCase();
    const status = ["SUCCESS", "SUCCEEDED", "COMPLETED", "PAID", "PAYMENT_SUCCESS"].includes(providerStatus)
      ? "completed"
      : ["FAILED", "FAILURE", "CANCELLED", "CANCELED", "PAYMENT_FAILED"].includes(providerStatus) ? "failed" : "pending";

    if (!reference) return jsonResponse({ error: "Identifiant de paiement absent" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabase.rpc("finalize_payment", {
      payment_reference: reference,
      payment_status: status,
      payment_payload: event,
    });
    if (error) throw error;

    return jsonResponse({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    const status = error instanceof SasPayError ? error.status : 500;
    return jsonResponse({ error: message }, status);
  }
});
