import { useQuery } from "@tanstack/react-query";
import { api } from "@/api";

export function useViewer() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await api.GET("/me");
      if (!data) throw new Error("No se pudo cargar el perfil");
      return data;
    },
  });
}
