import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { Viewer } from "@/lib/types";

/**
 * Persona con sesión abierta. `data` es `null` cuando no hay sesión
 * (hay que ir a la pantalla de acceso) y `undefined` mientras carga.
 */
export function useViewer() {
  return useQuery({
    queryKey: ["me"],
    // La expiración de la sesión se detecta con el 401 de cualquier petición.
    staleTime: Infinity,
    retry: 1,
    queryFn: async (): Promise<Viewer | null> => {
      const { data, response } = await api.GET("/me");
      if (response.status === 401) return null;
      if (!data) throw new Error("No se pudo cargar el perfil");
      return data;
    },
  });
}
