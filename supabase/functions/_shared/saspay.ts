export class SasPayError extends Error {
    status;
    details;
    constructor(message, status, details = null) {
        super(message);
        this.name = "SasPayError";
        this.status = status;
        this.details = details;
    }
}
const getConfig = () => {
    const apiKey = Deno.env.get("SASPAY_API_KEY");
    const apiUrl = Deno.env.get("SASPAY_API_URL");
    if (!apiUrl) {
        throw new SasPayError("SASPAY_API_URL doit être configurée.", 500);
    }
    return { apiKey, apiUrl: apiUrl.replace(/\/$/, "") };
};
const parseResponse = async (response) => {
    const text = await response.text();
    if (!text)
        return null;
    try {
        return JSON.parse(text);
    }
    catch {
        return { message: text };
    }
};
const getErrorMessage = (data, status) => {
    if (typeof data === "string")
        return data;
    if (data?.message)
        return data.message;
    if (data?.detail)
        return typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    if (data?.error)
        return typeof data.error === "string" ? data.error : JSON.stringify(data.error);
    if (data?.errors)
        return JSON.stringify(data.errors);
    return `Erreur SasPay (${status})`;
};
const isGatewayFailure = (status) => [502, 503, 504].includes(status);
const request = async (path, init = {}, requiresAuth = true) => {
    const { apiKey, apiUrl } = getConfig();
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");
    if (requiresAuth) {
        if (!apiKey)
            throw new SasPayError("SASPAY_API_KEY doit être configurée.", 500);
        headers.set("Authorization", `Bearer ${apiKey}`);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
        const response = await fetch(`${apiUrl}${path}`, { ...init, headers, signal: controller.signal });
        const data = await parseResponse(response);
        if (!response.ok) {
            const message = isGatewayFailure(response.status)
                ? "SasPay est temporairement indisponible (passerelle). Réessaie dans quelques instants ou choisis un autre réseau."
                : getErrorMessage(data, response.status);
            throw new SasPayError(message, response.status, data);
        }
        return data;
    }
    catch (error) {
        if (error instanceof SasPayError)
            throw error;
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new SasPayError("SasPay n'a pas répondu dans le délai prévu. Réessaie dans quelques instants.", 504);
        }
        throw new SasPayError("Impossible de joindre SasPay pour le moment. Vérifie ta connexion puis réessaie.", 502, error);
    }
    finally {
        clearTimeout(timeout);
    }
};
export const getNetworks = () => request("/countries/", {}, false);
export const createSoftPayPayment = (payload) => request("/payments/softpay/", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify(payload),
});
export const verifyPayment = (paymentId) => request(`/payments/${encodeURIComponent(paymentId)}/verify/`);
const toHex = (bytes) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
const toBase64 = (bytes) => {
    let binary = "";
    for (const byte of new Uint8Array(bytes))
        binary += String.fromCharCode(byte);
    return btoa(binary);
};
export const verifyWebhookSignature = async (rawBody, signature) => {
    const secret = Deno.env.get("SASPAY_WEBHOOK_SECRET");
    if (!secret)
        throw new SasPayError("SASPAY_WEBHOOK_SECRET n'est pas configurée.", 500);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
    const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
    const candidates = [toHex(digest), toBase64(digest), `sha512=${toHex(digest)}`];
    return candidates.some((candidate) => {
        if (signature.length !== candidate.length)
            return false;
        let mismatch = 0;
        for (let index = 0; index < candidate.length; index += 1) {
            mismatch |= signature.charCodeAt(index) ^ candidate.charCodeAt(index);
        }
        return mismatch === 0;
    });
};
