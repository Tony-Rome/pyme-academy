package db_test

import (
	"context"
	"errors"
	"testing"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"musicacademy/api/internal/testdb"
)

// Códigos SQLSTATE relevantes.
const (
	exclusionViolation = "23P01"
	uniqueViolation    = "23505"
	checkViolation     = "23514"
)

type fixture struct {
	academy, teacher1, teacher2, room1, room2, group, student string
}

// setup crea lo mínimo para insertar sesiones y devuelve los ids.
func setup(t *testing.T, pool *pgxpool.Pool) fixture {
	t.Helper()
	ctx := context.Background()
	var f fixture

	must := func(sql string, args ...any) string {
		t.Helper()
		var id string
		if err := pool.QueryRow(ctx, sql, args...).Scan(&id); err != nil {
			t.Fatalf("preparar datos: %v\n%s", err, sql)
		}
		return id
	}

	f.academy = must(`INSERT INTO academies(name) VALUES ('Academia') RETURNING id`)
	f.teacher1 = must(`INSERT INTO users(academy_id,email,full_name) VALUES ($1,'t1@x.cl','Profesor 1') RETURNING id`, f.academy)
	f.teacher2 = must(`INSERT INTO users(academy_id,email,full_name) VALUES ($1,'t2@x.cl','Profesor 2') RETURNING id`, f.academy)
	f.room1 = must(`INSERT INTO rooms(academy_id,name) VALUES ($1,'Sala 1') RETURNING id`, f.academy)
	f.room2 = must(`INSERT INTO rooms(academy_id,name) VALUES ($1,'Sala 2') RETURNING id`, f.academy)
	f.group = must(`INSERT INTO class_groups(academy_id,name,teacher_id,weekday,start_time,duration_minutes,starts_on)
		VALUES ($1,'Grupo',$2,1,'16:00',45,'2026-01-01') RETURNING id`, f.academy, f.teacher1)
	f.student = must(`INSERT INTO students(academy_id,full_name,birth_date) VALUES ($1,'Alumno','2015-01-01') RETURNING id`, f.academy)
	return f
}

func insertSession(pool *pgxpool.Pool, f fixture, teacher, room, start, end, status string) error {
	var roomArg any
	if room != "" {
		roomArg = room
	}
	_, err := pool.Exec(context.Background(),
		`INSERT INTO sessions(academy_id,class_group_id,teacher_id,room_id,starts_at,ends_at,status)
		 VALUES ($1,$2,$3,$4,$5::timestamptz,$6::timestamptz,$7)`,
		f.academy, f.group, teacher, roomArg, start, end, status)
	return err
}

func wantCode(t *testing.T, err error, code string) {
	t.Helper()
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		t.Fatalf("se esperaba un error de PostgreSQL con código %s, se obtuvo: %v", code, err)
	}
	if pgErr.Code != code {
		t.Fatalf("código %s (%s), se esperaba %s", pgErr.Code, pgErr.Message, code)
	}
}

func TestSessionOverlaps(t *testing.T) {
	pool := testdb.New(t)
	f := setup(t, pool)

	const (
		d     = "2026-03-02 "
		tz    = "-03"
		base0 = d + "16:00" + tz
		base1 = d + "16:45" + tz
	)

	if err := insertSession(pool, f, f.teacher1, f.room1, base0, base1, "scheduled"); err != nil {
		t.Fatalf("la sesión base debe insertarse: %v", err)
	}

	t.Run("misma sala superpuesta se rechaza", func(t *testing.T) {
		err := insertSession(pool, f, f.teacher2, f.room1, d+"16:30"+tz, d+"17:15"+tz, "scheduled")
		wantCode(t, err, exclusionViolation)
	})

	t.Run("mismo profesor en otra sala superpuesto se rechaza", func(t *testing.T) {
		err := insertSession(pool, f, f.teacher1, f.room2, d+"16:30"+tz, d+"17:15"+tz, "scheduled")
		wantCode(t, err, exclusionViolation)
	})

	t.Run("sesión adyacente se acepta", func(t *testing.T) {
		if err := insertSession(pool, f, f.teacher1, f.room1, base1, d+"17:30"+tz, "scheduled"); err != nil {
			t.Fatalf("una sesión que empieza cuando otra termina no debe chocar: %v", err)
		}
	})

	t.Run("sesión cancelada superpuesta se acepta", func(t *testing.T) {
		if err := insertSession(pool, f, f.teacher2, f.room1, base0, base1, "cancelled"); err != nil {
			t.Fatalf("una sesión cancelada no debe bloquear: %v", err)
		}
	})

	t.Run("sesión sin sala no choca por sala", func(t *testing.T) {
		if err := insertSession(pool, f, f.teacher2, "", base0, base1, "scheduled"); err != nil {
			t.Fatalf("sin sala solo aplica la restricción de profesor: %v", err)
		}
	})
}

func TestSubstitutionMustDifferFromOriginal(t *testing.T) {
	pool := testdb.New(t)
	f := setup(t, pool)
	ctx := context.Background()

	insert := func(teacher, original string) error {
		_, err := pool.Exec(ctx,
			`INSERT INTO sessions(academy_id,class_group_id,teacher_id,original_teacher_id,starts_at,ends_at)
			 VALUES ($1,$2,$3,$4,'2026-04-01 10:00-03','2026-04-01 10:45-03')`,
			f.academy, f.group, teacher, original)
		return err
	}

	wantCode(t, insert(f.teacher2, f.teacher2), checkViolation)
	if err := insert(f.teacher2, f.teacher1); err != nil {
		t.Fatalf("un reemplazo válido debe aceptarse: %v", err)
	}
}

func TestMaterialRules(t *testing.T) {
	pool := testdb.New(t)
	f := setup(t, pool)
	ctx := context.Background()

	t.Run("archivo sin declaración de derechos se rechaza", func(t *testing.T) {
		_, err := pool.Exec(ctx,
			`INSERT INTO materials(academy_id,uploaded_by,kind,title,storage_key,copyright_ack)
			 VALUES ($1,$2,'file','Partitura','k',false)`, f.academy, f.teacher1)
		wantCode(t, err, checkViolation)
	})

	t.Run("enlace no exige declaración de derechos", func(t *testing.T) {
		_, err := pool.Exec(ctx,
			`INSERT INTO materials(academy_id,uploaded_by,kind,title,url)
			 VALUES ($1,$2,'link','Video','https://example.com')`, f.academy, f.teacher1)
		if err != nil {
			t.Fatal(err)
		}
	})

	t.Run("asignación con dos destinos se rechaza", func(t *testing.T) {
		var materialID, sessionID string
		if err := pool.QueryRow(ctx,
			`INSERT INTO materials(academy_id,uploaded_by,kind,title,url)
			 VALUES ($1,$2,'link','Otro','https://example.com/2') RETURNING id`,
			f.academy, f.teacher1).Scan(&materialID); err != nil {
			t.Fatal(err)
		}
		if err := pool.QueryRow(ctx,
			`INSERT INTO sessions(academy_id,class_group_id,teacher_id,starts_at,ends_at)
			 VALUES ($1,$2,$3,'2026-05-01 10:00-03','2026-05-01 10:45-03') RETURNING id`,
			f.academy, f.group, f.teacher1).Scan(&sessionID); err != nil {
			t.Fatal(err)
		}
		_, err := pool.Exec(ctx,
			`INSERT INTO material_assignments(material_id,class_group_id,session_id) VALUES ($1,$2,$3)`,
			materialID, f.group, sessionID)
		wantCode(t, err, checkViolation)
	})
}

func TestConsentUniqueActive(t *testing.T) {
	pool := testdb.New(t)
	f := setup(t, pool)
	ctx := context.Background()

	var typeID string
	if err := pool.QueryRow(ctx,
		`INSERT INTO consent_types(academy_id,code,title,body) VALUES ($1,'image_use','Imagen','...') RETURNING id`,
		f.academy).Scan(&typeID); err != nil {
		t.Fatal(err)
	}

	insert := func(accepted bool) error {
		_, err := pool.Exec(ctx,
			`INSERT INTO consents(consent_type_id,student_id,given_by,accepted) VALUES ($1,$2,$3,$4)`,
			typeID, f.student, f.teacher1, accepted)
		return err
	}

	if err := insert(true); err != nil {
		t.Fatal(err)
	}
	wantCode(t, insert(false), uniqueViolation)

	if _, err := pool.Exec(ctx, `UPDATE consents SET revoked_at = now()`); err != nil {
		t.Fatal(err)
	}
	if err := insert(false); err != nil {
		t.Fatalf("tras revocar se debe poder decidir de nuevo: %v", err)
	}
}

func TestOnePendingRescheduleRequestPerSession(t *testing.T) {
	pool := testdb.New(t)
	f := setup(t, pool)
	ctx := context.Background()

	var sessionID string
	if err := pool.QueryRow(ctx,
		`INSERT INTO sessions(academy_id,class_group_id,teacher_id,starts_at,ends_at)
		 VALUES ($1,$2,$3,'2026-03-02 16:00-03','2026-03-02 16:45-03') RETURNING id`,
		f.academy, f.group, f.teacher1).Scan(&sessionID); err != nil {
		t.Fatal(err)
	}

	request := func() error {
		_, err := pool.Exec(ctx,
			`INSERT INTO reschedule_requests(academy_id,session_id,requested_by,proposed_starts_at,proposed_ends_at,expires_at)
			 VALUES ($1,$2,$3,'2026-03-03 16:00-03','2026-03-03 16:45-03', now() + interval '2 days')`,
			f.academy, sessionID, f.teacher1)
		return err
	}

	if err := request(); err != nil {
		t.Fatal(err)
	}
	wantCode(t, request(), uniqueViolation)
}

func TestOwnAccountMinAgeDefaultsTo18(t *testing.T) {
	pool := testdb.New(t)
	f := setup(t, pool)

	var age int
	err := pool.QueryRow(context.Background(),
		`INSERT INTO academy_settings(academy_id) VALUES ($1) RETURNING student_own_account_min_age`,
		f.academy).Scan(&age)
	if err != nil {
		t.Fatal(err)
	}
	if age != 18 {
		t.Fatalf("la edad mínima por defecto es %d, se esperaba 18", age)
	}
}

func TestAttendanceAgreedInAdvanceOnlyWhenExcused(t *testing.T) {
	pool := testdb.New(t)
	f := setup(t, pool)
	ctx := context.Background()

	var sessionID string
	if err := pool.QueryRow(ctx,
		`INSERT INTO sessions(academy_id,class_group_id,teacher_id,starts_at,ends_at)
		 VALUES ($1,$2,$3,'2026-03-02 16:00-03','2026-03-02 16:45-03') RETURNING id`,
		f.academy, f.group, f.teacher1).Scan(&sessionID); err != nil {
		t.Fatal(err)
	}

	mark := func(status string, agreed bool) error {
		_, err := pool.Exec(ctx,
			`INSERT INTO attendance(session_id,student_id,status,agreed_in_advance)
			 VALUES ($1,$2,$3,$4)
			 ON CONFLICT (session_id,student_id)
			 DO UPDATE SET status = EXCLUDED.status, agreed_in_advance = EXCLUDED.agreed_in_advance`,
			sessionID, f.student, status, agreed)
		return err
	}

	wantCode(t, mark("absent", true), checkViolation)
	wantCode(t, mark("present", true), checkViolation)
	if err := mark("excused", true); err != nil {
		t.Fatalf("una ausencia justificada y acordada es válida: %v", err)
	}
	if err := mark("absent", false); err != nil {
		t.Fatalf("una ausencia sin acuerdo es válida: %v", err)
	}
}

func TestMigrationsApplyCleanly(t *testing.T) {
	pool := testdb.New(t)

	var n int
	err := pool.QueryRow(context.Background(),
		`SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name <> 'goose_db_version'`).Scan(&n)
	if err != nil {
		t.Fatal(err)
	}
	if n != 29 {
		t.Fatalf("se esperaban 29 tablas del esquema, hay %d", n)
	}
}
