# Historias de usuario: Fase 1

> **Actualización:** el alcance de la fase 1 cambió en [04-mvp-fases.md](04-mvp-fases.md). Las épicas A a F, H1 a H3 e I1 a I3 siguen vigentes, y A5 (importación) pasa a imprescindible. La épica G (planes de clase) se mueve a la fase 4. Las épicas J (feriados), K (reemplazo de profesor), L (nota de sesión), M (consentimientos y retiro de menores) y N (alumnos y profesores vinculados) se agregaron al final.

Prioridad (MoSCoW): **M** = imprescindible, **S** = importante, **C** = deseable.
Formato: *Como [rol], quiero [acción], para [beneficio].*

---

## Épica A. Cuentas y vínculos

**A1 (M).** Como director, quiero invitar a profesores, alumnos y apoderados por email o enlace, para no crear cuentas a mano.
- Dado un email válido, se envía una invitación que expira en 7 días.
- Al aceptarla, la persona queda con el rol asignado.

**A2 (M).** Como apoderado, quiero vincularme a mis hijos y dar mi consentimiento, para que la academia pueda gestionar sus datos.
- Un alumno menor puede existir sin cuenta propia.
- Queda registrada la fecha del consentimiento.
- Un alumno puede tener más de un apoderado.

**A3 (M).** Como usuario, quiero iniciar sesión y recuperar mi contraseña, para entrar sin ayuda de la academia.

**A4 (S).** Como persona con varios roles (por ejemplo profesor y apoderado), quiero cambiar de perfil sin cerrar sesión.

**A5 (M).** Como director, quiero importar alumnos y profesores desde un Excel/CSV, para no digitar todo el primer día.

---

## Épica B. Catálogo y salas

**B1 (M).** Como director, quiero registrar instrumentos, géneros y niveles, para clasificar clases y materiales.

**B2 (M).** Como director, quiero registrar salas con su capacidad, para evitar usar una sala dos veces a la misma hora.

**B3 (S).** Como director, quiero registrar la disponibilidad semanal de cada profesor, para que el sistema no proponga horarios imposibles.

---

## Épica C. Clases, talleres e inscripciones

**C1 (M).** Como director, quiero crear un grupo de clase con profesor, sala, día, hora, duración, instrumento, género, nivel, rango de edad y cupo, para organizar la oferta.
- El grupo puede ser individual (cupo 1) o grupal.
- Al guardarlo, el sistema genera las sesiones del período.
- Si hay choque de sala o profesor, rechaza con un mensaje claro.

**C2 (M).** Como director, quiero inscribir un alumno a un grupo, para que sus sesiones aparezcan en su calendario.
- No permite superar el cupo.
- Advierte si la edad del alumno está fuera del rango (puede continuar con confirmación).

**C3 (S).** Como director, quiero dar de baja o pausar una inscripción, para reflejar abandonos y pausas sin perder el historial.

**C4 (S).** Como director, quiero filtrar la oferta por instrumento, género, nivel y edad, para recomendar clases a nuevas familias.

---

## Épica D. Calendario

**D1 (M).** Como alumno o apoderado, quiero ver mi calendario por semana y mes, para saber cuándo y dónde son las clases.
- Un apoderado ve las clases de todos sus pupilos, diferenciadas por color.

**D2 (M).** Como profesor, quiero ver mi calendario con alumnos y salas, para preparar mi jornada.

**D3 (M).** Como director, quiero ver el calendario por sala y por profesor, para detectar huecos y sobreocupación.
- Dos filtros sobre el mismo calendario: profesor y sala. Se pueden combinar y quitar con un clic.
- El filtro profesor muestra lo que dicta esa persona, con los reemplazos que cubre y sin los que cubrió otra persona.
- Los filtros viajan en la dirección (`?profesor=…&sala=…`), así se pueden compartir o recargar.
- Con un filtro activo se indica cuántas clases se muestran en el período.
- Cada clase del calendario muestra sala y profesor, para leer la ocupación sin abrirla.
- Los filtros solo acotan lo que cada rol ya puede ver; no amplían permisos.

**D4 (S).** Como usuario, quiero suscribir mi calendario a Google/Apple Calendar (enlace iCal), para verlo junto a mis otros compromisos.

---

## Épica E. Reagendamiento

**E1 (M).** Como apoderado, alumno o profesor, quiero proponer un nuevo horario para una clase, para no coordinarlo por mensajes.
- Solo ofrece horarios en que la sala y el profesor están libres.
- Respeta la anticipación mínima y el tope mensual configurados.
- Pide un motivo (opcional).

**E2 (M).** Como aprobador (según la regla de la academia), quiero aceptar o rechazar una solicitud con un toque, para resolverla en segundos.
- Al aceptar, la sesión se mueve y se notifica a todas las partes.
- Al rechazar, se envía el motivo.
- Una solicitud sin respuesta expira a las 48 h o antes de la clase.

**E3 (M).** Como director, quiero configurar las reglas de reagendamiento, para adaptarlas a mi academia.
- Parámetros: anticipación, quién aprueba, tope mensual.

**E4 (M).** Como profesor, quiero cancelar una sesión por un imprevisto y avisar de inmediato, para que las familias no viajen en vano.

**E5 (S).** Como director, quiero mover una clase grupal completa y notificar a todos los inscritos.

**E6 (S).** Como director, quiero ver el historial de cambios de cada sesión (quién, cuándo y por qué), para resolver reclamos.

**E7 (C).** Como apoderado, quiero ver sugerencias de horarios libres alternativos, para elegir más rápido.

---

## Épica F. Asistencia

**F1 (M).** Como profesor, quiero marcar presente, ausente, atrasado o justificado a cada alumno de una sesión, para llevar el registro.
- Marcado en un toque por alumno; "todos presentes" como atajo.
- Se puede editar hasta 7 días después.

**Reglas de la asistencia** (las aplica el servidor; la interfaz solo las muestra):
- **Quién marca:** el profesor que dicta la clase (con reemplazo, quien la dicta) y dirección. Las familias solo ven.
- **Cuándo:** desde que empieza la clase y hasta 7 días después de que termina. Antes de empezar o pasado ese plazo, el servidor responde 409. Una clase cancelada no tiene asistencia.
- **Estados:** presente, atrasado, ausente y justificado. Un alumno sin marcar queda "sin marcar" (no se asume nada).
- **Ausencia acordada:** un alumno justificado puede marcarse además como "acordada con el profesor" (decisión 3 de las decisiones pendientes). En la fase 1 solo se registra; los créditos de recuperación se calculan en la fase 2.
- **Al guardar:** si la clase ya había empezado y estaba "programada", pasa a "realizada".
- **Visibilidad:** una familia ve solo a sus hijos; un profesor, a los alumnos de las clases que dicta.
- **Pendiente:** el calendario señala con un punto las clases que ya empezaron y tienen alumnos sin marcar, a quienes pueden marcarlas.

**F1b (M).** Como profesor, quiero marcar un alumno como justificado y, si lo avisó antes con mi acuerdo, indicar que fue "acordada con el profesor", para distinguir una ausencia acordada de una sorpresa.
- Solo se puede marcar "acordada" cuando el estado es justificado.

**F2 (S).** Como apoderado, quiero ver la asistencia de mis hijos, para estar al tanto.
- Dentro de cada clase que ya empezó, la familia ve el estado de cada uno de sus hijos.
- En "Mis clases" ve el resumen del mes: clases a las que asistió, ausencias, justificadas, sin marcar y horas asistidas.

**F1c (S).** Como profesor, quiero dejar una nota breve sobre un alumno al marcar su asistencia (por ejemplo, "llegó sin el instrumento"), para recordar el contexto.
- La nota es opcional y solo se puede escribir si el alumno ya tiene un estado.
- La ven profesores y dirección. **Las familias no la ven**: el servidor la omite en sus respuestas.

**F3 (S).** Como director o profesor, quiero un reporte de asistencia por alumno, grupo y profesor, con exportación a CSV.
- Se elige el período (mes) y la agrupación: por alumno, por grupo o por profesor.
- Cada fila muestra presentes, atrasos, ausentes, justificadas, sin marcar, horas asistidas y porcentaje de asistencia.
- **Porcentaje de asistencia:** (presentes + atrasos) ÷ (presentes + atrasos + ausentes + justificadas). Las clases sin marcar no cuentan; se informan aparte. Sin clases marcadas, no hay porcentaje.
- Un profesor ve solo sus grupos y alumnos; por profesor, solo su propia fila. Dirección ve todo. Las familias no acceden.
- **CSV:** una fila por cada fila del reporte, con separador `;` y codificación UTF-8 con BOM, para que Excel en español lo abra bien con las tildes.

**F4 (S).** Como director o profesor, quiero alertas cuando un alumno acumule 3 ausencias seguidas, para contactar a la familia a tiempo.
- **Regla (umbral de 3, configurable por academia más adelante):** por alumno y grupo, se cuentan hacia atrás las clases ya marcadas; la racha son las **ausentes** consecutivas más recientes.
- Una clase **justificada, presente o atrasada** corta la racha: si la familia avisó o el alumno vino, no hay alerta.
- Las clases **sin marcar se ignoran** (no cortan ni suman): una clase pendiente no debe esconder una alerta.
- Las clases canceladas no cuentan.
- La alerta indica alumno, grupo, profesor, cuántas ausencias seguidas lleva, la fecha de la última ausencia y cuándo asistió por última vez.
- Dirección ve todas las alertas; un profesor, las de sus grupos. En el menú, el contador muestra cuántas hay.
- Las familias no ven alertas.

---

## Épica G. Planes de clase

**G1 (M).** Como profesor, quiero crear un plan de clase (objetivos, actividades, repertorio, duración), para ordenar mi enseñanza.

**G2 (M).** Como profesor, quiero guardar un plan como plantilla etiquetada por género, instrumento, nivel y edad, y reutilizarlo.
- Se busca y filtra por esas etiquetas.
- Al reutilizarlo se crea una copia editable.

**G3 (S).** Como profesor, quiero asociar un plan a una sesión y dejar una nota posterior (qué se logró), para dar continuidad.

**G4 (C).** Como director, quiero compartir plantillas entre profesores de la academia.

---

## Épica H. Materiales

**H1 (M).** Como profesor, quiero subir PDF (partituras, guías) a un grupo, sesión o alumno, para que tengan el material a mano.
- Tamaño máximo definido y solo tipos permitidos.
- Antes de subir, confirmo que tengo derecho a usar el material.

**H2 (M).** Como profesor, quiero adjuntar enlaces (por ejemplo YouTube), para compartir ejemplos de interpretación.

**H3 (M).** Como alumno o apoderado, quiero ver y descargar los materiales de mis clases, para estudiar en casa.
- Solo veo lo que corresponde a mis grupos y pupilos.

**H4 (S).** Como profesor, quiero organizar materiales por etiquetas y buscarlos, para reutilizarlos.

**H5 (S).** Como director, quiero ver cuánto espacio usa la academia, para controlar costos.

---

## Épica I. Notificaciones

**I1 (M).** Como usuario, quiero recibir un aviso cuando se cree, mueva o cancele una clase mía, para enterarme al instante.

**I2 (S).** Como apoderado, quiero un recordatorio 24 horas antes de cada clase.

**I3 (S).** Como usuario, quiero elegir qué avisos recibo y por qué canal, para no saturarme.

**I4 (C).** Como director, quiero enviar un aviso general a todos o a un grupo, para comunicar feriados o cambios masivos.

---

## Épica J. Feriados y cierres (agregada según 04-mvp-fases.md)

**J1 (M).** Como director, quiero registrar feriados y cierres de la academia (fecha o rango y motivo), para que no se generen clases esos días.
- Al crear un cierre, las sesiones `scheduled` dentro del rango se marcan como canceladas con el motivo del cierre.
- Se notifica a profesores y apoderados afectados, con un solo aviso por familia.
- Al generar sesiones recurrentes se omiten las fechas con cierre.

**J2 (S).** Como director, quiero indicar si un cierre genera crédito de recuperación, para aplicar mi política (por ejemplo, feriados sin recuperación y cierres por la academia con recuperación).
- El crédito en sí se implementa en la fase 2; en la fase 1 solo se guarda el indicador.

**J3 (C).** Como director, quiero importar los feriados oficiales del año, para no digitarlos uno a uno.

---

## Épica K. Reemplazo de profesor

**K1 (M).** Como director, quiero asignar un profesor reemplazante a una sesión puntual, para que la clase se dicte aunque el titular no pueda.
- Solo ofrece profesores sin otra clase en ese horario.
- El grupo conserva su profesor titular; cambia solo esa sesión.
- La sesión queda marcada como "con reemplazo" y registra al titular original.

**K2 (M).** Como alumno o apoderado, quiero recibir un aviso cuando cambia el profesor de una sesión, para saber quién me atenderá.

**K3 (S).** Como profesor titular, quiero proponer a quien me reemplace, para que la dirección solo tenga que aprobar.
- La propuesta queda pendiente hasta que el director la acepte o la rechace.

**K4 (S).** Como profesor, quiero que el reemplazo quede registrado a mi nombre o al del reemplazante según corresponda, para que la liquidación de honorarios de la fase 2 sea correcta.

**K5 (C).** Como director, quiero ver una lista de profesores disponibles con el mismo instrumento en ese horario, para encontrar reemplazo más rápido.

---

## Épica L. Nota de sesión

**L1 (M).** Como profesor, quiero escribir una nota breve después de cada clase (qué se trabajó y qué viene), para tener continuidad entre clases.
- El campo se puede completar desde el teléfono en menos de un minuto.
- Se puede editar hasta 7 días después.

**L2 (S).** Como profesor, quiero marcar si la nota es visible para los apoderados, para decidir qué comparto.
- Por defecto es privada. Solo las notas marcadas se muestran a la familia.

**L3 (S).** Como apoderado, quiero ver las notas compartidas de mis hijos, para saber qué están trabajando.

**L4 (C).** Como profesor, quiero recibir un recordatorio al terminar la clase si no he escrito la nota, para no olvidarla.

---

## Épica M. Consentimientos y retiro de menores

**M1 (M).** Como director, quiero definir qué consentimientos pide la academia (uso de datos, uso de imagen, otros) con su texto y versión, para cumplir con la normativa.

**M2 (M).** Como apoderado, quiero leer y aceptar o rechazar cada consentimiento al vincular a mi hijo, para decidir qué autorizo.
- Queda registrado quién aceptó, cuándo y qué versión del texto.
- El consentimiento de uso de datos es obligatorio para continuar; el de imagen es opcional.

**M3 (M).** Como apoderado, quiero revocar un consentimiento cuando quiera, para retirar mi autorización.
- La revocación queda con fecha y no borra el historial.

**M4 (M).** Como apoderado, quiero registrar a las personas autorizadas para retirar a mi hijo (nombre, parentesco, documento), para que la academia sepa a quién entregarlo.

**M5 (M).** Como profesor, quiero ver quién está autorizado a retirar a un alumno menor, para verificarlo al terminar la clase.
- Solo aparece para los alumnos de mis grupos y solo mientras la clase está en curso o recién terminada.

**M6 (S).** Como director, quiero ver qué alumnos tienen consentimientos pendientes o personas autorizadas sin registrar, para completar la información faltante.

**M7 (S).** Como director, quiero filtrar la lista de alumnos que no tienen consentimiento de imagen, para no publicarlos en redes.

**M8 (C).** Como apoderado, quiero ser avisado cuando cambie el texto de un consentimiento, para volver a aceptarlo.

---

## Épica N. Alumnos y profesores vinculados

El calendario responde cuándo y dónde. Esta épica responde **con quién y cuánto**: quién enseña a quién, qué clases tiene cada relación y cuántas horas suma.

**Definición de horas** (por alumno, por profesor y por mes):
- **Programadas:** clases del mes que aún no se realizan.
- **Realizadas:** clases del mes que ya ocurrieron.
- **Canceladas:** clases del mes que se cancelaron (no cuentan como realizadas).
- Las horas **asistidas** y los créditos de recuperación se suman más adelante (N6 y fase 2).
- Una clase con reemplazo cuenta en la relación con el profesor titular del grupo.

**N1 (S).** Como profesor, quiero ver la lista de mis alumnos, con su próxima clase y las horas del mes, para saber a quién enseño y cuánto.
- Solo aparecen alumnos inscritos en grupos que dicto yo.
- Se puede buscar por nombre.

**N2 (S).** Como profesor, quiero abrir un alumno y ver las clases que tiene conmigo (día, hora, sala, tipo y nivel) y sus horas por mes, para preparar y revisar su avance.
- Solo veo mi relación con ese alumno: no veo sus clases ni sus horas con otros profesores.

**N3 (S).** Como apoderado o alumno adulto, quiero ver, por cada alumno a mi cargo, los profesores con los que está vinculado y, por cada profesor, sus clases asignadas y las horas del mes, para entender cuánto tiempo de clase recibe.
- Veo todos los profesores de mis alumnos, y solo de ellos.

**N4 (S).** Como usuario de estas vistas, quiero cambiar de mes, para revisar las horas de períodos anteriores o futuros.

**N5 (S).** Como director, quiero ver el mismo detalle de cualquier alumno, con todos sus profesores, para responder consultas de las familias.

**N8 (S).** Como director, quiero ver la lista de todos los profesores de la academia, con sus instrumentos, cantidad de alumnos y grupos, horas dictadas del mes y próxima clase, para saber qué hace cada uno de un vistazo.
- Incluye a profesores sin grupo propio que solo hayan dictado reemplazos.
- Se puede buscar por nombre y cambiar de mes.
- Solo dirección tiene esta vista: un profesor, una familia o un alumno reciben 403.

**N9 (S).** Como director, quiero abrir un profesor y ver sus grupos (horario semanal, sala, nivel, cupo), los alumnos de cada grupo, las horas del mes y los reemplazos que dio o recibió, para tener el panorama completo.
- Horas dictadas: las clases que ese profesor dictó o dictará, con reemplazos incluidos y sin las que cubrió otra persona.
- Reemplazos: minutos que cubrió por otros y minutos de sus clases que cubrieron otros.

**N10 (S).** Como director, quiero pasar del detalle de un alumno al de cada uno de sus profesores, y del detalle de un profesor a cada uno de sus alumnos, para recorrer la academia sin volver al menú.

**N6 (S).** Como profesor o apoderado, quiero ver también las horas a las que el alumno asistió, para comparar lo programado con lo que realmente ocurrió.
- Horas asistidas: minutos de las clases del período en que el alumno estuvo presente o atrasado.
- Se muestra junto al resumen de asistencia de cada relación alumno-profesor.

**N7 (C).** Como usuario, quiero saltar de una clase de esta lista a su lugar en el calendario, para ver el contexto.

---

## Orden sugerido de construcción
1. A1–A3, B1–B2 (base).
2. C1–C2, D1–D3, J1 (sin esto no hay producto).
3. E1–E4, K1–K2, I1 (el diferenciador principal).
4. F1, N1–N5, N8–N10, L1, M1–M5, H1–H3.
5. A5 (importación), D4, y el resto de las S y C.

## Criterios de salida de la fase 1
- Todas las historias **M** completas.
- Un piloto real con al menos una academia durante 4 semanas.
- Cero choques de sala/profesor en el piloto.
- Las métricas de la fase 1 de [04-mvp-fases.md](04-mvp-fases.md) cumplidas.
