import { useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatTime, formatTimeRange } from "@/lib/format";
import { ApiError } from "@/lib/problem";
import type { RescheduleOption, Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCreateRescheduleRequest, useRescheduleOptions } from "./hooks";

interface Props {
  session: Session | null;
  onClose: () => void;
}

export function RescheduleDialog({ session, onClose }: Props) {
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {session && <RescheduleForm key={session.id} session={session} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

const keyOf = (o: RescheduleOption) => `${o.startsAt}|${o.roomId ?? ""}`;
const dayKeyOf = (iso: string) => new Date(iso).toLocaleDateString("en-CA"); // AAAA-MM-DD en hora local

function RescheduleForm({ session, onClose }: { session: Session; onClose: () => void }) {
  const notice = useNotice();
  const options = useRescheduleOptions(session.id);
  const create = useCreateRescheduleRequest(session.id);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const days = useMemo(() => {
    const byDay = new Map<string, RescheduleOption[]>();
    for (const option of options.data ?? []) {
      const key = dayKeyOf(option.startsAt);
      byDay.set(key, [...(byDay.get(key) ?? []), option]);
    }
    return [...byDay.values()];
  }, [options.data]);

  const selected = options.data?.find((o) => keyOf(o) === selectedKey) ?? null;
  const error = create.error;

  function submit() {
    if (!selected) return;
    create.mutate(
      {
        proposedStartsAt: selected.startsAt,
        proposedEndsAt: selected.endsAt,
        proposedRoomId: selected.roomId ?? null,
        reason: reason.trim() || null,
      },
      {
        onSuccess: (request) => {
          notice(
            request.status === "approved"
              ? `La clase se movió al ${formatDate(request.proposedStartsAt).toLowerCase()} a las ${formatTime(request.proposedStartsAt)}. Se avisó a las familias.`
              : "Solicitud enviada. Te avisaremos cuando se responda.",
          );
          onClose();
        },
        onError: (e) => {
          // Si el horario dejó de estar libre, se elige de nuevo con la lista actualizada.
          if (e instanceof ApiError && e.status === 409) setSelectedKey(null);
        },
      },
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Cambiar horario</DialogTitle>
        <DialogDescription>
          {session.groupName} · hoy: {formatDate(session.startsAt)}, {formatTimeRange(session.startsAt, session.endsAt)}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium" id="options-label">
            Elige un horario libre
          </p>

          {options.isPending && (
            <div className="space-y-2" aria-busy>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {options.isError && (
            <p role="alert" className="text-sm text-destructive">
              No se pudieron cargar los horarios.{" "}
              <button className="underline" onClick={() => options.refetch()}>
                Reintentar
              </button>
            </p>
          )}

          {options.isSuccess && days.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay horarios libres en los próximos días. Consulta con la academia.
            </p>
          )}

          {options.isSuccess && days.length > 0 && (
            <div
              role="radiogroup"
              aria-labelledby="options-label"
              className="max-h-72 space-y-3 overflow-y-auto rounded-md border p-3"
            >
              {days.map((day) => (
                <div key={dayKeyOf(day[0].startsAt)}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">{formatDate(day[0].startsAt)}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {day.map((option) => {
                      const active = keyOf(option) === selectedKey;
                      return (
                        <button
                          key={keyOf(option)}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSelectedKey(keyOf(option))}
                          className={cn(
                            "rounded-md border px-2.5 py-1 text-sm tabular-nums transition-colors hover:bg-accent",
                            active && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                          )}
                        >
                          {formatTime(option.startsAt)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <p className="rounded-md bg-muted p-3 text-sm">
            <strong>Nuevo horario:</strong> {formatDate(selected.startsAt)}, {formatTimeRange(selected.startsAt, selected.endsAt)}
            {selected.roomName && <> · {selected.roomName}</>}
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="reschedule-reason">Motivo (opcional)</Label>
          <Textarea
            id="reschedule-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Por ejemplo: tengo una actividad en el colegio"
            rows={2}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            {error instanceof ApiError ? error.message : "No se pudo enviar el cambio. Inténtalo de nuevo."}
            {error instanceof ApiError && error.status === 409 && " Elige otro horario de la lista."}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={!selected || create.isPending}>
          {create.isPending ? "Enviando…" : "Confirmar cambio"}
        </Button>
      </DialogFooter>
    </>
  );
}
