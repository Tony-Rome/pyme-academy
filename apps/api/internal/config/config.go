// Package config lee la configuración del proceso desde variables de entorno.
package config

import (
	"errors"
	"os"
	"strconv"
)

type Config struct {
	DatabaseURL    string
	Addr           string
	MigrateOnStart bool
}

func Load() (Config, error) {
	cfg := Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Addr:        getenv("ADDR", ":8080"),
	}
	if cfg.DatabaseURL == "" {
		return Config{}, errors.New("DATABASE_URL es obligatoria")
	}

	migrate, err := strconv.ParseBool(getenv("MIGRATE_ON_START", "false"))
	if err != nil {
		return Config{}, errors.New("MIGRATE_ON_START debe ser true o false")
	}
	cfg.MigrateOnStart = migrate

	return cfg, nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
