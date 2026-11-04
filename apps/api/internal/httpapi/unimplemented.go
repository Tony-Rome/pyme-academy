package httpapi

import (
	"context"
	"errors"

	"musicacademy/api/internal/api"
)

// ErrNotImplemented marca los endpoints que ya están en el contrato pero cuyo
// comportamiento aún no se implementa. Responden 501.
// Al implementar uno, se mueve fuera de este archivo.
var ErrNotImplemented = errors.New("no implementado")

func (s *Server) GetMe(context.Context, api.GetMeRequestObject) (api.GetMeResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) ListRooms(context.Context, api.ListRoomsRequestObject) (api.ListRoomsResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) ListTeachers(context.Context, api.ListTeachersRequestObject) (api.ListTeachersResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) ListClassGroups(context.Context, api.ListClassGroupsRequestObject) (api.ListClassGroupsResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) ListSessions(context.Context, api.ListSessionsRequestObject) (api.ListSessionsResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) GetSession(context.Context, api.GetSessionRequestObject) (api.GetSessionResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) CancelSession(context.Context, api.CancelSessionRequestObject) (api.CancelSessionResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) ListRescheduleOptions(context.Context, api.ListRescheduleOptionsRequestObject) (api.ListRescheduleOptionsResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) CreateRescheduleRequest(context.Context, api.CreateRescheduleRequestRequestObject) (api.CreateRescheduleRequestResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) ListRescheduleRequests(context.Context, api.ListRescheduleRequestsRequestObject) (api.ListRescheduleRequestsResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) DecideRescheduleRequest(context.Context, api.DecideRescheduleRequestRequestObject) (api.DecideRescheduleRequestResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) GetAttendance(context.Context, api.GetAttendanceRequestObject) (api.GetAttendanceResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) SaveAttendance(context.Context, api.SaveAttendanceRequestObject) (api.SaveAttendanceResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) ListNotifications(context.Context, api.ListNotificationsRequestObject) (api.ListNotificationsResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) MarkNotificationRead(context.Context, api.MarkNotificationReadRequestObject) (api.MarkNotificationReadResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) Login(context.Context, api.LoginRequestObject) (api.LoginResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) Logout(context.Context, api.LogoutRequestObject) (api.LogoutResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) ListStudents(context.Context, api.ListStudentsRequestObject) (api.ListStudentsResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) GetStudent(context.Context, api.GetStudentRequestObject) (api.GetStudentResponseObject, error) {
	return nil, ErrNotImplemented
}

func (s *Server) GetTeacher(context.Context, api.GetTeacherRequestObject) (api.GetTeacherResponseObject, error) {
	return nil, ErrNotImplemented
}
