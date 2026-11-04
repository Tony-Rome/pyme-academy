import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { monthRange, type Ym } from "@/features/students/month";
import { toApiError } from "@/lib/problem";
import type { AttendanceGroupBy } from "@/lib/types";

/** Alumnos con ausencias seguidas. Solo dirección y profesores; el resto recibiría 403. */
export function useAttendanceAlerts(enabled: boolean) {
  return useQuery({
    queryKey: ["attendance-alerts"],
    enabled,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/attendance/alerts");
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useAttendanceReport(ym: Ym, groupBy: AttendanceGroupBy) {
  return useQuery({
    queryKey: ["attendance-report", ym, groupBy],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/attendance/report", {
        params: { query: { ...monthRange(ym), groupBy } },
      });
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}
