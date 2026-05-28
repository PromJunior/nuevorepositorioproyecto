from typing import Any

import httpx
from core.config import settings


APIPERU_DNI_URL = "https://apiperu.dev/api/dni"
APIPERU_RUC_URL = "https://apiperu.dev/api/ruc"


class ApiPeruConfigError(Exception):
    pass


class ApiPeruRequestError(Exception):
    pass

async def consult_dni_apiperu (dni:str ) -> dict[str,Any]:
    token = settings.apiperu_token
    print("TOKEN:", settings.apiperu_token)

    if not token:
        raise ApiPeruConfigError("configura tu token dentro del archivo .env")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                APIPERU_DNI_URL,
                json={"dni":dni},
                headers={"Authorization": f"Bearer {token}",
                         "Content-Type": "application/json"},
                timeout=10.0,
            )
            print("STATUS CODE:", response.status_code)
            print("RESPONSE BODY:", response.text)
        except httpx.RequestError as exc:
            raise ApiPeruRequestError(f"Error de conexion con ApiPeru: {exc}") from exc
            
    
    if response.status_code in (403, 401):
        raise ApiPeruRequestError("Token de autenticacion invalido o expirado")
    
    if response.status_code >= 400:
        raise ApiPeruRequestError(f"Error de ApiPeru: {response.status_code} - {response.text}")
    
    payload = response.json()

    if not payload.get("success", False):
        raise ApiPeruRequestError(payload.get("message", "DNI no encontrado"))

    return payload.get("data") or {}


async def consult_ruc_apiperu(ruc: str) -> dict[str, Any]:
    token = settings.apiperu_token

    if not token:
        raise ApiPeruConfigError("configura tu token dentro del archivo .env")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                APIPERU_RUC_URL,
                json={"ruc": ruc},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                timeout=10.0,
            )
        except httpx.RequestError as exc:
            raise ApiPeruRequestError(
                f"Error de conexion con ApiPeru: {exc}"
            ) from exc

    if response.status_code in (403, 401):
        raise ApiPeruRequestError("Token de autenticacion invalido o expirado")

    if response.status_code >= 400:
        raise ApiPeruRequestError(
            f"Error de ApiPeru: {response.status_code} - {response.text}"
        )

    payload = response.json()

    if not payload.get("success", False):
        raise ApiPeruRequestError(payload.get("message", "RUC no encontrado"))

    return payload.get("data") or {}





