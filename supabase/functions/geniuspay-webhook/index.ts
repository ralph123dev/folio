import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-gateway-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");

const signaturesMatch = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-gateway-signature") || "";
    const webhookSecret = Deno.env.get("GENIUSPAY_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw new Error("GENIUSPAY_WEBHOOK_SECRET n'est pas configuré.");
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expectedSignature = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));

    if (!signaturesMatch(signature, expectedSignature)) {
      return new Response(JSON.stringify({ error: "Signature invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);
    const payload = event?.data || event;
    const reference = payload?.reference || payload?.payment_reference;
    const providerStatus = payload?.status || event?.event;
    const status = providerStatus === "completed" || providerStatus === "payment.succeeded"
      ? "completed"
      : ["failed", "payment.failed", "refunded", "payment.refunded"].includes(providerStatus)
        ? providerStatus.includes("refunded") || providerStatus === "refunded" ? "refunded" : "failed"
        : "pending";

    if (!reference) {
      return new Response(JSON.stringify({ error: "Référence de paiement absente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
