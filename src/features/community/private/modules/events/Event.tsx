// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\Event.tsx
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";

/** ---------- Types & helpers ---------- */
type CalEvent = {
  id: string;
  title: string;
  date: string; // ISO "YYYY-MM-DD"
  time: string; // "HH:mm"
  location?: string;
  kind?: "webinar" | "atelier" | "meetup";
};

const KINDS: Record<NonNullable<CalEvent["kind"]>, string> = {
  webinar: "Webinar",
  atelier: "Atelier",
  meetup: "Meetup",
};

/** Couleurs (bg/text) par type d’événement */
const KIND_STYLES: Record<
  NonNullable<CalEvent["kind"]>,
  { badge: string; pill: string }
> = {
  webinar: {
    badge:
      "bg-violet-600/14 text-violet-700 dark:text-violet-300 ring-violet-600/20",
    pill: "bg-violet-600/10 text-violet-700 dark:text-violet-300",
  },
  atelier: {
    badge:
      "bg-emerald-600/14 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20",
    pill: "bg-emerald-600/10 text-emerald-700 dark:text-emerald-300",
  },
  meetup: {
    badge:
      "bg-fuchsia-600/14 text-fuchsia-700 dark:text-fuchsia-300 ring-fuchsia-600/20",
    pill: "bg-fuchsia-600/10 text-fuchsia-700 dark:text-fuchsia-300",
  },
};

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addMonths(d: Date, n: number) {
  const dd = new Date(d);
  dd.setMonth(dd.getMonth() + n);
  return dd;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
/** Lundi = 1er jour */
function startOfWeekMonday(d: Date) {
  const day = (d.getDay() + 6) % 7;
  const s = new Date(d);
  s.setDate(d.getDate() - day);
  s.setHours(0, 0, 0, 0);
  return s;
}
function buildMonthMatrix(current: Date): Date[] {
  const start = startOfWeekMonday(startOfMonth(current));
  const matrix: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    matrix.push(d);
  }
  return matrix;
}
function formatMonthLabel(d: Date) {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** ---------- Démo data (à brancher sur API ensuite) ---------- */
const SEED_EVENTS: CalEvent[] = [
  {
    id: "e1",
    title: "Live Mentor — Lancer sa boutique",
    date: toISO(new Date()),
    time: "18:00",
    location: "En ligne",
    kind: "webinar",
  },
  {
    id: "e2",
    title: "Atelier — UI/UX pour dashboards",
    date: toISO(new Date()),
    time: "19:30",
    location: "Discord",
    kind: "atelier",
  },
  {
    id: "e3",
    title: "Webinar — Analytics & Consent",
    date: toISO(new Date()),
    time: "17:00",
    location: "Google Meet",
    kind: "webinar",
  },
  {
    id: "e4",
    title: "Meetup — Vendeurs Marketplace",
    date: toISO(new Date()),
    time: "09:30",
    location: "Abidjan",
    kind: "meetup",
  },
  {
    id: "e5",
    title: "Atelier — SEO Produits",
    date: toISO(addMonths(new Date(), 1)),
    time: "16:00",
    location: "En ligne",
    kind: "atelier",
  },
  {
    id: "e6",
    title: "Webinar — Growth sur TikTok",
    date: toISO(addMonths(new Date(), 1)),
    time: "18:30",
    location: "Zoom",
    kind: "webinar",
  },
];

export default function EventTab() {
  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => toISO(today), [today]);

  const [month, setMonth] = useState<Date>(startOfMonth(today));
  const [selected, setSelected] = useState<Date>(today);

  const events = SEED_EVENTS;

  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const arr = map.get(e.date) || [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return map;
  }, [events]);

  const grid = useMemo(() => buildMonthMatrix(month), [month]);

  /** Prochains événements (5 à venir) */
  const upcoming = useMemo(() => {
    return events
      .filter((e) => e.date >= todayISO)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 5);
  }, [events, todayISO]);

  const selectedISO = toISO(selected);
  const eventsOfSelected = (byDate.get(selectedISO) || []).sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  return (
    <section className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-semibold">Événements</h2>
        </div>

        {/* Toolbar desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[170px] text-center text-sm font-semibold capitalize">
            {formatMonthLabel(month)}
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grille responsive : calendrier + panneau latéral */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px] xl:grid-cols-[minmax(0,1fr),420px]">
        {/* --------- Calendrier --------- */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
          {/* Toolbar mobile */}
          <div className="flex items-center justify-between gap-2 px-4 py-3 sm:hidden border-b border-slate-100 dark:border-slate-800">
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-black/10 dark:ring-white/10"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              aria-label="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold capitalize">
              {formatMonthLabel(month)}
            </div>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-black/10 dark:ring-white/10"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="bg-white dark:bg-slate-900 py-2 text-center text-[12px] font-medium text-slate-500"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Jours (6 lignes) */}
          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800">
            {grid.map((d) => {
              const dISO = toISO(d);
              const inMonth = d.getMonth() === month.getMonth();
              const isToday = isSameDay(d, today);
              const has = byDate.has(dISO);
              const isSelected = isSameDay(d, selected);
              const list = (byDate.get(dISO) || []).slice(0, 3);

              return (
                <button
                  key={dISO}
                  onClick={() => setSelected(d)}
                  className={`relative min-h-[88px] sm:min-h-[96px] bg-white p-2 text-left transition dark:bg-slate-900
                    ${inMonth ? "" : "opacity-45"}
                    ${
                      isSelected
                        ? "ring-2 ring-violet-500 z-10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  title={
                    has
                      ? list.map((e) => `${e.time} ${e.title}`).join("\n")
                      : ""
                  }
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[12px] font-semibold ${
                        isToday
                          ? "text-violet-600"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-violet-600/10 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:text-violet-300">
                        Aujourd’hui
                      </span>
                    )}
                  </div>

                  {/* pastilles temps + couleur par type */}
                  {has && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {list.map((e) => (
                        <span
                          key={e.id}
                          className={`inline-flex w-full items-center gap-1.5 rounded-md px-1.5 py-[3px] text-[10px] font-medium ring-1
                          ${
                            e.kind
                              ? KIND_STYLES[e.kind].badge
                              : "bg-slate-200/60 text-slate-700 ring-slate-300/60 dark:bg-slate-700/40 dark:text-slate-300"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {e.time}
                          <span className="truncate">· {e.title}</span>
                        </span>
                      ))}
                      {(byDate.get(dISO) || []).length > 3 && (
                        <span className="inline-block rounded-md bg-slate-100 px-1.5 py-[3px] text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          +{(byDate.get(dISO) || []).length - 3} autres
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Légende */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
            <Legend color={KIND_STYLES.webinar.pill} label="Webinar" />
            <Legend color={KIND_STYLES.atelier.pill} label="Atelier" />
            <Legend color={KIND_STYLES.meetup.pill} label="Meetup" />
          </div>
        </div>

        {/* --------- Panneau latéral : Jour sélectionné + Prochains --------- */}
        <aside className="space-y-4">
          {/* Jour sélectionné */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="text-sm font-semibold">
                {selected.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </div>
              <div className="text-xs text-slate-500">
                {eventsOfSelected.length} évènement
                {eventsOfSelected.length > 1 ? "s" : ""}
              </div>
            </div>

            <div className="p-4 space-y-3 max-h-[280px] overflow-auto">
              {eventsOfSelected.length === 0 ? (
                <div className="text-sm text-slate-500">
                  Aucun événement pour ce jour.
                </div>
              ) : (
                eventsOfSelected.map((e) => <DayCard key={e.id} e={e} />)
              )}
            </div>
          </div>

          {/* Prochains événements */}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="text-sm font-semibold">À venir</div>
              <div className="text-xs text-slate-500">Les 5 imminents</div>
            </div>

            <div className="p-4 space-y-3 max-h-[320px] overflow-auto">
              {upcoming.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl bg-slate-50 p-3 ring-1 ring-black/5 hover:bg-slate-100 transition dark:bg-slate-800/60 dark:ring-white/10 dark:hover:bg-slate-800"
                >
                  <div className="text-sm font-medium">{e.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(e.date).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {e.time}
                    </span>
                    {e.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {e.location}
                      </span>
                    )}
                    {e.kind && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          KIND_STYLES[e.kind].pill
                        }`}
                      >
                        {KINDS[e.kind]}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {upcoming.length === 0 && (
                <div className="text-sm text-slate-500">
                  Aucun événement planifié.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

/** ---------- UI petits blocs ---------- */
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[11px] ${color}`}
    >
      <span className="inline-block h-2 w-2 rounded-full bg-current opacity-70" />
      {label}
    </div>
  );
}

function DayCard({ e }: { e: CalEvent }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-black/5 dark:bg-slate-800/60 dark:ring-white/10">
      <div className="text-sm font-medium">
        {e.title}
        {e.kind && (
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              KIND_STYLES[e.kind].pill
            }`}
          >
            {KINDS[e.kind]}
          </span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {e.time}
        </span>
        {e.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {e.location}
          </span>
        )}
      </div>
    </div>
  );
}
