from fastapi import APIRouter, Depends, HTTPException

from auth.security import get_current_admin_user
from models.model import User
from services.webhook_service import send_webhook_event

router = APIRouter(prefix="/automations", tags=["Automations"])


@router.post("/webhook/test")
def test_webhook_connection(
    _: User = Depends(get_current_admin_user),
):
    result = send_webhook_event(
        "test.connection",
        {"message": "ERP conectado correctamente"},
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "No se pudo enviar el webhook"),
        )

    return {
        "success": True,
        "message": "Webhook enviado correctamente",
    }
