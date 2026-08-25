import { buildBogotaMap, CUBE_OFFSET } from "@/lib/bogota-map";
import type { IbocaStation } from "@/lib/iboca";

export function BogotaAirMap({ stations }: { stations: IbocaStation[] }) {
  const { tiles, dots, viewBox } = buildBogotaMap(stations);

  return (
    <figure className="animate-rise mx-auto w-full max-w-[280px] md:max-w-none">
      <svg
        viewBox={viewBox}
        role="img"
        aria-labelledby="bogota-map-title bogota-map-desc"
        className="h-auto w-full max-h-[min(52vh,420px)] overflow-visible"
      >
        <title id="bogota-map-title">Mapa de Bogotá por localidad</title>
        <desc id="bogota-map-desc">
          Localidades urbanas de Bogotá, coloreadas con el IBOCA en vivo. Cada
          tesela usa una curva cúbica de Bézier y un sombreado tipo cubo.
        </desc>
        <g aria-hidden="true">
          {tiles.map((tile) => (
            <path
              key={`${tile.id}-shade`}
              d={tile.path}
              fill={tile.shade}
              transform={`translate(${CUBE_OFFSET.x} ${CUBE_OFFSET.y})`}
            />
          ))}
        </g>
        <g>
          {tiles.map((tile) => (
            <path
              key={tile.id}
              d={tile.path}
              fill={tile.fill}
              stroke={tile.stroke}
              strokeWidth="0.7"
              strokeLinejoin="round"
            >
              <title>{tile.name}</title>
            </path>
          ))}
        </g>
        <g>
          {dots.map((dot) => (
            <circle
              key={dot.id}
              cx={dot.x}
              cy={dot.y}
              r={dot.value != null && dot.value > 50 ? 3.1 : 2.4}
              fill={dot.color}
              stroke="#f4efe6"
              strokeWidth="1.1"
            >
              <title>
                {dot.name}
                {dot.value != null ? ` · ${dot.value}` : ""}
              </title>
            </circle>
          ))}
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-xs tracking-[0.16em] text-[var(--ink-muted)] uppercase">
        Bogotá · IBOCA por localidad
      </figcaption>
    </figure>
  );
}
