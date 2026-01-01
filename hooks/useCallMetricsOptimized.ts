import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';
import { queryKeys, staleTimeConfig, refetchIntervalConfig } from '@/lib/queryClient';

/**
 * 🚀 UNIFIED & OPTIMIZED Call Metrics Hook
 *
 * Replaces:
 * - useCallMetrics (latest + previous)
 * - useCallMetricsSeries (14 days historical)
 * - useNanoassistData (single latest - redundant)
 *
 * Benefits:
 * - 1 fetch instead of 3 at mount
 * - 1 realtime subscription instead of 3
 * - Intelligent polling (30s) with Page Visibility support
 * - Automatic debouncing for realtime updates
 * - Shared cache across components
 */

export interface CallMetricsSnapshot {
  total_apeluri: number;
  apeluri_initiate: number;
  apeluri_primite: number;
  rata_conversie: number;
  minute_consumate: number;
  created_at?: string;
}

export interface CallMetricsDelta {
  total_apeluri: number | null;
  apeluri_initiate: number | null;
  apeluri_primite: number | null;
  rata_conversie: number | null;
  minute_consumate: number | null;
}

interface SeriesDataPoint {
  name: string;
  peakHour: number;
  avgHour: number;
}

interface BarDataPoint {
  name: string;
  visits: number;
}

interface UnifiedCallMetricsData {
  latest: CallMetricsSnapshot | null;
  previous: CallMetricsSnapshot | null;
  seriesData: SeriesDataPoint[];
  barData: BarDataPoint[];
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function formatDateLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Fetch function - gets ALL data in ONE query
 */
async function fetchUnifiedCallMetrics(
  userId: string,
  days: number = 14
): Promise<UnifiedCallMetricsData> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  // Single query gets everything we need
  const { data, error } = await supabase
    .from('call_metrics' as any)
    .select('total_apeluri,apeluri_initiate,apeluri_primite,rata_conversie,minute_consumate,created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  const allRecords = (data || []) as CallMetricsSnapshot[];

  // Extract latest and previous
  const latest = allRecords[0] || null;
  const previous = allRecords[1] || null;

  // Process series data
  const map = new Map<string, { total: number; primite: number; initiate: number; minutes: number }>();
  for (const r of allRecords) {
    if (!r.created_at) continue;
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

  const seriesData: SeriesDataPoint[] = daysArr.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const v = map.get(key) || { total: 0, primite: 0, initiate: 0, minutes: 0 };
    return { name: formatDateLabel(d), peakHour: v.total, avgHour: v.primite };
  });

  const barData: BarDataPoint[] = daysArr.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const v = map.get(key) || { total: 0, primite: 0, initiate: 0, minutes: 0 };
    return { name: formatDateLabel(d), visits: v.minutes };
  });

  return { latest, previous, seriesData, barData };
}

/**
 * Main Hook - Unified Call Metrics with Intelligent Polling
 */
export const useCallMetricsOptimized = (days: number = 14) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const userId = profile?.id;

  // React Query with optimized polling
  const query = useQuery({
    queryKey: queryKeys.callMetrics.unified(userId || ''),
    queryFn: () => fetchUnifiedCallMetrics(userId!, days),
    enabled: !!userId,
    staleTime: staleTimeConfig.callMetricsSnapshot,
    refetchInterval: refetchIntervalConfig.callMetricsPolling,
    refetchIntervalInBackground: false, // 🔥 STOP polling when tab inactive
    refetchOnWindowFocus: true, // ✅ Refetch when user returns
    retry: 3,
  });

  // Realtime subscription with debouncing
  useEffect(() => {
    if (!userId || !query.data) return;

    // Cleanup old channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    // Debounced refetch function
    const debouncedRefetch = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        console.log('[CallMetrics] Realtime update detected, refetching...');
        queryClient.invalidateQueries({ queryKey: queryKeys.callMetrics.unified(userId) });
      }, 3000); // 3 second debounce - batch multiple updates
    };

    // Setup realtime subscription
    const channel = supabase
      .channel(`call_metrics_optimized_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_metrics',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[CallMetrics] Realtime event:', payload.eventType);
          debouncedRefetch();
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [userId, queryClient, query.data]);

  // Computed deltas
  const deltas: CallMetricsDelta = useMemo(() => {
    const { latest, previous } = query.data || {};

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
  }, [query.data]);

  return {
    // Latest & Previous (replaces useCallMetrics)
    latest: query.data?.latest || null,
    previous: query.data?.previous || null,
    deltas,

    // Series data (replaces useCallMetricsSeries)
    lineData: query.data?.seriesData || [],
    barData: query.data?.barData || [],

    // Status
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    isRefetching: query.isRefetching,

    // Manual refetch
    refetch: query.refetch,
  };
};

/**
 * 📊 Performance Impact:
 *
 * BEFORE:
 * - 3 separate fetches at mount
 * - 3 realtime subscriptions
 * - 3 refetches on every DB change
 * - No debouncing
 * - Polling continues in background tabs
 *
 * AFTER:
 * - 1 unified fetch at mount
 * - 1 realtime subscription
 * - 1 refetch (debounced 3s) on DB change
 * - Automatic polling pause when tab inactive
 * - Shared cache across all components
 *
 * REDUCTION: ~66% fewer fetches, ~66% fewer connections
 */
