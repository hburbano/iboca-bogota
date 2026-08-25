export type IbocaStation = {
  id: number;
  nombre: string;
  abreviatura: string;
  localidad: string;
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

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function asIndex(value: unknown): number | string {
  if (typeof value === "number" || typeof value === "string") return value;
  return "--";
}

function asConc(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** Keep only fields the UI and city index need. Drops ~4.5MB photos plus GIS metadata. */
export function slimStation(raw: Record<string, unknown>): IbocaStation {
  return {
    id: Number(raw.id),
    nombre: asString(raw.nombre),
    abreviatura: asString(raw.abreviatura),
    localidad: asString(raw.localidad),
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
    rango_color: asString(raw.rango_color, "94A3B8"),
    rango_nombre_pm25: asString(raw.rango_nombre_pm25),
    rango_nombre_pm10: asString(raw.rango_nombre_pm10),
    rango_nombre_o3: asString(raw.rango_nombre_o3),
    rango_color_pm25: asString(raw.rango_color_pm25, "94A3B8"),
    rango_color_pm10: asString(raw.rango_color_pm10, "94A3B8"),
    rango_color_o3: asString(raw.rango_color_o3, "94A3B8"),
  };
}

export function asNumber(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined || value === "--" || value === "") {
    return null;
  }
  const n =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** User-facing IBOCA band label (Spanish copy). */
export function levelLabel(label: string | null | undefined): string {
  if (!label || label === "--" || label === "Sin data")
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
