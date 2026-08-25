"use client";

import { useMemo, useState } from "react";
import {
  Button,
  GridList,
  GridListItem,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  SelectValue,
  Popover,
} from "react-aria-components";
import {
  StationHistoryChart,
  StationHistoryMessage,
  StationHistorySkeleton,
} from "@/components/StationHistoryChart";
import {
  asNumber,
  FALLBACK_HEX,
  formatBogotaDate,
  levelLabel,
  seriesForPollutant,
  stationReadingAt,
  type IbocaStation,
  type Pollutant,
} from "@/lib/iboca";
import { useStationHistory } from "@/lib/use-station-history";

const POLLUTANTS: { id: Pollutant; label: string }[] = [
  { id: "iboca", label: "IBOCA" },
  { id: "pm25", label: "PM2.5" },
  { id: "pm10", label: "PM10" },
  { id: "o3", label: "O₃" },
];

function reading(station: IbocaStation, pollutant: Pollutant) {
  switch (pollutant) {
    case "pm25":
      return {
        index: asNumber(station.pm25_iboca),
        conc: station.pm25_concentracion,
        label: levelLabel(station.rango_nombre_pm25),
        color: station.rango_color_pm25,
        unit: "µg/m³",
      };
    case "pm10":
      return {
        index: asNumber(station.pm10_iboca),
        conc: station.pm10_concentracion,
        label: levelLabel(station.rango_nombre_pm10),
        color: station.rango_color_pm10,
        unit: "µg/m³",
      };
    case "o3":
      return {
        index: asNumber(station.O3_iboca),
        conc: station.O3_concentracion,
        label: levelLabel(station.rango_nombre_o3),
        color: station.rango_color_o3,
        unit: "µg/m³",
      };
    default:
      return {
        index: asNumber(station.iboca),
        conc: null as number | null,
        label: levelLabel(station.rango_nombre),
        color: station.rango_color,
        unit: null as string | null,
      };
  }
}

export function StationExplorer({ stations }: { stations: IbocaStation[] }) {
  const [pollutant, setPollutant] = useState<Pollutant>("iboca");
  const [selected, setSelected] = useState<string | null>(
    stations[0] ? String(stations[0].id) : null,
  );

  const sorted = useMemo(() => {
    return [...stations].sort((a, b) => {
      const av = reading(a, pollutant).index ?? -1;
      const bv = reading(b, pollutant).index ?? -1;
      return bv - av;
    });
  }, [stations, pollutant]);

  const active = sorted.find((s) => String(s.id) === selected) ?? sorted[0];
  const pollutantLabel =
    POLLUTANTS.find((p) => p.id === pollutant)?.label ?? "IBOCA";

  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-24 pt-10 md:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-sm tracking-[0.18em] text-[var(--ink-muted)] uppercase">
            Red RMCAB
          </p>
          <h2 className="mt-2 font-display text-3xl text-[var(--ink)] md:text-4xl">
            Estaciones en vivo
          </h2>
          <p className="mt-2 max-w-xl text-[var(--ink-soft)]">
            Índice y concentraciones por estación de monitoreo en Bogotá.
          </p>
        </div>

        <Select
          selectedKey={pollutant}
          onSelectionChange={(key) => setPollutant(key as Pollutant)}
          className="w-full max-w-xs"
        >
          <Label className="mb-1 block text-xs tracking-wide text-[var(--ink-muted)] uppercase">
            Indicador
          </Label>
          <Button className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-white/70 px-4 py-3 text-left text-[var(--ink)] shadow-[0_1px_0_rgba(20,32,28,0.04)] outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            <SelectValue />
            <span aria-hidden className="text-[var(--ink-muted)]">
              ▾
            </span>
          </Button>
          <Popover className="w-[var(--trigger-width)] overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-lg">
            <ListBox className="outline-none">
              {POLLUTANTS.map((p) => (
                <ListBoxItem
                  key={p.id}
                  id={p.id}
                  textValue={p.label}
                  className="cursor-pointer px-4 py-2.5 text-[var(--ink)] outline-none data-[focused]:bg-[var(--mist)] data-[selected]:bg-[var(--accent-soft)]"
                >
                  {p.label}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <GridList
          aria-label="Estaciones IBOCA"
          selectionMode="single"
          selectedKeys={selected ? new Set([selected]) : new Set()}
          onSelectionChange={(keys) => {
            const first = [...keys][0];
            if (first != null) setSelected(String(first));
          }}
          items={sorted}
          className="grid gap-2 outline-none"
        >
          {(station) => {
            const r = reading(station, pollutant);
            return (
              <GridListItem
                id={String(station.id)}
                textValue={station.nombre}
                className="group flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-transparent px-4 py-3 outline-none transition hover:border-[var(--line)] hover:bg-white/55 data-[selected]:border-[var(--line)] data-[selected]:bg-white/80 data-[focus-visible]:ring-2 data-[focus-visible]:ring-[var(--accent)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: `#${r.color || FALLBACK_HEX}` }}
                      aria-hidden
                    />
                    <p className="truncate font-medium text-[var(--ink)]">
                      {station.nombre}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-[var(--ink-muted)]">
                    {station.localidad || station.abreviatura}
                    {r.label ? ` · ${r.label}` : ""}
                  </p>
                </div>
                <p className="font-display text-2xl tabular-nums text-[var(--ink)]">
                  {r.index ?? "—"}
                </p>
              </GridListItem>
            );
          }}
        </GridList>

        {active && (
          <StationDetails
            key={active.id}
            station={active}
            pollutant={pollutant}
            pollutantLabel={pollutantLabel}
          />
        )}
      </div>
    </section>
  );
}

function StationDetails({
  station,
  pollutant,
  pollutantLabel,
}: {
  station: IbocaStation;
  pollutant: Pollutant;
  pollutantLabel: string;
}) {
  const activeReading = reading(station, pollutant);
  const history = useStationHistory(station.id);
  const series = history.data
    ? seriesForPollutant(history.data, pollutant)
    : [];
  const updated = formatBogotaDate(stationReadingAt(station, pollutant));

  return (
    <aside
      className="station-panel relative overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white/75 p-6 backdrop-blur-md lg:sticky lg:top-6 lg:self-start md:p-8"
      aria-busy={history.status === "loading" || history.refreshing}
    >
      <div
        className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full opacity-40 blur-3xl"
        style={{ backgroundColor: `#${activeReading.color || FALLBACK_HEX}` }}
        aria-hidden
      />
      <p className="text-xs tracking-[0.2em] text-[var(--ink-muted)] uppercase">
        {station.abreviatura}
      </p>
      <h3 className="mt-2 font-display text-3xl text-[var(--ink)]">
        {station.nombre}
      </h3>
      <p className="mt-1 text-[var(--ink-soft)]">
        {station.localidad || "Bogotá D.C."}
      </p>

      <div className="mt-8 flex items-end gap-4">
        <p
          className="font-display text-7xl leading-none tabular-nums tracking-tight text-[var(--ink)] animate-rise"
          key={pollutant}
        >
          {activeReading.index ?? "—"}
        </p>
        <div className="pb-2">
          <p className="text-sm text-[var(--ink-muted)]">{pollutantLabel}</p>
          <p className="font-medium text-[var(--ink)]">
            {activeReading.label || "Sin clasificación"}
          </p>
        </div>
      </div>

      {activeReading.conc != null && activeReading.unit && (
        <p className="mt-6 text-[var(--ink-soft)]">
          Concentración{" "}
          <span className="font-medium text-[var(--ink)] tabular-nums">
            {activeReading.conc} {activeReading.unit}
          </span>
        </p>
      )}

      {updated && (
        <p className="mt-3 text-sm text-[var(--ink-muted)]">
          Actualizado {updated}
        </p>
      )}

      {history.status === "loading" && <StationHistorySkeleton />}
      {history.status === "error" && !history.data && (
        <StationHistoryMessage>
          No se pudo cargar el histórico
        </StationHistoryMessage>
      )}
      {history.data && series.length >= 2 && (
        <StationHistoryChart
          points={series}
          color={activeReading.color}
          label={pollutantLabel}
        />
      )}
      {history.status === "ok" && series.length < 2 && (
        <StationHistoryMessage>
          Sin histórico para este indicador
        </StationHistoryMessage>
      )}

      <dl className="mt-8 grid grid-cols-3 gap-3 border-t border-[var(--line)] pt-6 text-sm">
        <div>
          <dt className="text-[var(--ink-muted)]">PM2.5</dt>
          <dd className="mt-1 font-medium tabular-nums text-[var(--ink)]">
            {asNumber(station.pm25_iboca) ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--ink-muted)]">PM10</dt>
          <dd className="mt-1 font-medium tabular-nums text-[var(--ink)]">
            {asNumber(station.pm10_iboca) ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--ink-muted)]">O₃</dt>
          <dd className="mt-1 font-medium tabular-nums text-[var(--ink)]">
            {asNumber(station.O3_iboca) ?? "—"}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
