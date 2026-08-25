import localities from "@/data/bogota-localities.json";
import { asNumber, paintColor, type IbocaStation } from "@/lib/iboca";

type LonLat = [number, number];

export type MapTile = {
  id: string;
  name: string;
  path: string;
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
const CUBE = { x: 5, y: 6 };

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

function tilePaint(hex: string | null): {
  fill: string;
  shade: string;
  stroke: string;
} {
  if (!hex) {
    return {
      fill: "color-mix(in srgb, var(--mist) 70%, white)",
      shade: "color-mix(in srgb, var(--ridge) 28%, var(--sky-horizon))",
      stroke: "color-mix(in srgb, var(--ink) 22%, transparent)",
    };
  }
  return {
    fill: mix(hex, 62, "#f3ebe0"),
    shade: mix(hex, 38, "#2f4a3f"),
    stroke: mix(hex, 28, "#14201c"),
  };
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
    if (x < -8 || y < -8 || x > MAP_WIDTH + 8 || y > MAP_HEIGHT + 8) return [];
    const reading = readingFor(station);
    return [
      {
        id: station.id,
        name: station.nombre,
        x,
        y,
        color: reading.color ? `#${reading.color}` : "#6b7c74",
        value: reading.value,
      },
    ];
  });

  const pad = 10;
  const viewBox = `${-pad} ${-pad} ${MAP_WIDTH + CUBE.x + pad * 2} ${MAP_HEIGHT + CUBE.y + pad * 2}`;
  return { tiles, dots, viewBox };
}

export const CUBE_OFFSET = CUBE;
