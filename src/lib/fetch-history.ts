import { unstable_cache } from "next/cache";
import {
  emptyStationHistory,
  slimStationHistory,
  type StationHistory,
} from "@/lib/iboca";

type IbocaApiResponse = {
  success: boolean;
  error: string;
  data: Array<Record<string, unknown>>;
};

const FETCH_TIMEOUT_MS = 15_000;

function historyUrl(stationId: number): string {
  return `http://iboca.ambientebogota.gov.co/iboca/service/stationHistoricalHours/${stationId}`;
}

async function loadHistoryUncached(stationId: number): Promise<StationHistory> {
  const res = await fetch(historyUrl(stationId), {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      "User-Agent": "iboca-bogota/0.1",
    },
  });

  if (!res.ok) {
    throw new Error(`IBOCA history API responded with ${res.status}`);
  }

  const json = (await res.json()) as IbocaApiResponse;
  if (!json.success) {
    throw new Error(json.error || "Unexpected IBOCA history payload");
  }
  if (!Array.isArray(json.data)) {
    return emptyStationHistory();
  }

  return slimStationHistory(json.data);
}

const getCachedHistory = unstable_cache(
  loadHistoryUncached,
  ["iboca-history-v2"],
  { revalidate: 300 },
);

export function fetchStationHistory(stationId: number): Promise<StationHistory> {
  return getCachedHistory(stationId);
}
