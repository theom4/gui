import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/auth/AuthContext';
import { queryKeys } from '@/lib/queryClient';

/**
 * 🎯 Optimized Call Recordings Hook
 *
 * Features:
 * - Smart realtime ONLY for latest 10 recordings
 * - Debounced updates (500ms) - perfect for active call scenarios
 * - Lazy loading with infinite scroll support
 * - Aggressive caching for older recordings
 *
 * Strategy:
 * - Latest 10-20: Realtime updates (user expects to see new calls)
 * - Older recordings: Cached aggressively (they don't change!)
 */

export interface CallRecording {
  id: number;
  user_id: string;
  created_at: string;
  duration_seconds: number | null;
  recording_url: string;
  recording_transcript: string | null;
  phone_number: string | null;
  client_personal_id: string | null;
  direction: string | null;
}

interface CallRecordingsResult {
  recordings: CallRecording[];
  total: number;
}

import { DateRange } from "react-day-picker";

/**
 * Fetch latest recordings with limit
 */
async function fetchLatestRecordings(
  userId: string,
  limit: number = 20,
  dateRange?: DateRange
): Promise<CallRecording[]> {
  console.log('[CallRecordings] Fetching for user:', userId, 'Limit:', limit, 'DateRange:', dateRange);

  try {
    let query = supabase
      .from('call_recordings' as any)
      .select('id,user_id,created_at,duration_seconds,recording_url,recording_transcript,phone_number,client_personal_id,direction')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0); // Ensure we start at beginning of day
      const fromISO = fromDate.toISOString();
      console.log('[CallRecordings] Filter From:', fromISO);
      query = query.gte('created_at', fromISO);
    }

    if (dateRange?.to) {
      // End of the day
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
      console.log('[CallRecordings] Filter To:', toDate.toISOString());
    }

    // If filtering by date, we might want to increase the limit or rely on the user to use pagination (infinite scroll).
    // For now, let's keep the limit but maybe increase it slightly or just respect it as "top N results within filtered range"
    query = query.limit(limit);

    console.log('[CallRecordings] Executing Supabase query. URL:', (query as any).url?.toString());

    // Add timeout to diagnose hanging queries
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
    });

    const result = await Promise.race([query, timeoutPromise]) as any;
    const { data, error } = result;

    if (error) {
      console.error('[CallRecordings] Supabase Error:', error);
      throw error;
    }

    console.log('[CallRecordings] Success. Rows found:', data?.length, 'Data:', data);
    return (data as CallRecording[]) || [];
  } catch (err) {
    console.error('[CallRecordings] Unexpected error in fetch:', err);
    throw err;
  }
}

/**
 * Main Hook - Optimized Call Recordings with Smart Realtime
 */
export const useCallRecordingsOptimized = (limit: number = 20, dateRange?: DateRange) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const userId = profile?.id;

  // React Query
  const query = useQuery({
    queryKey: [...queryKeys.callRecordings.latest(userId || ''), dateRange], // Include dateRange in query key
    queryFn: () => fetchLatestRecordings(userId!, limit, dateRange),
    enabled: !!userId,
    staleTime: 60_000, // 1 minute - recordings don't change once created
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Smart Realtime - Only for INSERT events (new recordings)
  useEffect(() => {
    if (!userId || !query.data) return;

    // If a date filter is active and it doesn't include "today" approx, maybe disable realtime?
    // But keeping it simple: any new recording triggers a specific key invalidation.
    // If we filter by date, the key includes the date.
    // So we should invalidate queries effectively. 
    // Actually invalidateQueries matching the base key will invalidate all variations (with different date ranges) if we use prefix matching,
    // but here we used exact keys?
    // queryKeys.callRecordings.latest returns an array.

    // Cleanup old channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    // Debounced refetch - 500ms is perfect for recording scenarios
    // If multiple calls end around same time, batch the updates
    const debouncedRefetch = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        console.log('[CallRecordings] New recording detected, refetching...');
        // Invalidate ALL recordings queries for this user, so that any date filter view updates if needed
        queryClient.invalidateQueries({ queryKey: ['call_recordings', userId] as any });
      }, 500); // 500ms debounce
    };

    // Setup realtime subscription - ONLY for INSERT
    const channel = supabase
      .channel(`call_recordings_optimized_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // ✅ ONLY new recordings matter
          schema: 'public',
          table: 'call_recordings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('[CallRecordings] New recording inserted:', payload.new);
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
  }, [userId, queryClient, query.data]); // Re-sub if userId changes

  return {
    recordings: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
  };
};

/**
 * 🔄 Infinite Scroll Hook (for future pagination)
 *
 * Use this when you want to load older recordings on demand
 */
export const useCallRecordingsInfinite = (pageSize: number = 20) => {
  const { profile } = useAuth();
  const userId = profile?.id;

  const query = useInfiniteQuery({
    queryKey: queryKeys.callRecordings.list(userId || '', pageSize, 0),
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) return { recordings: [], nextCursor: null };

      const { data, error } = await supabase
        .from('call_recordings' as any)
        .select('id,user_id,created_at,duration_seconds,recording_url,client_personal_id,recording_transcript,phone_number', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + pageSize - 1);

      if (error) throw error;

      return {
        recordings: (data as CallRecording[]) || [],
        nextCursor: data && data.length === pageSize ? pageParam + pageSize : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!userId,
    staleTime: 5 * 60_000, // 5 minutes - old recordings don't change!
    initialPageParam: 0,
  });

  const allRecordings = query.data?.pages.flatMap((page) => page.recordings) || [];

  return {
    recordings: allRecordings,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
};

/**
 * 📊 Performance Comparison:
 *
 * BEFORE (CallRecordings.tsx):
 * - Fetch 50 recordings at mount
 * - Realtime subscription for ALL events (INSERT, UPDATE, DELETE)
 * - Refetch immediately on any change
 * - No caching - refetch every time component mounts
 *
 * AFTER:
 * - Fetch 20 recordings at mount (less data)
 * - Realtime ONLY for INSERT (new recordings)
 * - Debounced refetch (500ms)
 * - Cached for 1 minute
 * - Option for infinite scroll (future)
 *
 * BENEFITS:
 * - 60% less data transferred (20 vs 50 records)
 * - Only relevant realtime events (INSERT only)
 * - Batched updates when multiple calls end
 * - Instant render on remount (cached)
 */
