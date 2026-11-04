import type { DatesSetArg, EventClickArg, EventContentArg, EventInput } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { instrumentKey } from "@/lib/format";
import type { Session } from "@/lib/types";
import { RescheduleDialog } from "@/features/reschedule/RescheduleDialog";
import { useViewer } from "@/features/viewer/useViewer";
import { CalendarFilters } from "./CalendarFilters";
import { SessionDialog } from "./SessionDialog";
import { useSessions, type DateRange, type SessionFilters } from "./useSessions";

type ViewName = "timeGridWeek" | "dayGridMonth" | "listWeek";

const VIEWS: { name: ViewName; label: string }[] = [
  { name: "timeGridWeek", label: "Semana" },
  { name: "dayGridMonth", label: "Mes" },
  { name: "listWeek", label: "Lista" },
];

const isPhone = () => window.matchMedia("(max-width: 767px)").matches;

function toEvent(s: Session): EventInput {
  return {
    id: s.id,
    title: s.groupName,
    start: s.startsAt,
    end: s.endsAt,
    classNames: [`inst-${instrumentKey(s.instrument)}`, ...(s.status === "cancelled" ? ["session-cancelled"] : [])],
    extendedProps: { session: s },
  };
}

function studentsLabel(s: Session): string {
  if (s.students.length === 0) return "";
  if (s.students.length <= 2) return s.students.map((x) => x.fullName.split(" ")[0]).join(", ");
  return `${s.students.length} alumnos`;
}

function renderEvent(arg: EventContentArg, showTeacher: boolean) {
  const s = arg.event.extendedProps.session as Session;
  const type = arg.view.type;

  if (type === "listWeek") {
    const details = [s.roomName ?? "Sin sala", s.teacherName, studentsLabel(s)].filter(Boolean).join(" · ");
    return (
      <div>
        <div className="session-title font-medium">
          {s.groupName}
          {s.status === "cancelled" && " (cancelada)"}
        </div>
        <div className="text-xs text-muted-foreground">{details}</div>
      </div>
    );
  }

  if (type === "dayGridMonth") {
    return (
      <div className="flex gap-1 overflow-hidden text-xs">
        <span className="shrink-0 tabular-nums">{arg.timeText}</span>
        <span className="session-title truncate font-medium">{s.groupName}</span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden px-1 text-xs leading-tight">
      <div className="session-title truncate font-medium">{s.groupName}</div>
      <div className="truncate text-muted-foreground">{arg.timeText}</div>
      <div className="truncate text-muted-foreground">
        {[s.roomName, showTeacher ? s.teacherName.split(" ")[0] : null].filter(Boolean).join(" · ")}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const calendar = useRef<FullCalendar>(null);
  const [range, setRange] = useState<DateRange>();
  const [title, setTitle] = useState("");
  const [view, setView] = useState<ViewName>(() => (isPhone() ? "listWeek" : "timeGridWeek"));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const role = useViewer().data?.activeRole;
  const isDirector = role === "director";
  const showTeacher = role !== "teacher";

  // Los filtros de dirección viajan en la dirección (?profesor=…&sala=…).
  const [params, setParams] = useSearchParams();
  const filters = useMemo<SessionFilters>(
    () =>
      isDirector
        ? { teacherId: params.get("profesor") ?? undefined, roomId: params.get("sala") ?? undefined }
        : {},
    [isDirector, params],
  );
  const onFiltersChange = useCallback(
    (next: SessionFilters) =>
      setParams(
        (prev) => {
          const copy = new URLSearchParams(prev);
          for (const [key, value] of [["profesor", next.teacherId], ["sala", next.roomId]] as const) {
            if (value) copy.set(key, value);
            else copy.delete(key);
          }
          return copy;
        },
        { replace: true },
      ),
    [setParams],
  );

  const sessions = useSessions(range, filters);
  const eventContent = useCallback((arg: EventContentArg) => renderEvent(arg, showTeacher), [showTeacher]);
  const events = useMemo(() => (sessions.data ?? []).map(toEvent), [sessions.data]);
  const selected = sessions.data?.find((s) => s.id === selectedId) ?? null;
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const rescheduling = sessions.data?.find((s) => s.id === reschedulingId) ?? null;

  // La vista de semana muestra solo las horas con clases (con un margen), para no
  // dejar la mañana vacía en academias que enseñan por la tarde.
  const { slotMinTime, slotMaxTime } = useMemo(() => {
    const starts = (sessions.data ?? []).map((s) => new Date(s.startsAt).getHours());
    const ends = (sessions.data ?? []).map((s) => {
      const end = new Date(s.endsAt);
      return end.getHours() + (end.getMinutes() > 0 ? 1 : 0);
    });
    const min = Math.max(0, Math.min(15, ...starts) - 1);
    const max = Math.min(24, Math.max(19, ...ends) + 1);
    return {
      slotMinTime: `${String(min).padStart(2, "0")}:00:00`,
      slotMaxTime: `${String(max).padStart(2, "0")}:00:00`,
    };
  }, [sessions.data]);

  // FullCalendar vuelve a llamar a datesSet cuando cambian sus props; si el estado
  // se reemplazara con un objeto nuevo cada vez, se produciría un bucle de renders.
  const onDatesSet = useCallback((arg: DatesSetArg) => {
    const text = arg.view.title;
    setTitle(text.charAt(0).toUpperCase() + text.slice(1));
    const from = arg.start.toISOString();
    const to = arg.end.toISOString();
    setRange((prev) => (prev?.from === from && prev.to === to ? prev : { from, to }));
  }, []);

  const onEventClick = useCallback((arg: EventClickArg) => setSelectedId(arg.event.id), []);

  function changeView(name: ViewName) {
    setView(name);
    calendar.current?.getApi().changeView(name);
  }

  return (
    <div className="space-y-3">
      {isDirector && <CalendarFilters value={filters} onChange={onFiltersChange} count={sessions.data?.length} />}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Anterior" onClick={() => calendar.current?.getApi().prev()}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" aria-label="Siguiente" onClick={() => calendar.current?.getApi().next()}>
            <ChevronRight />
          </Button>
          <Button variant="outline" onClick={() => calendar.current?.getApi().today()}>
            Hoy
          </Button>
        </div>

        <h1
          className="order-first basis-full text-lg font-semibold sm:order-none sm:min-w-0 sm:flex-1 sm:basis-auto sm:truncate"
          aria-live="polite"
        >
          {title}
        </h1>

        <div className="flex gap-1" role="group" aria-label="Vista del calendario">
          {VIEWS.map((v) => (
            <Button
              key={v.name}
              variant={view === v.name ? "secondary" : "outline"}
              aria-pressed={view === v.name}
              onClick={() => changeView(v.name)}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      {sessions.isError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          No se pudieron cargar las clases.{" "}
          <button className="underline" onClick={() => sessions.refetch()}>
            Reintentar
          </button>
        </p>
      )}

      <div aria-busy={sessions.isFetching} className={sessions.isFetching ? "opacity-80 transition-opacity" : ""}>
        <FullCalendar
          ref={calendar}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView={view}
          headerToolbar={false}
          locales={[esLocale]}
          locale="es"
          firstDay={1}
          height="auto"
          allDaySlot={false}
          slotMinTime={slotMinTime}
          slotMaxTime={slotMaxTime}
          slotDuration="00:30:00"
          nowIndicator
          eventDisplay="block"
          displayEventEnd
          events={events}
          datesSet={onDatesSet}
          eventContent={eventContent}
          eventClick={onEventClick}
          noEventsContent="No hay clases en este período"
        />
      </div>

      <SessionDialog
        session={selected}
        onClose={() => setSelectedId(null)}
        onReschedule={(s) => {
          setSelectedId(null);
          setReschedulingId(s.id);
        }}
      />
      <RescheduleDialog session={rescheduling} onClose={() => setReschedulingId(null)} />
    </div>
  );
}
