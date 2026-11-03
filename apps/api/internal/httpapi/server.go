// Package httpapi implementa la interfaz generada a partir del contrato OpenAPI.
package httpapi

import (
	"context"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"musicacademy/api/internal/api"
)

// Pinger lo cumple *pgxpool.Pool; permite probar sin base de datos.
type Pinger interface {
	Ping(ctx context.Context) error
}

type Server struct {
	db Pinger
}

var _ api.StrictServerInterface = (*Server)(nil)

func NewRouter(db Pinger) http.Handler {
	s := &Server{db: db}

	r := chi.NewRouter()
	r.Use(middleware.RequestID, middleware.RealIP, middleware.Recoverer)

	strict := api.NewStrictHandler(s, nil)
	return api.HandlerWithOptions(strict, api.ChiServerOptions{
		BaseURL:    "/api/v1",
		BaseRouter: r,
	})
}

func (s *Server) GetHealth(context.Context, api.GetHealthRequestObject) (api.GetHealthResponseObject, error) {
	return api.GetHealth200JSONResponse{Status: api.Ok}, nil
}

func (s *Server) GetReady(ctx context.Context, _ api.GetReadyRequestObject) (api.GetReadyResponseObject, error) {
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	if err := s.db.Ping(ctx); err != nil {
		return api.GetReady503JSONResponse{Status: api.Unavailable}, nil
	}
	return api.GetReady200JSONResponse{Status: api.Ok}, nil
}
