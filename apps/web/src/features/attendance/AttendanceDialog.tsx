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
import { Input } from "@/components/ui/input";
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

interface Row {
  status: AttendanceStatus | null;
  agreedInAdvance: boolean;
  note: string;
}

function AttendanceForm({ session, onClose }: { session: Session; onClose: () => void }) {
  const notice = useNotice();
  const attendance = useAttendance(session.id);
  const save = useSaveAttendance(session.id);

  // Solo se guardan los alumnos que se tocaron aquí; lo ya marcado en el servidor no se reenvía.
  const [edits, setEdits] = useState<Record<string, Row>>({});

  const rows = (attendance.data ?? []).map((record) => ({
    id: record.studentId,
    name: record.fullName,
    ...(edits[record.studentId] ?? {
      status: record.status ?? null,
      agreedInAdvance: record.agreedInAdvance,
      note: record.note ?? "",
    }),
  }));

  const unmarked = rows.filter((r) => r.status === null);
  const changes = Object.keys(edits).length;

  const current = (id: string): Row => {
    const row = rows.find((r) => r.id === id)!;
    return { status: row.status, agreedInAdvance: row.agreedInAdvance, note: row.note };
  };
  const update = (id: string, change: Partial<Row>) => setEdits((prev) => ({ ...prev, [id]: { ...current(id), ...change } }));

  // "Acordada" solo existe con "Justificado": al cambiar de estado se descarta.
  const setStatus = (id: string, status: AttendanceStatus) =>
    update(id, { status, agreedInAdvance: status === "excused" ? current(id).agreedInAdvance : false });

  function markAllPresent() {
    setEdits((prev) => {
      const next = { ...prev };
      for (const row of unmarked) next[row.id] = { status: "present", agreedInAdvance: false, note: row.note };
      return next;
    });
  }

  function submit() {
    save.mutate(
      Object.entries(edits).flatMap(([studentId, edit]) =>
        edit.status
          ? [{ studentId, status: edit.status, agreedInAdvance: edit.agreedInAdvance, note: edit.note.trim() || null }]
          : [],
      ),
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
                      checked={row.agreedInAdvance}
                      onChange={(e) => update(row.id, { agreedInAdvance: e.target.checked })}
                    />
                    Acordada de antemano con el profesor
                  </label>
                )}

                {/* La nota necesita un estado: el servidor guarda estado y nota juntos. */}
                {row.status && (
                  <Input
                    className="mt-2"
                    aria-label={`Nota sobre ${row.name} (opcional)`}
                    placeholder="Nota (opcional)"
                    maxLength={200}
                    value={row.note}
                    onChange={(e) => update(row.id, { note: e.target.value })}
                  />
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
