import { StationExplorer } from "@/components/StationExplorer";
import {
  cityIndex,
  fetchIbocaStations,
  latestReadingAt,
  type IbocaStation,
} from "@/lib/iboca";

export const revalidate = 300;

function formatUpdated(isoLike: string | null) {
  if (!isoLike) return "Sin actualización reciente";
  const date = new Date(isoLike.replace(" ", "T") + "-05:00");
  if (Number.isNaN(date.getTime())) return isoLike;
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(date);
}

async function loadStations(): Promise<
  { ok: true; stations: IbocaStation[] } | { ok: false; message: string }
> {
  try {
    const stations = await fetchIbocaStations();
    return { ok: true, stations };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "No se pudo cargar IBOCA",
    };
  }
}

export default async function Home() {
  const result = await loadStations();
  const stations = result.ok ? result.stations : [];
  const city = cityIndex(stations);
  const updated = formatUpdated(latestReadingAt(stations));
  const aqiColor = `#${city.color || "7eb6d9"}`;

  return (
    <div className="flex min-h-full flex-col">
      <header
        className="hero-sky relative min-h-[100svh] overflow-hidden"
        style={{ ["--aqi" as string]: aqiColor }}
      >
        <div className="animate-drift pointer-events-none absolute inset-x-[-8%] top-[8%] h-40 opacity-50">
          <div className="mx-auto h-24 w-[70%] rounded-[100%] bg-white/35 blur-3xl" />
        </div>

        <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 md:px-8">
          <p className="font-display text-xl tracking-tight text-[var(--ink)] md:text-2xl">
            IBOCA
          </p>
          <a
            href="#estaciones"
            className="rounded-full border border-[var(--line)] bg-white/55 px-4 py-2 text-sm text-[var(--ink)] outline-none backdrop-blur transition hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Ver estaciones
          </a>
        </nav>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-6xl flex-col justify-end px-5 pb-28 pt-16 md:px-8 md:pb-36">
          <p className="animate-rise font-display text-sm tracking-[0.22em] text-[var(--ink-soft)] uppercase">
            Bogotá
          </p>
          <h1 className="animate-rise mt-3 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight text-[var(--ink)] md:text-7xl lg:text-8xl">
            IBOCA
          </h1>
          <p className="animate-rise mt-5 max-w-lg text-lg text-[var(--ink-soft)] md:text-xl">
            El aire de la ciudad, ahora — índice y riesgo por estación RMCAB.
          </p>

          <div className="animate-rise mt-10 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs tracking-[0.18em] text-[var(--ink-muted)] uppercase">
                Índice ciudad
              </p>
              <p className="font-display text-7xl leading-none tabular-nums text-[var(--ink)] md:text-8xl">
                {city.value ?? "—"}
              </p>
            </div>
            <div className="pb-2">
              <p className="flex items-center gap-2 font-medium text-[var(--ink)]">
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: aqiColor }}
                  aria-hidden
                />
                {city.label}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                {city.driver
                  ? `Mayor lectura: ${city.driver.nombre}`
                  : "Sin estaciones activas"}
              </p>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{updated}</p>
            </div>
          </div>

          <div className="animate-rise mt-10 flex flex-wrap gap-3">
            <a
              href="#estaciones"
              className="rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-medium text-[#f4efe6] outline-none transition hover:bg-[var(--ridge)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Explorar red
            </a>
            <a
              href="http://iboca.ambientebogota.gov.co/mapa/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--line)] bg-white/50 px-5 py-3 text-sm text-[var(--ink)] outline-none backdrop-blur transition hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Mapa oficial
            </a>
          </div>
        </div>

        <div className="mountain-band pointer-events-none absolute inset-x-0 bottom-0 h-36 md:h-48" />
      </header>

      <main id="estaciones" className="relative z-10 -mt-8 grow rounded-t-[2rem] bg-[color-mix(in_srgb,var(--sky-horizon)_88%,white)]">
        {result.ok ? (
          <StationExplorer stations={stations} />
        ) : (
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
            <h2 className="font-display text-3xl text-[var(--ink)]">
              No se pudo cargar IBOCA
            </h2>
            <p className="mt-3 text-[var(--ink-soft)]">{result.message}</p>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--line)] px-5 py-8 text-sm text-[var(--ink-muted)] md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>
            Fuente: Secretaría Distrital de Ambiente — IBOCA / RMCAB. Datos no
            oficiales de la entidad; espejo de lectura pública.
          </p>
          <p>Actualización cada 5 minutos</p>
        </div>
      </footer>
    </div>
  );
}
