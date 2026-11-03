// Package testdb crea una base de datos efímera con las migraciones aplicadas.
package testdb

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/url"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"musicacademy/api/internal/db"
)

// New devuelve un pool conectado a una base nueva y vacía (con migraciones).
// Si TEST_DATABASE_URL no está definida, la prueba se omite.
// TEST_DATABASE_URL debe apuntar a un usuario con permiso CREATE DATABASE.
func New(t *testing.T) *pgxpool.Pool {
	t.Helper()

	adminURL := os.Getenv("TEST_DATABASE_URL")
	if adminURL == "" {
		t.Skip("TEST_DATABASE_URL no definida; se omite la prueba de integración")
	}

	ctx := context.Background()
	admin, err := pgxpool.New(ctx, adminURL)
	if err != nil {
		t.Fatalf("conectar como administrador: %v", err)
	}

	suffix := make([]byte, 6)
	if _, err := rand.Read(suffix); err != nil {
		t.Fatal(err)
	}
	name := "test_" + hex.EncodeToString(suffix)

	if _, err := admin.Exec(ctx, "CREATE DATABASE "+name); err != nil {
		admin.Close()
		t.Fatalf("crear base %s: %v", name, err)
	}

	u, err := url.Parse(adminURL)
	if err != nil {
		t.Fatal(err)
	}
	u.Path = "/" + name
	testURL := u.String()

	if err := db.Migrate(ctx, testURL); err != nil {
		t.Fatalf("migrar: %v", err)
	}
	pool, err := db.Connect(ctx, testURL)
	if err != nil {
		t.Fatalf("conectar a la base de prueba: %v", err)
	}

	t.Cleanup(func() {
		pool.Close()
		_, _ = admin.Exec(ctx, "DROP DATABASE IF EXISTS "+name+" WITH (FORCE)")
		admin.Close()
	})
	return pool
}
