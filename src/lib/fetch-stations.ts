import { unstable_cache } from "next/cache";
import { slimStation, type IbocaStation } from "@/lib/iboca";

type IbocaApiResponse = {
  success: boolean;
  error: string;
  data: Array<Record<string, unknown>>;
};

const IBOCA_STATIONS_URL =
  "http://iboca.ambientebogota.gov.co/iboca/service/allstations/true";

const FETCH_TIMEOUT_MS = 15_000;

async function loadStationsUncached(): Promise<IbocaStation[]> {
  const res = await fetch(IBOCA_STATIONS_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      "User-Agent": "iboca-bogota/0.1",
    },
  });

  if (!res.ok) {
    throw new Error(`IBOCA API responded with ${res.status}`);
  }

  const json = (await res.json()) as IbocaApiResponse;
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error(json.error || "Unexpected IBOCA payload");
  }

  return json.data.map(slimStation);
}

export const fetchIbocaStations = unstable_cache(
  loadStationsUncached,
  ["iboca-stations-v3"],
  { revalidate: 300 },
);
