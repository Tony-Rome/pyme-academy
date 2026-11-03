import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

export type { components, paths } from "./schema";
export type Health = components["schemas"]["Health"];

/**
 * Cliente tipado de la API. Compartido por la web y, más adelante, la app móvil.
 * `baseUrl` incluye el prefijo de versión (por ejemplo "/api/v1").
 */
export function createApiClient(
  baseUrl: string,
  options?: {
    /** Sustituye a `fetch` (por ejemplo, para una API simulada durante el desarrollo). */
    fetch?: (request: Request) => Promise<Response>;
  },
) {
  return createClient<paths>({ baseUrl, fetch: options?.fetch });
}

export type ApiClient = ReturnType<typeof createApiClient>;
