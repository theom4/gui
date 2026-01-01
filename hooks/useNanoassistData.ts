import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';

interface NanoassistData {
  total_apeluri: number;
  apeluri_initiate: number;
  apeluri_primite: number;
  rata_conversie: number;
  minute_consumate: number;
}

export const useNanoassistData = () => {
  const { profile } = useAuth();
  const [data, setData] = useState<NanoassistData>({
    total_apeluri: 0,
    apeluri_initiate: 0,
    apeluri_primite: 0,
    rata_conversie: 0,
    minute_consumate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      if (!profile?.id) return; // așteaptă sesiunea
      console.debug('[call_metrics] querying for user_id:', profile.id);

      // Preferă view-ul call_metrics_latest dacă există; altfel citește ultimul rând din call_metrics
      // Încercăm întâi call_metrics (evităm dependența de view care poate să nu existe)
      const { data: rows, error: qErr } = await supabase
        .from('call_metrics' as any)
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (qErr) throw qErr;

      const row = rows && rows.length > 0 ? rows[0] : null;

      if (row) {
        const newData: NanoassistData = {
          total_apeluri: Number(row.total_apeluri) || 0,
          apeluri_initiate: Number(row.apeluri_initiate) || 0,
          apeluri_primite: Number(row.apeluri_primite) || 0,
          rata_conversie: Number(row.rata_conversie) || 0,
          minute_consumate: Number(row.minute_consumate) || 0,
        };
        setData(newData);
        setError(null);
      } else {
        setError(`Nu există metrici încă pentru acest utilizator (${profile.id}).`);
      }
    } catch (err) {
      console.error('Supabase fetch error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Eroare la citirea metricilor din Supabase: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile?.id) {
      setLoading(true);
      return; // așteaptă profilul
    }
    // Re-fetch când se schimbă utilizatorul
    fetchData();

    // Realtime updates pentru propriile rânduri
    if (!profile?.id) return;

    const channel = supabase
      .channel('call_metrics_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_metrics',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          // La inserare/update/ștergere, recitește cel mai nou rând
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  return { data, loading, error, refetch: fetchData };
};
