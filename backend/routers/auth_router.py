from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta

from database.database import get_db
from auth.security import (
    verify_password,
    create_access_token,
    get_current_user,
    get_user_role_name,
    require_role
)
from models.model import User
from schemas.user_schema import (
    UserCreate,
    UserResponse,
    Token,
    UserUpdate
)
from crud import user_crud

router = APIRouter(tags=["Authentication"])

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = user_crud.get_user_by_username(db=db, username=form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="username o contraseña incorrecta",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=480)
    access_token = create_access_token(
        data={"sub": user.username, "role": get_user_role_name(user)},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register/", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="solo admin puede crear usuarios")

    db_user = user_crud.get_user_by_username(db=db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="username ya existe")
    
    try:
        return user_crud.create_user(db=db, user_data=user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/users/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user          


@router.get("/users/", response_model=List[UserResponse])
def read_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Solo el administrador puede ver la lista de usuarios")
    return user_crud.get_all_users(db=db)


@router.put("/users/{user_id}", response_model=UserResponse)
def edit_user(
    user_id: int, 
    user_updates: UserUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para editar usuarios")
    
    try:
        return user_crud.update_user(db, user_id, user_updates)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/users/{user_id}", response_model=UserResponse)
def delete_user_logical(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if get_user_role_name(current_user) != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para esta acción")
    
    return user_crud.deactivate_user(db, user_id)
