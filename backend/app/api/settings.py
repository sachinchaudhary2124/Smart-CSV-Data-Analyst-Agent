from fastapi import APIRouter, status, HTTPException
from typing import Dict, Any
from app.services.settings_service import settings_service

router = APIRouter()

@router.get("", response_model=Dict[str, Any])
def get_settings():
    """
    Retrieves the persisted SaaS application settings.
    """
    try:
        return settings_service.load_settings()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load settings: {str(e)}"
        )

@router.post("", response_model=Dict[str, Any])
def update_settings(payload: Dict[str, Any]):
    """
    Updates and persists user-defined SaaS application settings.
    """
    try:
        return settings_service.save_settings(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update settings: {str(e)}"
        )
