import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/api";

export interface DateRange {
  from: string;
  to: string;
}

export interface SessionFilters {
  teacherId?: string;
  roomId?: string;
}

export function useSessions(range: DateRange | undefined, filters: SessionFilters = {}) {
  return useQuery({
    queryKey: ["sessions", range?.from, range?.to, filters.teacherId ?? null, filters.roomId ?? null],
    enabled: !!range,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await api.GET("/sessions", {
        params: { query: { from: range!.from, to: range!.to, ...filters } },
      });
      if (error || !data) throw new Error(error?.message ?? "No se pudieron cargar las clases");
      return data;
    },
  });
}
