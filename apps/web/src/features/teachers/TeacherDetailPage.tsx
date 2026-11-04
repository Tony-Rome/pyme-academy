import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthNav } from "@/features/students/MonthNav";
import { useMonth } from "@/features/students/month";
import { HoursSummary } from "@/features/students/TeacherLinkCard";
import { formatMinutes, formatSlot } from "@/lib/format";
import { ApiError } from "@/lib/problem";
import type { TeacherGroup } from "@/lib/types";
import { useTeacher } from "./hooks";

const KIND_LABELS = { individual: "Individual", group: "Grupal" } as const;

/** Un profesor con sus grupos, alumnos, horas y reemplazos (solo dirección). */
export function TeacherDetailPage() {
  const { teacherId } = useParams();
  const { ym, setYm } = useMonth();
  const teacher = useTeacher(teacherId, ym);
  const location = useLocation();

  const back = (
    <Link
      to={{ pathname: "/profesores", search: location.search }}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Profesores
    </Link>
  );

  if (teacher.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        {back}
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (teacher.isError) {
    const notFound = teacher.error instanceof ApiError && teacher.error.status === 404;
    return (
      <div className="space-y-4">
        {back}
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          {notFound ? "No encontramos a este profesor." : "No se pudo cargar el profesor."}
        </p>
      </div>
    );
  }

  const { teacher: summary, groups, substitutions } = teacher.data;

  return (
    <div className="space-y-4">
      {back}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{summary.fullName}</h1>
          <div className="flex flex-wrap gap-1.5">
            {summary.instruments.map((instrument) => (
              <Badge key={instrument} variant="outline">
                {instrument}
              </Badge>
            ))}
          </div>
        </div>
        <MonthNav ym={ym} onChange={setYm} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Resumen del mes</h2>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {summary.studentCount} {summary.studentCount === 1 ? "alumno" : "alumnos"} ·{" "}
            {summary.groupCount} {summary.groupCount === 1 ? "grupo" : "grupos"}
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <HoursSummary hours={summary.hours} />
          <p className="text-muted-foreground">
            Reemplazos: cubrió {formatMinutes(substitutions.coveredMinutes)} de otros profesores · le cubrieron{" "}
            {formatMinutes(substitutions.replacedMinutes)} de sus clases.
          </p>
        </CardContent>
      </Card>

      <section aria-labelledby="groups-heading" className="space-y-3">
        <h2 id="groups-heading" className="text-base font-semibold">
          Grupos
        </h2>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tiene grupos propios. Sus horas vienen de reemplazos.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {groups.map((g) => (
              <GroupCard key={g.group.id} item={g} search={location.search} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GroupCard({ item, search }: { item: TeacherGroup; search: string }) {
  const { group, students, capacity, hours } = item;
  const planned = hours.scheduledMinutes + hours.completedMinutes;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>
            <h3>{group.name}</h3>
          </CardTitle>
          <Badge variant="secondary">{KIND_LABELS[group.kind]}</Badge>
          <span className="text-sm text-muted-foreground">{group.level}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatSlot(group.weekday, group.startTime, group.durationMinutes)}
          {group.roomName && ` · ${group.roomName}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="mb-1 font-medium">
            Alumnos ({students.length} de {capacity})
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {students.map((student) => (
              <li key={student.id}>
                <Link
                  to={{ pathname: `/alumnos/${student.id}`, search }}
                  className="inline-block rounded-md border px-2 py-0.5 hover:bg-accent"
                >
                  {student.fullName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground">
          Horas del grupo este mes (incluye reemplazos): {formatMinutes(planned)} ({formatMinutes(hours.completedMinutes)} realizadas ·{" "}
          {formatMinutes(hours.scheduledMinutes)} por realizar
          {hours.cancelledMinutes > 0 && ` · ${formatMinutes(hours.cancelledMinutes)} canceladas`})
        </p>
      </CardContent>
    </Card>
  );
}
