package httpapi_test

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"musicacademy/api/internal/httpapi"
)

type fakeDB struct{ err error }

func (f fakeDB) Ping(context.Context) error { return f.err }

func get(t *testing.T, h http.Handler, path string) *httptest.ResponseRecorder {
	t.Helper()
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
	return rec
}

func TestHealth(t *testing.T) {
	rec := get(t, httpapi.NewRouter(fakeDB{}), "/api/v1/healthz")
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), `"status":"ok"`) {
		t.Fatalf("cuerpo inesperado: %s", rec.Body.String())
	}
}

func TestUnimplementedEndpointsReturn501(t *testing.T) {
	h := httpapi.NewRouter(fakeDB{})
	for _, path := range []string{"/api/v1/me", "/api/v1/rooms", "/api/v1/notifications"} {
		rec := get(t, h, path)
		if rec.Code != http.StatusNotImplemented {
			t.Fatalf("%s: status %d, se esperaba 501", path, rec.Code)
		}
		if !strings.Contains(rec.Body.String(), `"code":"not_implemented"`) {
			t.Fatalf("%s: cuerpo inesperado: %s", path, rec.Body.String())
		}
	}
}

func TestReady(t *testing.T) {
	t.Run("con base de datos", func(t *testing.T) {
		rec := get(t, httpapi.NewRouter(fakeDB{}), "/api/v1/readyz")
		if rec.Code != http.StatusOK {
			t.Fatalf("status %d", rec.Code)
		}
	})
	t.Run("sin base de datos", func(t *testing.T) {
		rec := get(t, httpapi.NewRouter(fakeDB{err: errors.New("caída")}), "/api/v1/readyz")
		if rec.Code != http.StatusServiceUnavailable {
			t.Fatalf("status %d", rec.Code)
		}
		if !strings.Contains(rec.Body.String(), `"status":"unavailable"`) {
			t.Fatalf("cuerpo inesperado: %s", rec.Body.String())
		}
	})
}
