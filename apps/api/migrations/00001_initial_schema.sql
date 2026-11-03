-- +goose Up
-- Esquema PostgreSQL, Fase 1 (MVP).
-- Requiere PostgreSQL 13+ (gen_random_uuid) y la extensión btree_gist.

CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------
-- Academias y configuración
-- ---------------------------------------------------------------
CREATE TABLE academies (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    timezone    text NOT NULL DEFAULT 'America/Santiago',
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE academy_settings (
    academy_id                  uuid PRIMARY KEY REFERENCES academies(id) ON DELETE CASCADE,
    reschedule_min_notice_hours integer NOT NULL DEFAULT 24 CHECK (reschedule_min_notice_hours >= 0),
    reschedule_approver         text NOT NULL DEFAULT 'teacher'
                                CHECK (reschedule_approver IN ('none','teacher','director','guardian')),
    reschedule_monthly_limit    integer NOT NULL DEFAULT 2 CHECK (reschedule_monthly_limit >= 0),
    request_expiry_hours        integer NOT NULL DEFAULT 48 CHECK (request_expiry_hours > 0),
    student_own_account_min_age integer NOT NULL DEFAULT 14,
    updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------
-- Personas y roles
-- ---------------------------------------------------------------
CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    email         citext NOT NULL,
    password_hash text,                       -- NULL hasta aceptar la invitación
    full_name     text NOT NULL,
    phone         text,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (academy_id, email),
    UNIQUE (academy_id, id)                   -- permite FKs compuestas por academia
);

CREATE TABLE user_roles (
    user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role     text NOT NULL CHECK (role IN ('director','teacher','guardian','student')),
    PRIMARY KEY (user_id, role)
);

CREATE TABLE invitations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id  uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    email       citext NOT NULL,
    role        text NOT NULL CHECK (role IN ('director','teacher','guardian','student')),
    token_hash  text NOT NULL UNIQUE,         -- se guarda el hash, nunca el token
    invited_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    expires_at  timestamptz NOT NULL,
    accepted_at timestamptz
);

-- Alumnos: pueden existir sin cuenta (menores).
CREATE TABLE students (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id  uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
    full_name   text NOT NULL,
    birth_date  date NOT NULL,
    notes       text,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (academy_id, id)
);

CREATE TABLE guardianships (
    guardian_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id       uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    relationship     text,                    -- madre, padre, tutor...
    is_primary       boolean NOT NULL DEFAULT false,
    consent_at       timestamptz,             -- consentimiento sobre los datos del menor
    PRIMARY KEY (guardian_user_id, student_id)
);

CREATE TABLE teacher_availability (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weekday     smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),  -- 0 = domingo
    start_time  time NOT NULL,
    end_time    time NOT NULL,
    CHECK (end_time > start_time)
);

-- ---------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------
CREATE TABLE instruments (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name       text NOT NULL,
    UNIQUE (academy_id, name)
);

CREATE TABLE genres (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name       text NOT NULL,
    UNIQUE (academy_id, name)
);

CREATE TABLE levels (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name       text NOT NULL,
    sort_order smallint NOT NULL DEFAULT 0,
    UNIQUE (academy_id, name)
);

CREATE TABLE rooms (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name       text NOT NULL,
    capacity   integer NOT NULL DEFAULT 1 CHECK (capacity > 0),
    notes      text,
    is_active  boolean NOT NULL DEFAULT true,
    UNIQUE (academy_id, name)
);

-- ---------------------------------------------------------------
-- Feriados y cierres
-- ---------------------------------------------------------------
CREATE TABLE closures (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id           uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    starts_on            date NOT NULL,
    ends_on              date NOT NULL,
    reason               text NOT NULL,
    grants_makeup_credit boolean NOT NULL DEFAULT false,  -- el crédito se aplica en la fase 2
    created_by           uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at           timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_on >= starts_on)
);
CREATE INDEX closures_academy_dates_idx ON closures (academy_id, starts_on, ends_on);

-- ---------------------------------------------------------------
-- Grupos de clase, inscripciones y sesiones
-- ---------------------------------------------------------------
CREATE TABLE class_groups (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id       uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name             text NOT NULL,
    instrument_id    uuid REFERENCES instruments(id),
    genre_id         uuid REFERENCES genres(id),
    level_id         uuid REFERENCES levels(id),
    min_age          smallint,
    max_age          smallint,
    kind             text NOT NULL DEFAULT 'group' CHECK (kind IN ('individual','group')),
    capacity         integer NOT NULL DEFAULT 1 CHECK (capacity > 0),
    teacher_id       uuid NOT NULL REFERENCES users(id),
    default_room_id  uuid REFERENCES rooms(id),
    weekday          smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_time       time NOT NULL,
    duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
    starts_on        date NOT NULL,
    ends_on          date,
    is_active        boolean NOT NULL DEFAULT true,
    CHECK (max_age IS NULL OR min_age IS NULL OR max_age >= min_age),
    CHECK (ends_on IS NULL OR ends_on >= starts_on),
    UNIQUE (academy_id, id)
);

CREATE TABLE enrollments (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    class_group_id uuid NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
    student_id     uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
    started_on     date NOT NULL DEFAULT current_date,
    ended_on       date,
    UNIQUE (class_group_id, student_id)
);

CREATE TABLE lesson_plans (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    author_id     uuid NOT NULL REFERENCES users(id),
    title         text NOT NULL,
    objectives    text,
    activities    text,
    repertoire    text,
    duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    instrument_id uuid REFERENCES instruments(id),
    genre_id      uuid REFERENCES genres(id),
    level_id      uuid REFERENCES levels(id),
    min_age       smallint,
    max_age       smallint,
    is_template   boolean NOT NULL DEFAULT false,
    is_shared     boolean NOT NULL DEFAULT false,   -- visible para otros profesores
    created_at    timestamptz NOT NULL DEFAULT now(),
    CHECK (max_age IS NULL OR min_age IS NULL OR max_age >= min_age)
);

-- Una sesión es una clase concreta en una fecha y hora.
CREATE TABLE sessions (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id     uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    class_group_id uuid NOT NULL REFERENCES class_groups(id) ON DELETE CASCADE,
    teacher_id     uuid NOT NULL REFERENCES users(id),
    room_id        uuid REFERENCES rooms(id),
    starts_at      timestamptz NOT NULL,
    ends_at        timestamptz NOT NULL,
    status         text NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','completed','cancelled')),
    cancel_reason  text,
    lesson_plan_id uuid REFERENCES lesson_plans(id) ON DELETE SET NULL,
    teacher_notes  text,                            -- qué se logró en la clase
    moved_from_session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
    original_teacher_id uuid REFERENCES users(id),  -- profesor titular cuando hay reemplazo
    notes_shared   boolean NOT NULL DEFAULT false,  -- la nota es visible para los apoderados
    closure_id     uuid REFERENCES closures(id) ON DELETE SET NULL,  -- cancelada por un cierre
    CHECK (original_teacher_id IS NULL OR original_teacher_id <> teacher_id),
    CHECK (ends_at > starts_at),
    -- Sin choques de sala entre sesiones programadas
    CONSTRAINT no_room_overlap EXCLUDE USING gist (
        room_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&
    ) WHERE (status = 'scheduled' AND room_id IS NOT NULL),
    -- Sin choques de profesor entre sesiones programadas
    CONSTRAINT no_teacher_overlap EXCLUDE USING gist (
        teacher_id WITH =,
        tstzrange(starts_at, ends_at) WITH &&
    ) WHERE (status = 'scheduled')
);
CREATE INDEX sessions_group_idx   ON sessions (class_group_id, starts_at);
CREATE INDEX sessions_teacher_idx ON sessions (teacher_id, starts_at);
CREATE INDEX sessions_room_idx    ON sessions (room_id, starts_at);

-- ---------------------------------------------------------------
-- Reagendamiento
-- ---------------------------------------------------------------
CREATE TABLE reschedule_requests (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id          uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    session_id          uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    requested_by        uuid NOT NULL REFERENCES users(id),
    proposed_starts_at  timestamptz NOT NULL,
    proposed_ends_at    timestamptz NOT NULL,
    proposed_room_id    uuid REFERENCES rooms(id),
    reason              text,
    status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','cancelled','expired')),
    decided_by          uuid REFERENCES users(id),
    decided_at          timestamptz,
    decision_note       text,
    expires_at          timestamptz NOT NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CHECK (proposed_ends_at > proposed_starts_at)
);
-- Solo una solicitud pendiente por sesión
CREATE UNIQUE INDEX one_pending_request_per_session
    ON reschedule_requests (session_id) WHERE status = 'pending';

-- ---------------------------------------------------------------
-- Asistencia
-- ---------------------------------------------------------------
CREATE TABLE attendance (
    session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status     text NOT NULL CHECK (status IN ('present','absent','late','excused')),
    note       text,
    marked_by  uuid REFERENCES users(id),
    marked_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (session_id, student_id)
);

-- ---------------------------------------------------------------
-- Materiales
-- ---------------------------------------------------------------
CREATE TABLE materials (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id    uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    uploaded_by   uuid NOT NULL REFERENCES users(id),
    kind          text NOT NULL CHECK (kind IN ('file','link')),
    title         text NOT NULL,
    url           text,                           -- si kind = 'link'
    storage_key   text,                           -- si kind = 'file'
    mime_type     text,
    size_bytes    bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
    copyright_ack boolean NOT NULL DEFAULT false, -- el profesor declara tener derecho de uso
    created_at    timestamptz NOT NULL DEFAULT now(),
    CHECK ((kind = 'link' AND url IS NOT NULL AND storage_key IS NULL)
        OR (kind = 'file' AND storage_key IS NOT NULL AND url IS NULL)),
    CHECK (kind = 'link' OR copyright_ack)
);

CREATE TABLE material_tags (
    material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    tag         text NOT NULL,
    PRIMARY KEY (material_id, tag)
);

-- Un material se asigna a un grupo, a una sesión o a un alumno.
CREATE TABLE material_assignments (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id    uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    class_group_id uuid REFERENCES class_groups(id) ON DELETE CASCADE,
    session_id     uuid REFERENCES sessions(id) ON DELETE CASCADE,
    student_id     uuid REFERENCES students(id) ON DELETE CASCADE,
    assigned_at    timestamptz NOT NULL DEFAULT now(),
    CHECK (num_nonnulls(class_group_id, session_id, student_id) = 1)
);
CREATE INDEX material_assign_group_idx   ON material_assignments (class_group_id);
CREATE INDEX material_assign_session_idx ON material_assignments (session_id);
CREATE INDEX material_assign_student_idx ON material_assignments (student_id);

-- ---------------------------------------------------------------
-- Reemplazos de profesor
-- ---------------------------------------------------------------
-- El profesor titular propone un reemplazante; la dirección aprueba.
-- Si el director asigna directamente, se actualiza sessions sin pasar por aquí.
CREATE TABLE substitution_requests (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id          uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    session_id          uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    proposed_by         uuid NOT NULL REFERENCES users(id),
    proposed_teacher_id uuid NOT NULL REFERENCES users(id),
    status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','cancelled')),
    decided_by          uuid REFERENCES users(id),
    decided_at          timestamptz,
    decision_note       text,
    created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_pending_substitution_per_session
    ON substitution_requests (session_id) WHERE status = 'pending';

-- ---------------------------------------------------------------
-- Consentimientos y retiro de menores
-- ---------------------------------------------------------------
-- Un cambio de texto crea una nueva versión (fila nueva), nunca edita la anterior.
CREATE TABLE consent_types (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id  uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    code        text NOT NULL,                    -- 'data_use', 'image_use'...
    version     integer NOT NULL DEFAULT 1 CHECK (version > 0),
    title       text NOT NULL,
    body        text NOT NULL,
    is_required boolean NOT NULL DEFAULT false,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (academy_id, code, version)
);

-- Una fila por decisión del apoderado. Se conserva el historial: revocar
-- completa revoked_at y no borra nada.
CREATE TABLE consents (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_type_id uuid NOT NULL REFERENCES consent_types(id),
    student_id      uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    given_by        uuid NOT NULL REFERENCES users(id),
    accepted        boolean NOT NULL,             -- false = rechazó (consentimientos opcionales)
    decided_at      timestamptz NOT NULL DEFAULT now(),
    revoked_at      timestamptz,
    CHECK (revoked_at IS NULL OR revoked_at >= decided_at)
);
-- Una sola decisión vigente por tipo y alumno
CREATE UNIQUE INDEX one_active_consent_per_type
    ON consents (consent_type_id, student_id) WHERE revoked_at IS NULL;

CREATE TABLE pickup_authorizations (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id    uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    full_name     text NOT NULL,
    relationship  text,
    document_id   text,                           -- dato sensible: mostrar solo a quien corresponde
    phone         text,
    created_by    uuid NOT NULL REFERENCES users(id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    revoked_at    timestamptz
);
CREATE INDEX pickup_student_idx ON pickup_authorizations (student_id) WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------
-- Notificaciones y auditoría
-- ---------------------------------------------------------------
CREATE TABLE notification_preferences (
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       text NOT NULL,                     -- session_moved, session_cancelled, reminder...
    channel    text NOT NULL CHECK (channel IN ('email','in_app')),
    enabled    boolean NOT NULL DEFAULT true,
    PRIMARY KEY (user_id, type, channel)
);

CREATE TABLE notifications (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       text NOT NULL,
    payload    jsonb NOT NULL DEFAULT '{}',
    channel    text NOT NULL CHECK (channel IN ('email','in_app')),
    created_at timestamptz NOT NULL DEFAULT now(),
    sent_at    timestamptz,
    read_at    timestamptz
);
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);

CREATE TABLE audit_log (
    id          bigserial PRIMARY KEY,
    academy_id  uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
    entity      text NOT NULL,                    -- 'session', 'attendance', ...
    entity_id   uuid NOT NULL,
    action      text NOT NULL,                    -- 'moved', 'cancelled', 'marked'...
    details     jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_entity_idx ON audit_log (entity, entity_id, created_at);

-- +goose Down
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
