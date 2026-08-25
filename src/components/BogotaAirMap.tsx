import { buildBogotaMap } from "@/lib/bogota-map";
import { IBOCA_BANDS, type IbocaStation } from "@/lib/iboca";

const DOT_RADIUS = {
  rest: 2.6,
  aboveBajo: 3.4,
} as const;

export function BogotaAirMap({ stations }: { stations: IbocaStation[] }) {
  const { tiles, dots, viewBox } = buildBogotaMap(stations);

  return (
    <figure className="animate-rise mx-auto w-full max-w-[320px] justify-self-center md:max-w-none md:justify-self-end">
      <svg
        viewBox={viewBox}
        role="img"
        aria-labelledby="bogota-map-title bogota-map-desc"
        className="h-auto w-full max-h-[min(46vh,440px)] overflow-visible"
      >
        <title id="bogota-map-title">Mapa de Bogotá por localidad</title>
        <desc id="bogota-map-desc">
          Localidades urbanas de Bogotá, coloreadas con el IBOCA en vivo. Cada
          tesela usa una curva cúbica de Bézier y un sombreado tipo cubo.
        </desc>
        <g aria-hidden="true">
          {tiles.map((tile) => (
            <path key={`${tile.id}-cube`} d={tile.extrusion} fill={tile.shade} />
          ))}
        </g>
        <g>
          {tiles.map((tile) => (
            <path
              key={tile.id}
              d={tile.path}
              fill={tile.fill}
              stroke={tile.stroke}
              strokeWidth="0.85"
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
              r={
                dot.value != null && dot.value > IBOCA_BANDS.bajo.max
                  ? DOT_RADIUS.aboveBajo
                  : DOT_RADIUS.rest
              }
              fill={dot.color}
              stroke="var(--sky-horizon)"
              strokeWidth="1.2"
              aria-label={
                dot.value != null ? `${dot.name} · ${dot.value}` : dot.name
              }
            />
          ))}
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-xs tracking-[0.16em] text-[var(--ink-muted)] uppercase">
        Bogotá · IBOCA por localidad
      </figcaption>
    </figure>
  );
}
