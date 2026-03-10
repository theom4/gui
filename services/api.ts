import { supabase } from "@/integrations/supabase/client";

export const getProfile = async (userId: string, token?: string) => {
    // Use direct fetch if token is provided to bypass potential Supabase client issues
    if (token) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ympkyaakwveogjcgqqnr.supabase.co';
        const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`;
        console.log('[Supabase:getProfile] Fetching profile via direct fetch:', url);
        try {
            const response = await fetch(url, {
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('[Supabase:getProfile] Response status:', response.status);
            if (!response.ok) {
                throw new Error(`Profile fetch failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('[Supabase:getProfile] Data received:', data);
            return data && data.length > 0 ? data[0] : null;
        } catch (e) {
            console.error('[Supabase:getProfile] Direct fetch failed:', e);
            throw e;
        }
    }

    // Fallback for legacy calls
    console.log('[Supabase:getProfile] Fetching profile via Supabase client for user:', userId);
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('[Supabase:getProfile] Client fetch error:', error);
        throw error;
    }

    console.log('[Supabase:getProfile] Client fetch result:', data);
    return data;
};
