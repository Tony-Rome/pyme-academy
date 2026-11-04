import type { components } from "@music-academy/api-client";

type Schemas = components["schemas"];

export type Role = Schemas["Role"];
export type Viewer = Schemas["Viewer"];
export type StudentRef = Schemas["StudentRef"];
export type Room = Schemas["Room"];
export type TeacherOverview = Schemas["TeacherOverview"];
export type TeacherDetail = Schemas["TeacherDetail"];
export type TeacherGroup = Schemas["TeacherGroup"];
export type ClassGroup = Schemas["ClassGroup"];
export type Session = Schemas["Session"];
export type SessionStatus = Schemas["SessionStatus"];
export type RescheduleRequest = Schemas["RescheduleRequest"];
export type Notification = Schemas["Notification"];
export type RescheduleOption = Schemas["RescheduleOption"];
export type RescheduleStatus = Schemas["RescheduleStatus"];
export type StudentOverview = Schemas["StudentOverview"];
export type StudentTeacherLink = Schemas["StudentTeacherLink"];
export type GroupBrief = Schemas["GroupBrief"];
export type PeriodHours = Schemas["PeriodHours"];
