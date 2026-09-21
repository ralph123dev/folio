import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handlePreflight } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const storageBucket = "contact-data";
const storagePath = "contacts.txt.gz";

type Contact = {
  name: string;
  email: string;
  phone: string;
  whatsappPhone: string;
};

const response = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
});

const parseContacts = (text: string): Contact[] => text
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split("|"))
  .filter((parts) => parts.length >= 4)
  .map(([name, email, phone, whatsappPhone]) => ({
    name: name?.trim() || "Contact",
    email: email?.trim() || "",
    phone: phone?.trim() || "",
    whatsappPhone: whatsappPhone?.trim() || "",
  }))
  .filter((contact) => contact.email || contact.phone || contact.whatsappPhone);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflight(req);
  if (req.method !== "POST") return response(req, { error: "Méthode non autorisée" }, 405);
  if (!supabaseUrl || !serviceRoleKey || !anonKey) return response(req, { error: "Configuration serveur incomplète." }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return response(req, { error: "Authentification requise." }, 401);

  try {
    const { sector, count } = await req.json();
    if (typeof sector !== "string" || !sector.trim() || !Number.isInteger(count) || count < 1) {
      return response(req, { error: "Secteur ou volume invalide." }, 400);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return response(req, { error: "Session invalide." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: subscription, error: subscriptionError } = await admin
      .from("contact_boost_subscriptions")
      .select("contact_count")
      .eq("user_id", user.id)
      .eq("sector", sector.trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) return response(req, { error: "Impossible de vérifier la souscription." }, 500);
    if (!subscription) return response(req, { error: "Aucune souscription active pour ce secteur." }, 403);

    const { data: file, error: fileError } = await admin.storage.from(storageBucket).download(storagePath);
    if (fileError || !file) return response(req, { error: "Le fichier de contacts est indisponible." }, 503);

    const compressed = new Uint8Array(await file.arrayBuffer());
    const decompressed = new DecompressionStream("gzip");
    const text = await new Response(new Blob([compressed]).stream().pipeThrough(decompressed)).text();
    const contacts = parseContacts(text).slice(0, Math.min(count, subscription.contact_count));
    return response(req, { contacts });
  } catch (error) {
    console.error("get-contact-boost-contacts error", error);
    return response(req, { error: "Impossible de charger les contacts." }, 500);
  }
});
