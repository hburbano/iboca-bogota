import type { CSSProperties } from "react";

const VIEW = { w: 1440, h: 220 } as const;
const ORIGIN = { x: 0, y: 0 } as const;

const BAND = {
  h: "5rem",
  hMd: "7rem",
} as const;

const WALL_OPACITY = 0.55;
const FOOTHILLS_OPACITY = 0.35;

type Pt = { x: number; y: number; at?: string };

function closedRidge(points: readonly Pt[]) {
  const line = points
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x} ${pt.y}`)
    .join(" ");
  return `${line} L${VIEW.w} ${VIEW.h} L${ORIGIN.x} ${VIEW.h} Z`;
}

const CERROS_WALL = closedRidge([
  { x: ORIGIN.x, y: 160, at: "west" },
  { x: 100, y: 128 },
  { x: 210, y: 148 },
  { x: 340, y: 108 },
  { x: 470, y: 136 },
  { x: 600, y: 114 },
  { x: 680, y: 86 },
  { x: 740, y: 62 },
  { x: 770, y: 54 },
  { x: 790, y: 52 },
  { x: 810, y: 54 },
  { x: 840, y: 62 },
  { x: 900, y: 84 },
  { x: 980, y: 76 },
  { x: 1010, y: 70 },
  { x: 1030, y: 74 },
  { x: 1140, y: 92 },
  { x: 1260, y: 132 },
  { x: VIEW.w, y: 108, at: "east" },
]);

const FOOTHILLS = closedRidge([
  { x: ORIGIN.x, y: 190, at: "west" },
  { x: 180, y: 158 },
  { x: 340, y: 178 },
  { x: 520, y: 142 },
  { x: 700, y: 172 },
  { x: 880, y: 138 },
  { x: 1040, y: 158 },
  { x: 1220, y: 148 },
  { x: VIEW.w, y: 170, at: "east" },
]);

export function BogotaRidge() {
  return (
    <div
      className="ridge-band pointer-events-none absolute inset-x-0 bottom-0"
      style={
        {
          ["--ridge-band-h"]: BAND.h,
          ["--ridge-band-h-md"]: BAND.hMd,
        } as CSSProperties
      }
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`${ORIGIN.x} ${ORIGIN.y} ${VIEW.w} ${VIEW.h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <g id="cerros-orientales">
          <path
            id="cerros-wall"
            fill="var(--ridge)"
            fillOpacity={WALL_OPACITY}
            d={CERROS_WALL}
          />
          <path
            id="cerros-foothills"
            fill="var(--ink)"
            fillOpacity={FOOTHILLS_OPACITY}
            d={FOOTHILLS}
          />
        </g>
      </svg>
    </div>
  );
}
