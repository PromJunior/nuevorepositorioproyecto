from fastapi import HTTPException, status


def validate_ruc_format(ruc: str) -> str:
    """
    Valida que el RUC peruano tenga exactly 11 dígitos, sea completamente numérico,
    y comience con los prefijos válidos de la SUNAT (10, 15, 17, 20).
    """
    if not ruc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El RUC no puede estar vacío"
        )
    if len(ruc) != 11 or not ruc.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El RUC debe tener exactamente 11 dígitos numéricos"
        )
    
    # Prefijos válidos en Perú: 10 (persona natural con negocio), 20 (persona jurídica), 15, 17, etc.
    valid_prefixes = ("10", "15", "17", "20")
    if not ruc.startswith(valid_prefixes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El RUC no tiene un formato válido de SUNAT (debe comenzar con 10, 15, 17 o 20)"
        )
        
    return ruc
