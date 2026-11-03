// Package httpapi implementa la interfaz generada a partir del contrato OpenAPI.
package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
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

	strict := api.NewStrictHandlerWithOptions(s, nil, api.StrictHTTPServerOptions{
		RequestErrorHandlerFunc: func(w http.ResponseWriter, _ *http.Request, err error) {
			writeProblem(w, http.StatusBadRequest, "bad_request", err.Error())
		},
		ResponseErrorHandlerFunc: func(w http.ResponseWriter, r *http.Request, err error) {
			if errors.Is(err, ErrNotImplemented) {
				writeProblem(w, http.StatusNotImplemented, "not_implemented", "Este endpoint aún no está implementado")
				return
			}
			slog.Error("error al responder", "path", r.URL.Path, "error", err)
			writeProblem(w, http.StatusInternalServerError, "internal_error", "Error interno")
		},
	})
	return api.HandlerWithOptions(strict, api.ChiServerOptions{
		BaseURL:    "/api/v1",
		BaseRouter: r,
	})
}

func writeProblem(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(api.Problem{Code: code, Message: message})
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
