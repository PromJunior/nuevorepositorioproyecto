# Fase 18A - Respaldo diario automatico con n8n

## Objetivo

Ejecutar un backup diario incremental del ERP hacia Google Drive usando n8n.

No implementa dashboards, pipeline maestro, union de tablas, BigQuery, IA ni multiempresa. La exportacion incremental existente se mantiene.

## Carpetas en Google Drive

Crear la carpeta raiz:

- `ERP_BACKUPS`

Crear subcarpetas:

- `ERP_BACKUPS/sales`
- `ERP_BACKUPS/purchases`
- `ERP_BACKUPS/inventory`
- `ERP_BACKUPS/cash`
- `ERP_BACKUPS/logs`

## Endpoint

`POST /exports/daily-run`

Permisos:

- JWT de usuario `admin`.
- O header `X-API-Key` si el backend tiene configurada una de estas variables:
  - `ERP_DAILY_BACKUP_API_KEY`
  - `ERP_BACKUP_API_KEY`
  - `ERP_API_KEY`

Body:

```json
{
  "incremental": true
}
```

Respuesta base:

```json
{
  "success": true,
  "modules": [
    { "module": "sales", "rows": 10 },
    { "module": "purchases", "rows": 3 },
    { "module": "inventory", "rows": 2 },
    { "module": "cash", "rows": 1 }
  ]
}
```

La respuesta real incluye campos adicionales para n8n:

- `filename`
- `drive_root`
- `drive_folder`
- `status`: `SUCCESS`, `EMPTY` o `ERROR`
- `mime_type`: solo cuando `rows > 0`
- `content_base64`: CSV codificado en base64, solo cuando `rows > 0`

Si `rows = 0`, el endpoint no devuelve contenido CSV para ese modulo.

## Workflow n8n

Nombre: `ERP Daily Backup`

### 1. Schedule Trigger

Config:

- Trigger interval: `Days`
- Hour: `00`
- Minute: `00`

Este es el cron diario del backup automatico.

### 2. HTTP Request - Ejecutar daily-run

- Method: `POST`
- URL: `http://127.0.0.1:8000/exports/daily-run`
- Authentication:
  - Bearer token admin, o
  - Header `X-API-Key: <clave-configurada>`
- Send body: JSON

```json
{
  "incremental": true
}
```

### 3. IF - Validar ejecucion

Condicion:

```text
{{$json.success}} == true
```

Si es `false`, registrar un log `ERROR` y finalizar.

### 4. Loop modulos

Iterar sobre:

```text
{{$json.modules}}
```

Para cada modulo evaluar:

```text
{{$json.rows}} > 0
```

### 5. Google Drive Upload

Si `rows = 0`:

- No subir archivo.
- Registrar log con `status=EMPTY`.

Si `rows > 0`:

- Convertir `content_base64` a binario.
- Subir `filename` a la carpeta correspondiente:
  - `sales` -> `ERP_BACKUPS/sales`
  - `purchases` -> `ERP_BACKUPS/purchases`
  - `inventory` -> `ERP_BACKUPS/inventory`
  - `cash` -> `ERP_BACKUPS/cash`

Recomendacion para no duplicar:

- Buscar primero por `filename` dentro de la subcarpeta.
- Si existe, actualizar el archivo.
- Si no existe, subirlo.

### 6. Log resultado

Usar:

`POST /automations/drive-uploads/log`

Permisos:

- Bearer token admin, o
- Header `X-API-Key: <clave-configurada>`

Body para `SUCCESS`:

```json
{
  "module": "={{$json.module}}",
  "filename": "={{$json.filename}}",
  "rows_count": "={{$json.rows}}",
  "incremental": true,
  "status": "SUCCESS",
  "drive_file_id": "={{$node['Google Drive Upload'].json.id}}",
  "message": "Subido a Google Drive"
}
```

Body para `EMPTY`:

```json
{
  "module": "={{$json.module}}",
  "filename": "={{$json.filename}}",
  "rows_count": 0,
  "incremental": true,
  "status": "EMPTY",
  "message": "Sin cambios nuevos; no se subio CSV vacio"
}
```

Body para `ERROR`:

```json
{
  "module": "={{$json.module}}",
  "filename": "={{$json.filename}}",
  "rows_count": 0,
  "incremental": true,
  "status": "ERROR",
  "message": "={{$json.error || 'Fallo el backup diario'}}"
}
```

## Logs

Consultar:

`GET /automations/drive-uploads/logs`

Campos:

- `module`
- `filename`
- `rows_count`
- `status`
- `timestamp`
- `drive_file_id`

Estados validos para este flujo:

- `SUCCESS`
- `EMPTY`
- `ERROR`

## Como probar

1. Ejecutar manualmente `POST /exports/daily-run` con admin o `X-API-Key`.
2. Confirmar que responde los cuatro modulos: `sales`, `purchases`, `inventory`, `cash`.
3. Crear ventas nuevas.
4. Ejecutar el workflow `ERP Daily Backup`.
5. Confirmar subida en `ERP_BACKUPS/sales`.
6. Ejecutar el workflow otra vez.
7. Confirmar que no sube CSV vacio ni duplica filas.
8. Revisar `GET /exports/tracking`.
9. Revisar `GET /automations/drive-uploads/logs`.
10. Esperar la siguiente medianoche y confirmar ejecucion automatica.

## Riesgos

- Si n8n llama despues a `/exports/upload` para los mismos modulos, puede consumir otro incremental y producir archivos vacios.
- Si la API key no esta configurada, solo funcionara con token admin.
- El backend no guarda credenciales de Google; OAuth2 y permisos de Drive quedan en n8n.
- Si se ejecuta mas de una vez el mismo dia y hay cambios nuevos entre ejecuciones, se actualizara el mismo `filename` diario en Drive.
