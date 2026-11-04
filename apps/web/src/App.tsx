import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AppShell } from "@/components/AppShell";
import { LoginPage } from "@/features/auth/LoginPage";
import { AttendancePage } from "@/features/attendance/AttendancePage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { RequireRole } from "@/features/auth/RequireRole";
import { MyClassesPage } from "@/features/students/MyClassesPage";
import { StudentDetailPage } from "@/features/students/StudentDetailPage";
import { StudentsPage } from "@/features/students/StudentsPage";
import { TeacherDetailPage } from "@/features/teachers/TeacherDetailPage";
import { TeachersPage } from "@/features/teachers/TeachersPage";
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

            <Route element={<RequireRole roles={["teacher", "director"]} />}>
              <Route path="asistencia" element={<AttendancePage />} />
              <Route path="alumnos" element={<StudentsPage />} />
              <Route path="alumnos/:studentId" element={<StudentDetailPage />} />
            </Route>
            <Route element={<RequireRole roles={["director"]} />}>
              <Route path="profesores" element={<TeachersPage />} />
              <Route path="profesores/:teacherId" element={<TeacherDetailPage />} />
            </Route>
            <Route element={<RequireRole roles={["guardian", "student"]} />}>
              <Route path="mis-clases" element={<MyClassesPage />} />
            </Route>
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
