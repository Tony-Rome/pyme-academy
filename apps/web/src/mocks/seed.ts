// Datos de ejemplo para la API simulada. Se generan relativos a la semana actual
// para que el calendario siempre tenga clases pasadas y futuras.
import type { Role, SessionStatus } from "@/lib/types";

export interface MockUser {
  id: string;
  fullName: string;
  /** Solo para la API simulada: cuentas de demostración, nunca credenciales reales. */
  email: string;
  password: string;
  role: Role;
  /** Alumnos a cargo (apoderado). */
  studentIds: string[];
}

export interface MockTeacher {
  id: string;
  fullName: string;
  instruments: string[];
}

export interface MockRoom {
  id: string;
  name: string;
  capacity: number;
}

export interface MockStudent {
  id: string;
  fullName: string;
}

export interface MockGroup {
  id: string;
  name: string;
  instrument: string;
  level: string;
  kind: "individual" | "group";
  teacherId: string;
  roomId: string;
  weekday: number; // 0 = domingo
  startTime: string; // "HH:MM"
  durationMinutes: number;
  capacity: number;
  studentIds: string[];
}

export interface MockSession {
  id: string;
  classGroupId: string;
  teacherId: string;
  originalTeacherId: string | null;
  roomId: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  cancelReason: string | null;
  pendingRequestId: string | null;
}

export interface MockRequest {
  id: string;
  sessionId: string;
  requestedById: string;
  originalStartsAt: string;
  originalEndsAt: string;
  proposedStartsAt: string;
  proposedEndsAt: string;
  proposedRoomId: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
  decisionNote: string | null;
  decidedByName: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface MockNotification {
  id: string;
  recipientIds: string[];
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readBy: string[];
}

const uid = (kind: number, n: number) =>
  `00000000-0000-4000-8000-${String(kind * 1000 + n).padStart(12, "0")}`;

export const ID = {
  teacher: (n: number) => uid(1, n),
  room: (n: number) => uid(2, n),
  student: (n: number) => uid(3, n),
  group: (n: number) => uid(4, n),
  user: (n: number) => uid(5, n),
  session: (n: number) => uid(6, n),
  request: (n: number) => uid(7, n),
  notification: (n: number) => uid(8, n),
};

export const teachers: MockTeacher[] = [
  { id: ID.teacher(1), fullName: "Camila Rojas", instruments: ["Piano"] },
  { id: ID.teacher(2), fullName: "Matías Soto", instruments: ["Guitarra"] },
  { id: ID.teacher(3), fullName: "Valentina Pérez", instruments: ["Violín", "Canto"] },
  { id: ID.teacher(4), fullName: "Rodrigo Díaz", instruments: ["Guitarra", "Bajo"] },
];

export const rooms: MockRoom[] = [
  { id: ID.room(1), name: "Sala Piano", capacity: 4 },
  { id: ID.room(2), name: "Sala Guitarras", capacity: 8 },
  { id: ID.room(3), name: "Sala Cuerdas", capacity: 6 },
  { id: ID.room(4), name: "Sala Grupal", capacity: 15 },
];

const studentNames = [
  "Sofía Muñoz", "Tomás Muñoz", "Isidora Vega", "Benjamín Araya", "Martina Castro",
  "Joaquín Pinto", "Emilia Torres", "Vicente Gallardo", "Antonia Riquelme", "Maximiliano Leiva",
  "Florencia Núñez", "Agustín Parra", "Catalina Herrera", "Camilo Ibarra", "Josefa Salinas",
  "Lucas Bravo", "Amanda Cortés", "Diego Olivares", "Renata Figueroa", "Felipe Maldonado",
];

export const students: MockStudent[] = studentNames.map((fullName, i) => ({
  id: ID.student(i + 1),
  fullName,
}));

const s = (index: number) => ID.student(index + 1);

/** Personas con las que se puede "entrar" a la demo (selector de rol). */
export const users: MockUser[] = [
  { id: ID.user(1), fullName: "Laura Fuentes", email: "laura@academia.test", password: "demo1234", role: "director", studentIds: [] },
  { id: teachers[0].id, fullName: teachers[0].fullName, email: "camila@academia.test", password: "demo1234", role: "teacher", studentIds: [] },
  { id: ID.user(3), fullName: "Andrea Muñoz", email: "andrea@academia.test", password: "demo1234", role: "guardian", studentIds: [s(0), s(1)] },
];

export const groups: MockGroup[] = [
  { id: ID.group(1), name: "Piano inicial · Sofía", instrument: "Piano", level: "Inicial", kind: "individual", teacherId: ID.teacher(1), roomId: ID.room(1), weekday: 1, startTime: "16:00", durationMinutes: 45, capacity: 1, studentIds: [s(0)] },
  { id: ID.group(2), name: "Piano intermedio · Tomás", instrument: "Piano", level: "Intermedio", kind: "individual", teacherId: ID.teacher(1), roomId: ID.room(1), weekday: 1, startTime: "17:00", durationMinutes: 45, capacity: 1, studentIds: [s(1)] },
  { id: ID.group(3), name: "Piano infantil", instrument: "Piano", level: "Inicial", kind: "group", teacherId: ID.teacher(1), roomId: ID.room(1), weekday: 3, startTime: "16:00", durationMinutes: 60, capacity: 4, studentIds: [s(2), s(3), s(4)] },
  { id: ID.group(4), name: "Guitarra básica", instrument: "Guitarra", level: "Inicial", kind: "group", teacherId: ID.teacher(2), roomId: ID.room(2), weekday: 2, startTime: "17:30", durationMinutes: 60, capacity: 8, studentIds: [s(1), s(5), s(6), s(7), s(8), s(9), s(10)] },
  { id: ID.group(5), name: "Guitarra avanzada · Agustín", instrument: "Guitarra", level: "Avanzado", kind: "individual", teacherId: ID.teacher(2), roomId: ID.room(2), weekday: 4, startTime: "18:00", durationMinutes: 45, capacity: 1, studentIds: [s(11)] },
  { id: ID.group(6), name: "Violín inicial", instrument: "Violín", level: "Inicial", kind: "group", teacherId: ID.teacher(3), roomId: ID.room(3), weekday: 2, startTime: "16:00", durationMinutes: 60, capacity: 6, studentIds: [s(12), s(14), s(15)] },
  { id: ID.group(7), name: "Violín · Camilo", instrument: "Violín", level: "Intermedio", kind: "individual", teacherId: ID.teacher(3), roomId: ID.room(3), weekday: 4, startTime: "16:00", durationMinutes: 45, capacity: 1, studentIds: [s(13)] },
  { id: ID.group(8), name: "Coro infantil", instrument: "Canto", level: "Inicial", kind: "group", teacherId: ID.teacher(3), roomId: ID.room(4), weekday: 5, startTime: "17:00", durationMinutes: 60, capacity: 15, studentIds: [s(0), s(2), s(4), s(16), s(17), s(18), s(19)] },
];

function mondayOfThisWeek(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() - ((day + 6) % 7));
  return d;
}

function at(base: Date, dayOffset: number, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}

export interface SeedData {
  sessions: MockSession[];
  requests: MockRequest[];
  notifications: MockNotification[];
}

export function buildSeed(now = new Date()): SeedData {
  const monday = mondayOfThisWeek(now);
  const sessions: MockSession[] = [];
  let n = 0;

  for (const g of groups) {
    for (let week = -2; week <= 6; week++) {
      const dayOffset = week * 7 + ((g.weekday + 6) % 7);
      const start = at(monday, dayOffset, g.startTime);
      const end = new Date(start.getTime() + g.durationMinutes * 60_000);
      sessions.push({
        id: ID.session(++n),
        classGroupId: g.id,
        teacherId: g.teacherId,
        originalTeacherId: null,
        roomId: g.roomId,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        status: end < now ? "completed" : "scheduled",
        cancelReason: null,
        pendingRequestId: null,
      });
    }
  }

  const find = (groupId: string, week: number) => {
    const g = groups.find((x) => x.id === groupId)!;
    const target = at(monday, week * 7 + ((g.weekday + 6) % 7), g.startTime).toISOString();
    return sessions.find((x) => x.classGroupId === groupId && x.startsAt === target)!;
  };

  // La semana siguiente el profesor de guitarra está con licencia.
  const cancelled = find(ID.group(4), 1);
  cancelled.status = "cancelled";
  cancelled.cancelReason = "Profesor con licencia médica";

  const replaced = find(ID.group(5), 1);
  replaced.originalTeacherId = ID.teacher(2);
  replaced.teacherId = ID.teacher(4);

  // Solicitud pendiente de la apoderada para mover la clase de piano de Sofía.
  const target = find(ID.group(1), 1);
  const proposedStart = at(monday, 7 + 1, "16:00"); // martes de la semana siguiente
  const proposedEnd = new Date(proposedStart.getTime() + 45 * 60_000);
  const request: MockRequest = {
    id: ID.request(1),
    sessionId: target.id,
    requestedById: ID.user(3),
    originalStartsAt: target.startsAt,
    originalEndsAt: target.endsAt,
    proposedStartsAt: proposedStart.toISOString(),
    proposedEndsAt: proposedEnd.toISOString(),
    proposedRoomId: ID.room(1),
    reason: "Sofía tiene una presentación en el colegio ese lunes",
    status: "pending",
    decisionNote: null,
    decidedByName: null,
    createdAt: new Date(now.getTime() - 3 * 3_600_000).toISOString(),
    expiresAt: new Date(now.getTime() + 45 * 3_600_000).toISOString(),
  };
  target.pendingRequestId = request.id;

  const notifications: MockNotification[] = [
    {
      id: ID.notification(1),
      recipientIds: [ID.user(3)],
      type: "session_cancelled",
      title: "Clase cancelada: Guitarra básica",
      body: "La clase de la próxima semana se canceló: profesor con licencia médica.",
      createdAt: new Date(now.getTime() - 26 * 3_600_000).toISOString(),
      readBy: [],
    },
    {
      id: ID.notification(2),
      recipientIds: [ID.teacher(1), ID.user(1)],
      type: "reschedule_requested",
      title: "Solicitud de cambio: Piano inicial · Sofía",
      body: "Andrea Muñoz propone mover la clase del lunes al martes a las 16:00.",
      createdAt: request.createdAt,
      readBy: [],
    },
  ];

  return { sessions, requests: [request], notifications };
}
