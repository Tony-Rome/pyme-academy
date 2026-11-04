import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthNav } from "@/features/students/MonthNav";
import { useMonth } from "@/features/students/month";
import { formatDate, formatMinutes, formatTime } from "@/lib/format";
import { useTeachers } from "./hooks";

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Todos los profesores de la academia (solo dirección). */
export function TeachersPage() {
  const { ym, setYm } = useMonth();
  const teachers = useTeachers(ym);
  const location = useLocation();
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = normalize(query.trim());
    return (teachers.data ?? []).filter((t) => !needle || normalize(t.fullName).includes(needle));
  }, [teachers.data, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Profesores</h1>
        <MonthNav ym={ym} onChange={setYm} />
      </div>

      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="teacher-search">Buscar profesor</Label>
        <Input
          id="teacher-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre"
        />
      </div>

      {teachers.isPending && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      )}

      {teachers.isError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          No se pudieron cargar los profesores.{" "}
          <button className="underline" onClick={() => teachers.refetch()}>
            Reintentar
          </button>
        </p>
      )}

      {teachers.isSuccess && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {shown.length === 1 ? "1 profesor" : `${shown.length} profesores`}
        </p>
      )}

      {teachers.isSuccess && shown.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">Ningún profesor coincide con la búsqueda.</p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((teacher) => {
          const hours = teacher.hours.scheduledMinutes + teacher.hours.completedMinutes;
          return (
            <li key={teacher.id}>
              <Link
                to={{ pathname: `/profesores/${teacher.id}`, search: location.search }}
                className="block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-colors hover:bg-accent/40">
                  <CardHeader>
                    <CardTitle>{teacher.fullName}</CardTitle>
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.instruments.map((instrument) => (
                        <Badge key={instrument} variant="outline">
                          {instrument}
                        </Badge>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>
                      {teacher.groupCount === 0
                        ? "Sin grupos propios"
                        : `${teacher.studentCount} ${teacher.studentCount === 1 ? "alumno" : "alumnos"} · ${teacher.groupCount} ${teacher.groupCount === 1 ? "grupo" : "grupos"}`}
                    </p>
                    <p className="text-muted-foreground">Horas dictadas del mes: {formatMinutes(hours)}</p>
                    <p className="text-muted-foreground">
                      {teacher.nextSessionAt
                        ? `Próxima: ${formatDate(teacher.nextSessionAt)}, ${formatTime(teacher.nextSessionAt)}`
                        : "Sin clases próximas"}
                    </p>
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
