import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

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

export function App() {
  const state = useApiState();

  return (
    <main>
      <h1>Academia de Música</h1>
      <p>Estado del servidor:</p>
      <p className={`status status-${state}`} role="status">
        {LABELS[state]}
      </p>
    </main>
  );
}
