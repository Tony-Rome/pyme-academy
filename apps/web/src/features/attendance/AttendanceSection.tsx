import { ClipboardCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Session } from "@/lib/types";
import { useAttendance } from "./hooks";
import { STATUS_LABELS } from "./labels";

interface Props {
  session: Session;
  onTake: (session: Session) => void;
}

/** Asistencia dentro del detalle de una clase: la ven todos, la marcan quien dicta y dirección. */
export function AttendanceSection({ session, onTake }: Props) {
  const started = new Date(session.startsAt).getTime() <= Date.now();
  const visible = started && session.status !== "cancelled";
  const attendance = useAttendance(session.id, visible);

  if (!visible) return null;

  const records = attendance.data ?? [];
  const anyMarked = records.some((r) => r.status);

  return (
    <section aria-labelledby={`att-title-${session.id}`} className="space-y-2">
      <h3 id={`att-title-${session.id}`} className="text-sm font-medium">
        Asistencia
      </h3>

      {attendance.isPending && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {attendance.isError && <p className="text-sm text-destructive">No se pudo cargar la asistencia.</p>}

      {attendance.isSuccess && records.length > 0 && (
        <ul className="space-y-1.5 text-sm">
          {records.map((r) => (
            <li key={r.studentId}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>{r.fullName}</span>
                <span className="flex items-center gap-1.5">
                  {r.agreedInAdvance && <Badge variant="outline">Acordada</Badge>}
                  {r.status ? (
                    <Badge variant={r.status === "absent" ? "destructive" : "secondary"}>
                      {STATUS_LABELS[r.status]}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Sin marcar</Badge>
                  )}
                </span>
              </div>
              {/* El servidor solo entrega la nota a profesores y dirección. */}
              {r.note && <p className="text-xs text-muted-foreground">Nota: {r.note}</p>}
            </li>
          ))}
        </ul>
      )}

      {attendance.isSuccess && !anyMarked && !session.canTakeAttendance && (
        <p className="text-sm text-muted-foreground">Todavía no se marcó la asistencia de esta clase.</p>
      )}

      {session.canTakeAttendance && (
        <Button variant={session.attendancePending ? "default" : "outline"} onClick={() => onTake(session)}>
          <ClipboardCheck data-icon="inline-start" />
          {anyMarked ? "Editar asistencia" : "Tomar asistencia"}
        </Button>
      )}
    </section>
  );
}
