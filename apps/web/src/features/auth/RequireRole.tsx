import { Navigate, Outlet } from "react-router";
import { useViewer } from "@/features/viewer/useViewer";
import type { Role } from "@/lib/types";

/**
 * Oculta pantallas que no corresponden al rol activo (por ejemplo, "Mis alumnos" a una familia).
 * Es solo comodidad de la interfaz: el servidor es quien decide qué datos devuelve a cada rol.
 */
export function RequireRole({ roles }: { roles: Role[] }) {
  const viewer = useViewer().data;
  if (!viewer || !roles.includes(viewer.activeRole)) return <Navigate to="/calendario" replace />;
  return <Outlet />;
}
