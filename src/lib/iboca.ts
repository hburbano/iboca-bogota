export type Pollutant = "iboca" | "pm25" | "pm10" | "o3";

export type HistoryPoint = {
  t: string;
  v: number;
};

export type StationHistory = {
  pm25: HistoryPoint[];
  pm10: HistoryPoint[];
  o3: HistoryPoint[];
};

export type IbocaStation = {
  id: number;
  nombre: string;
  abreviatura: string;
  localidad: string;
  latitud: number | null;
  longitud: number | null;
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

/** Official IBOCA band table — hex and cutoffs used by the API and this app. */
export const IBOCA_BANDS = {
  bajo: { max: 50, label: "Bajo", hex: "00E400" },
  moderado: { max: 100, label: "Moderado", hex: "FFFF00" },
  regular: { max: 150, label: "Regular", hex: "FF7E00" },
  alto: { max: 200, label: "Alto", hex: "FF0000" },
  peligroso: { max: Number.POSITIVE_INFINITY, label: "Peligroso", hex: "8F3F97" },
} as const;

const IBOCA_BAND_ORDER = [
  IBOCA_BANDS.bajo,
  IBOCA_BANDS.moderado,
  IBOCA_BANDS.regular,
  IBOCA_BANDS.alto,
  IBOCA_BANDS.peligroso,
] as const;

export const MISSING_READING = "--";
export const MISSING_RANGE_LABEL = "Sin data";
export const FALLBACK_HEX = "94A3B8";
const UNPAINTABLE_HEX = new Set(["000000", "FFFFFF"]);

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function asIndex(value: unknown): number | string {
  if (typeof value === "number" || typeof value === "string") return value;
  return MISSING_READING;
}

function asConc(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** IBOCA uses 000000 / empty for missing bands; those are not paint colors. */
export function paintColor(hex: string | null | undefined): string | null {
  if (!hex || hex === MISSING_READING) return null;
  const clean = hex.replace("#", "").toUpperCase();
  if (UNPAINTABLE_HEX.has(clean) || !/^[0-9A-F]{6}$/.test(clean)) {
    return null;
  }
  return clean;
}

const EMPTY_HISTORY: StationHistory = { pm25: [], pm10: [], o3: [] };

function isMissingSample(index: number | null): boolean {
  return index == null || index === 0;
}

/** Hourly Nowcast points only — drops IBOCA's zero-as-missing samples. */
export function slimStationHistory(
  rawRows: Array<Record<string, unknown>>,
): StationHistory {
  const history: StationHistory = { pm25: [], pm10: [], o3: [] };

  for (const row of rawRows) {
    const t = asStringOrNull(row.fecha_inicio);
    const v = asNumber(row.calc_iboca);
    if (!t || isMissingSample(v) || v == null) continue;

    const name = asString(row.contaminante_name);
    const point: HistoryPoint = { t, v };
    if (name === "PM25") history.pm25.push(point);
    else if (name === "PM10") history.pm10.push(point);
    else if (name === "O3") history.o3.push(point);
  }

  history.pm25.sort(byTime);
  history.pm10.sort(byTime);
  history.o3.sort(byTime);
  return history;
}

function byTime(a: HistoryPoint, b: HistoryPoint): number {
  return a.t < b.t ? -1 : a.t > b.t ? 1 : 0;
}

export function emptyStationHistory(): StationHistory {
  return EMPTY_HISTORY;
}

/** IBOCA has no overall series; use the hourly max of available pollutants. */
export function seriesForPollutant(
  history: StationHistory,
  pollutant: Pollutant,
): HistoryPoint[] {
  if (pollutant === "pm25") return history.pm25;
  if (pollutant === "pm10") return history.pm10;
  if (pollutant === "o3") return history.o3;

  const hourlyMax = new Map<string, number>();
  for (const series of [history.pm25, history.pm10, history.o3]) {
    for (const point of series) {
      const prev = hourlyMax.get(point.t);
      if (prev == null || point.v > prev) hourlyMax.set(point.t, point.v);
    }
  }
  return [...hourlyMax.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([t, v]) => ({ t, v }));
}

export function stationReadingAt(
  station: IbocaStation,
  pollutant: Pollutant,
): string | null {
  if (pollutant === "pm25") return station.pm25_fecha;
  if (pollutant === "pm10") return station.pm10_fecha;
  if (pollutant === "o3") return station.pmO3_fecha;
  return latestReadingAt([station]);
}

export function parseStationId(raw: string): number | null {
  if (!/^\d{1,5}$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** IBOCA timestamps are Bogotá local time without an offset. */
export function formatBogotaDate(isoLike: string | null): string | null {
  if (!isoLike) return null;
  const date = new Date(isoLike.replace(" ", "T") + "-05:00");
  if (Number.isNaN(date.getTime())) return isoLike;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(date);
}

export function formatBogotaDay(isoLike: string | null): string | null {
  if (!isoLike) return null;
  const date = new Date(isoLike.replace(" ", "T") + "-05:00");
  if (Number.isNaN(date.getTime())) return isoLike;
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "America/Bogota",
  }).format(date);
}

/** Keep only fields the UI and city index need. Drops ~4.5MB photos plus GIS metadata. */
export function slimStation(raw: Record<string, unknown>): IbocaStation {
  return {
    id: Number(raw.id),
    nombre: asString(raw.nombre),
    abreviatura: asString(raw.abreviatura),
    localidad: asString(raw.localidad),
    latitud: asCoord(raw.latitud),
    longitud: asCoord(raw.longitud),
    iboca: asIndex(raw.iboca),
    pm25_iboca: asIndex(raw.pm25_iboca),
    pm10_iboca: asIndex(raw.pm10_iboca),
    O3_iboca: asIndex(raw.O3_iboca),
    pm25_concentracion: asConc(raw.pm25_concentracion),
    pm10_concentracion: asConc(raw.pm10_concentracion),
    O3_concentracion: asConc(raw.O3_concentracion),
    pm25_fecha: asStringOrNull(raw.pm25_fecha),
    pm10_fecha: asStringOrNull(raw.pm10_fecha),
    pmO3_fecha: asStringOrNull(raw.pmO3_fecha),
    rango_nombre: asString(raw.rango_nombre),
    rango_color: asString(raw.rango_color, FALLBACK_HEX),
    rango_nombre_pm25: asString(raw.rango_nombre_pm25),
    rango_nombre_pm10: asString(raw.rango_nombre_pm10),
    rango_nombre_o3: asString(raw.rango_nombre_o3),
    rango_color_pm25: asString(raw.rango_color_pm25, FALLBACK_HEX),
    rango_color_pm10: asString(raw.rango_color_pm10, FALLBACK_HEX),
    rango_color_o3: asString(raw.rango_color_o3, FALLBACK_HEX),
  };
}

export function asNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === MISSING_READING ||
    value === ""
  ) {
    return null;
  }
  const n =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** User-facing IBOCA band label (Spanish copy). */
export function levelLabel(label: string | null | undefined): string {
  if (!label || label === MISSING_READING || label === MISSING_RANGE_LABEL)
    return "Sin clasificación";
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
    return { value: null, label: "Sin dato", color: FALLBACK_HEX, driver: null };
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
  const band =
    IBOCA_BAND_ORDER.find((entry) => value <= entry.max) ??
    IBOCA_BANDS.peligroso;
  return { label: band.label, hex: band.hex };
}
