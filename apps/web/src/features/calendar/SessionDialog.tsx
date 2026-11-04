import { CalendarClock, Clock, DoorOpen, GraduationCap, Users } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceSection } from "@/features/attendance/AttendanceSection";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatTimeRange } from "@/lib/format";
import type { Session } from "@/lib/types";

const STATUS_LABELS = {
  scheduled: "Programada",
  completed: "Realizada",
  cancelled: "Cancelada",
} as const;

interface Props {
  session: Session | null;
  onClose: () => void;
  onReschedule: (session: Session) => void;
  onTakeAttendance: (session: Session) => void;
}

export function SessionDialog({ session, onClose, onReschedule, onTakeAttendance }: Props) {
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {session && (
          <>
            <DialogHeader>
              <DialogTitle>{session.groupName}</DialogTitle>
              <DialogDescription>
                {formatDate(session.startsAt)} · {formatTimeRange(session.startsAt, session.endsAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              <Badge variant={session.status === "cancelled" ? "destructive" : "secondary"}>
                {STATUS_LABELS[session.status]}
              </Badge>
              <Badge variant="outline">{session.instrument}</Badge>
              {session.originalTeacherName && <Badge variant="outline">Con reemplazo</Badge>}
              {session.pendingRescheduleRequestId && (
                <Badge variant="outline">Cambio de horario pendiente</Badge>
              )}
            </div>

            {session.cancelReason && (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <strong>Motivo de la cancelación:</strong> {session.cancelReason}
              </p>
            )}

            <dl className="grid gap-3 text-sm">
              <Row icon={Clock} label="Horario">
                {formatTimeRange(session.startsAt, session.endsAt)}
              </Row>
              <Row icon={GraduationCap} label="Profesor">
                {session.teacherName}
                {session.originalTeacherName && (
                  <span className="text-muted-foreground"> (titular: {session.originalTeacherName})</span>
                )}
              </Row>
              <Row icon={DoorOpen} label="Sala">
                {session.roomName ?? "Sin sala asignada"}
              </Row>
              <Row icon={Users} label={session.students.length === 1 ? "Alumno" : "Alumnos"}>
                {session.students.length > 0
                  ? session.students.map((s) => s.fullName).join(", ")
                  : "Sin alumnos inscritos"}
              </Row>
            </dl>

            <AttendanceSection session={session} onTake={onTakeAttendance} />

            {session.pendingRescheduleRequestId && (
              <Link to="/solicitudes" className="text-sm underline" onClick={onClose}>
                Ver la solicitud de cambio pendiente
              </Link>
            )}

            {(session.canReschedule || session.rescheduleBlockedReason) && (
              <div className="space-y-1.5">
                <Button disabled={!session.canReschedule} onClick={() => onReschedule(session)}>
                  <CalendarClock data-icon="inline-start" />
                  Cambiar horario
                </Button>
                {session.rescheduleBlockedReason && (
                  <p className="text-xs text-muted-foreground">{session.rescheduleBlockedReason}</p>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}
