import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Supabase] CRITICAL Missing Config:', {
        url: !!supabaseUrl,
        key: !!supabaseAnonKey
    });
} else {
    console.log('[Supabase] Initializing client with:', supabaseUrl);
}

// Custom storage implementation with fallback for Chrome compatibility
const customStorage = {
    getItem: (key: string) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('[Supabase] localStorage.getItem failed, using sessionStorage:', e);
            try {
                return sessionStorage.getItem(key);
            } catch (e2) {
                console.error('[Supabase] Both localStorage and sessionStorage failed:', e2);
                return null;
            }
        }
    },
    setItem: (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn('[Supabase] localStorage.setItem failed, using sessionStorage:', e);
            try {
                sessionStorage.setItem(key, value);
            } catch (e2) {
                console.error('[Supabase] Both localStorage and sessionStorage failed:', e2);
            }
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.warn('[Supabase] localStorage.removeItem failed, using sessionStorage:', e);
            try {
                sessionStorage.removeItem(key);
            } catch (e2) {
                console.error('[Supabase] Both localStorage and sessionStorage failed:', e2);
            }
        }
    }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    global: {
        headers: {
            'X-Client-Info': 'supabase-js-web',
        },
    },
});

// Test connectivity on load
fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'GET',
    headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
    }
})
    .then(res => {
        console.log('[Supabase] Connectivity test status:', res.status, res.statusText);
        if (!res.ok) {
            console.error('[Supabase] API returned error. Project may be paused or inaccessible.');
        }
    })
    .catch(err => {
        console.error('[Supabase] Connectivity test FAILED:', err.message);
    });
