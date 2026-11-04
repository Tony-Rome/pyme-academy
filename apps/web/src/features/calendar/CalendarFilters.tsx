import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currentYm } from "@/features/students/month";
import { useTeachers } from "@/features/teachers/hooks";
import { toApiError } from "@/lib/problem";
import type { SessionFilters } from "./useSessions";

const ALL = "all";

interface Props {
  value: SessionFilters;
  onChange: (next: SessionFilters) => void;
  /** Cantidad de clases que se muestran, para decirlo cuando hay un filtro activo. */
  count: number | undefined;
}

function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/rooms");
      if (!data) throw toApiError(error, response);
      return data;
    },
  });
}

/** Filtros del calendario por profesor y por sala (dirección). */
export function CalendarFilters({ value, onChange, count }: Props) {
  const teachers = useTeachers(currentYm());
  const rooms = useRooms();

  const teacherItems = [
    { value: ALL, label: "Todos los profesores" },
    ...(teachers.data ?? []).map((t) => ({ value: t.id, label: t.fullName })),
  ];
  const roomItems = [
    { value: ALL, label: "Todas las salas" },
    ...(rooms.data ?? []).map((r) => ({ value: r.id, label: r.name })),
  ];

  const active = !!value.teacherId || !!value.roomId;

  return (
    <div className="flex flex-wrap items-end gap-3" role="group" aria-label="Filtros del calendario">
      <div className="space-y-1.5">
        <Label id="filter-teacher-label">Profesor</Label>
        <Select
          items={teacherItems}
          value={value.teacherId ?? ALL}
          onValueChange={(next) => onChange({ ...value, teacherId: next && next !== ALL ? next : undefined })}
        >
          <SelectTrigger aria-labelledby="filter-teacher-label" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teacherItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label id="filter-room-label">Sala</Label>
        <Select
          items={roomItems}
          value={value.roomId ?? ALL}
          onValueChange={(next) => onChange({ ...value, roomId: next && next !== ALL ? next : undefined })}
        >
          <SelectTrigger aria-labelledby="filter-room-label" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roomItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {active && (
        <>
          <Button variant="ghost" onClick={() => onChange({})}>
            <X data-icon="inline-start" />
            Quitar filtros
          </Button>
          {count !== undefined && (
            <p className="pb-1.5 text-sm text-muted-foreground" aria-live="polite">
              {count === 1 ? "1 clase" : `${count} clases`} en este período
            </p>
          )}
        </>
      )}
    </div>
  );
}
