import { createApiClient } from "@music-academy/api-client";

// Con VITE_MOCK_API=true las peticiones se resuelven en la página con los datos
// de ejemplo (sin red ni Service Worker). `import.meta.env.DEV` se escribe aquí,
// junto al import dinámico, para que el build de producción elimine la rama entera.
const useMocks = import.meta.env.DEV && import.meta.env.VITE_MOCK_API === "true";

export const api = createApiClient(
  "/api/v1",
  useMocks
    ? { fetch: async (request) => (await import("./mocks/fetch")).mockFetch(request) }
    : undefined,
);
