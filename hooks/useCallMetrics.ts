import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';

export interface CallMetricsSnapshot {
  total_apeluri: number;
  apeluri_initiate: number;
  apeluri_primite: number;
  rata_conversie: number; // percent value, e.g. 60.5
  minute_consumate: number;
  created_at?: string;
}

export interface CallMetricsDelta {
  total_apeluri: number | null;
  apeluri_initiate: number | null;
  apeluri_primite: number | null;
  rata_conversie: number | null; // percentage change
  minute_consumate: number | null;
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export const useCallMetrics = () => {
  const { profile } = useAuth();
  const [latest, setLatest] = useState<CallMetricsSnapshot | null>(null);
  const [previous, setPrevious] = useState<CallMetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTwoLatest = async () => {
    try {
      if (!profile?.id) return;
      const { data, error } = await supabase
        .from('call_metrics' as any)
        .select('total_apeluri,apeluri_initiate,apeluri_primite,rata_conversie,minute_consumate,created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(2);
      if (error) throw error;
      setLatest(data && data[0] ? (data[0] as CallMetricsSnapshot) : null);
      setPrevious(data && data[1] ? (data[1] as CallMetricsSnapshot) : null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwoLatest();
    // subscribe to realtime changes to refresh
    if (!profile?.id) return;
    const channel = supabase
      .channel('call_metrics_two_latest')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_metrics', filter: `user_id=eq.${profile.id}` },
        () => fetchTwoLatest()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const deltas: CallMetricsDelta = useMemo(() => {
    if (!latest || !previous) {
      return {
        total_apeluri: null,
        apeluri_initiate: null,
        apeluri_primite: null,
        rata_conversie: null,
        minute_consumate: null,
      };
    }
    return {
      total_apeluri: percentChange(latest.total_apeluri ?? 0, previous.total_apeluri ?? 0),
      apeluri_initiate: percentChange(latest.apeluri_initiate ?? 0, previous.apeluri_initiate ?? 0),
      apeluri_primite: percentChange(latest.apeluri_primite ?? 0, previous.apeluri_primite ?? 0),
      rata_conversie: percentChange(latest.rata_conversie ?? 0, previous.rata_conversie ?? 0),
      minute_consumate: percentChange(latest.minute_consumate ?? 0, previous.minute_consumate ?? 0),
    };
  }, [latest, previous]);

  return { latest, previous, deltas, loading, error, refetch: fetchTwoLatest };
};

