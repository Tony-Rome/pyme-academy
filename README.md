# Academia de Música

Plataforma web para gestionar una academia musical: agenda, reagendamiento sin choques, asistencia y, en fases posteriores, cobros, retención y pedagogía.

La planificación está en [`docs/`](docs/):

| Documento | Contenido |
|---|---|
| [01-alcance-mvp.md](docs/01-alcance-mvp.md) | Alcance original, reglas de reagendamiento, permisos y requisitos no funcionales |
| [02-historias-de-usuario.md](docs/02-historias-de-usuario.md) | Historias de usuario con criterios de aceptación |
| [03-esquema-bd.md](docs/03-esquema-bd.md) | Modelo de datos y decisiones de diseño |
| [04-mvp-fases.md](docs/04-mvp-fases.md) | **Hoja de ruta vigente**, fase por fase |

## Estructura

```
apps/
  api/            API en Go (chi + pgx). Contrato en openapi/openapi.yaml
    migrations/   Migraciones SQL (goose), embebidas en el binario
  web/            Web en React + Vite + TanStack Query
packages/
  api-client/     Cliente TypeScript generado desde el contrato OpenAPI
docs/             Planificación
```

## Requisitos
- Go 1.27 o superior
- Node 24 o superior (con npm)
- Docker (para PostgreSQL local)

## Puesta en marcha

```bash
docker compose up -d --wait
npm install
```

API, con migraciones automáticas al arrancar.

PowerShell (Windows):

```powershell
cd apps/api
$env:DATABASE_URL = "postgres://musicacademy:musicacademy@localhost:5433/musicacademy?sslmode=disable"
$env:MIGRATE_ON_START = "true"
go run ./cmd/api
```

Bash (Git Bash, macOS, Linux):

```bash
cd apps/api
DATABASE_URL='postgres://musicacademy:musicacademy@localhost:5433/musicacademy?sslmode=disable' MIGRATE_ON_START=true go run ./cmd/api
```

Comprobación: `http://localhost:8080/api/v1/readyz` debe responder `{"status":"ok"}`.

Web:

```bash
npm run dev:web
```

Abre http://localhost:5173. Por defecto la web usa **datos de ejemplo** (API simulada en la propia página, sin necesitar la API ni Postgres): la insignia de la cabecera dice "Datos de ejemplo". Sin sesión, cualquier ruta lleva a la pantalla de acceso (`/entrar`), que en este modo ofrece tres cuentas de demostración (dirección, profesor y apoderado; contraseña `demo1234`). Eligiendo una se rellena el formulario y se entra con «Entrar». Son cuentas de mentira que solo existen en la simulación.

Para hablar con la API real, cambia `VITE_MOCK_API` a `false` en `apps/web/.env.development` (o crea `apps/web/.env.development.local` con ese valor, que Git ignora) y levanta la API como se indica arriba. La web usa un proxy hacia `localhost:8080` y la insignia debe decir "Conectado". Los endpoints nuevos del contrato responden 501 hasta que se implementen.

## Cómo se desarrolla la interfaz antes que el backend

1. El contrato (`apps/api/openapi/openapi.yaml`) define los endpoints antes de implementarlos.
2. La API simulada (`apps/web/src/mocks/`) responde a ese contrato con datos de ejemplo; los tipos vienen del cliente generado, así que si el contrato cambia, TypeScript marca lo que hay que ajustar.
3. Al implementar un endpoint en Go se cumple el mismo contrato y la web no cambia.

El código de simulación no entra en el build de producción.

## Pruebas

PowerShell (Windows):

```powershell
cd apps/api
$env:TEST_DATABASE_URL = "postgres://musicacademy:musicacademy@localhost:5433/postgres?sslmode=disable"
go test ./...
```

Bash:

```bash
cd apps/api
TEST_DATABASE_URL='postgres://musicacademy:musicacademy@localhost:5433/postgres?sslmode=disable' go test ./...
```

Las pruebas de integración crean una base de datos temporal por prueba y la borran al terminar. Sin `TEST_DATABASE_URL` se omiten. Cubren las restricciones del esquema: choques de sala y de profesor, reemplazos, materiales, consentimientos y solicitudes de reagendamiento.

```bash
npm run typecheck    # tipos de la web y del cliente
npm run build:web
```

## Contrato de la API y código generado

La fuente de verdad es [`apps/api/openapi/openapi.yaml`](apps/api/openapi/openapi.yaml). Al cambiarlo:

```bash
cd apps/api && go generate ./...    # servidor (internal/api/api.gen.go)
npm run generate                    # cliente TypeScript (packages/api-client/src/schema.d.ts)
```

La integración continua falla si el código generado no coincide con el contrato.

## Migraciones

Están en `apps/api/migrations/`. Para cambiar el esquema se **agrega** una migración nueva (`00002_...sql`); nunca se edita una ya aplicada.
