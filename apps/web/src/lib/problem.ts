/** Error de la API con el código estable del contrato (`Problem`). */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Convierte la respuesta de error de openapi-fetch en un ApiError. */
export function toApiError(error: unknown, response: Response): ApiError {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const { code, message } = error as { code: unknown; message: unknown };
    return new ApiError(String(code), String(message), response.status);
  }
  return new ApiError("unknown", "Algo salió mal. Inténtalo de nuevo.", response.status);
}
