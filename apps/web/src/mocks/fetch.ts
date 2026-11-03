import { getResponse } from "msw";
import { handlers } from "./handlers";

/** Resuelve la petición con los handlers de MSW directamente, sin red. */
export async function mockFetch(request: Request): Promise<Response> {
  const response = await getResponse(handlers, request);
  return (
    response ??
    Response.json(
      { code: "not_found", message: "No hay simulación para esta ruta" },
      { status: 404 },
    )
  );
}
