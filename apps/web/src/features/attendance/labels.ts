import type { AttendanceStatus } from "@/lib/types";

export const STATUS_ORDER: AttendanceStatus[] = ["present", "late", "absent", "excused"];

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Presente",
  late: "Atrasado",
  absent: "Ausente",
  excused: "Justificado",
};
