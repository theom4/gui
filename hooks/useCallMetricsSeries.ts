import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';

type DayPoint = { name: string; peakHour: number; avgHour: number };
type BarPoint = { name: string; visits: number };

function formatDateLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const useCallMetricsSeries = (days: number = 14) => {
  const { profile } = useAuth();
  const [lineData, setLineData] = useState<DayPoint[]>([]);
  const [barData, setBarData] = useState<BarPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRange = async () => {
    try {
      if (!profile?.id) return;
      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      since.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('call_metrics' as any)
        .select('total_apeluri,apeluri_initiate,apeluri_primite,minute_consumate,created_at')
        .eq('user_id', profile.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;

      // Aggregate per day
      const map = new Map<string, { total: number; primite: number; initiate: number; minutes: number }>();
      for (const r of data ?? []) {
        const d = startOfDay(new Date(r.created_at));
        const key = d.toISOString().slice(0, 10);
        const entry = map.get(key) || { total: 0, primite: 0, initiate: 0, minutes: 0 };
        entry.total += r.total_apeluri ?? 0;
        entry.primite += r.apeluri_primite ?? 0;
        entry.initiate += r.apeluri_initiate ?? 0;
        entry.minutes += r.minute_consumate ?? 0;
        map.set(key, entry);
      }

      // Ensure continuous days
      const daysArr: Date[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        daysArr.push(d);
      }

      const line: DayPoint[] = daysArr.map((d) => {
        const key = d.toISOString().slice(0, 10);
        const v = map.get(key) || { total: 0, primite: 0, initiate: 0, minutes: 0 };
        return { name: formatDateLabel(d), peakHour: v.total, avgHour: v.primite };
      });

      const bar: BarPoint[] = daysArr.map((d) => {
        const key = d.toISOString().slice(0, 10);
        const v = map.get(key) || { total: 0, primite: 0, initiate: 0, minutes: 0 };
        return { name: formatDateLabel(d), visits: v.minutes };
      });

      setLineData(line);
      setBarData(bar);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRange();
    if (!profile?.id) return;
    const channel = supabase
      .channel('call_metrics_series')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_metrics', filter: `user_id=eq.${profile.id}` },
        () => fetchRange()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, days]);

  return { lineData, barData, loading, error };
};

