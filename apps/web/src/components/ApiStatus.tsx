import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { Badge } from "@/components/ui/badge";
import { MOCK_API } from "@/lib/env";

type State = "checking" | "ok" | "down";

function useApiState(): State {
  const { data, isPending } = useQuery({
    queryKey: ["ready"],
    queryFn: async () => {
      const { response } = await api.GET("/readyz");
      return response.ok;
    },
    retry: false,
    refetchInterval: 15_000,
  });

  if (isPending) return "checking";
  return data ? "ok" : "down";
}

const LABELS: Record<State, string> = {
  checking: "Comprobando…",
  ok: "Conectado",
  down: "Sin conexión con la API",
};

export function ApiStatus() {
  const state = useApiState();

  if (MOCK_API) {
    return <Badge variant="secondary">Datos de ejemplo</Badge>;
  }
  return (
    <Badge variant={state === "down" ? "destructive" : "secondary"} role="status">
      {LABELS[state]}
    </Badge>
  );
}
