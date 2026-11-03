-- +goose Up
-- Decisión de producto: desde los 18 años un alumno tiene cuenta propia.
-- Cada academia puede cambiarlo; esto solo fija el valor por defecto.
ALTER TABLE academy_settings
    ALTER COLUMN student_own_account_min_age SET DEFAULT 18;

-- +goose Down
ALTER TABLE academy_settings
    ALTER COLUMN student_own_account_min_age SET DEFAULT 14;
