# MVP redefinido: fases y funciones

> Este documento **reemplaza la priorización** de [01-alcance-mvp.md](01-alcance-mvp.md) y el orden de [02-historias-de-usuario.md](02-historias-de-usuario.md). Las historias y el esquema anteriores siguen siendo la base; aquí cambia qué se construye primero y por qué.

## 1. Qué cambió respecto al plan anterior

El plan original partía de las funciones de aula (planes de clase, partituras, audio). Después de analizar los dolores reales de una academia, el orden se invierte:

1. **Primero la operación diaria** (agenda, asistencia, avisos), que es lo que obliga a abrir la app todas las semanas.
2. **Luego el dinero** (mensualidades, honorarios), que es lo que más tiempo administrativo consume.
3. **Luego retención y captación** (alertas de deserción, embudo de alumnos nuevos), que es lo que más ingresos mueve.
4. **Después lo pedagógico** y, al final, los diferenciadores más costosos (recital, partituras, WhatsApp, app nativa).

**Motivo:** las funciones de retención y captación necesitan datos que solo existen si antes se usó la agenda, la asistencia y los pagos. Construirlas primero sería construir sobre vacío.

## 2. Cómo se priorizó

Cada función se puntuó con cuatro criterios: **impacto** (ahorra horas o mueve ingresos), **frecuencia** de uso, **esfuerzo** técnico y **riesgo** (legal, técnico o de adopción). Se prioriza alto impacto y frecuencia con bajo esfuerzo, y se posterga lo que depende de datos que aún no existen.

| Función | Impacto | Frecuencia | Esfuerzo | Fase |
|---|---|---|---|---|
| Calendario con salas, sin choques | Alto | Diaria | Medio | 1 |
| Reagendamiento con reglas | Alto | Semanal | Medio | 1 |
| Asistencia en un toque | Alto | Diaria | Bajo | 1 |
| Avisos por email y en la app | Alto | Diaria | Bajo | 1 |
| Importación desde Excel/CSV | Alto (adopción) | Una vez | Bajo | 1 |
| Consentimientos y retiro de menores | Medio-alto (riesgo) | Una vez | Bajo | 1 |
| Reemplazo de profesor | Medio-alto | Ocasional | Bajo | 1 |
| Alumnos y profesores vinculados | Medio-alto | Semanal | Bajo | 1 |
| Materiales simples (PDF y enlaces) | Medio | Semanal | Bajo | 1 |
| Control de mensualidades | Alto | Mensual | Bajo | 2 |
| Descuentos y becas | Medio | Mensual | Bajo | 2 |
| Recuperaciones y créditos | Medio-alto | Semanal | Medio | 2 |
| Liquidación de honorarios | Alto | Mensual | Medio | 2 |
| Pasarela de pago en línea | Alto | Mensual | Alto | 2 |
| Embudo de captación | Alto | Diaria | Medio | 3 |
| Alerta de riesgo de deserción | Alto | Semanal | Medio | 3 |
| Panel de dirección | Alto | Semanal | Medio | 3 |
| Reportes de progreso a apoderados | Alto | Trimestral | Medio | 3 |
| Encuesta de satisfacción | Medio | Trimestral | Bajo | 3 |
| Planes de clase y plantillas | Medio | Semanal | Medio | 4 |
| Niveles y evaluación | Medio-alto | Semestral | Medio | 4 |
| Tareas y práctica con video | Alto potencial | Diaria | Alto | 4 |
| Módulo de recital | Alto | Anual | Alto | 5 |
| WhatsApp | Medio-alto | Diaria | Medio | 5 |
| Ensambles | Medio | Ocasional | Medio | 5 |
| Inventario de instrumentos | Medio | Ocasional | Medio | 5 |
| Partitura a audio y secciones | Medio | Ocasional | Muy alto | 5 |
| App móvil nativa (Expo) | Medio | Diaria | Alto | 5 |

## 3. Vista general

| Fase | Nombre | Pregunta que responde | Duración estimada* |
|---|---|---|---|
| 0 | Fundaciones | ¿Está listo el terreno técnico y legal? | 1 semana |
| 1 | Agenda y asistencia | ¿Usan la app cada semana en vez de WhatsApp y Excel? | 6 a 8 semanas |
| 2 | Dinero | ¿Reduce el trabajo administrativo mensual? | 5 a 6 semanas |
| 3 | Retención y captación | ¿Retiene y capta más alumnos? | 5 a 6 semanas |
| 4 | Pedagogía | ¿Mejora el seguimiento del aprendizaje? | por definir tras la fase 3 |
| 5 | Diferenciadores | ¿Justifica un precio mayor? | por definir |

\* Estimaciones gruesas para una sola persona desarrollando con Go, React y Postgres. Se ajustan al terminar la fase 0.

**MVP = fases 0 a 3.** Las fases 4 y 5 son hoja de ruta y se deciden según lo aprendido en los pilotos.

---

## Fase 0: Fundaciones

**Objetivo:** dejar listo lo que no se ve pero frena todo lo demás.

**Funciones**
- Monorepo: `apps/api` (Go), `apps/web` (React + Vite), `packages/api-client` (cliente TypeScript generado desde OpenAPI).
- Base de datos con migraciones (goose), partiendo de [la migración inicial](../apps/api/migrations/00001_initial_schema.sql), **validada contra un Postgres real**, incluida la prueba de choque de salas.
- Integración continua: pruebas de la API y del frontend en cada cambio.
- Entornos de desarrollo y de piloto desplegables.
- Decisiones abiertas cerradas: país y normativa de datos de menores, edad mínima para cuenta propia, política de recuperación de clases.
- **Reclutar el piloto:** 1 o 2 academias dispuestas a usar la app durante un mes y a decir cuánto pagarían.

**Criterio de salida:** una migración vacía levanta el esquema, una prueba automática demuestra que dos sesiones superpuestas son rechazadas, y hay una academia piloto comprometida.

---

## Fase 1: Agenda y asistencia

**Objetivo:** que la academia deje de coordinar horarios por mensajes y de llevar asistencia en papel.

**Por qué primero:** es el dolor diario más visible, genera los datos que usan las fases siguientes y es el diferenciador central de la idea original (reagendar sin coordinar).

### Funciones imprescindibles
1. **Cuentas, roles e invitaciones.** Director, profesor, apoderado y alumno, con invitación por correo o enlace. Una persona puede tener varios roles.
2. **Vínculo apoderado ↔ alumno** con consentimiento registrado. Los menores pueden existir sin cuenta propia.
3. **Catálogo:** instrumentos, géneros, niveles y salas.
4. **Grupos de clase e inscripciones.** Individuales o grupales, con profesor, sala, horario, rango de edad y cupo.
5. **Calendario** por semana y mes, para cada rol, y por sala y profesor para dirección.
6. **Feriados y cierres** de la academia (tabla `closures`), que bloquean la generación de sesiones.
7. **Reagendamiento con reglas.** Solicitud con motivo, aprobación según la regla de la academia, tope mensual y anticipación mínima. La base de datos impide choques de sala y de profesor.
8. **Cancelación por imprevisto** con aviso inmediato a las familias.
9. **Asistencia** en un toque (presente, ausente, atrasado, justificado).
10. **Avisos por email y dentro de la app** ante cambios, cancelaciones y recordatorios.
11. **Importación desde Excel/CSV** de alumnos, profesores y horarios.

### Funciones importantes
12. **Reemplazo de profesor** en una sesión puntual, con aviso a los inscritos. Es un cambio de `teacher_id`, y será la base de la liquidación de honorarios.
13. **Nota breve del profesor** por sesión (qué se trabajó). Alimenta los reportes de la fase 3.
14. **Materiales simples:** PDF y enlaces asociados a un grupo, sesión o alumno, con declaración de derechos de uso. Da a los apoderados una razón para abrir la app.
15. **Consentimientos de imagen** y **autorizados para retirar al menor**, registrados con fecha.
16. **Suscripción al calendario** (iCal) para ver las clases en el teléfono.
17. **Alumnos y profesores vinculados:** el profesor ve sus alumnos y, por cada uno, sus clases y horas del mes; la familia ve, por cada alumno, sus profesores con las clases y horas de cada uno. Dirección ve todo (épica N): además de los alumnos, tiene una vista de todos los profesores (grupos, alumnos, horas dictadas y reemplazos) y navega de uno a otro.

### Cambios al modelo de datos
Agregar al esquema actual: `closures`, `consents` (tipo, otorgado por, fecha, revocado) y `pickup_authorizations` (alumno, persona autorizada, documento).

### Fuera de esta fase (a propósito)
Cobros, WhatsApp, planes de clase, partituras, app nativa. La web debe verse bien en el teléfono, y eso basta.

### Cómo se mide
Contra el piloto de 4 semanas:
- Más del 80% de los reagendamientos se hacen en la app.
- Más del 90% de las sesiones tienen asistencia marcada.
- Más del 60% de los apoderados entran al menos una vez por semana.
- Cero choques de sala o profesor.

### Decisión al cerrar la fase
Si el piloto no cumple, no se avanza: se investiga por qué (adopción de profesores, fricción de apoderados) antes de construir más.

---

## Fase 2: Dinero

**Objetivo:** eliminar la planilla de mensualidades y el cálculo manual de honorarios.

**Por qué segundo:** es el mayor consumo de tiempo administrativo y la principal fuente de conversaciones incómodas. La fase 1 ya dejó los datos necesarios (inscripciones, asistencia, reemplazos).

### Funciones imprescindibles
1. **Planes de precios y matrículas** por grupo o por alumno.
2. **Control de mensualidades:** cargos generados automáticamente cada mes, estado (pendiente, pagado, vencido) y registro manual de pagos (transferencia, efectivo).
3. **Descuentos y becas:** por hermanos, convenios o beca, con porcentaje o monto y vigencia.
4. **Morosidad:** lista de deudores, recordatorios automáticos por email y reporte para el director.
5. **Recuperaciones y créditos:** el alumno no pierde ninguna clase mientras tenga su plan pagado (ver decisión 3 en la sección 6). Una ausencia acordada de antemano con el profesor, o una cancelación de la academia, genera un crédito que se consume reagendando.
6. **Liquidación de honorarios:** por profesor y período, a partir de horas dictadas, reemplazos y feriados, con reporte exportable.

### Funciones importantes
7. **Pasarela de pago en línea** (con un proveedor local de tu país), en una subfase 2b. Se empieza con registro manual para validar las reglas sin la complejidad de integrar pagos.
8. **Comprobante de pago** descargable.
9. **Exportación contable** a CSV para el contador.

### Cambios al modelo de datos
`fee_plans`, `charges`, `payments`, `discounts`, `makeup_credits`, `payout_periods`, `payout_lines`.

### Riesgos
- Reglas de cobro distintas en cada academia: modelarlas como parámetros y no como código fijo.
- Normativa tributaria local: **no emitir documentos tributarios** en esta fase; solo registrar y exportar.
- Dinero real: cada cálculo con pruebas automáticas y registro de auditoría.

### Cómo se mide
- Tiempo mensual de cobranza y liquidación: baja al menos a la mitad.
- Diferencias entre lo cobrado y lo registrado: cero.
- Pagos conciliados dentro de la app: más del 90%.

---

## Fase 3: Retención y captación

**Objetivo:** que la app ayude a conservar a los alumnos actuales y a convertir las consultas en inscripciones.

**Por qué tercero:** es donde está el mayor retorno económico, pero depende de la asistencia (fase 1) y de los pagos (fase 2) para detectar riesgo.

### Funciones imprescindibles
1. **Embudo de captación.** Registro de cada consulta (nombre, instrumento, origen), estados (consulta, clase de prueba, inscrito, perdido), recordatorios de seguimiento y agenda de la clase de prueba.
2. **Alerta de riesgo de deserción.** Una lista semanal de alumnos en riesgo según reglas claras: ausencias consecutivas, atrasos en pagos, poca asistencia reciente. Cada alerta indica a quién llamar y por qué.
3. **Panel de dirección.** Alumnos activos, altas y bajas, ocupación de salas, ingresos por mes, morosidad y asistencia por profesor.
4. **Reportes de progreso para apoderados.** Un resumen mensual o trimestral armado con asistencia, notas del profesor y repertorio trabajado, revisable por el profesor antes de enviarse.

### Funciones importantes
5. **Encuesta de satisfacción** breve a las familias, con resultados por profesor.
6. **Formulario público de consulta** que alimenta el embudo directamente desde la web o las redes sociales.
7. **Lista de espera** para grupos llenos, con aviso cuando se libera un cupo.
8. **Motivo de baja** registrado al cerrar una inscripción, para aprender por qué se van.

### Cambios al modelo de datos
`leads`, `lead_activities`, `trial_classes`, `retention_alerts`, `progress_reports`, `surveys`, `survey_responses`, `waitlist_entries`.

### Decisión de diseño
Las alertas parten como **reglas simples y explicables**, no como un modelo de predicción. Un director debe poder entender por qué aparece cada alumno en la lista.

### Cómo se mide
- Consultas que reciben respuesta en menos de 24 horas.
- Porcentaje de consultas que pasan a clase de prueba y a inscripción.
- Alumnos en riesgo contactados dentro de la semana, y cuántos se quedaron.
- Retención a 3 meses frente al período anterior al uso de la app.

---

## Fase 4: Pedagogía (hoja de ruta)

Se detalla al cerrar la fase 3, con base en lo que pidan los pilotos.

- **Planes de clase y plantillas** etiquetadas por género, instrumento, nivel y edad, compartibles entre profesores.
- **Niveles y criterios de evaluación:** qué debe dominar un alumno para subir de nivel, con registro de evaluaciones.
- **Tareas y práctica en casa:** el profesor asigna, el alumno marca lo hecho y puede subir un video corto; el profesor responde. Solo se construye si no agrega trabajo al profesor.
- **Repertorio por alumno** y seguimiento de piezas.

## Fase 5: Diferenciadores (hoja de ruta)

- **Módulo de recital anual:** inscripción de números, orden del programa, ensayos, salas, invitados y programa imprimible.
- **WhatsApp:** avisos con plantillas de utilidad, solo si el piloto muestra que email y la app no bastan. Ver los costos analizados en la conversación previa.
- **Ensambles:** armado de grupos por nivel, instrumento y horarios compatibles.
- **Inventario y préstamo de instrumentos,** con mantención.
- **Partituras:** reproducción de MusicXML, MIDI y MuseScore; conversión desde PDF como experimento; marcadores por compás para seccionar la partitura.
- **App móvil nativa** con Expo, reutilizando el cliente de la API.

---

## 4. Reglas que atraviesan todas las fases

- **Web primero, responsiva e instalable (PWA).** La app nativa llega en la fase 5, si los datos de uso la justifican.
- **Multi-academia desde el inicio.** Todo lleva `academy_id`, con aislamiento reforzado mediante Row Level Security.
- **Privacidad de menores:** datos mínimos, consentimiento registrado, sin mensajería directa profesor ↔ menor.
- **Derechos de autor:** declaración de uso al subir cualquier archivo, y acceso solo con sesión iniciada.
- **Auditoría** de cambios en agenda, asistencia y dinero.
- **Cada fase termina con un piloto real y una decisión explícita** de seguir, ajustar o detenerse.

## 5. Modelo de negocio inicial (hipótesis)

- Suscripción mensual por academia, escalonada por alumnos activos.
- Fase 1 gratuita o a precio simbólico para el piloto, **con una pregunta explícita de cuánto pagarían** cuando termine.
- El pago empieza a tener sentido desde la fase 2, cuando la app ahorra trabajo administrativo medible.
- WhatsApp y pasarela de pago como complementos, para traspasar su costo variable.

## 6. Decisiones pendientes

1. País y normativa aplicable (datos de menores, tributación, proveedores de pago): País Chile, normativa queda pendiente
2. Edad desde la cual un alumno tiene cuenta propia: desde 18 años
3. Política de recuperación de clases por defecto: estudiante no pierde ninguna clase mientras lo tenga pagado, por lo que puede estar sin asistir algunas semanas, todo con previo acuerdo con su profesor.
4. Academia(s) piloto y fecha de inicio: Dejar pendiente
5. Qué Postgres administrado usar (Neon o Supabase): usar Neon

### Consecuencias de lo decidido

**Decisión 2: cuenta propia desde los 18 años.**
- El valor por defecto de `academy_settings.student_own_account_min_age` pasó de 14 a 18 (migración `00002`, con prueba automática).
- Un alumno menor de 18 nunca tiene sesión propia: todo pasa por su apoderado.
- Un alumno de 18 o más se registra con su propia cuenta y no necesita apoderado. En la fase 2 habrá que decidir si también es quien paga.

**Decisión 3: no se pierde ninguna clase mientras el plan esté pagado.**
- La clase no se descuenta: una ausencia acordada con el profesor genera un crédito, y el crédito vive mientras el plan esté pagado.
- Necesita un flujo nuevo, **ausencia acordada**: el apoderado o alumno avisa, el profesor la aprueba antes de la clase, y solo entonces cuenta como justificada con crédito.
- Depende de los pagos (fase 2), porque "mientras esté pagado" se calcula con las mensualidades. En la fase 1 basta con poder marcar una ausencia como "acordada con el profesor", sin calcular créditos todavía.
- Efecto sobre el reagendamiento: el tope mensual (`reschedule_monthly_limit`, 2 por defecto) puede chocar con esta política. Conviene subirlo o desactivarlo por defecto en cuanto se implementen los créditos.
- **Sin definir todavía:**
  - ¿Los créditos vencen alguna vez, o se acumulan sin límite mientras el plan siga pagado?: Por el momento se acumulan sin límites mientras el plan siga pagado
  - ¿Hay un máximo de semanas seguidas sin asistir?: Por el momento no
  - Si el alumno se retira con créditos pendientes, ¿se pierden, se devuelven o se transfieren?: El alumno pierde los créditos

**Decisión 5: Neon.**
- Neon es solo PostgreSQL: no trae autenticación ni archivos. La autenticación ya la hace la API en Go; los archivos irán a un almacenamiento aparte compatible con S3 (por ejemplo Cloudflare R2).
- El aislamiento entre academias debe reforzarse con Row Level Security propio, porque no viene incluido.
- Neon ofrece conexión directa y conexión "con pool". Las migraciones y las pruebas deben usar la **directa**; la API en producción puede usar la con pool, con ajustes en pgx para que no use consultas preparadas.
- Hay que confirmar en el piloto que están habilitadas las extensiones `btree_gist` y `citext`, de las que depende el esquema.
- Las bases de datos con inactividad pueden "dormirse" y tardar en responder la primera vez; conviene tenerlo en cuenta para `/readyz`.

**Decisiones 1 y 4: siguen pendientes.** No bloquean la fase 1. El país afecta el texto legal de los consentimientos y los proveedores de pago, y la academia piloto afecta cuándo se puede probar con usuarios reales.
