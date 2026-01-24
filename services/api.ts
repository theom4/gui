import { supabase } from "@/integrations/supabase/client";

export const getProfile = async (userId: string, token?: string) => {
    // Use direct fetch if token is provided to bypass potential Supabase client issues
    if (token) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ympkyaakwveogjcgqqnr.supabase.co';
        try {
            const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`, {
                headers: {
                    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Profile fetch failed: ${response.status}`);
            }

            const data = await response.json();
            return data && data.length > 0 ? data[0] : null;
        } catch (e) {
            console.error('Direct fetch profile failed', e);
            throw e;
        }
    }

    // Fallback for legacy calls
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }

    return data;
};
