import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GENIUSPAY_API_KEY");
    const apiSecret = Deno.env.get("GENIUSPAY_API_SECRET");
    const apiUrl = Deno.env.get("GENIUSPAY_API_URL") || "https://pay.genius.ci/api/v1";

    if (!apiKey || !apiSecret) {
      throw new Error("Les secrets GENIUSPAY_API_KEY et GENIUSPAY_API_SECRET ne sont pas configurés.");
    }
  
      if (!apiKey.startsWith("pk_live_") || !apiSecret.startsWith("sk_live_")) {
        throw new Error("Les identifiants GeniusPay configurés ne sont pas des identifiants de production.");
      }

    const { amount, description, customerName, customerEmail, customerPhone, orderId, userId } = await req.json();

    if (!userId || !orderId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error("Les informations du paiement sont invalides.");
    }

    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/merchant/payments`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        description,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
        },
        metadata: {
          order_id: orderId,
        },
      }),
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch {
      const contentType = response.headers.get("content-type") || "inconnu";
      throw new Error(`Réponse GeniusPay invalide (${response.status}, ${contentType}, ${response.url})`);
    }

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: response.status,
      });
    }

    const paymentReference = data?.data?.reference
      || data?.data?.payment_reference
      || data?.data?.uuid
      || data?.data?.id
      || data?.reference;

    if (!paymentReference) {
      throw new Error("GeniusPay n'a pas renvoyé de référence de paiement.");
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error: transactionError } = await supabase.from("payment_transactions").insert({
      user_id: userId,
      order_id: orderId,
      provider_reference: paymentReference,
      amount: Number(amount),
      provider_payload: data,
    });

    if (transactionError) {
      console.error("Erreur d'enregistrement du paiement:", transactionError);
      throw new Error("Le paiement a été créé, mais son suivi n'a pas pu être enregistré.");
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: response.status,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});