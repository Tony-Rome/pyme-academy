import { delay, http, HttpResponse, type HttpResponseResolver, type JsonBodyType } from "msw";
import * as store from "./store";

const BASE = "/api/v1";
const latency = () => delay(120);

function problem(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status });
}

/** Como la API real: sin sesión abierta, todo responde 401. */
function authed(resolver: HttpResponseResolver): HttpResponseResolver {
  return async (info) => {
    if (!store.isAuthenticated()) {
      return problem(401, "unauthenticated", "Inicia sesión para continuar.");
    }
    await latency();
    return resolver(info);
  };
}

/** `from` y `to` opcionales; sin ellos, el mes actual. */
function periodFrom(url: URL): { from: Date; to: Date } | null {
  const rawFrom = url.searchParams.get("from");
  const rawTo = url.searchParams.get("to");
  if (!rawFrom && !rawTo) return store.currentMonth();
  const from = new Date(rawFrom ?? "");
  const to = new Date(rawTo ?? "");
  return Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) ? null : { from, to };
}

const badPeriod = () => problem(400, "bad_request", "from y to deben ser fechas válidas");

const respond = <T extends JsonBodyType>(result: store.Result<T>, status = 200) =>
  result.ok ? HttpResponse.json(result.value, { status }) : problem(result.status, result.code, result.message);

export const handlers = [
  http.get(`${BASE}/healthz`, () => HttpResponse.json({ status: "ok" })),
  http.get(`${BASE}/readyz`, () => HttpResponse.json({ status: "ok" })),

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(300);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
      return problem(400, "bad_request", "Faltan el correo o la contraseña");
    }
    return respond(store.login(body.email, body.password));
  }),
  http.post(`${BASE}/auth/logout`, () => {
    store.logout();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${BASE}/me`, authed(() => HttpResponse.json(store.viewerPayload()))),

  http.get(`${BASE}/rooms`, authed(() => HttpResponse.json(store.listRooms()))),
  http.get(
    `${BASE}/teachers`,
    authed(({ request }) => {
      const range = periodFrom(new URL(request.url));
      return range ? respond(store.listTeachers(range.from, range.to)) : badPeriod();
    }),
  ),
  http.get(
    `${BASE}/teachers/:teacherId`,
    authed(({ params, request }) => {
      const range = periodFrom(new URL(request.url));
      return range ? respond(store.getTeacher(String(params.teacherId), range.from, range.to)) : badPeriod();
    }),
  ),
  http.get(`${BASE}/class-groups`, authed(() => HttpResponse.json(store.listClassGroups()))),

  http.get(
    `${BASE}/students`,
    authed(({ request }) => {
      const range = periodFrom(new URL(request.url));
      return range ? HttpResponse.json(store.listStudents(range.from, range.to)) : badPeriod();
    }),
  ),
  http.get(
    `${BASE}/students/:studentId`,
    authed(({ params, request }) => {
      const range = periodFrom(new URL(request.url));
      if (!range) return badPeriod();
      const student = store.getStudent(String(params.studentId), range.from, range.to);
      return student ? HttpResponse.json(student) : problem(404, "not_found", "El alumno no existe");
    }),
  ),

  http.get(
    `${BASE}/sessions`,
    authed(({ request }) => {
      const url = new URL(request.url);
      const from = new Date(url.searchParams.get("from") ?? "");
      const to = new Date(url.searchParams.get("to") ?? "");
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return problem(400, "bad_request", "from y to deben ser fechas válidas");
      }
      return HttpResponse.json(
        store.listSessions(from, to, {
          teacherId: url.searchParams.get("teacherId"),
          roomId: url.searchParams.get("roomId"),
        }),
      );
    }),
  ),
  http.get(
    `${BASE}/sessions/:sessionId`,
    authed(({ params }) => {
      const session = store.getSession(String(params.sessionId));
      return session ? HttpResponse.json(session) : problem(404, "not_found", "La sesión no existe");
    }),
  ),

  http.get(
    `${BASE}/sessions/:sessionId/reschedule-options`,
    authed(({ params }) => respond(store.listRescheduleOptions(String(params.sessionId)))),
  ),
  http.post(
    `${BASE}/sessions/:sessionId/reschedule-requests`,
    authed(async ({ params, request }) => {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body || typeof body.proposedStartsAt !== "string" || typeof body.proposedEndsAt !== "string") {
        return problem(400, "bad_request", "Faltan proposedStartsAt o proposedEndsAt");
      }
      return respond(
        store.createRescheduleRequest(String(params.sessionId), {
          proposedStartsAt: body.proposedStartsAt,
          proposedEndsAt: body.proposedEndsAt,
          proposedRoomId: typeof body.proposedRoomId === "string" ? body.proposedRoomId : null,
          reason: typeof body.reason === "string" ? body.reason : null,
        }),
        201,
      );
    }),
  ),
  http.post(
    `${BASE}/reschedule-requests/:requestId/decision`,
    authed(async ({ params, request }) => {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body || (body.decision !== "approve" && body.decision !== "reject")) {
        return problem(400, "bad_request", "decision debe ser approve o reject");
      }
      return respond(
        store.decideRescheduleRequest(
          String(params.requestId),
          body.decision,
          typeof body.note === "string" ? body.note : null,
        ),
      );
    }),
  ),
  http.get(
    `${BASE}/sessions/:sessionId/attendance`,
    authed(({ params }) => respond(store.getAttendance(String(params.sessionId)))),
  ),
  http.put(
    `${BASE}/sessions/:sessionId/attendance`,
    authed(async ({ params, request }) => {
      const body = (await request.json().catch(() => null)) as { records?: unknown } | null;
      if (!body || !Array.isArray(body.records)) return problem(400, "bad_request", "Falta la lista de registros");
      return respond(store.saveAttendance(String(params.sessionId), body.records as store.AttendanceInput[]));
    }),
  ),
  http.get(
    `${BASE}/reschedule-requests`,
    authed(({ request }) => {
      const status = new URL(request.url).searchParams.get("status");
      return HttpResponse.json(store.listRequests(status));
    }),
  ),

  http.get(`${BASE}/notifications`, authed(() => HttpResponse.json(store.listNotifications()))),

  // Lo que aún no se simula responde igual que la API real sin implementar.
  http.all(`${BASE}/*`, () => problem(501, "not_implemented", "Este endpoint aún no está simulado")),
];
