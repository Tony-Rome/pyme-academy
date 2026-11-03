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

export const ROLE_LABELS = {
  director: "Dirección",
  teacher: "Profesor",
  guardian: "Apoderado",
  student: "Alumno",
} as const;
