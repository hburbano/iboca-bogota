import {
  formatBogotaDay,
  type HistoryPoint,
} from "@/lib/iboca";

export function StationHistoryChart({
  points,
  color,
  label,
}: {
  points: HistoryPoint[];
  color: string;
  label: string;
}) {
  const fill = `#${color || "1b6b5a"}`;
  const first = points[0];
  const last = points.at(-1);
  let min = first;
  let max = first;
  for (const point of points) {
    if (!min || point.v < min.v) min = point;
    if (!max || point.v > max.v) max = point;
  }

  const aria = min && max && first && last
    ? `${label} últimos 7 días, mínimo ${min.v}, máximo ${max.v}`
    : `${label} últimos 7 días`;

  return (
    <div className="mt-8 border-t border-[var(--line)] pt-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-[var(--ink-muted)] uppercase">
            Histórico
          </p>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{label} · 7 días</p>
        </div>
        {min && max && (
          <p className="text-sm tabular-nums text-[var(--ink-muted)]">
            min {min.v} · máx {max.v}
          </p>
        )}
      </div>

      <Sparkline points={points} fill={fill} label={aria} />

      <div className="mt-2 flex justify-between text-xs text-[var(--ink-muted)]">
        <span>{formatBogotaDay(first?.t ?? null)}</span>
        <span>{formatBogotaDay(last?.t ?? null)}</span>
      </div>
    </div>
  );
}

export function StationHistorySkeleton() {
  return (
    <div className="mt-8 border-t border-[var(--line)] pt-6">
      <p className="text-xs tracking-[0.18em] text-[var(--ink-muted)] uppercase">
        Histórico
      </p>
      <div
        className="mt-4 h-[72px] animate-pulse rounded-xl bg-[var(--mist)]/80"
        aria-hidden
      />
      <p className="sr-only">Cargando histórico</p>
    </div>
  );
}

export function StationHistoryMessage({ children }: { children: string }) {
  return (
    <div className="mt-8 border-t border-[var(--line)] pt-6">
      <p className="text-xs tracking-[0.18em] text-[var(--ink-muted)] uppercase">
        Histórico
      </p>
      <p className="mt-3 text-sm text-[var(--ink-soft)]">{children}</p>
    </div>
  );
}

function Sparkline({
  points,
  fill,
  label,
}: {
  points: HistoryPoint[];
  fill: string;
  label: string;
}) {
  const width = 320;
  const height = 72;
  const stroke = "#14201c";
  const times = points.map((p) => Date.parse(p.t.replace(" ", "T") + "-05:00"));
  const timeOk = times.every((t) => Number.isFinite(t));
  const t0 = times[0] ?? 0;
  const t1 = times.at(-1) ?? 0;
  const tSpan = t1 - t0 || 1;
  const values = points.map((p) => p.v);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const coords = values.map((v, i) => {
    const x = timeOk
      ? ((times[i] - t0) / tSpan) * width
      : (i / Math.max(values.length - 1, 1)) * width;
    const y = height - ((v - lo) / span) * (height - 8) - 4;
    return [x, y] as const;
  });
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  const last = coords.at(-1);

  return (
    <svg
      viewBox={`-1 -1 ${width + 2} ${height + 2}`}
      role="img"
      aria-label={label}
      className="mt-4 h-[72px] w-full overflow-visible"
    >
      <path d={area} fill={fill} opacity="0.28" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="3.2" fill={stroke} />}
    </svg>
  );
}
