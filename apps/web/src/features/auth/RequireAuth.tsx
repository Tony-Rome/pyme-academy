import { Navigate, Outlet, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { useViewer } from "@/features/viewer/useViewer";

/** Deja pasar solo a quien tiene sesión; al resto lo lleva a /entrar y luego lo devuelve aquí. */
export function RequireAuth() {
  const viewer = useViewer();
  const location = useLocation();

  if (viewer.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted-foreground" role="status">
        Cargando…
      </div>
    );
  }

  if (viewer.isError) {
    return (
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <div className="space-y-3">
          <p>No se pudo conectar con el servidor.</p>
          <Button onClick={() => viewer.refetch()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  if (viewer.data === null) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
