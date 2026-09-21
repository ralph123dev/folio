import { getNetworks, SasPayError } from "../_shared/saspay.ts";
import { getCorsHeaders, handlePreflight } from "../_shared/cors.ts";

const jsonResponse = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflight(req, { allowMethods: "GET, OPTIONS" });
  if (req.method !== "GET") return jsonResponse(req, { error: "Méthode non autorisée" }, 405);

  try {
    return jsonResponse(req, await getNetworks());
  } catch (error) {
    const status = error instanceof SasPayError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Impossible de charger les réseaux SasPay.";
    return jsonResponse(req, { error: message }, status);
  }
});
