import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

export type { components, paths } from "./schema";
export type Health = components["schemas"]["Health"];

/**
 * Cliente tipado de la API. Compartido por la web y, más adelante, la app móvil.
 * `baseUrl` incluye el prefijo de versión (por ejemplo "/api/v1").
 */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}

export type ApiClient = ReturnType<typeof createApiClient>;
