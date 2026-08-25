"use client";

import { useEffect, useState } from "react";
import type { StationHistory } from "@/lib/iboca";

const FRESH_MS = 5 * 60 * 1000;
const ERROR_COOLDOWN_MS = 20_000;

type CacheEntry =
  | { ok: true; data: StationHistory; fetchedAt: number }
  | { ok: false; error: string; fetchedAt: number };

const cache = new Map<number, CacheEntry>();
const inflight = new Map<number, Promise<StationHistory>>();

function isFresh(entry: CacheEntry, ttl: number): boolean {
  return Date.now() - entry.fetchedAt < ttl;
}

function fetchHistory(stationId: number): Promise<StationHistory> {
  const existing = inflight.get(stationId);
  if (existing) return existing;

  const req = fetch(`/api/stations/${stationId}/history`, {
    headers: { Accept: "application/json" },
  })
    .then(async (res) => {
      const json = (await res.json()) as {
        success: boolean;
        data?: StationHistory;
        error?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      return json.data;
    })
    .then((data) => {
      cache.set(stationId, { ok: true, data, fetchedAt: Date.now() });
      return data;
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      cache.set(stationId, { ok: false, error: message, fetchedAt: Date.now() });
      throw err;
    })
    .finally(() => {
      inflight.delete(stationId);
    });

  inflight.set(stationId, req);
  return req;
}

export function useStationHistory(stationId: number | null): {
  data: StationHistory | null;
  status: "idle" | "loading" | "ok" | "error";
  error: string | null;
  refreshing: boolean;
} {
  const [, bump] = useState(0);
  const cached = stationId == null ? undefined : cache.get(stationId);

  let status: "idle" | "loading" | "ok" | "error" = "idle";
  let refreshing = false;
  if (stationId == null) {
    status = "idle";
  } else if (cached?.ok && isFresh(cached, FRESH_MS)) {
    status = "ok";
  } else if (cached && !cached.ok && isFresh(cached, ERROR_COOLDOWN_MS)) {
    status = "error";
  } else if (cached?.ok) {
    status = "ok";
    refreshing = true;
  } else if (cached && !cached.ok) {
    status = "error";
    refreshing = true;
  } else {
    status = "loading";
  }

  useEffect(() => {
    if (stationId == null) return;

    const entry = cache.get(stationId);
    if (entry?.ok && isFresh(entry, FRESH_MS)) return;
    if (entry && !entry.ok && isFresh(entry, ERROR_COOLDOWN_MS)) return;

    let cancelled = false;
    fetchHistory(stationId)
      .then(() => {
        if (!cancelled) bump((n) => n + 1);
      })
      .catch(() => {
        if (!cancelled) bump((n) => n + 1);
      });

    return () => {
      cancelled = true;
    };
  }, [stationId]);

  return {
    data: cached?.ok ? cached.data : null,
    status,
    error: cached && !cached.ok ? cached.error : null,
    refreshing,
  };
}
