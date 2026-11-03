# MVP Fase 1: Alcance

> **Actualización:** la priorización vigente está en [04-mvp-fases.md](04-mvp-fases.md). En ese plan los planes de clase pasan a la fase 4, WhatsApp a la fase 5, y la fase 1 suma importación, feriados, consentimientos y reemplazo de profesor. Las reglas de reagendamiento, la matriz de permisos y los requisitos no funcionales de este documento siguen vigentes.

## 1. Objetivo
Reemplazar el Excel y los grupos de WhatsApp con los que una academia musical coordina horarios, salas, asistencia y materiales. El éxito de la fase 1 se mide en lo administrativo: menos tiempo coordinando.

**Hipótesis a validar:** una academia con 50 a 150 alumnos usa la app cada semana si reagendar una clase y avisar a las familias toma menos de un minuto.

## 2. Roles
| Rol | Descripción |
|---|---|
| Director/a | Administra la academia, aprueba reglas, ve todo. |
| Profesor/a | Dicta clases, marca asistencia, sube materiales, solicita o acepta cambios. |
| Alumno/a | Ve su agenda y materiales. Puede ser menor sin cuenta propia. |
| Apoderado/a | Ve agenda, asistencia y materiales de sus pupilos. Aprueba o solicita cambios. |

Una misma persona puede tener varios roles (ej. profesor y apoderado).

## 3. Dentro de la fase 1
1. **Cuentas y roles**, invitación por email o enlace, vínculo apoderado ↔ alumno con consentimiento.
2. **Catálogo:** instrumentos, géneros, niveles, salas.
3. **Clases y talleres:** grupos recurrentes (individuales o grupales) con profesor, sala, horario, rango de edad y cupo.
4. **Inscripciones** de alumnos a grupos.
5. **Calendario** por rol (día, semana, mes) y por sala/profesor.
6. **Reagendamiento con reglas:** sin choques de sala ni profesor, con aprobación configurable.
7. **Asistencia** con un clic por sesión.
8. **Plan de clase** con plantillas filtrables por género, instrumento, nivel y edad.
9. **Materiales:** PDF, enlaces (YouTube u otros), asociados a grupo, sesión o alumno.
10. **Notificaciones** por email (y en la app) ante cambios, cancelaciones y recordatorios.

## 4. Fuera de la fase 1 (con motivo)
| Función | Fase | Motivo |
|---|---|---|
| Cobros y mensualidades | 2 | Alto valor, pero exige integración de pagos y reglas contables. |
| Créditos de recuperación | 2 | Depende de cobros y de política definida. |
| Seguimiento de progreso y tareas | 2 | Primero hay que tener asistencia y planes funcionando. |
| Módulo de recital anual | 2 | Evento de una vez al año; tiene tiempo de sobra. |
| WhatsApp | 2 | Requiere proveedor oficial y plantillas aprobadas. |
| Partitura a audio y secciones | 3 | Mayor riesgo técnico y legal; ver nota abajo. |

**Nota sobre partituras:** en la fase 3 conviene aceptar MusicXML/MIDI/MuseScore (reproducen bien) y tratar la conversión desde PDF como experimento. Las secciones se modelan como marcadores de compases sobre el PDF.

## 5. Reglas de negocio de reagendamiento
Configurables por academia (tabla `academy_settings`):
- **Anticipación mínima:** horas antes de la clase para poder moverla (por defecto 24).
- **Aprobación:** quién debe aprobar (`none`, `teacher`, `director`, `guardian`).
- **Tope mensual** de cambios por alumno (por defecto 2).
- **Sin choques:** la base de datos impide dos sesiones activas en la misma sala o con el mismo profesor en horarios que se superponen.
- **Estados de solicitud:** `pending` → `approved` / `rejected` / `cancelled` / `expired`. Al aprobar, se crea o modifica la sesión y se notifica.
- Clases grupales: solo director o profesor pueden moverlas, y se notifica a todos los inscritos.

## 6. Matriz de permisos
| Acción | Director | Profesor | Apoderado | Alumno |
|---|:-:|:-:|:-:|:-:|
| Gestionar catálogo y salas | ✔ | | | |
| Crear grupos e inscribir | ✔ | | | |
| Ver calendario | todo | propio | pupilos | propio |
| Solicitar reagendar | ✔ | ✔ | ✔ | ✔* |
| Aprobar reagendar | ✔ | ✔** | ✔*** | |
| Marcar asistencia | ✔ | ✔ | | |
| Ver asistencia | todo | sus grupos | pupilos | propia |
| Crear planes y plantillas | ✔ | ✔ | | |
| Subir materiales | ✔ | ✔ | | |
| Ver materiales | todo | sus grupos | pupilos | propios |

\* Solo alumnos con cuenta propia, es decir, mayores de la edad que defina la academia (18 años por defecto). Los menores actúan siempre a través de su apoderado.
\*\* Si la regla de aprobación lo indica.
\*\*\* Cuando el alumno es menor y la solicitud la inicia el profesor.

## 7. Requisitos no funcionales
- **Privacidad de menores:** datos mínimos, consentimiento registrado del apoderado, sin mensajería directa profesor ↔ menor en la fase 1.
- **Derechos de autor:** al subir un material se registra una declaración de que la academia tiene derecho a usarlo (`copyright_ack`). Los archivos no son públicos y solo se ven con sesión iniciada.
- **Multi-academia desde el inicio:** todas las tablas llevan `academy_id` para vender a otras academias sin rehacer el modelo.
- **Zona horaria:** fechas guardadas en UTC; cada academia define la suya.
- **Móvil primero:** la mayoría de apoderados y profesores entrarán desde el teléfono (web responsiva o PWA).
- **Auditoría:** cambios de agenda y asistencia quedan en `audit_log`.
- **Respaldo y exportación:** el director puede exportar sus datos a CSV.

## 8. Propuesta técnica (sugerencia, no decisión)
- PostgreSQL (necesario para las restricciones de no-choque con `btree_gist`).
- Web responsiva/PWA antes que app nativa, para una sola base de código.
- Almacenamiento de archivos en un bucket privado con URLs firmadas.
- Email transaccional como primer canal de notificación.

## 9. Métricas de éxito (piloto de 1 mes)
- Reagendamientos hechos en la app vs. por mensaje: meta > 80%.
- Tiempo medio de reagendar: < 1 minuto.
- Sesiones con asistencia marcada: > 90%.
- Apoderados activos al menos una vez por semana: > 60%.
- Choques de sala o profesor en producción: 0.

## 10. Riesgos
| Riesgo | Mitigación |
|---|---|
| Profesores no lo usan | Marcar asistencia en un toque; importar horarios desde Excel; piloto con 2 o 3 profesores entusiastas. |
| Reglas de reagendamiento distintas por academia | Parámetros configurables, no código fijo. |
| Datos de menores | Consentimiento explícito y mínimo de datos; revisión legal local antes de lanzar. |
| Alcance que crece hacia partituras | Mantener la fase 3 fuera hasta validar la fase 1. |

## 11. Preguntas abiertas
1. ¿Los alumnos mayores de cierta edad tienen cuenta propia? ¿Desde qué edad?
2. ¿Las clases individuales son siempre con el mismo profesor y horario fijo?
3. ¿Qué ocurre con una clase cancelada por el profesor: se recupera siempre?
4. ¿Cuántas salas y profesores tiene una academia típica del piloto?
5. ¿Qué país y regulación de datos aplican?
