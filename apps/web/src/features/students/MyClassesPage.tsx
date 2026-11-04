import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "./hooks";
import { MonthNav } from "./MonthNav";
import { useMonth } from "./month";
import { TeacherLinkCard } from "./TeacherLinkCard";

/** Vista de la familia: por cada alumno, sus profesores con las clases y horas de cada uno. */
export function MyClassesPage() {
  const { ym, setYm } = useMonth();
  const students = useStudents(ym);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Mis clases</h1>
        <MonthNav ym={ym} onChange={setYm} />
      </div>

      {students.isPending && (
        <div className="space-y-3" aria-busy>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {students.isError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          No se pudieron cargar las clases.{" "}
          <button className="underline" onClick={() => students.refetch()}>
            Reintentar
          </button>
        </p>
      )}

      {students.isSuccess && students.data.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          Todavía no hay alumnos vinculados a tu cuenta. Consulta con la academia.
        </p>
      )}

      {students.data?.map((student) => (
        <section key={student.id} aria-labelledby={`student-${student.id}`} className="space-y-3">
          <div>
            <h2 id={`student-${student.id}`} className="text-base font-semibold">
              {student.fullName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {student.age} años ·{" "}
              {student.links.length === 1 ? "1 profesor" : `${student.links.length} profesores`}
            </p>
          </div>

          {student.links.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tiene clases asignadas.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {student.links.map((link) => (
                <TeacherLinkCard key={link.teacher.id} link={link} headingLevel={3} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
