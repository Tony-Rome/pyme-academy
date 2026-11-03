// Estado en memoria de la API simulada y reglas de visibilidad por rol.
import type { ClassGroup, Notification, RescheduleRequest, Session, Viewer } from "@/lib/types";
import {
  buildSeed,
  groups,
  rooms,
  students,
  teachers,
  users,
  type MockGroup,
  type MockNotification,
  type MockRequest,
  type MockSession,
  type MockUser,
} from "./seed";

const VIEWER_KEY = "mock-viewer-id";

const data = buildSeed();
const state = {
  sessions: data.sessions,
  requests: data.requests,
  notifications: data.notifications,
  viewerId: readStoredViewer() ?? users[0].id,
};

function readStoredViewer(): string | null {
  try {
    const id = localStorage.getItem(VIEWER_KEY);
    return id && users.some((u) => u.id === id) ? id : null;
  } catch {
    return null;
  }
}

export const demoViewers = users.map((u) => ({ id: u.id, fullName: u.fullName, role: u.role }));

export function getViewerId() {
  return state.viewerId;
}

export function setViewer(id: string) {
  if (!users.some((u) => u.id === id)) return;
  state.viewerId = id;
  try {
    localStorage.setItem(VIEWER_KEY, id);
  } catch {
    // sin almacenamiento: el cambio vale solo para esta carga
  }
}

export function currentUser(): MockUser {
  return users.find((u) => u.id === state.viewerId)!;
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

const studentById = new Map(students.map((x) => [x.id, x]));
const teacherById = new Map(teachers.map((x) => [x.id, x]));
const roomById = new Map(rooms.map((x) => [x.id, x]));
const groupById = new Map(groups.map((x) => [x.id, x]));

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

function canSeeSession(s: MockSession, u: MockUser): boolean {
  const g = groupById.get(s.classGroupId)!;
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

function toSession(s: MockSession, u: MockUser): Session {
  const g = groupById.get(s.classGroupId)!;
  const teacher = teacherById.get(s.teacherId)!;
  const original = s.originalTeacherId ? teacherById.get(s.originalTeacherId)! : null;
  const room = roomById.get(s.roomId) ?? null;

  const visibleStudentIds =
    u.role === "guardian" || u.role === "student"
      ? g.studentIds.filter((id) => u.studentIds.includes(id))
      : g.studentIds;

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
  };
}

export function listSessions(from: Date, to: Date): Session[] {
  const u = currentUser();
  return state.sessions
    .filter((s) => canSeeSession(s, u))
    .filter((s) => new Date(s.endsAt) > from && new Date(s.startsAt) < to)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((s) => toSession(s, u));
}

export function getSession(id: string): Session | null {
  const u = currentUser();
  const s = state.sessions.find((x) => x.id === id);
  return s && canSeeSession(s, u) ? toSession(s, u) : null;
}

export function listRooms() {
  return rooms;
}

export function listTeachers() {
  return teachers;
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

function toRequest(r: MockRequest): RescheduleRequest {
  const s = state.sessions.find((x) => x.id === r.sessionId)!;
  const g = groupById.get(s.classGroupId)!;
  const requester = users.find((u) => u.id === r.requestedById);
  return {
    id: r.id,
    sessionId: r.sessionId,
    groupName: g.name,
    requestedById: r.requestedById,
    requestedByName: requester?.fullName ?? "Desconocido",
    originalStartsAt: s.startsAt,
    originalEndsAt: s.endsAt,
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
  };
}

export function listRequests(status: string | null): RescheduleRequest[] {
  const u = currentUser();
  return state.requests
    .filter((r) => {
      const s = state.sessions.find((x) => x.id === r.sessionId)!;
      if (u.role === "director") return true;
      if (u.role === "teacher") return s.teacherId === u.id;
      return r.requestedById === u.id;
    })
    .filter((r) => !status || r.status === status)
    .map(toRequest);
}

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
