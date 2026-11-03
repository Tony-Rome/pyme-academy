import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import type { Viewer } from "@/lib/types";
import { toApiError } from "@/lib/problem";

/**
 * Cambia la persona con sesión y descarta lo que había en memoria de la anterior
 * (agenda, solicitudes, avisos). No se usa `queryClient.clear()`: desconectaría la
 * consulta de "me" que ya tienen montada las rutas protegidas y no se enterarían.
 */
function setViewer(queryClient: QueryClient, viewer: Viewer | null) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "me" });
  queryClient.setQueryData(["me"], viewer);
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data, error, response } = await api.POST("/auth/login", { body: input });
      if (!data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (viewer) => setViewer(queryClient, viewer),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.POST("/auth/logout");
    },
    // Aunque falle la red, en este navegador la sesión se da por cerrada.
    onSettled: () => setViewer(queryClient, null),
  });
}
