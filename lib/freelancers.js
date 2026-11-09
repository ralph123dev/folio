import { createClient } from '@supabase/supabase-js';
import { displayName, freelancerSlug, locationSlug, specialtySlug, } from './site';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
function getPublicSupabase() {
    if (!supabaseUrl || !supabaseAnonKey)
        return null;
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
function decorateFreelancer(freelancer, ratingStats) {
    const stats = ratingStats.get(freelancer.id) || { count: 0, sum: 0 };
    const ratingCount = stats.count;
    const averageRating = ratingCount ? Number((stats.sum / ratingCount).toFixed(1)) : null;
    return {
        ...freelancer,
        name: displayName(freelancer),
        specialtySlug: specialtySlug(freelancer),
        location: freelancer.localisation || 'En ligne',
        locationSlug: locationSlug(freelancer),
        seoSlug: freelancerSlug(freelancer),
        averageRating,
        ratingCount,
    };
}
export async function getFreelancers() {
    const supabase = getPublicSupabase();
    if (!supabase)
        return [];
    const { data: freelancers, error } = await supabase
        .from('freelancers')
        .select('*')
        .order('created_at', { ascending: false });
    if (error || !freelancers?.length)
        return [];
    const ids = freelancers.map(({ id }) => id).filter(Boolean);
    const { data: ratings } = ids.length
        ? await supabase.from('freelancer_ratings').select('freelancer_id, rating').in('freelancer_id', ids)
        : { data: [] };
    const ratingStats = new Map();
    (ratings || []).forEach(({ freelancer_id: freelancerId, rating }) => {
        const current = ratingStats.get(freelancerId) || { count: 0, sum: 0 };
        ratingStats.set(freelancerId, { count: current.count + 1, sum: current.sum + Number(rating || 0) });
    });
    return freelancers
        .filter((freelancer) => freelancer.seo_published !== false)
        .map((freelancer) => decorateFreelancer(freelancer, ratingStats));
}
export async function getFreelancerByRoute({ specialty, location, slug }) {
    const freelancers = await getFreelancers();
    return freelancers.find((freelancer) => (freelancer.specialtySlug === specialty
        && freelancer.locationSlug === location
        && freelancer.seoSlug === slug)) || null;
}
export async function getFreelancersByCategory(specialty, location) {
    const freelancers = await getFreelancers();
    return freelancers.filter((freelancer) => (freelancer.specialtySlug === specialty
        && (!location || freelancer.locationSlug === location)));
}
export async function getCategories() {
    const freelancers = await getFreelancers();
    const categories = new Map();
    freelancers.forEach((freelancer) => {
        const key = freelancer.specialtySlug;
        const current = categories.get(key) || {
            slug: key,
            label: freelancer.activite || 'Freelancers',
            count: 0,
            locations: new Map(),
        };
        current.count += 1;
        current.locations.set(freelancer.locationSlug, {
            slug: freelancer.locationSlug,
            label: freelancer.location,
        });
        categories.set(key, current);
    });
    return [...categories.values()]
        .map((category) => ({ ...category, locations: [...category.locations.values()] }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
}
export function filterFreelancers(freelancers, query) {
    const needle = String(query || '').trim().toLocaleLowerCase('fr');
    if (!needle)
        return freelancers;
    return freelancers.filter((freelancer) => [
        freelancer.name,
        freelancer.nom,
        freelancer.prenom,
        freelancer.activite,
        freelancer.description,
        freelancer.location,
    ].filter(Boolean).join(' ').toLocaleLowerCase('fr').includes(needle));
}
