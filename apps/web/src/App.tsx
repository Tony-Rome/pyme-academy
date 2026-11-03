import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/components/AppShell";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { CalendarPage } from "@/features/calendar/CalendarPage";
import { RequestsPage } from "@/features/reschedule/RequestsPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="entrar" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/calendario" replace />} />
            <Route path="calendario" element={<CalendarPage />} />
            <Route path="solicitudes" element={<RequestsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-lg font-semibold">Página no encontrada</h1>
      <p className="text-muted-foreground">La dirección no existe.</p>
    </div>
  );
}
