import { ArrowLeft } from "lucide-react";
import { Link, useLocation, useParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewer } from "@/features/viewer/useViewer";
import { ApiError } from "@/lib/problem";
import { useStudent } from "./hooks";
import { MonthNav } from "./MonthNav";
import { useMonth } from "./month";
import { TeacherLinkCard } from "./TeacherLinkCard";

/** Un alumno con sus profesores. Un profesor ve solo su propia relación con él. */
export function StudentDetailPage() {
  const { studentId } = useParams();
  const { ym, setYm } = useMonth();
  const student = useStudent(studentId, ym);
  const location = useLocation();
  const isDirector = useViewer().data?.activeRole === "director";

  const back = (
    <Link
      to={{ pathname: "/alumnos", search: location.search }}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Alumnos
    </Link>
  );

  if (student.isPending) {
    return (
      <div className="space-y-4" aria-busy>
        {back}
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (student.isError) {
    const notFound = student.error instanceof ApiError && student.error.status === 404;
    return (
      <div className="space-y-4">
        {back}
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          {notFound ? "No encontramos a este alumno." : "No se pudo cargar el alumno."}
        </p>
      </div>
    );
  }

  const { data } = student;
  return (
    <div className="space-y-4">
      {back}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{data.fullName}</h1>
          <p className="text-sm text-muted-foreground">{data.age} años</p>
        </div>
        <MonthNav ym={ym} onChange={setYm} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {data.links.map((link) => (
          <TeacherLinkCard
            key={link.teacher.id}
            link={link}
            headingLevel={2}
            teacherHref={
              isDirector ? { pathname: `/profesores/${link.teacher.id}`, search: location.search } : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
