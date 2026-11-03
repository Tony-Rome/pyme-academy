import { CalendarDays, Music } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { ApiStatus } from "@/components/ApiStatus";
import { RoleSwitcher } from "@/features/viewer/RoleSwitcher";
import { MOCK_API } from "@/lib/env";
import { cn } from "@/lib/utils";

const NAV = [{ to: "/calendario", label: "Calendario", icon: CalendarDays }];

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <div className="flex items-center gap-2 font-semibold">
            <Music className="size-5" aria-hidden />
            <span>Academia de Música</span>
          </div>

          <nav aria-label="Principal" className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
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
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ApiStatus />
            {import.meta.env.DEV && MOCK_API && <RoleSwitcher />}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
        <Outlet />
      </main>
    </div>
  );
}
