import { delay, http, HttpResponse } from "msw";
import * as store from "./store";

const BASE = "/api/v1";
const latency = () => delay(120);

function problem(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message }, { status });
}

export const handlers = [
  http.get(`${BASE}/healthz`, () => HttpResponse.json({ status: "ok" })),
  http.get(`${BASE}/readyz`, () => HttpResponse.json({ status: "ok" })),

  http.get(`${BASE}/me`, async () => {
    await latency();
    return HttpResponse.json(store.viewerPayload());
  }),

  http.get(`${BASE}/rooms`, async () => {
    await latency();
    return HttpResponse.json(store.listRooms());
  }),
  http.get(`${BASE}/teachers`, async () => {
    await latency();
    return HttpResponse.json(store.listTeachers());
  }),
  http.get(`${BASE}/class-groups`, async () => {
    await latency();
    return HttpResponse.json(store.listClassGroups());
  }),

  http.get(`${BASE}/sessions`, async ({ request }) => {
    await latency();
    const url = new URL(request.url);
    const from = new Date(url.searchParams.get("from") ?? "");
    const to = new Date(url.searchParams.get("to") ?? "");
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return problem(400, "bad_request", "from y to deben ser fechas válidas");
    }
    return HttpResponse.json(store.listSessions(from, to));
  }),
  http.get(`${BASE}/sessions/:sessionId`, async ({ params }) => {
    await latency();
    const session = store.getSession(String(params.sessionId));
    return session ? HttpResponse.json(session) : problem(404, "not_found", "La sesión no existe");
  }),

  http.get(`${BASE}/reschedule-requests`, async ({ request }) => {
    await latency();
    const status = new URL(request.url).searchParams.get("status");
    return HttpResponse.json(store.listRequests(status));
  }),

  http.get(`${BASE}/notifications`, async () => {
    await latency();
    return HttpResponse.json(store.listNotifications());
  }),

  // Lo que aún no se simula responde igual que la API real sin implementar.
  http.all(`${BASE}/*`, () =>
    problem(501, "not_implemented", "Este endpoint aún no está simulado"),
  ),
];
