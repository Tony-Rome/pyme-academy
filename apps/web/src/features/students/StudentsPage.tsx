import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewer } from "@/features/viewer/useViewer";
import { formatDate, formatMinutes, formatTime } from "@/lib/format";
import type { StudentOverview } from "@/lib/types";
import { useStudents } from "./hooks";
import { MonthNav } from "./MonthNav";
import { useMonth } from "./month";

/** Sin tildes ni mayúsculas, para que "sofia" encuentre a "Sofía". */
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function summarize(student: StudentOverview, isDirector: boolean) {
  const plannedMinutes = student.links.reduce(
    (sum, l) => sum + l.hours.scheduledMinutes + l.hours.completedMinutes,
    0,
  );
  const next = student.links
    .map((l) => l.nextSessionAt)
    .filter((d): d is string => !!d)
    .sort()[0];
  const what = isDirector
    ? student.links.map((l) => l.teacher.fullName).join(", ")
    : student.links.flatMap((l) => l.groups.map((g) => g.name)).join(" · ");
  return { plannedMinutes, next, what };
}

/** Lista de alumnos: del profesor que consulta, o todos si es dirección. */
export function StudentsPage() {
  const viewer = useViewer().data;
  const isDirector = viewer?.activeRole === "director";
  const { ym, setYm } = useMonth();
  const students = useStudents(ym);
  const location = useLocation();
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = normalize(query.trim());
    return (students.data ?? []).filter((s) => !needle || normalize(s.fullName).includes(needle));
  }, [students.data, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">{isDirector ? "Alumnos" : "Mis alumnos"}</h1>
        <MonthNav ym={ym} onChange={setYm} />
      </div>

      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="student-search">Buscar alumno</Label>
        <Input
          id="student-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre"
        />
      </div>

      {students.isPending && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {students.isError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          No se pudieron cargar los alumnos.{" "}
          <button className="underline" onClick={() => students.refetch()}>
            Reintentar
          </button>
        </p>
      )}

      {students.isSuccess && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {shown.length === 1 ? "1 alumno" : `${shown.length} alumnos`}
        </p>
      )}

      {students.isSuccess && shown.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          {query ? "Ningún alumno coincide con la búsqueda." : "Todavía no tienes alumnos asignados."}
        </p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((student) => {
          const { plannedMinutes, next, what } = summarize(student, isDirector);
          return (
            <li key={student.id}>
              <Link
                to={{ pathname: `/alumnos/${student.id}`, search: location.search }}
                className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-colors hover:bg-accent/40">
                  <CardHeader>
                    <CardTitle>{student.fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{student.age} años</p>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>{what}</p>
                    <p className="text-muted-foreground">
                      {next ? `Próxima: ${formatDate(next)}, ${formatTime(next)}` : "Sin clases próximas"}
                    </p>
                    <p className="text-muted-foreground">Horas del mes: {formatMinutes(plannedMinutes)}</p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
