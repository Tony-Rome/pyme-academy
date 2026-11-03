// Package migrations embebe las migraciones SQL para aplicarlas desde el binario.
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
