/**
 * La web habla con una API simulada (MSW) en lugar de la real.
 * Solo existe en desarrollo: `import.meta.env.DEV` es `false` en el build de producción,
 * así el código de simulación se elimina del bundle aunque la variable estuviera definida.
 */
export const MOCK_API = import.meta.env.DEV && import.meta.env.VITE_MOCK_API === "true";
