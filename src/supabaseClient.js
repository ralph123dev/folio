import { createClient } from '@supabase/supabase-js';
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yasxjodaccjvajttqrlo.supabase.co';
const supabaseUrl = rawUrl.replace(/["'\r\n]/g, '').trim();
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_spzxbz44VeHYPIwkmQqEsA_iuhCKTIc';
const supabaseAnonKey = rawKey.replace(/["'\r\n]/g, '').trim();
const detectFreshAuthCallback = (url, params) => {
    if (!params.access_token || !params.expires_at || !params.expires_in)
        return true;
    const issuedAt = Number(params.expires_at) - Number(params.expires_in);
    const isExpiredCallback = !Number.isFinite(issuedAt) || (Date.now() / 1000) - issuedAt >= 120;
    if (isExpiredCallback && typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
        return false;
    }
    return true;
};
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        detectSessionInUrl: detectFreshAuthCallback,
    },
});
