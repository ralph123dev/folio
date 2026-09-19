import { getNetworks, SasPayError } from "../_shared/saspay.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return jsonResponse({ error: "Méthode non autorisée" }, 405);

  try {
    return jsonResponse(await getNetworks());
  } catch (error) {
    const status = error instanceof SasPayError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Impossible de charger les réseaux SasPay.";
    return jsonResponse({ error: message }, status);
  }
});
