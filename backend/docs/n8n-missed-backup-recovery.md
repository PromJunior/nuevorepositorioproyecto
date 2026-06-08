# Fase 18B - Backup programado y recuperacion al encender

## Objetivo

Mantener el flujo:

`ERP -> n8n -> CSV incremental -> Drive`

Y agregar recuperacion automatica cuando la PC estuvo apagada a la hora programada.

No implementa dashboard, pipeline maestro, multiempresa, cloud ni cambios a la logica incremental.

## Tabla creada

`backup_execution_log`

Campos:

- `id`
- `scheduled_date`
- `scheduled_time`
- `executed_at`
- `status`
- `trigger_type`
- `message`
- `duration_ms`
- `rows_exported`
- `created_at`
- `updated_at`

Estados:

- `PENDING`
- `SUCCESS`
- `FAILED`
- `SKIPPED`

Triggers:

- `schedule`
- `startup`
- `manual`

## Servicio

Archivo:

`backend/services/backup_service.py`

Funciones principales:

- `schedule_daily_backup()`
- `check_missed_backup()`
- `run_backup()`
- `log_execution()`

La hora fija del backup diario es `22:30`.

## Endpoints

### POST /exports/daily-run

Ejecuta el backup diario incremental si no existe una ejecucion final para la fecha actual.

Body:

```json
{
  "incremental": true,
  "trigger_type": "schedule"
}
```

Si ya se ejecuto:

```json
{
  "success": true,
  "executed": false,
  "skipped": true,
  "status": "SKIPPED",
  "modules": []
}
```

### GET /exports/backup-status

Respuesta:

```json
{
  "last_backup": "2026-06-07T22:30:00",
  "status": "SUCCESS",
  "next_backup": "2026-06-08T22:30:00"
}
```

### POST /exports/run-missed-backup

Ejecuta el backup pendiente detectado al iniciar.

Respuesta:

```json
{
  "executed": true,
  "trigger": "startup"
}
```

## Startup recovery

Al iniciar FastAPI:

1. Se crea/actualiza la tabla `backup_execution_log`.
2. Se lanza una tarea background.
3. La tarea revisa si falta el backup del dia anterior.
4. Si falta, crea un log `PENDING`.
5. Envia un evento webhook `backup.missed` a n8n.
6. n8n llama `POST /exports/run-missed-backup`.

No bloquea el arranque y no duplica: si la fecha ya tiene `SUCCESS` o `SKIPPED`, no vuelve a ejecutar.

## n8n

### Workflow 1: ERP Daily Backup

Archivo importable:

`backend/docs/n8n-erp-daily-backup.workflow.json`

Config:

- Schedule Trigger: diario a las `22:30`.
- HTTP Request: `POST http://127.0.0.1:8000/exports/daily-run`.
- IF `success == true`.
- Loop modulos.
- Si `rows > 0`, convertir `content_base64` a binario y subir a Drive.
- Si `rows = 0`, log `SKIPPED` y no subir archivo vacio.

### Workflow 2: ERP Startup Recovery

Archivo importable:

`backend/docs/n8n-erp-startup-recovery.workflow.json`

Config:

- Webhook n8n recibe `backup.missed`.
- HTTP Request: `POST http://127.0.0.1:8000/exports/run-missed-backup`.
- IF `success == true`.
- Loop modulos.
- Si `rows > 0`, subir CSV a Drive.
- No subir archivos vacios.

## Frontend

Pantalla:

`Configuracion -> n8n`

Muestra:

- Ultimo respaldo
- Proximo respaldo
- Estado
- Ejecutar ahora

## Logs

Consultar estado programado:

```sql
SELECT *
FROM backup_execution_log
ORDER BY scheduled_date DESC, id DESC;
```

Consultar logs de subida:

`GET /automations/drive-uploads/logs`

## Como probar

1. Ejecutar manualmente desde `Configuracion -> n8n -> Ejecutar ahora`.
2. Confirmar `SUCCESS` o `SKIPPED`.
3. Revisar `backup_execution_log`.
4. Crear una venta nueva.
5. Ejecutar `ERP Daily Backup` en n8n.
6. Confirmar subida a Drive.
7. Ejecutar otra vez el mismo dia.
8. Confirmar que responde `SKIPPED` y no duplica.
9. Apagar PC antes de las `22:30`.
10. Encender al dia siguiente.
11. Confirmar evento `backup.missed` y ejecucion de `ERP Startup Recovery`.
12. Reiniciar varias veces y confirmar que no duplica.

## Riesgos

- El backend no sube a Drive; n8n debe estar activo para completar la subida.
- Si el webhook de n8n esta desactivado, el startup deja el backup `PENDING` y se puede ejecutar manualmente con `/exports/run-missed-backup`.
- Si hay cambios nuevos despues de un backup `SKIPPED`, ese dia no se vuelve a ejecutar para evitar duplicados.
- La API key debe existir tanto en backend como en n8n si se usa `X-API-Key`.
