import { useState } from "react";
import { useNotice } from "@/components/Notice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTimeRange } from "@/lib/format";
import { ApiError } from "@/lib/problem";
import type { AttendanceStatus, Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAttendance, useSaveAttendance } from "./hooks";
import { STATUS_LABELS, STATUS_ORDER } from "./labels";

interface Props {
  session: Session | null;
  onClose: () => void;
}

/** Marcar la asistencia de una clase (quien la dicta y dirección). */
export function AttendanceDialog({ session, onClose }: Props) {
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {session && <AttendanceForm key={session.id} session={session} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

interface Edit {
  status: AttendanceStatus;
  agreedInAdvance: boolean;
}

function AttendanceForm({ session, onClose }: { session: Session; onClose: () => void }) {
  const notice = useNotice();
  const attendance = useAttendance(session.id);
  const save = useSaveAttendance(session.id);

  // Solo se guardan los cambios hechos aquí; lo ya marcado en el servidor no se reenvía.
  const [edits, setEdits] = useState<Record<string, Edit>>({});

  const rows = (attendance.data ?? []).map((record) => {
    const edit = edits[record.studentId];
    return {
      id: record.studentId,
      name: record.fullName,
      status: edit?.status ?? record.status ?? null,
      agreed: edit?.agreedInAdvance ?? record.agreedInAdvance,
    };
  });

  const unmarked = rows.filter((r) => r.status === null);
  const changes = Object.keys(edits).length;

  function setStatus(id: string, status: AttendanceStatus) {
    setEdits((prev) => ({
      ...prev,
      // "Acordada" solo existe con "Justificado": al cambiar de estado se descarta.
      [id]: { status, agreedInAdvance: status === "excused" ? (prev[id]?.agreedInAdvance ?? false) : false },
    }));
  }

  function setAgreed(id: string, agreedInAdvance: boolean) {
    setEdits((prev) => ({ ...prev, [id]: { status: "excused", agreedInAdvance } }));
  }

  function markAllPresent() {
    setEdits((prev) => {
      const next = { ...prev };
      for (const row of unmarked) next[row.id] = { status: "present", agreedInAdvance: false };
      return next;
    });
  }

  function submit() {
    save.mutate(
      Object.entries(edits).map(([studentId, edit]) => ({
        studentId,
        status: edit.status,
        agreedInAdvance: edit.agreedInAdvance,
      })),
      {
        onSuccess: () => {
          notice("Asistencia guardada.");
          onClose();
        },
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Asistencia</DialogTitle>
        <DialogDescription>
          {session.groupName} · {formatDate(session.startsAt)}, {formatTimeRange(session.startsAt, session.endsAt)}
        </DialogDescription>
      </DialogHeader>

      {attendance.isPending && (
        <div className="space-y-2" aria-busy>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {attendance.isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudo cargar la asistencia.{" "}
          <button className="underline" onClick={() => attendance.refetch()}>
            Reintentar
          </button>
        </p>
      )}

      {attendance.isSuccess && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {unmarked.length === 0 ? "Todos marcados." : `${unmarked.length} sin marcar`}
            </p>
            <Button variant="outline" size="sm" onClick={markAllPresent} disabled={unmarked.length === 0}>
              Todos presentes
            </Button>
          </div>

          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="rounded-md border p-3">
                <p className="mb-2 text-sm font-medium" id={`att-${row.id}`}>
                  {row.name}
                </p>
                <div role="radiogroup" aria-labelledby={`att-${row.id}`} className="flex flex-wrap gap-1.5">
                  {STATUS_ORDER.map((status) => {
                    const active = row.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setStatus(row.id, status)}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-sm transition-colors hover:bg-accent",
                          active &&
                            (status === "absent"
                              ? "border-destructive bg-destructive text-white hover:bg-destructive"
                              : "border-primary bg-primary text-primary-foreground hover:bg-primary"),
                        )}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    );
                  })}
                </div>

                {row.status === "excused" && (
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={row.agreed}
                      onChange={(e) => setAgreed(row.id, e.target.checked)}
                    />
                    Acordada de antemano con el profesor
                  </label>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {save.error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          {save.error instanceof ApiError ? save.error.message : "No se pudo guardar la asistencia."}
        </p>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={changes === 0 || save.isPending}>
          {save.isPending ? "Guardando…" : changes > 0 ? `Guardar (${changes})` : "Guardar"}
        </Button>
      </DialogFooter>
    </>
  );
}
