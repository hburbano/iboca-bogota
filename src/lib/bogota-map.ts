import localities from "@/data/bogota-localities.json";
import {
  asNumber,
  IBOCA_BANDS,
  paintColor,
  type IbocaStation,
} from "@/lib/iboca";

type LonLat = [number, number];

export type MapTile = {
  id: string;
  name: string;
  path: string;
  extrusion: string;
  fill: string;
  shade: string;
  stroke: string;
  depth: number;
  cx: number;
  cy: number;
};

export type MapDot = {
  id: number;
  name: string;
  x: number;
  y: number;
  color: string;
  value: number | null;
};

const WEST = -74.225;
const EAST = -73.985;
const SOUTH = 4.47;
const NORTH = 4.838;
export const MAP_WIDTH = 240;
export const MAP_HEIGHT = Math.round(
  MAP_WIDTH * ((NORTH - SOUTH) / (EAST - WEST)),
);
const CUBE = { x: 8, y: 10 };
const DOT_CLIP = 8;
const VIEWBOX_PAD = 14;

function project(lon: number, lat: number): LonLat {
  return [
    ((lon - WEST) / (EAST - WEST)) * MAP_WIDTH,
    ((NORTH - lat) / (NORTH - SOUTH)) * MAP_HEIGHT,
  ];
}

function closeRing(ring: LonLat[]): LonLat[] {
  if (ring.length < 3) return ring;
  const [fx, fy] = ring[0];
  const [lx, ly] = ring[ring.length - 1];
  if (fx === lx && fy === ly) return ring;
  return [...ring, ring[0]];
}

function centroid(ring: LonLat[]): LonLat {
  let x = 0;
  let y = 0;
  const pts = ring.slice(0, -1);
  for (const [px, py] of pts) {
    x += px;
    y += py;
  }
  const n = pts.length || 1;
  return [x / n, y / n];
}

function pointInRing(point: LonLat, ring: LonLat[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Catmull-Rom spline as cubic Bézier — the locality edges stay geographic but read as one stroke. */
function cubicBezierPath(ring: LonLat[]): string {
  const pts = closeRing(ring);
  if (pts.length < 4) return "";
  const n = pts.length - 1;
  const fmt = (v: number) => v.toFixed(2);
  let d = `M ${fmt(pts[0][0])} ${fmt(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2[0])} ${fmt(p2[1])}`;
  }
  return `${d} Z`;
}

function dist2(a: LonLat, b: LonLat): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function stationPoint(station: IbocaStation): LonLat | null {
  if (station.longitud == null || station.latitud == null) return null;
  return [station.longitud, station.latitud];
}

function mix(hex: string, amount: number, into: string): string {
  return `color-mix(in srgb, #${hex} ${amount}%, ${into})`;
}

type TilePaint = { fill: string; shade: string; stroke: string };

const MISSING_PAINT: TilePaint = {
  fill: "color-mix(in srgb, var(--mist) 55%, var(--sky-horizon))",
  shade: "color-mix(in srgb, var(--ridge) 45%, var(--sky-mid))",
  stroke: "color-mix(in srgb, var(--ink) 18%, transparent)",
};

/** Official IBOCA hex is neon; restain it with the page tokens so cubes belong in the sky. */
const TILE_PAINT: Record<string, TilePaint> = {
  [IBOCA_BANDS.bajo.hex]: {
    fill: "color-mix(in srgb, var(--accent) 55%, var(--mist))",
    shade: "color-mix(in srgb, var(--ridge) 82%, var(--accent))",
    stroke: "color-mix(in srgb, var(--ink) 35%, var(--accent))",
  },
  [IBOCA_BANDS.moderado.hex]: {
    fill: "color-mix(in srgb, #e2c04a 82%, var(--sky-horizon))",
    shade: "color-mix(in srgb, var(--ridge) 70%, #b8912c)",
    stroke: "color-mix(in srgb, var(--ink) 30%, #b8912c)",
  },
  [IBOCA_BANDS.regular.hex]: {
    fill: "color-mix(in srgb, #e07a2a 78%, var(--sky-horizon))",
    shade: "color-mix(in srgb, var(--ridge) 68%, #c45e12)",
    stroke: "color-mix(in srgb, var(--ink) 30%, #c45e12)",
  },
  [IBOCA_BANDS.alto.hex]: {
    fill: "color-mix(in srgb, #c43b32 72%, var(--sky-horizon))",
    shade: "color-mix(in srgb, var(--ridge) 70%, #8f2a24)",
    stroke: "color-mix(in srgb, var(--ink) 32%, #8f2a24)",
  },
  [IBOCA_BANDS.peligroso.hex]: {
    fill: mix(IBOCA_BANDS.peligroso.hex, 68, "var(--mist)"),
    shade: "color-mix(in srgb, var(--ridge) 75%, #5c2a62)",
    stroke: "color-mix(in srgb, var(--ink) 32%, #5c2a62)",
  },
};

function tilePaint(hex: string | null): TilePaint {
  if (!hex) return MISSING_PAINT;
  return (
    TILE_PAINT[hex] ?? {
      fill: mix(hex, 70, "var(--sky-horizon)"),
      shade: mix(hex, 42, "var(--ridge)"),
      stroke: mix(hex, 30, "var(--ink)"),
    }
  );
}

/** Visible cube sides: quads along edges that face the offset. */
function extrusionPath(ring: LonLat[], ox: number, oy: number): string {
  const pts = closeRing(ring);
  const fmt = (v: number) => v.toFixed(2);
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const cross = (x2 - x1) * oy - (y2 - y1) * ox;
    if (cross <= 0) continue;
    d += `M ${fmt(x1)} ${fmt(y1)} L ${fmt(x2)} ${fmt(y2)} L ${fmt(x2 + ox)} ${fmt(y2 + oy)} L ${fmt(x1 + ox)} ${fmt(y1 + oy)} Z `;
  }
  return d;
}

function readingFor(station: IbocaStation): {
  value: number | null;
  color: string | null;
} {
  return {
    value: asNumber(station.iboca),
    color: paintColor(station.rango_color),
  };
}

function colorLocality(
  outer: LonLat[],
  stations: IbocaStation[],
): string | null {
  let worst: { value: number; color: string | null } | null = null;
  for (const station of stations) {
    const pt = stationPoint(station);
    if (!pt || !pointInRing(pt, outer)) continue;
    const reading = readingFor(station);
    if (reading.value == null) continue;
    if (!worst || reading.value > worst.value) {
      worst = { value: reading.value, color: reading.color };
    }
  }
  if (worst) return worst.color;

  const c = centroid(outer);
  let nearest: { d: number; color: string | null } | null = null;
  for (const station of stations) {
    const pt = stationPoint(station);
    if (!pt) continue;
    const d = dist2(pt, c);
    const reading = readingFor(station);
    if (!nearest || d < nearest.d) {
      nearest = { d, color: reading.color };
    }
  }
  return nearest?.color ?? null;
}

export function buildBogotaMap(stations: IbocaStation[]): {
  tiles: MapTile[];
  dots: MapDot[];
  viewBox: string;
} {
  const tiles: MapTile[] = localities.features.map((feature) => {
    const outerLonLat = closeRing(feature.r[0] as LonLat[]);
    const projected = outerLonLat.map(([lon, lat]) => project(lon, lat));
    const [cx, cy] = centroid(projected);
    const paint = tilePaint(colorLocality(outerLonLat, stations));
    return {
      id: feature.c,
      name: feature.n,
      path: cubicBezierPath(projected),
      extrusion: extrusionPath(projected, CUBE.x, CUBE.y),
      fill: paint.fill,
      shade: paint.shade,
      stroke: paint.stroke,
      depth: cx + cy,
      cx,
      cy,
    };
  });

  tiles.sort((a, b) => a.depth - b.depth);

  const dots: MapDot[] = stations.flatMap((station) => {
    const pt = stationPoint(station);
    if (!pt) return [];
    const [x, y] = project(pt[0], pt[1]);
    if (x < -DOT_CLIP || y < -DOT_CLIP || x > MAP_WIDTH + DOT_CLIP || y > MAP_HEIGHT + DOT_CLIP)
      return [];
    const reading = readingFor(station);
    return [
      {
        id: station.id,
        name: station.nombre,
        x,
        y,
        color: reading.color ? `#${reading.color}` : "var(--ink-muted)",
        value: reading.value,
      },
    ];
  });

  const viewBox = `${-VIEWBOX_PAD} ${-VIEWBOX_PAD} ${MAP_WIDTH + CUBE.x + VIEWBOX_PAD * 2} ${MAP_HEIGHT + CUBE.y + VIEWBOX_PAD * 2}`;
  return { tiles, dots, viewBox };
}

export const CUBE_OFFSET = CUBE;
