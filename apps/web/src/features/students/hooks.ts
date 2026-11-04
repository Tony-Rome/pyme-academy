import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import { toApiError } from "@/lib/problem";
import { monthRange, type Ym } from "./month";

export function useStudents(ym: Ym) {
  return useQuery({
    queryKey: ["students", ym],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/students", { params: { query: monthRange(ym) } });
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useStudent(studentId: string | undefined, ym: Ym) {
  return useQuery({
    queryKey: ["students", ym, studentId],
    enabled: !!studentId,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/students/{studentId}", {
        params: { path: { studentId: studentId! }, query: monthRange(ym) },
      });
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}
