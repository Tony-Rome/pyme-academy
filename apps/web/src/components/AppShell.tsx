import { CalendarDays, Inbox, LogOut, Music, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { ApiStatus } from "@/components/ApiStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks";
import { useRequests } from "@/features/reschedule/hooks";
import { useViewer } from "@/features/viewer/useViewer";
import { ROLE_LABELS } from "@/lib/format";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof CalendarDays };

const CALENDAR: NavItem = { to: "/calendario", label: "Calendario", icon: CalendarDays };
const REQUESTS: NavItem = { to: "/solicitudes", label: "Solicitudes", icon: Inbox };

/** Qué ve cada rol en el menú. */
function navFor(role: Role | undefined): NavItem[] {
  switch (role) {
    case "director":
      return [CALENDAR, { to: "/alumnos", label: "Alumnos", icon: Users }, REQUESTS];
    case "teacher":
      return [CALENDAR, { to: "/alumnos", label: "Mis alumnos", icon: Users }, REQUESTS];
    default:
      return [CALENDAR, { to: "/mis-clases", label: "Mis clases", icon: Users }, REQUESTS];
  }
}

export function AppShell() {
  const viewer = useViewer().data;
  const logout = useLogout();

  // Solo se cuentan las solicitudes que esta persona puede resolver.
  const pending = useRequests("pending");
  const actionable = pending.data?.filter((r) => r.viewerCanDecide).length ?? 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <div className="flex items-center gap-2 font-semibold">
            <Music className="size-5" aria-hidden />
            <span>Academia de Música</span>
          </div>

          <nav aria-label="Principal" className="flex items-center gap-1">
            {navFor(viewer?.activeRole).map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground",
                  )
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
                {to === "/solicitudes" && actionable > 0 && (
                  <Badge aria-label={`${actionable} por resolver`}>{actionable}</Badge>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ApiStatus />
            {viewer && (
              <>
                <div className="text-right text-sm leading-tight">
                  <div className="font-medium">{viewer.fullName}</div>
                  <div className="text-xs text-muted-foreground">{ROLE_LABELS[viewer.activeRole]}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  <LogOut data-icon="inline-start" />
                  Salir
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
