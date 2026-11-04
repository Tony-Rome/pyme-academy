const locale = "es-CL";

const dateFmt = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" });
const timeFmt = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false });

export function formatDate(iso: string): string {
  const text = dateFmt.format(new Date(iso));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

/** "Violín" -> "violin": clave para elegir el color del instrumento. */
export function instrumentKey(instrument: string): string {
  return instrument
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/** "45 min", "2 h", "1 h 30 min". */
export function formatMinutes(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

/** Horario semanal de un grupo: "Lunes · 16:00 – 16:45". */
export function formatSlot(weekday: number, startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const end = h * 60 + m + durationMinutes;
  const endTime = `${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
  return `${WEEKDAYS[weekday]} · ${startTime} – ${endTime}`;
}

export const ROLE_LABELS = {
  director: "Dirección",
  teacher: "Profesor",
  guardian: "Apoderado",
  student: "Alumno",
} as const;
