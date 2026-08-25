import { unstable_cache } from "next/cache";

export type IbocaStation = {
  id: number;
  nombre: string;
  abreviatura: string;
  latitud: string;
  longitud: string;
  localidad: string;
  estado: string;
  iboca: number | string;
  pm25_iboca: number | string;
  pm10_iboca: number | string;
  O3_iboca: number | string;
  pm25_concentracion: number;
  pm10_concentracion: number;
  O3_concentracion: number;
  pm25_fecha: string | null;
  pm10_fecha: string | null;
  pmO3_fecha: string | null;
  rango_nombre: string;
  rango_color: string;
  rango_nombre_pm25: string;
  rango_nombre_pm10: string;
  rango_nombre_o3: string;
  rango_color_pm25: string;
  rango_color_pm10: string;
  rango_color_o3: string;
};

type IbocaApiResponse = {
  success: boolean;
  error: string;
  data: Array<IbocaStation & { imagen?: string }>;
};

const IBOCA_STATIONS_URL =
  "http://iboca.ambientebogota.gov.co/iboca/service/allstations/true";

export function asNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "--" || value === "") {
    return null;
  }
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** User-facing IBOCA band label (Spanish copy). */
export function levelLabel(label: string | null | undefined): string {
  if (!label || label === "--") return "Sin clasificación";
  return label;
}

export function latestReadingAt(stations: IbocaStation[]): string | null {
  const dates = stations
    .flatMap((s) => [s.pm25_fecha, s.pm10_fecha, s.pmO3_fecha])
    .filter((d): d is string => Boolean(d));
  if (!dates.length) return null;
  return dates.sort().at(-1) ?? null;
}

export function cityIndex(stations: IbocaStation[]): {
  value: number | null;
  label: string;
  color: string;
  driver: IbocaStation | null;
} {
  let worst: { value: number; station: IbocaStation } | null = null;
  for (const station of stations) {
    const value = asNumber(station.iboca);
    if (value === null) continue;
    if (!worst || value > worst.value) {
      worst = { value, station };
    }
  }
  if (!worst) {
    return { value: null, label: "Sin dato", color: "94A3B8", driver: null };
  }
  return {
    value: worst.value,
    label: levelLabel(
      worst.station.rango_nombre || levelFromValue(worst.value).label,
    ),
    color: worst.station.rango_color || levelFromValue(worst.value).hex,
    driver: worst.station,
  };
}

/** Fallback IBOCA band from numeric index (Spanish copy for UI). */
export function levelFromValue(value: number): { label: string; hex: string } {
  if (value <= 50) return { label: "Bajo", hex: "00E400" };
  if (value <= 100) return { label: "Moderado", hex: "FFFF00" };
  if (value <= 150) return { label: "Regular", hex: "FF7E00" };
  if (value <= 200) return { label: "Alto", hex: "FF0000" };
  return { label: "Peligroso", hex: "8F3F97" };
}

async function loadStationsUncached(): Promise<IbocaStation[]> {
  const res = await fetch(IBOCA_STATIONS_URL, {
    cache: "no-store",
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

  // Drop base64 station photos (~6MB) before caching.
  return json.data.map(({ imagen: _imagen, ...station }) => station);
}

export const fetchIbocaStations = unstable_cache(
  loadStationsUncached,
  ["iboca-stations-slim"],
  { revalidate: 300 },
);
