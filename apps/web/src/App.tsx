import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/components/AppShell";
import { CalendarPage } from "@/features/calendar/CalendarPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/calendario" replace />} />
          <Route path="calendario" element={<CalendarPage />} />
          <Route path="*" element={<NotFound />} />
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
