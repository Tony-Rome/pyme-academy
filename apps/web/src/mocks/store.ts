// Estado en memoria de la API simulada y reglas de visibilidad y reagendamiento.
// Imita lo que hará el backend real; cuando este exista, este archivo se descarta.
import { formatDate, formatTime } from "@/lib/format";
import type {
  AttendanceAlert,
  AttendanceGroupBy,
  AttendanceRecord,
  AttendanceReportRow,
  AttendanceStatus,
  AttendanceSummary,
  ClassGroup,
  Notification,
  RescheduleOption,
  RescheduleRequest,
  Session,
  GroupBrief,
  PeriodHours,
  StudentOverview,
  StudentTeacherLink,
  TeacherDetail,
  TeacherOverview,
  Viewer,
} from "@/lib/types";
import {
  buildSeed,
  groups,
  rooms,
  students,
  teachers,
  users,
  type MockAttendance,
  type MockGroup,
  type MockNotification,
  type MockRequest,
  type MockSession,
  type MockUser,
} from "./seed";

/** Reglas de la academia (en el backend vivirán en `academy_settings`). */
export const POLICY = {
  minNoticeHours: 24,
  monthlyLimit: 2,
  requestExpiryHours: 48,
};

const SESSION_KEY = "mock-session-user-id";

const data = buildSeed();
/** Asistencia por clase y alumno. */
const attendanceBySession = new Map<string, Map<string, MockAttendance>>();
for (const record of data.attendance) {
  const inSession = attendanceBySession.get(record.sessionId) ?? new Map<string, MockAttendance>();
  inSession.set(record.studentId, record);
  attendanceBySession.set(record.sessionId, inSession);
}
const attendanceOf = (sessionId: string) => attendanceBySession.get(sessionId) ?? new Map<string, MockAttendance>();

const ATTENDANCE_EDIT_DAYS = 7;

const state = {
  sessions: data.sessions,
  requests: data.requests,
  notifications: data.notifications,
  /** Persona con sesión abierta; null si nadie ha iniciado sesión. */
  userId: readStoredSession(),
  counter: 100,
};

function readStoredSession(): string | null {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    return id && users.some((u) => u.id === id) ? id : null;
  } catch {
    return null;
  }
}

function storeSession(id: string | null) {
  state.userId = id;
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // sin almacenamiento: la sesión vale solo para esta carga
  }
}

/** Cuentas que la pantalla de acceso ofrece como atajo en la demo. */
export const demoAccounts = users.map((u) => ({
  fullName: u.fullName,
  role: u.role,
  email: u.email,
  password: u.password,
}));

export function isAuthenticated() {
  return state.userId !== null;
}

export function login(email: string, password: string): Result<Viewer> {
  const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || user.password !== password) {
    return fail(401, "invalid_credentials", "Correo o contraseña incorrectos.");
  }
  storeSession(user.id);
  return { ok: true, value: viewerPayload() };
}

export function logout() {
  storeSession(null);
}

/** Persona con sesión abierta. Los handlers comprueban antes `isAuthenticated()`. */
export function currentUser(): MockUser {
  return users.find((u) => u.id === state.userId)!;
}

/** Resultado de una operación que puede incumplir una regla. */
export type Result<T> = { ok: true; value: T } | { ok: false; status: number; code: string; message: string };

const fail = (status: number, code: string, message: string): Result<never> => ({
  ok: false,
  status,
  code,
  message,
});

// ---------------------------------------------------------------------------
// Índices y utilidades
// ---------------------------------------------------------------------------

const studentById = new Map(students.map((x) => [x.id, x]));
const teacherById = new Map(teachers.map((x) => [x.id, x]));
const roomById = new Map(rooms.map((x) => [x.id, x]));
const groupById = new Map(groups.map((x) => [x.id, x]));

const sessionById = (id: string) => state.sessions.find((x) => x.id === id);
const groupOf = (s: MockSession): MockGroup => groupById.get(s.classGroupId)!;
const hoursUntil = (iso: string) => (new Date(iso).getTime() - Date.now()) / 3_600_000;
const overlaps = (aS: Date, aE: Date, bS: Date, bE: Date) => aS < bE && bS < aE;

function nextId(kind: "request" | "notification" | "session"): string {
  const n = ++state.counter;
  const base = { request: 7000, notification: 8000, session: 6000 }[kind] + n;
  return `00000000-0000-4000-8000-${String(base).padStart(12, "0")}`;
}

function guardiansOf(s: MockSession): MockUser[] {
  const studentIds = groupOf(s).studentIds;
  return users.filter((u) => u.role === "guardian" && u.studentIds.some((id) => studentIds.includes(id)));
}

function notify(recipientIds: string[], type: string, title: string, body: string) {
  const unique = [...new Set(recipientIds)];
  if (unique.length === 0) return;
  state.notifications.push({
    id: nextId("notification"),
    recipientIds: unique,
    type,
    title,
    body,
    createdAt: new Date().toISOString(),
    readBy: [],
  });
}

const when = (iso: string) => `${formatDate(iso)} a las ${formatTime(iso)}`;

// ---------------------------------------------------------------------------
// Reglas: permisos, bloqueos por política y choques
// ---------------------------------------------------------------------------

function canSeeSession(s: MockSession, u: MockUser): boolean {
  const g = groupOf(s);
  switch (u.role) {
    case "director":
      return true;
    case "teacher":
      return s.teacherId === u.id;
    case "guardian":
    case "student":
      return g.studentIds.some((id) => u.studentIds.includes(id));
  }
}

/** ¿Tiene este rol permiso para pedir o aplicar un cambio en esta sesión? */
function hasReschedulePermission(s: MockSession, u: MockUser): boolean {
  const g = groupOf(s);
  switch (u.role) {
    case "director":
      return true;
    case "teacher":
      return s.teacherId === u.id;
    case "guardian":
    case "student":
      // Las clases grupales solo las mueven dirección o el profesor.
      return g.kind === "individual" && g.studentIds.some((id) => u.studentIds.includes(id));
  }
}

function monthlyChangesBy(userId: string): number {
  const now = new Date();
  return state.requests.filter((r) => {
    if (r.requestedById !== userId) return false;
    if (r.status !== "pending" && r.status !== "approved") return false;
    const created = new Date(r.createdAt);
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;
}

/** Regla de la academia que impide el cambio, si hay alguna. */
function blockedReason(s: MockSession, u: MockUser): string | null {
  if (u.role === "director") return null;
  if (hoursUntil(s.startsAt) < POLICY.minNoticeHours) {
    return `Las clases se pueden mover hasta ${POLICY.minNoticeHours} horas antes.`;
  }
  if ((u.role === "guardian" || u.role === "student") && monthlyChangesBy(u.id) >= POLICY.monthlyLimit) {
    return `Ya usaste los ${POLICY.monthlyLimit} cambios de este mes.`;
  }
  return null;
}

type Conflict = "teacher" | "room" | "student";

function findConflict(
  start: Date,
  end: Date,
  who: { teacherId: string; roomId: string | null; studentIds: string[]; ignoreSessionId: string },
): Conflict | null {
  for (const other of state.sessions) {
    if (other.status !== "scheduled" || other.id === who.ignoreSessionId) continue;
    if (!overlaps(start, end, new Date(other.startsAt), new Date(other.endsAt))) continue;
    if (other.teacherId === who.teacherId) return "teacher";
    if (who.roomId && other.roomId === who.roomId) return "room";
    if (groupOf(other).studentIds.some((id) => who.studentIds.includes(id))) return "student";
  }
  return null;
}

const CONFLICT_MESSAGES: Record<Conflict, string> = {
  teacher: "El profesor ya tiene otra clase en ese horario.",
  room: "La sala ya está ocupada en ese horario.",
  student: "El alumno ya tiene otra clase en ese horario.",
};

/** Quién marca asistencia: quien dicta la clase y dirección. Las familias solo ven. */
function mayMarkAttendance(s: MockSession, u: MockUser): boolean {
  return u.role === "director" || (u.role === "teacher" && s.teacherId === u.id);
}

/** Por qué la asistencia no se puede marcar ahora, si no se puede. */
function attendanceBlock(s: MockSession): string | null {
  if (s.status === "cancelled") return "La clase está cancelada.";
  const now = Date.now();
  if (new Date(s.startsAt).getTime() > now) return "La clase aún no empieza.";
  if (now > new Date(s.endsAt).getTime() + ATTENDANCE_EDIT_DAYS * 86_400_000) {
    return `Pasaron más de ${ATTENDANCE_EDIT_DAYS} días desde la clase.`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

export function viewerPayload(): Viewer {
  const u = currentUser();
  return {
    id: u.id,
    fullName: u.fullName,
    roles: [u.role],
    activeRole: u.role,
    students: u.studentIds.map((id) => studentById.get(id)!),
  };
}

function toSession(s: MockSession, u: MockUser): Session {
  const g = groupOf(s);
  const teacher = teacherById.get(s.teacherId)!;
  const original = s.originalTeacherId ? teacherById.get(s.originalTeacherId)! : null;
  const room = roomById.get(s.roomId) ?? null;

  const visibleStudentIds =
    u.role === "guardian" || u.role === "student"
      ? g.studentIds.filter((id) => u.studentIds.includes(id))
      : g.studentIds;

  const canTakeAttendance = mayMarkAttendance(s, u) && attendanceBlock(s) === null;
  const open = s.status === "scheduled" && hoursUntil(s.startsAt) > 0 && !s.pendingRequestId;
  const permitted = open && hasReschedulePermission(s, u);
  const blocked = permitted ? blockedReason(s, u) : null;

  return {
    id: s.id,
    classGroupId: g.id,
    groupName: g.name,
    instrument: g.instrument,
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    originalTeacherId: original?.id ?? null,
    originalTeacherName: original?.fullName ?? null,
    roomId: room?.id ?? null,
    roomName: room?.name ?? null,
    startsAt: s.startsAt,
    endsAt: s.endsAt,
    status: s.status,
    cancelReason: s.cancelReason,
    students: visibleStudentIds.map((id) => studentById.get(id)!),
    pendingRescheduleRequestId: s.pendingRequestId,
    canReschedule: permitted && !blocked,
    rescheduleBlockedReason: blocked,
    canTakeAttendance,
    attendancePending: canTakeAttendance && g.studentIds.some((id) => !attendanceOf(s.id).has(id)),
  };
}

/** Los filtros solo acotan lo que el rol ya puede ver; nunca amplían la visibilidad. */
export function listSessions(
  from: Date,
  to: Date,
  filters: { teacherId?: string | null; roomId?: string | null } = {},
): Session[] {
  const u = currentUser();
  return state.sessions
    .filter((s) => canSeeSession(s, u))
    .filter((s) => !filters.teacherId || s.teacherId === filters.teacherId)
    .filter((s) => !filters.roomId || s.roomId === filters.roomId)
    .filter((s) => new Date(s.endsAt) > from && new Date(s.startsAt) < to)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((s) => toSession(s, u));
}

export function getSession(id: string): Session | null {
  const u = currentUser();
  const s = sessionById(id);
  return s && canSeeSession(s, u) ? toSession(s, u) : null;
}

export function listRooms() {
  return rooms;
}


export function listClassGroups(): ClassGroup[] {
  const u = currentUser();
  return groups
    .filter((g) => {
      if (u.role === "director") return true;
      if (u.role === "teacher") return g.teacherId === u.id;
      return g.studentIds.some((id) => u.studentIds.includes(id));
    })
    .map(toClassGroup);
}

function toClassGroup(g: MockGroup): ClassGroup {
  return {
    id: g.id,
    name: g.name,
    instrument: g.instrument,
    level: g.level,
    kind: g.kind,
    teacherId: g.teacherId,
    roomId: g.roomId,
    weekday: g.weekday,
    startTime: g.startTime,
    durationMinutes: g.durationMinutes,
    capacity: g.capacity,
    enrolled: g.studentIds.length,
  };
}

// ---------------------------------------------------------------------------
// Alumnos y profesores vinculados
// ---------------------------------------------------------------------------

/** Mes actual en hora local: [inicio, inicio del mes siguiente). */
export function currentMonth(): { from: Date; to: Date } {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

/** Grupos de un alumno que quien consulta puede ver (un profesor, solo los suyos). */
function visibleGroupsOf(studentId: string, u: MockUser): MockGroup[] {
  return groups.filter((g) => {
    if (!g.studentIds.includes(studentId)) return false;
    return u.role === "teacher" ? g.teacherId === u.id : true;
  });
}

function canSeeStudent(studentId: string, u: MockUser): boolean {
  if (u.role === "director") return true;
  if (u.role === "teacher") return visibleGroupsOf(studentId, u).length > 0;
  return u.studentIds.includes(studentId);
}

function minutesOf(s: MockSession) {
  return Math.round((new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()) / 60_000);
}

/** Minutos de clase del período, por estado. Las canceladas no cuentan como realizadas. */
function periodHours(sessions: MockSession[], from: Date, to: Date): PeriodHours {
  const hours = { scheduledMinutes: 0, completedMinutes: 0, cancelledMinutes: 0 };
  for (const s of sessions) {
    const start = new Date(s.startsAt);
    if (start < from || start >= to) continue;
    if (s.status === "scheduled") hours.scheduledMinutes += minutesOf(s);
    else if (s.status === "completed") hours.completedMinutes += minutesOf(s);
    else hours.cancelledMinutes += minutesOf(s);
  }
  return hours;
}

/** Asistencia de un alumno en clases ya iniciadas y no canceladas; sin marcar no se asume nada. */
function attendanceSummary(sessions: MockSession[], studentId: string, from: Date, to: Date): AttendanceSummary {
  const summary = { attendedMinutes: 0, present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 };
  const now = Date.now();
  for (const s of sessions) {
    const start = new Date(s.startsAt);
    if (start < from || start >= to || start.getTime() > now || s.status === "cancelled") continue;
    const record = attendanceOf(s.id).get(studentId);
    if (!record) {
      summary.unmarked++;
      continue;
    }
    summary[record.status]++;
    if (record.status === "present" || record.status === "late") summary.attendedMinutes += minutesOf(s);
  }
  return summary;
}

function toGroupBrief(g: MockGroup): GroupBrief {
  return {
    id: g.id,
    name: g.name,
    instrument: g.instrument,
    level: g.level,
    kind: g.kind,
    weekday: g.weekday,
    startTime: g.startTime,
    durationMinutes: g.durationMinutes,
    roomName: roomById.get(g.roomId)?.name ?? null,
  };
}

function toOverview(studentId: string, u: MockUser, from: Date, to: Date): StudentOverview {
  const student = studentById.get(studentId)!;
  const byTeacher = new Map<string, MockGroup[]>();
  for (const g of visibleGroupsOf(studentId, u)) {
    byTeacher.set(g.teacherId, [...(byTeacher.get(g.teacherId) ?? []), g]);
  }

  const now = Date.now();
  const links: StudentTeacherLink[] = [...byTeacher.entries()].map(([teacherId, teacherGroups]) => {
    const groupIds = new Set(teacherGroups.map((g) => g.id));
    const mine = state.sessions.filter((s) => groupIds.has(s.classGroupId));

    const hours = periodHours(mine, from, to);
    const attendance = attendanceSummary(mine, studentId, from, to);

    const next = mine
      .filter((s) => s.status === "scheduled" && new Date(s.startsAt).getTime() > now)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

    return {
      teacher: { id: teacherId, fullName: teacherById.get(teacherId)!.fullName },
      groups: teacherGroups.map(toGroupBrief),
      hours,
      attendance,
      nextSessionAt: next?.startsAt ?? null,
    };
  });

  links.sort((a, b) => a.teacher.fullName.localeCompare(b.teacher.fullName, "es"));
  return { id: student.id, fullName: student.fullName, age: student.age, links };
}

export function listStudents(from: Date, to: Date): StudentOverview[] {
  const u = currentUser();
  return students
    .filter((s) => canSeeStudent(s.id, u))
    .map((s) => toOverview(s.id, u, from, to))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export function getStudent(id: string, from: Date, to: Date): StudentOverview | null {
  const u = currentUser();
  return studentById.has(id) && canSeeStudent(id, u) ? toOverview(id, u, from, to) : null;
}

// ---------------------------------------------------------------------------
// Profesores (solo dirección)
// ---------------------------------------------------------------------------

const directorOnly = () => fail(403, "forbidden", "Solo dirección puede ver a los profesores.");

/** Horas que el profesor dictó o dictará: por quien dicta la sesión, no por el titular del grupo. */
function toTeacherOverview(t: (typeof teachers)[number], from: Date, to: Date): TeacherOverview {
  const own = groups.filter((g) => g.teacherId === t.id);
  const dictated = state.sessions.filter((s) => s.teacherId === t.id);
  const next = dictated
    .filter((s) => s.status === "scheduled" && new Date(s.startsAt).getTime() > Date.now())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  return {
    id: t.id,
    fullName: t.fullName,
    instruments: t.instruments,
    studentCount: new Set(own.flatMap((g) => g.studentIds)).size,
    groupCount: own.length,
    hours: periodHours(dictated, from, to),
    nextSessionAt: next?.startsAt ?? null,
  };
}

export function listTeachers(from: Date, to: Date): Result<TeacherOverview[]> {
  if (currentUser().role !== "director") return directorOnly();
  const list = teachers
    .map((t) => toTeacherOverview(t, from, to))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
  return { ok: true, value: list };
}

export function getTeacher(id: string, from: Date, to: Date): Result<TeacherDetail> {
  if (currentUser().role !== "director") return directorOnly();
  const t = teacherById.get(id);
  if (!t) return fail(404, "not_found", "El profesor no existe");

  const inRange = (s: MockSession) => {
    const start = new Date(s.startsAt);
    return start >= from && start < to && s.status !== "cancelled";
  };
  const sumMinutes = (list: MockSession[]) => list.reduce((sum, s) => sum + minutesOf(s), 0);

  return {
    ok: true,
    value: {
      teacher: toTeacherOverview(t, from, to),
      groups: groups
        .filter((g) => g.teacherId === id)
        .map((g) => ({
          group: toGroupBrief(g),
          capacity: g.capacity,
          students: g.studentIds
            .map((sid) => studentById.get(sid)!)
            .map((x) => ({ id: x.id, fullName: x.fullName }))
            .sort((a, b) => a.fullName.localeCompare(b.fullName, "es")),
          hours: periodHours(
            state.sessions.filter((s) => s.classGroupId === g.id),
            from,
            to,
          ),
        })),
      substitutions: {
        coveredMinutes: sumMinutes(state.sessions.filter((s) => s.teacherId === id && s.originalTeacherId && inRange(s))),
        replacedMinutes: sumMinutes(state.sessions.filter((s) => s.originalTeacherId === id && inRange(s))),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Solicitudes de reagendamiento
// ---------------------------------------------------------------------------

function requesterRole(r: MockRequest) {
  return users.find((x) => x.id === r.requestedById)?.role ?? "teacher";
}

function canSeeRequest(r: MockRequest, u: MockUser): boolean {
  const s = sessionById(r.sessionId)!;
  if (u.role === "director") return true;
  if (u.role === "teacher") return s.teacherId === u.id;
  return r.requestedById === u.id || groupOf(s).studentIds.some((id) => u.studentIds.includes(id));
}

/**
 * Quién resuelve: dirección siempre; el profesor las pedidas por la familia;
 * la familia las pedidas por el profesor.
 */
function canDecide(r: MockRequest, u: MockUser): boolean {
  if (r.status !== "pending") return false;
  const s = sessionById(r.sessionId)!;
  switch (u.role) {
    case "director":
      return true;
    case "teacher":
      return s.teacherId === u.id && requesterRole(r) !== "teacher";
    case "guardian":
    case "student":
      return requesterRole(r) === "teacher" && groupOf(s).studentIds.some((id) => u.studentIds.includes(id));
  }
}

function toRequest(r: MockRequest, u: MockUser): RescheduleRequest {
  const s = sessionById(r.sessionId)!;
  const requester = users.find((x) => x.id === r.requestedById);
  return {
    id: r.id,
    sessionId: r.sessionId,
    groupName: groupOf(s).name,
    requestedById: r.requestedById,
    requestedByName: requester?.fullName ?? teacherById.get(r.requestedById)?.fullName ?? "Desconocido",
    originalStartsAt: r.originalStartsAt,
    originalEndsAt: r.originalEndsAt,
    proposedStartsAt: r.proposedStartsAt,
    proposedEndsAt: r.proposedEndsAt,
    proposedRoomId: r.proposedRoomId,
    proposedRoomName: r.proposedRoomId ? (roomById.get(r.proposedRoomId)?.name ?? null) : null,
    reason: r.reason,
    status: r.status,
    decisionNote: r.decisionNote,
    decidedByName: r.decidedByName,
    createdAt: r.createdAt,
    expiresAt: r.expiresAt,
    viewerCanDecide: canDecide(r, u),
  };
}

export function listRequests(status: string | null): RescheduleRequest[] {
  const u = currentUser();
  return state.requests
    .filter((r) => canSeeRequest(r, u))
    .filter((r) => !status || r.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => toRequest(r, u));
}

/** Horarios libres para mover una sesión: sin choques y dentro de las reglas. */
export function listRescheduleOptions(sessionId: string): Result<RescheduleOption[]> {
  const u = currentUser();
  const s = sessionById(sessionId);
  if (!s || !canSeeSession(s, u)) return fail(404, "not_found", "La sesión no existe");

  const g = groupOf(s);
  const durationMs = new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime();
  const earliest = Date.now() + (u.role === "director" ? 0 : POLICY.minNoticeHours * 3_600_000);

  const roomOrder = [s.roomId, ...rooms.map((r) => r.id).filter((id) => id !== s.roomId)].filter((id) => {
    return roomById.get(id)!.capacity >= g.studentIds.length;
  });

  const options: RescheduleOption[] = [];
  const day = new Date();
  day.setHours(0, 0, 0, 0);

  for (let d = 0; d <= 14 && options.length < 120; d++, day.setDate(day.getDate() + 1)) {
    if (day.getDay() === 0 || day.getDay() === 6) continue; // la academia atiende de lunes a viernes
    for (let minutes = 15 * 60; minutes + durationMs / 60_000 <= 20 * 60; minutes += 30) {
      const start = new Date(day);
      start.setHours(0, minutes, 0, 0);
      const end = new Date(start.getTime() + durationMs);
      if (start.getTime() < earliest) continue;
      if (start.toISOString() === s.startsAt) continue;

      const free = roomOrder.find(
        (roomId) =>
          !findConflict(start, end, {
            teacherId: s.teacherId,
            roomId,
            studentIds: g.studentIds,
            ignoreSessionId: s.id,
          }),
      );
      if (!free) continue;
      options.push({
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        roomId: free,
        roomName: roomById.get(free)!.name,
      });
    }
  }
  return { ok: true, value: options };
}

interface ProposalInput {
  proposedStartsAt: string;
  proposedEndsAt: string;
  proposedRoomId?: string | null;
  reason?: string | null;
}

function applyMove(s: MockSession, r: MockRequest) {
  s.startsAt = r.proposedStartsAt;
  s.endsAt = r.proposedEndsAt;
  if (r.proposedRoomId) s.roomId = r.proposedRoomId;
  s.pendingRequestId = null;
}

export function createRescheduleRequest(sessionId: string, input: ProposalInput): Result<RescheduleRequest> {
  const u = currentUser();
  const s = sessionById(sessionId);
  if (!s || !canSeeSession(s, u)) return fail(404, "not_found", "La sesión no existe");
  if (!hasReschedulePermission(s, u)) return fail(403, "forbidden", "No tienes permiso para mover esta clase");
  if (s.status !== "scheduled" || hoursUntil(s.startsAt) <= 0) {
    return fail(409, "session_not_open", "La clase ya no se puede mover");
  }
  if (s.pendingRequestId) return fail(409, "request_pending", "Ya hay una solicitud pendiente para esta clase");

  const blocked = blockedReason(s, u);
  if (blocked) return fail(422, "policy_violation", blocked);

  const g = groupOf(s);
  const start = new Date(input.proposedStartsAt);
  const end = new Date(input.proposedEndsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return fail(400, "bad_request", "El horario propuesto no es válido");
  }
  if (u.role !== "director" && hoursUntil(input.proposedStartsAt) < POLICY.minNoticeHours) {
    return fail(422, "policy_violation", `El nuevo horario debe estar al menos ${POLICY.minNoticeHours} horas más adelante.`);
  }

  const roomId = input.proposedRoomId ?? s.roomId;
  const conflict = findConflict(start, end, {
    teacherId: s.teacherId,
    roomId,
    studentIds: g.studentIds,
    ignoreSessionId: s.id,
  });
  if (conflict) return fail(409, `${conflict}_conflict`, CONFLICT_MESSAGES[conflict]);

  // Dirección, y el profesor en clases grupales, aplican el cambio directamente.
  const immediate = u.role === "director" || (u.role === "teacher" && g.kind === "group");
  const now = new Date();
  const request: MockRequest = {
    id: nextId("request"),
    sessionId: s.id,
    requestedById: u.id,
    originalStartsAt: s.startsAt,
    originalEndsAt: s.endsAt,
    proposedStartsAt: start.toISOString(),
    proposedEndsAt: end.toISOString(),
    proposedRoomId: roomId,
    reason: input.reason?.trim() || null,
    status: immediate ? "approved" : "pending",
    decisionNote: null,
    decidedByName: immediate ? u.fullName : null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + POLICY.requestExpiryHours * 3_600_000).toISOString(),
  };
  state.requests.push(request);

  const familyIds = guardiansOf(s).map((x) => x.id);
  if (immediate) {
    applyMove(s, request);
    notify(
      [...familyIds, s.teacherId],
      "session_moved",
      `Clase movida: ${g.name}`,
      `La clase pasó al ${when(request.proposedStartsAt)}.`,
    );
  } else {
    s.pendingRequestId = request.id;
    const approvers = u.role === "teacher" ? familyIds : [s.teacherId, ...users.filter((x) => x.role === "director").map((x) => x.id)];
    notify(
      approvers,
      "reschedule_requested",
      `Solicitud de cambio: ${g.name}`,
      `${u.fullName} propone mover la clase al ${when(request.proposedStartsAt)}.`,
    );
  }
  return { ok: true, value: toRequest(request, u) };
}

export function decideRescheduleRequest(
  requestId: string,
  decision: "approve" | "reject",
  note: string | null,
): Result<RescheduleRequest> {
  const u = currentUser();
  const r = state.requests.find((x) => x.id === requestId);
  if (!r || !canSeeRequest(r, u)) return fail(404, "not_found", "La solicitud no existe");
  if (r.status !== "pending") return fail(409, "already_resolved", "La solicitud ya fue resuelta");
  if (!canDecide(r, u)) return fail(403, "forbidden", "No puedes resolver esta solicitud");

  const s = sessionById(r.sessionId)!;
  const g = groupOf(s);

  if (decision === "approve") {
    const conflict = findConflict(new Date(r.proposedStartsAt), new Date(r.proposedEndsAt), {
      teacherId: s.teacherId,
      roomId: r.proposedRoomId ?? s.roomId,
      studentIds: g.studentIds,
      ignoreSessionId: s.id,
    });
    if (conflict) {
      return fail(409, `${conflict}_conflict`, `${CONFLICT_MESSAGES[conflict]} Pide al solicitante que elija otro horario.`);
    }
    applyMove(s, r);
    r.status = "approved";
  } else {
    s.pendingRequestId = null;
    r.status = "rejected";
  }
  r.decisionNote = note?.trim() || null;
  r.decidedByName = u.fullName;

  const familyIds = guardiansOf(s).map((x) => x.id);
  const everyone = [...familyIds, s.teacherId, r.requestedById];
  if (decision === "approve") {
    notify(everyone, "session_moved", `Cambio aprobado: ${g.name}`, `La clase pasó al ${when(r.proposedStartsAt)}.`);
  } else {
    notify(
      [r.requestedById],
      "reschedule_rejected",
      `Cambio rechazado: ${g.name}`,
      r.decisionNote ? `${u.fullName}: ${r.decisionNote}` : `${u.fullName} rechazó el cambio; la clase sigue igual.`,
    );
  }
  return { ok: true, value: toRequest(r, u) };
}

// ---------------------------------------------------------------------------
// Asistencia
// ---------------------------------------------------------------------------

const ATTENDANCE_STATUSES: AttendanceStatus[] = ["present", "late", "absent", "excused"];

function attendanceRecords(s: MockSession, u: MockUser): AttendanceRecord[] {
  const g = groupOf(s);
  const isFamily = u.role === "guardian" || u.role === "student";
  // Una familia ve solo a sus hijos; el resto, a todos los de la clase.
  const visible = isFamily ? g.studentIds.filter((id) => u.studentIds.includes(id)) : g.studentIds;
  return visible
    .map((id) => {
      const record = attendanceOf(s.id).get(id);
      return {
        studentId: id,
        fullName: studentById.get(id)!.fullName,
        status: record?.status ?? null,
        // La nota del profesor no se muestra a las familias.
        note: isFamily ? null : (record?.note ?? null),
        agreedInAdvance: record?.agreedInAdvance ?? false,
      };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

export function getAttendance(sessionId: string): Result<AttendanceRecord[]> {
  const u = currentUser();
  const s = sessionById(sessionId);
  if (!s || !canSeeSession(s, u)) return fail(404, "not_found", "La sesión no existe");
  return { ok: true, value: attendanceRecords(s, u) };
}

export interface AttendanceInput {
  studentId: string;
  status: AttendanceStatus;
  note?: string | null;
  agreedInAdvance?: boolean;
}

export function saveAttendance(sessionId: string, records: AttendanceInput[]): Result<AttendanceRecord[]> {
  const u = currentUser();
  const s = sessionById(sessionId);
  if (!s || !canSeeSession(s, u)) return fail(404, "not_found", "La sesión no existe");
  if (!mayMarkAttendance(s, u)) return fail(403, "forbidden", "No puedes marcar la asistencia de esta clase");

  const blocked = attendanceBlock(s);
  if (blocked) return fail(409, "attendance_closed", blocked);

  const classStudents = new Set(groupOf(s).studentIds);
  for (const r of records) {
    if (!classStudents.has(r.studentId)) {
      return fail(400, "unknown_student", "Hay un alumno que no pertenece a esta clase");
    }
    if (!ATTENDANCE_STATUSES.includes(r.status)) return fail(400, "bad_request", "Estado de asistencia no válido");
    if (r.agreedInAdvance && r.status !== "excused") {
      return fail(400, "bad_request", "Solo una ausencia justificada puede marcarse como acordada con el profesor");
    }
  }

  const current = attendanceBySession.get(s.id) ?? new Map<string, MockAttendance>();
  for (const r of records) {
    current.set(r.studentId, {
      sessionId: s.id,
      studentId: r.studentId,
      status: r.status,
      note: r.note?.trim() || null,
      agreedInAdvance: !!r.agreedInAdvance,
    });
  }
  attendanceBySession.set(s.id, current);

  // Una clase que ya empezó y se marca queda como realizada.
  if (s.status === "scheduled") s.status = "completed";

  return { ok: true, value: attendanceRecords(s, u) };
}

/** Ausencias seguidas a partir de las cuales se avisa (en el backend: `academy_settings`). */
export const ALERT_THRESHOLD = 3;

const staffOnly = () => fail(403, "forbidden", "Solo dirección y profesores ven las alertas y el reporte de asistencia.");

/**
 * Racha de ausencias por alumno y grupo. Cuenta hacia atrás las clases marcadas:
 * presente, atrasado o justificado cortan la racha; las sin marcar y las canceladas se ignoran.
 */
export function attendanceAlerts(): Result<AttendanceAlert[]> {
  const u = currentUser();
  if (u.role !== "director" && u.role !== "teacher") return staffOnly();

  const now = Date.now();
  const alerts: AttendanceAlert[] = [];

  for (const g of groups) {
    if (u.role === "teacher" && g.teacherId !== u.id) continue;
    const started = state.sessions
      .filter((s) => s.classGroupId === g.id && s.status !== "cancelled" && new Date(s.startsAt).getTime() <= now)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

    for (const studentId of g.studentIds) {
      let streak = 0;
      let counting = true;
      let lastAbsenceAt: string | null = null;
      let lastAttendedAt: string | null = null;

      for (const s of started) {
        const record = attendanceOf(s.id).get(studentId);
        if (!record) continue; // sin marcar: no corta ni suma
        if (record.status === "absent") {
          if (counting) {
            streak++;
            lastAbsenceAt ??= s.startsAt;
          }
        } else {
          counting = false;
          if (record.status === "present" || record.status === "late") lastAttendedAt ??= s.startsAt;
        }
        if (!counting && lastAttendedAt) break;
      }

      if (streak >= ALERT_THRESHOLD && lastAbsenceAt) {
        alerts.push({
          student: { id: studentId, fullName: studentById.get(studentId)!.fullName },
          groupId: g.id,
          groupName: g.name,
          teacher: { id: g.teacherId, fullName: teacherById.get(g.teacherId)!.fullName },
          consecutiveAbsences: streak,
          lastAbsenceAt,
          lastAttendedAt,
        });
      }
    }
  }

  alerts.sort(
    (a, b) => b.consecutiveAbsences - a.consecutiveAbsences || a.student.fullName.localeCompare(b.student.fullName, "es"),
  );
  return { ok: true, value: alerts };
}

type Summary = AttendanceReportRow["summary"];

const emptySummary = (): Summary => ({ attendedMinutes: 0, present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 });

function addSummary(into: Summary, other: Summary) {
  into.attendedMinutes += other.attendedMinutes;
  into.present += other.present;
  into.late += other.late;
  into.absent += other.absent;
  into.excused += other.excused;
  into.unmarked += other.unmarked;
}

/** (presentes + atrasos) / (presentes + atrasos + ausentes + justificadas); las sin marcar no cuentan. */
function attendanceRate(summary: Summary): number | null {
  const attended = summary.present + summary.late;
  const marked = attended + summary.absent + summary.excused;
  return marked === 0 ? null : attended / marked;
}

export function attendanceReport(from: Date, to: Date, groupBy: AttendanceGroupBy): Result<AttendanceReportRow[]> {
  const u = currentUser();
  if (u.role !== "director" && u.role !== "teacher") return staffOnly();

  const sessionsOf = (groupIds: Set<string>) => state.sessions.filter((s) => groupIds.has(s.classGroupId));
  const visibleGroups = groups.filter((g) => u.role === "director" || g.teacherId === u.id);
  const rows: AttendanceReportRow[] = [];
  const push = (id: string, name: string, summary: Summary) =>
    rows.push({ id, name, summary, attendanceRate: attendanceRate(summary) });

  if (groupBy === "student") {
    const ids = new Set(visibleGroups.flatMap((g) => g.studentIds));
    for (const studentId of ids) {
      const mine = new Set(visibleGroups.filter((g) => g.studentIds.includes(studentId)).map((g) => g.id));
      push(studentId, studentById.get(studentId)!.fullName, attendanceSummary(sessionsOf(mine), studentId, from, to));
    }
  } else if (groupBy === "group") {
    for (const g of visibleGroups) {
      const total = emptySummary();
      const sessions = sessionsOf(new Set([g.id]));
      for (const studentId of g.studentIds) addSummary(total, attendanceSummary(sessions, studentId, from, to));
      push(g.id, g.name, total);
    }
  } else {
    // Por quien dictó la clase (con reemplazos), igual que las horas de la vista de profesores.
    for (const t of teachers.filter((x) => u.role === "director" || x.id === u.id)) {
      const total = emptySummary();
      for (const s of state.sessions.filter((x) => x.teacherId === t.id)) {
        for (const studentId of groupOf(s).studentIds) addSummary(total, attendanceSummary([s], studentId, from, to));
      }
      push(t.id, t.fullName, total);
    }
  }

  rows.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return { ok: true, value: rows };
}

// ---------------------------------------------------------------------------
// Avisos
// ---------------------------------------------------------------------------

function toNotification(n: MockNotification, userId: string): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt,
    readAt: n.readBy.includes(userId) ? n.createdAt : null,
  };
}

export function listNotifications(): Notification[] {
  const u = currentUser();
  return state.notifications
    .filter((n) => n.recipientIds.includes(u.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((n) => toNotification(n, u.id));
}
