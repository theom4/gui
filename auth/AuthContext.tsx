import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getProfile } from '@/services/api';

export interface UserProfile {
  id: string;
  role: 'admin' | 'user';
  full_name?: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function useProfileFallback(
  session: Session | null,
  profile: UserProfile | null,
  setProfile: (p: UserProfile) => void,
  loading: boolean
) {
  useEffect(() => {
    if (!session || profile || loading) return;
    const t = setTimeout(() => {
      if (session && !profile) {
        setProfile({ id: session.user.id, role: 'user' });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [session, profile, loading]);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useProfileFallback(session, profile, (p) => setProfile(p), loading);

  const refreshProfile = async () => {
    if (!session?.user) return;

    const cacheKey = `profile:${session.user.id}`;
    // Clear cache to force fresh fetch
    try {
      localStorage.removeItem(cacheKey);
    } catch {}

    try {
      const profileData = await getProfile(session.user.id);
      if (profileData) {
        const freshProfile = {
          id: session.user.id,
          role: (profileData.role as 'admin' | 'user') ?? 'user',
          full_name: (profileData.full_name as string | null) ?? null,
          avatar_url: (profileData.avatar_url as string | null) ?? null,
        };
        setProfile(freshProfile);
        // Update cache with fresh data
        try {
          localStorage.setItem(cacheKey, JSON.stringify(freshProfile));
        } catch {}
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    // Watchdog: never keep loading forever (shortened)
    const watchdog = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 1000);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        if (session?.user) {
          const cacheKey = `profile:${session.user.id}`;

          try {
            // Always fetch fresh profile data to ensure role is correct
            const profileData = await getProfile(session.user.id);
            if (!isMounted) return;

            if (profileData) {
              const freshProfile = {
                id: session.user.id,
                role: (profileData.role as 'admin' | 'user') ?? 'user',
                full_name: (profileData.full_name as string | null) ?? null,
                avatar_url: (profileData.avatar_url as string | null) ?? null,
              };

              setProfile(freshProfile);

              // Update cache with fresh data
              try {
                localStorage.setItem(cacheKey, JSON.stringify(freshProfile));
              } catch {}
            } else {
              setProfile({ id: session.user.id, role: 'user' });
            }
          } catch (error) {
            console.error('Failed to fetch profile:', error);
            // On error, try to use cache as fallback
            try {
              const cached = localStorage.getItem(cacheKey);
              if (cached && isMounted) {
                const parsed = JSON.parse(cached) as UserProfile;
                setProfile(parsed);
              } else if (isMounted) {
                setProfile({ id: session.user.id, role: 'user' });
              }
            } catch {
              if (isMounted) setProfile({ id: session.user.id, role: 'user' });
            }
          }
        } else {
          setProfile(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      setSession(session);
      if (session?.user) {
        const cacheKey = `profile:${session.user.id}`;
        try {
          const profileData = await getProfile(session.user.id);
          if (!isMounted) return;
          if (profileData) {
            setProfile({
              id: session.user.id,
              role: (profileData.role as 'admin' | 'user') ?? 'user',
              full_name: (profileData.full_name as string | null) ?? null,
              avatar_url: (profileData.avatar_url as string | null) ?? null,
            });
            try {
              localStorage.setItem(
                cacheKey,
                JSON.stringify({
                  id: session.user.id,
                  role: (profileData.role as 'admin' | 'user') ?? 'user',
                  full_name: (profileData.full_name as string | null) ?? null,
                  avatar_url: (profileData.avatar_url as string | null) ?? null,
                } satisfies UserProfile)
              );
            } catch {}
          } else {
            setProfile({ id: session.user.id, role: 'user' });
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          if (isMounted) setProfile({ id: session.user.id, role: 'user' });
        }
      } else {
        setProfile(null);
      }
    });

    // Realtime listener pentru schimbări în tabelul profiles
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    if (session?.user) {
      profileChannel = supabase
        .channel(`profile:${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${session.user.id}`,
          },
          async (payload) => {
            if (!isMounted) return;
            console.log('Profile updated in realtime:', payload);
            // Actualizează profilul cu noile date
            const newData = payload.new as any;
            const freshProfile = {
              id: session.user.id,
              role: (newData.role as 'admin' | 'user') ?? 'user',
              full_name: (newData.full_name as string | null) ?? null,
              avatar_url: (newData.avatar_url as string | null) ?? null,
            };
            setProfile(freshProfile);
            // Actualizează cache-ul
            const cacheKey = `profile:${session.user.id}`;
            try {
              localStorage.setItem(cacheKey, JSON.stringify(freshProfile));
            } catch {}
          }
        )
        .subscribe();
    }

    return () => {
      isMounted = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile }}>
      {!loading ? children : <div className="flex items-center justify-center min-h-screen">Loading session...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
