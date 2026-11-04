import { CalendarClock, GraduationCap } from "lucide-react";
import { Link, type To } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMinutes, formatSlot, formatTime } from "@/lib/format";
import type { AttendanceSummary, PeriodHours, StudentTeacherLink } from "@/lib/types";

const KIND_LABELS = { individual: "Individual", group: "Grupal" } as const;

/** Un profesor con sus clases asignadas a un alumno y las horas del período. */
export function TeacherLinkCard({
  link,
  headingLevel = 3,
  teacherHref,
}: {
  link: StudentTeacherLink;
  headingLevel?: 2 | 3;
  /** Si se indica, el nombre del profesor lleva a su ficha (solo dirección). */
  teacherHref?: To;
}) {
  const Heading = `h${headingLevel}` as const;
  const instruments = [...new Set(link.groups.map((g) => g.instrument))];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <GraduationCap className="size-4 text-muted-foreground" aria-hidden />
          <CardTitle>
            <Heading>
              {teacherHref ? (
                <Link to={teacherHref} className="underline-offset-4 hover:underline">
                  {link.teacher.fullName}
                </Link>
              ) : (
                link.teacher.fullName
              )}
            </Heading>
          </CardTitle>
          {instruments.map((instrument) => (
            <Badge key={instrument} variant="outline">
              {instrument}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        <ul className="space-y-2">
          {link.groups.map((group) => (
            <li key={group.id} className="rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium">{group.name}</span>
                <Badge variant="secondary">{KIND_LABELS[group.kind]}</Badge>
                <span className="text-muted-foreground">{group.level}</span>
              </div>
              <p className="text-muted-foreground">
                {formatSlot(group.weekday, group.startTime, group.durationMinutes)}
                {group.roomName && ` · ${group.roomName}`}
              </p>
            </li>
          ))}
        </ul>

        <p className="flex items-center gap-2">
          <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          {link.nextSessionAt ? (
            <span>
              <span className="text-muted-foreground">Próxima clase:</span> {formatDate(link.nextSessionAt)} a las{" "}
              {formatTime(link.nextSessionAt)}
            </span>
          ) : (
            <span className="text-muted-foreground">No hay clases próximas programadas.</span>
          )}
        </p>

        <HoursSummary hours={link.hours} />
        <AttendanceBlock summary={link.attendance} />
      </CardContent>
    </Card>
  );
}

export function HoursSummary({ hours }: { hours: PeriodHours }) {
  const total = hours.scheduledMinutes + hours.completedMinutes;
  return (
    <div>
      <p className="mb-2 font-medium">Horas de clase del mes: {formatMinutes(total)}</p>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Realizadas" value={hours.completedMinutes} />
        <Stat label="Por realizar" value={hours.scheduledMinutes} />
        <Stat label="Canceladas" value={hours.cancelledMinutes} muted />
      </dl>
    </div>
  );
}

/** Asistencia del período. Lo "sin marcar" se muestra aparte: no se asume presente ni ausente. */
function AttendanceBlock({ summary }: { summary: AttendanceSummary }) {
  const attended = summary.present + summary.late;
  const marked = attended + summary.absent + summary.excused;
  const nothingYet = marked === 0 && summary.unmarked === 0;

  return (
    <div>
      <p className="mb-2 font-medium">Asistencia del mes</p>
      {nothingYet ? (
        <p className="text-muted-foreground">Todavía no hay clases realizadas este mes.</p>
      ) : (
        <>
          {marked > 0 && (
            <p className="mb-2">
              Asistió a {attended} de {marked} {marked === 1 ? "clase marcada" : "clases marcadas"} (
              {Math.round((attended / marked) * 100)} %).
            </p>
          )}
          <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <Stat label="Horas asistidas" value={summary.attendedMinutes} />
            <CountStat label="Ausencias" value={summary.absent} />
            <CountStat label="Justificadas" value={summary.excused} />
            <CountStat label="Sin marcar" value={summary.unmarked} muted />
          </dl>
        </>
      )}
    </div>
  );
}

function CountStat({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={muted || value === 0 ? "text-muted-foreground" : "font-medium"}>{value}</dd>
    </div>
  );
}

function Stat({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={muted ? "text-muted-foreground" : "font-medium"}>{formatMinutes(value)}</dd>
    </div>
  );
}
