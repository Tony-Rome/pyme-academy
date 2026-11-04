-- +goose Up
-- Ausencia acordada de antemano con el profesor (decisión de producto sobre recuperación de clases).
-- Solo tiene sentido en una ausencia justificada. Los créditos se calculan en la fase 2.
ALTER TABLE attendance
    ADD COLUMN agreed_in_advance boolean NOT NULL DEFAULT false,
    ADD CONSTRAINT attendance_agreed_only_when_excused
        CHECK (NOT agreed_in_advance OR status = 'excused');

-- +goose Down
ALTER TABLE attendance
    DROP CONSTRAINT attendance_agreed_only_when_excused,
    DROP COLUMN agreed_in_advance;
