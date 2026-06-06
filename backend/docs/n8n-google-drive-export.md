# Fase 17A - Exportacion CSV a Google Drive desde n8n

## Objetivo

Enviar CSV generados por el ERP a Google Drive usando n8n como responsable de OAuth2, subida de archivos y control de duplicados.

No se usa Azure, scheduler, colas, Redis ni WhatsApp. El backend no guarda credenciales de Google.

## Carpetas en Google Drive

Crear una carpeta raiz:

- `ERP_BACKUPS`

Crear subcarpetas:

- `ERP_BACKUPS/sales`
- `ERP_BACKUPS/purchases`
- `ERP_BACKUPS/inventory`
- `ERP_BACKUPS/cash`
- `ERP_BACKUPS/clients`
- `ERP_BACKUPS/snapshots`

## Archivos esperados

Diarios:

- `sales_YYYYMMDD.csv`
- `sales_items_YYYYMMDD.csv`
- `purchases_YYYYMMDD.csv`
- `purchase_items_YYYYMMDD.csv`
- `inventory_movements_YYYYMMDD.csv`
- `cash_sessions_YYYYMMDD.csv`
- `clients_delta_YYYYMMDD.csv`

Semanales:

- `products_snapshot_YYYYWW.csv`
- `suppliers_snapshot_YYYYWW.csv`
- `settings_snapshot_YYYYWW.csv`

## Backend

Endpoint opcional:

`POST /exports/upload`

Body:

```json
{
  "module": "sales",
  "format": "csv",
  "filename": "sales_20260605.csv"
}
```

Respuesta:

- `text/csv`
- Header `Content-Disposition` con el nombre del archivo.
- Header `X-ERP-Drive-Folder` con la subcarpeta sugerida.
- Header `X-ERP-Row-Count` con la cantidad de filas.

Permisos:

- Admin: puede exportar.
- Supervisor: puede ver logs en automatizaciones.
- Vendedor: sin acceso.

Cuando n8n llama este endpoint a partir de un webhook, usar `emit_event=false` para evitar un loop:

```json
{
  "module": "sales",
  "format": "csv",
  "filename": "sales_20260605.csv",
  "emit_event": false
}
```

## Workflow n8n

1. Webhook
   - Method: `POST`
   - Path sugerido: `/erp/report-generated`
   - Recibe el payload del ERP:

```json
{
  "event": "report.generated",
  "timestamp": "2026-06-05T16:20:00",
  "source": "erp",
  "version": "1.0",
  "data": {
    "module": "sales",
    "format": "csv",
    "filename": "sales_20260605.csv",
    "filters": {
      "drive_root": "ERP_BACKUPS",
      "drive_folder": "sales",
      "export_endpoint": "/exports/upload",
      "emit_event": false
    },
    "generated_by": "admin"
  }
}
```

2. Switch
   - Value: `{{$json.event}}`
   - Case: `report.generated`

3. IF
   - Condition: `{{$json.data.format}} == "csv"`

4. HTTP Request - Descargar CSV del ERP
   - Method: `POST`
   - URL: `https://TU_ERP_API/exports/upload`
   - Authentication: Bearer token de un usuario admin o credencial segura equivalente.
   - Send body as JSON:

```json
{
  "module": "={{$json.data.module}}",
  "format": "csv",
  "filename": "={{$json.data.filename}}",
  "emit_event": false
}
```

   - Response format: File
   - Binary property: `data`

5. Google Drive - Search
   - Resource: File
   - Search by name: `{{$json.data.filename}}`
   - Folder: subcarpeta `ERP_BACKUPS/{{$json.data.filters.drive_folder}}`

6. IF - Existe archivo
   - Si existe: Google Drive Update con el mismo `fileId`.
   - Si no existe: Google Drive Upload en la subcarpeta correspondiente.

7. HTTP Request - Guardar log en ERP
   - Method: `POST`
   - URL: `https://TU_ERP_API/automations/drive-uploads/log`
   - Authentication: Bearer token admin.
   - Body:

```json
{
  "filename": "={{$json.data.filename}}",
  "module": "={{$json.data.module}}",
  "status": "OK",
  "duration_ms": "={{$execution.resumeUrl ? 0 : 0}}",
  "drive_file_id": "={{$node['Google Drive Upload'].json.id || $node['Google Drive Update'].json.id}}",
  "message": "Subido a Google Drive"
}
```

8. Respond to Webhook
   - Status: `200`
   - Body:

```json
{
  "ok": true,
  "message": "CSV guardado en Google Drive"
}
```

## Logs

Listar resultados de subida:

`GET /automations/drive-uploads/logs`

Campos guardados:

- fecha: `timestamp`
- archivo: `filename`
- estado: `status`
- duracion: `duration_ms`
- archivo Drive: `drive_file_id`

## Validacion

1. Exportar CSV desde el ERP o llamar `POST /exports/upload`.
2. Ver `report.generated` en `GET /automations/events/logs?event=report.generated`.
3. Confirmar que n8n descarga el CSV desde `/exports/upload` con `emit_event=false`.
4. Verificar que el archivo queda en `ERP_BACKUPS/<subcarpeta>`.
5. Descargar el archivo desde Google Drive.
6. Confirmar el log en `GET /automations/drive-uploads/logs`.
7. Repetir el mismo filename y confirmar que n8n actualiza el archivo existente en vez de duplicarlo.

## Riesgos

- Si n8n llama `/exports/upload` sin `emit_event=false`, se puede generar un loop de webhooks.
- El backend no puede validar OAuth2 de Drive; esa responsabilidad queda en n8n.
- `clients_delta` usa `create_at` porque el modelo actual de clientes no tiene `updated_at`.
- Para evitar duplicados, el control debe hacerse en n8n buscando por nombre dentro de la subcarpeta antes de subir.
