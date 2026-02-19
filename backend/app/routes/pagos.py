from fastapi import APIRouter

router = APIRouter(prefix="/pagos", tags=["Pagos"])

@router.get("/")
def test_pagos():
    return {"message": "Router de pagos funcionando"}