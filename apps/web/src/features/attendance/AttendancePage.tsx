import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthNav } from "@/features/students/MonthNav";
import { useMonth } from "@/features/students/month";
import { useViewer } from "@/features/viewer/useViewer";
import { downloadCsv } from "@/lib/csv";
import { formatDate, formatMinutes } from "@/lib/format";
import type { AttendanceGroupBy, AttendanceReportRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAttendanceAlerts, useAttendanceReport } from "./reportHooks";

const GROUP_BY_LABELS: Record<AttendanceGroupBy, string> = {
  student: "Alumno",
  group: "Grupo",
  teacher: "Profesor",
};

type Order = "name" | "rate";

/** Porcentaje entero o null si no hay clases marcadas. */
const percent = (row: AttendanceReportRow) =>
  row.attendanceRate === null || row.attendanceRate === undefined ? null : Math.round(row.attendanceRate * 100);

/** Alertas de ausencias seguidas y reporte de asistencia (dirección y profesores). */
export function AttendancePage() {
  const { ym, setYm } = useMonth();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Asistencia</h1>
        <MonthNav ym={ym} onChange={setYm} />
      </div>
      <Alerts />
      <Report ym={ym} />
    </div>
  );
}

function Alerts() {
  const alerts = useAttendanceAlerts(true);

  return (
    <section aria-labelledby="alerts-title" className="space-y-3">
      <div>
        <h2 id="alerts-title" className="text-base font-semibold">
          Alertas
        </h2>
        <p className="text-sm text-muted-foreground">
          Alumnos con 3 o más ausencias seguidas en un grupo. Una clase justificada, o a la que asistió, corta la racha;
          las clases sin marcar no cuentan.
        </p>
      </div>

      {alerts.isPending && <Skeleton className="h-24 w-full" />}
      {alerts.isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar las alertas.{" "}
          <button className="underline" onClick={() => alerts.refetch()}>
            Reintentar
          </button>
        </p>
      )}
      {alerts.isSuccess && alerts.data.length === 0 && (
        <p className="rounded-md border p-4 text-sm text-muted-foreground">
          Sin alertas: nadie acumula 3 ausencias seguidas.
        </p>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {alerts.data?.map((alert) => (
          <li key={`${alert.student.id}-${alert.groupId}`}>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>
                    <Link to={`/alumnos/${alert.student.id}`} className="underline-offset-4 hover:underline">
                      {alert.student.fullName}
                    </Link>
                  </CardTitle>
                  <Badge variant="destructive">{alert.consecutiveAbsences} ausencias seguidas</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {alert.groupName} · {alert.teacher.fullName}
                </p>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Última ausencia:</span> {formatDate(alert.lastAbsenceAt)}
                </p>
                <p>
                  <span className="text-muted-foreground">Última vez que asistió:</span>{" "}
                  {alert.lastAttendedAt ? formatDate(alert.lastAttendedAt) : "sin asistencia marcada"}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Report({ ym }: { ym: string }) {
  const isDirector = useViewer().data?.activeRole === "director";
  const [groupBy, setGroupBy] = useState<AttendanceGroupBy>("student");
  const [order, setOrder] = useState<Order>("name");
  const report = useAttendanceReport(ym, groupBy);

  // Un profesor solo ve su propia fila al agrupar por profesor: la opción sobra.
  const options = (Object.keys(GROUP_BY_LABELS) as AttendanceGroupBy[]).filter((k) => isDirector || k !== "teacher");

  const rows = useMemo(() => {
    const list = [...(report.data ?? [])];
    if (order === "rate") {
      // Menor asistencia primero; sin clases marcadas, al final.
      list.sort((a, b) => (percent(a) ?? 101) - (percent(b) ?? 101) || a.name.localeCompare(b.name, "es"));
    }
    return list;
  }, [report.data, order]);

  function exportCsv() {
    const header = [
      GROUP_BY_LABELS[groupBy],
      "Presentes",
      "Atrasos",
      "Ausentes",
      "Justificadas",
      "Sin marcar",
      "Minutos asistidos",
      "% asistencia",
    ];
    const body = rows.map((r) => [
      r.name,
      r.summary.present,
      r.summary.late,
      r.summary.absent,
      r.summary.excused,
      r.summary.unmarked,
      r.summary.attendedMinutes,
      percent(r),
    ]);
    downloadCsv(`asistencia-${ym}-por-${GROUP_BY_LABELS[groupBy].toLowerCase()}.csv`, [header, ...body]);
  }

  return (
    <section aria-labelledby="report-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="report-title" className="text-base font-semibold">
            Reporte del mes
          </h2>
          <p className="text-sm text-muted-foreground">
            % de asistencia = (presentes + atrasos) ÷ (presentes + atrasos + ausentes + justificadas). Las clases sin
            marcar no cuentan.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download data-icon="inline-start" />
          Descargar CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-1" role="group" aria-label="Agrupar por">
          <span className="mr-1 text-sm text-muted-foreground">Ver por</span>
          {options.map((key) => (
            <Button
              key={key}
              variant={groupBy === key ? "secondary" : "outline"}
              aria-pressed={groupBy === key}
              onClick={() => setGroupBy(key)}
            >
              {GROUP_BY_LABELS[key]}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Ordenar">
          <span className="mr-1 text-sm text-muted-foreground">Orden</span>
          <Button variant={order === "name" ? "secondary" : "outline"} aria-pressed={order === "name"} onClick={() => setOrder("name")}>
            Nombre
          </Button>
          <Button variant={order === "rate" ? "secondary" : "outline"} aria-pressed={order === "rate"} onClick={() => setOrder("rate")}>
            Menor asistencia
          </Button>
        </div>
      </div>

      {report.isPending && <Skeleton className="h-48 w-full" />}
      {report.isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudo cargar el reporte.{" "}
          <button className="underline" onClick={() => report.refetch()}>
            Reintentar
          </button>
        </p>
      )}
      {report.isSuccess && rows.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">No hay datos para este período.</p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">
              Asistencia del mes agrupada por {GROUP_BY_LABELS[groupBy].toLowerCase()}
            </caption>
            <thead className="bg-muted text-left">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  {GROUP_BY_LABELS[groupBy]}
                </th>
                {["Presentes", "Atrasos", "Ausentes", "Justificadas", "Sin marcar", "Horas asistidas", "% asistencia"].map(
                  (title) => (
                    <th key={title} scope="col" className="px-3 py-2 text-right font-medium">
                      {title}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = percent(r);
                return (
                  <tr key={r.id} className="border-t">
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      {groupBy === "student" ? (
                        <Link to={`/alumnos/${r.id}`} className="underline-offset-4 hover:underline">
                          {r.name}
                        </Link>
                      ) : (
                        r.name
                      )}
                    </th>
                    <Num value={r.summary.present} />
                    <Num value={r.summary.late} />
                    <Num value={r.summary.absent} />
                    <Num value={r.summary.excused} />
                    <Num value={r.summary.unmarked} muted />
                    <td className="px-3 py-2 text-right tabular-nums">{formatMinutes(r.summary.attendedMinutes)}</td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right font-medium tabular-nums",
                        pct !== null && pct < 75 && "text-destructive",
                      )}
                    >
                      {pct === null ? "—" : `${pct} %`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Num({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <td className={cn("px-3 py-2 text-right tabular-nums", (muted || value === 0) && "text-muted-foreground")}>
      {value}
    </td>
  );
}
