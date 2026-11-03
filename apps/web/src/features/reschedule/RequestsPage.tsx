import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNotice } from "@/components/Notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate, formatTimeRange } from "@/lib/format";
import { ApiError } from "@/lib/problem";
import type { RescheduleRequest, RescheduleStatus } from "@/lib/types";
import { useDecideRequest, useRequests } from "./hooks";

const STATUS_LABELS: Record<RescheduleStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  expired: "Vencida",
};

type Tab = "pending" | "history";

export function RequestsPage() {
  const requests = useRequests();
  const [tab, setTab] = useState<Tab>("pending");

  const all = requests.data ?? [];
  const pending = all.filter((r) => r.status === "pending");
  const history = all.filter((r) => r.status !== "pending");
  const shown = tab === "pending" ? pending : history;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">Solicitudes de cambio</h1>
        <div className="flex gap-1" role="group" aria-label="Filtrar solicitudes">
          <Button variant={tab === "pending" ? "secondary" : "outline"} aria-pressed={tab === "pending"} onClick={() => setTab("pending")}>
            Pendientes ({pending.length})
          </Button>
          <Button variant={tab === "history" ? "secondary" : "outline"} aria-pressed={tab === "history"} onClick={() => setTab("history")}>
            Historial ({history.length})
          </Button>
        </div>
      </div>

      {requests.isPending && (
        <div className="space-y-3" aria-busy>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {requests.isError && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          No se pudieron cargar las solicitudes.{" "}
          <button className="underline" onClick={() => requests.refetch()}>
            Reintentar
          </button>
        </p>
      )}

      {requests.isSuccess && shown.length === 0 && (
        <p className="py-10 text-center text-muted-foreground">
          {tab === "pending" ? "No hay solicitudes pendientes." : "Todavía no hay solicitudes resueltas."}
        </p>
      )}

      <ul className="grid gap-3 md:grid-cols-2">
        {shown.map((request) => (
          <li key={request.id}>
            <RequestCard request={request} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function hoursLeft(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000));
}

function RequestCard({ request }: { request: RescheduleRequest }) {
  const notice = useNotice();
  const decide = useDecideRequest();
  const [rejecting, setRejecting] = useState(false);

  const isPending = request.status === "pending";
  const error = decide.error;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{request.groupName}</CardTitle>
          <Badge variant={request.status === "rejected" ? "destructive" : "secondary"}>
            {STATUS_LABELS[request.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {request.requestedByName} propone mover la clase
          {isPending && ` · vence en ${hoursLeft(request.expiresAt)} h`}
        </p>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-muted-foreground line-through">
            {formatDate(request.originalStartsAt)} · {formatTimeRange(request.originalStartsAt, request.originalEndsAt)}
          </span>
          <ArrowRight className="size-4 shrink-0" aria-label="pasa a" />
          <strong>
            {formatDate(request.proposedStartsAt)} · {formatTimeRange(request.proposedStartsAt, request.proposedEndsAt)}
            {request.proposedRoomName && ` · ${request.proposedRoomName}`}
          </strong>
        </div>

        {request.reason && (
          <p>
            <span className="text-muted-foreground">Motivo:</span> {request.reason}
          </p>
        )}

        {!isPending && request.decidedByName && (
          <p className="text-muted-foreground">
            {request.status === "approved" ? "Aprobada" : "Resuelta"} por {request.decidedByName}
            {request.decisionNote && `: ${request.decisionNote}`}
          </p>
        )}

        {isPending && !request.viewerCanDecide && (
          <p className="text-muted-foreground">Esperando respuesta.</p>
        )}

        {error && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-2">
            {error instanceof ApiError ? error.message : "No se pudo resolver la solicitud."}
          </p>
        )}
      </CardContent>

      {isPending && request.viewerCanDecide && (
        <CardFooter className="gap-2">
          <Button
            disabled={decide.isPending}
            onClick={() =>
              decide.mutate(
                { requestId: request.id, decision: "approve" },
                { onSuccess: () => notice("Cambio aprobado. Se avisó a las familias y al profesor.") },
              )
            }
          >
            Aprobar
          </Button>
          <Button variant="outline" disabled={decide.isPending} onClick={() => setRejecting(true)}>
            Rechazar
          </Button>
        </CardFooter>
      )}

      <RejectDialog
        open={rejecting}
        onClose={() => setRejecting(false)}
        pending={decide.isPending}
        onConfirm={(note) =>
          decide.mutate(
            { requestId: request.id, decision: "reject", note },
            {
              onSuccess: () => {
                setRejecting(false);
                notice("Solicitud rechazada. Se avisó a quien la pidió.");
              },
            },
          )
        }
      />
    </Card>
  );
}

function RejectDialog({
  open,
  onClose,
  pending,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onConfirm: (note: string | null) => void;
}) {
  const [note, setNote] = useState("");
  const id = `reject-note-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar solicitud</DialogTitle>
          <DialogDescription>La clase seguirá en su horario actual. Puedes explicar el motivo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor={id}>Motivo (opcional)</Label>
          <Textarea id={id} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button variant="destructive" disabled={pending} onClick={() => onConfirm(note.trim() || null)}>
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
