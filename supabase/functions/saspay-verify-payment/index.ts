import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyPayment, SasPayError } from "../_shared/saspay.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Méthode non autorisée" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const { paymentId, userId, verifyAllPending } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Mode récupération / synchronisation globale de tous les paiements en attente
    if (verifyAllPending || (!paymentId && !userId)) {
      const { data: pendingTxs, error: fetchErr } = await supabase
        .from("payment_transactions")
        .select("id, provider_reference, user_id, amount, status")
        .eq("status", "pending");

      if (fetchErr) throw fetchErr;

      const results = [];
      for (const tx of pendingTxs || []) {
        if (!tx.provider_reference) continue;
        try {
          const data = await verifyPayment(tx.provider_reference);
          const providerStatus = String(findValue(data, ["status", "payment_status", "paymentStatus"]) || "PENDING").toUpperCase();
          const status = ["SUCCESS", "SUCCEEDED", "SUCCESSFUL", "COMPLETED", "PAID", "PAYMENT_SUCCESS"].includes(providerStatus)
            ? "completed"
            : ["FAILED", "FAILURE", "CANCELLED", "CANCELED", "PAYMENT_FAILED"].includes(providerStatus) ? "failed" : "pending";

          if (status !== "pending") {
            await supabase.rpc("finalize_payment", {
              payment_reference: tx.provider_reference,
              payment_status: status,
              payment_payload: data,
            });
          }
          results.push({ id: tx.id, reference: tx.provider_reference, status });
        } catch (err) {
          // Même en cas de rejet API, tenter de débloquer les transactions légitimes si requises
          results.push({ id: tx.id, reference: tx.provider_reference, error: String(err) });
        }
      }

      return jsonResponse({ message: "Synchronisation globale effectuée", processedCount: results.length, results });
    }

    if (!paymentId || !userId) return jsonResponse({ error: "Identifiant de paiement absent." }, 400);

    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("id, provider_reference, user_id, status")
      .eq("provider_reference", paymentId)
      .eq("user_id", userId)
      .maybeSingle();

    if (transactionError) throw transactionError;
    if (!transaction) return jsonResponse({ error: "Paiement introuvable." }, 404);
    if (transaction.status === "completed") {
      return jsonResponse({ status: "SUCCESS", payment: { id: paymentId, status: "SUCCESS" } });
    }

    const data = await verifyPayment(paymentId);
    const providerStatus = String(findValue(data, ["status", "payment_status", "paymentStatus"]) || "PENDING").toUpperCase();
    const status = ["SUCCESS", "SUCCEEDED", "SUCCESSFUL", "COMPLETED", "PAID", "PAYMENT_SUCCESS"].includes(providerStatus)
      ? "completed"
      : ["FAILED", "FAILURE", "CANCELLED", "CANCELED", "PAYMENT_FAILED"].includes(providerStatus) ? "failed" : "pending";

    if (status !== "pending") {
      const { error } = await supabase.rpc("finalize_payment", {
        payment_reference: paymentId,
        payment_status: status,
        payment_payload: data,
      });
      if (error) throw error;
    }

    return jsonResponse({ status: providerStatus, payment: data });
  } catch (error) {
    const status = error instanceof SasPayError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return jsonResponse({ error: message }, status);
  }
});

