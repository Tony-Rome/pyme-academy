// Package db abre el pool de conexiones y aplica las migraciones.
package db

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib" // registra el driver "pgx" para goose
	"github.com/pressly/goose/v3"

	"musicacademy/api/migrations"
)

func Connect(ctx context.Context, url string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, fmt.Errorf("abrir pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("conectar a la base de datos: %w", err)
	}
	return pool, nil
}

// Migrate aplica todas las migraciones pendientes.
func Migrate(ctx context.Context, url string) error {
	sqlDB, err := sql.Open("pgx", url)
	if err != nil {
		return fmt.Errorf("abrir conexión para migrar: %w", err)
	}
	defer sqlDB.Close()

	provider, err := goose.NewProvider(goose.DialectPostgres, sqlDB, migrations.FS)
	if err != nil {
		return fmt.Errorf("crear proveedor de migraciones: %w", err)
	}
	if _, err := provider.Up(ctx); err != nil {
		return fmt.Errorf("aplicar migraciones: %w", err)
	}
	return nil
}
