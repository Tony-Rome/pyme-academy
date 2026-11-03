import { Eye, EyeOff, Music } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useViewer } from "@/features/viewer/useViewer";
import { MOCK_API } from "@/lib/env";
import { ApiError } from "@/lib/problem";
import { DemoAccounts } from "./DemoAccounts";
import { useLogin } from "./hooks";

export function LoginPage() {
  const viewer = useViewer();
  const location = useLocation();
  const login = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Quien ya tiene sesión no necesita ver esta pantalla; vuelve a donde iba.
  if (viewer.data) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? "/calendario"} replace />;
  }

  const error = login.error;
  const message =
    error instanceof ApiError
      ? error.message
      : error
        ? "No se pudo iniciar sesión. Inténtalo de nuevo."
        : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    login.mutate({ email: email.trim(), password });
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <Music className="size-5" aria-hidden />
            Academia de Música
          </div>
          <CardTitle>
            <h1>Iniciar sesión</h1>
          </CardTitle>
          <CardDescription>Entra para ver tus clases y solicitudes.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-4" noValidate={false}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!message}
                aria-describedby={message ? "login-error" : undefined}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="flex gap-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!message}
                  aria-describedby={message ? "login-error" : undefined}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            {message && (
              <p
                id="login-error"
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
              >
                {message}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Entrando…" : "Entrar"}
            </Button>
          </form>

          {import.meta.env.DEV && MOCK_API && (
            <DemoAccounts
              onPick={(account) => {
                setEmail(account.email);
                setPassword(account.password);
                login.reset();
              }}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
