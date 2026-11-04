import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { monthRange, type Ym } from "@/features/students/month";
import { toApiError } from "@/lib/problem";

export function useTeachers(ym: Ym, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["teachers", ym],
    enabled: options.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/teachers", { params: { query: monthRange(ym) } });
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useTeacher(teacherId: string | undefined, ym: Ym) {
  return useQuery({
    queryKey: ["teachers", ym, teacherId],
    enabled: !!teacherId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/teachers/{teacherId}", {
        params: { path: { teacherId: teacherId! }, query: monthRange(ym) },
      });
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}
