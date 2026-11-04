import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { toApiError } from "@/lib/problem";
import type { components } from "@music-academy/api-client";

type Input = components["schemas"]["AttendanceInput"]["records"];

export function useAttendance(sessionId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["attendance", sessionId],
    enabled: !!sessionId && enabled,
    staleTime: 0,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/sessions/{sessionId}/attendance", {
        params: { path: { sessionId: sessionId! } },
      });
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useSaveAttendance(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (records: Input) => {
      const { data, error, response } = await api.PUT("/sessions/{sessionId}/attendance", {
        params: { path: { sessionId } },
        body: { records },
      });
      if (!data) throw toApiError(error, response);
      return data;
    },
    // La clase puede pasar a "realizada", y cambian los pendientes y los resúmenes por alumno.
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["attendance"] }),
        queryClient.invalidateQueries({ queryKey: ["sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["students"] }),
        queryClient.invalidateQueries({ queryKey: ["teachers"] }),
      ]),
  });
}
