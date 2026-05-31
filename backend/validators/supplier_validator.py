from fastapi import HTTPException, status

GENERIC_SUPPLIER_RUC = "00000000000"


def validate_ruc_format(ruc: str) -> str:
    """
    Valida que el RUC peruano tenga 11 digitos, sea numerico,
    y comience con los prefijos validos de SUNAT.
    """
    if not ruc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El RUC no puede estar vacio",
        )

    if len(ruc) != 11 or not ruc.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El RUC debe tener exactamente 11 digitos numericos",
        )

    if ruc == GENERIC_SUPPLIER_RUC:
        return ruc

    valid_prefixes = ("10", "15", "17", "20")
    if not ruc.startswith(valid_prefixes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El RUC no tiene un formato valido de SUNAT (debe comenzar con 10, 15, 17 o 20)",
        )

    return ruc
