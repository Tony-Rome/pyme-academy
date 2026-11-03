import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { toApiError } from "@/lib/problem";
import type { components } from "@music-academy/api-client";

type Status = components["schemas"]["RescheduleStatus"];

export function useRescheduleOptions(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["reschedule-options", sessionId],
    enabled: !!sessionId,
    // Los horarios libres cambian cuando otra persona reagenda: no reutilizar datos viejos.
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/sessions/{sessionId}/reschedule-options", {
        params: { path: { sessionId: sessionId! } },
      });
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useRequests(status?: Status) {
  return useQuery({
    queryKey: ["requests", status ?? "all"],
    queryFn: async () => {
      const { data, error, response } = await api.GET("/reschedule-requests", {
        params: { query: { status } },
      });
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}

function useRefreshAfterChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sessions"] }),
      queryClient.invalidateQueries({ queryKey: ["requests"] }),
      queryClient.invalidateQueries({ queryKey: ["reschedule-options"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
}

export function useCreateRescheduleRequest(sessionId: string) {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: async (body: components["schemas"]["RescheduleRequestInput"]) => {
      const { data, error, response } = await api.POST("/sessions/{sessionId}/reschedule-requests", {
        params: { path: { sessionId } },
        body,
      });
      if (!data) throw toApiError(error, response);
      return data;
    },
    onSettled: refresh,
  });
}

export function useDecideRequest() {
  const refresh = useRefreshAfterChange();
  return useMutation({
    mutationFn: async (input: { requestId: string; decision: "approve" | "reject"; note?: string | null }) => {
      const { data, error, response } = await api.POST("/reschedule-requests/{requestId}/decision", {
        params: { path: { requestId: input.requestId } },
        body: { decision: input.decision, note: input.note ?? null },
      });
      if (!data) throw toApiError(error, response);
      return data;
    },
    onSettled: refresh,
  });
}
