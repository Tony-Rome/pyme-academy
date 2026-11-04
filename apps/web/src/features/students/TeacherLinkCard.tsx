import { CalendarClock, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMinutes, formatSlot, formatTime } from "@/lib/format";
import type { PeriodHours, StudentTeacherLink } from "@/lib/types";

const KIND_LABELS = { individual: "Individual", group: "Grupal" } as const;

/** Un profesor con sus clases asignadas a un alumno y las horas del período. */
export function TeacherLinkCard({ link, headingLevel = 3 }: { link: StudentTeacherLink; headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as const;
  const instruments = [...new Set(link.groups.map((g) => g.instrument))];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <GraduationCap className="size-4 text-muted-foreground" aria-hidden />
          <CardTitle>
            <Heading>{link.teacher.fullName}</Heading>
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

function Stat({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={muted ? "text-muted-foreground" : "font-medium"}>{formatMinutes(value)}</dd>
    </div>
  );
}
