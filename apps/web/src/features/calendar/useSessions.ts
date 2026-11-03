import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/api";

export interface DateRange {
  from: string;
  to: string;
}

export function useSessions(range: DateRange | undefined) {
  return useQuery({
    queryKey: ["sessions", range?.from, range?.to],
    enabled: !!range,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await api.GET("/sessions", {
        params: { query: { from: range!.from, to: range!.to } },
      });
      if (error || !data) throw new Error(error?.message ?? "No se pudieron cargar las clases");
      return data;
    },
  });
}
