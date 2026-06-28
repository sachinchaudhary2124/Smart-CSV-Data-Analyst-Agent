from fastapi import APIRouter, status, HTTPException, Query
from typing import Dict, Any, Optional
import os

from app.services.dataset_service import DatasetService
from app.tools.csv_tools import executive_kpi_calculator, ExecutiveKPIsInput, theme_dashboard_generator, ThemeDashboardInput

router = APIRouter()
dataset_service = DatasetService()

@router.get("/overview")
def get_active_overview(
    category: Optional[str] = Query(None, description="Category filter"),
    region: Optional[str] = Query(None, description="Region filter"),
    product: Optional[str] = Query(None, description="Product filter")
):
    """
    Calculates summary card parameters directly over the active uploaded dataset, applying filters if supplied.
    """
    from app.services.session_manager import dataset_session_manager
    active_id = dataset_session_manager.get_active_dataset_id_or_fallback()
    if not active_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No dataset context active. Please upload a dataset CSV file first."
        )
    return get_dataset_overview(active_id, category, region, product)

@router.get("/overview/{upload_id}")
def get_dataset_overview(
    upload_id: str,
    category: Optional[str] = Query(None, description="Category filter"),
    region: Optional[str] = Query(None, description="Region filter"),
    product: Optional[str] = Query(None, description="Product filter")
):
    """
    Calculates summary card parameters directly over the selected uploaded dataset, applying filters if supplied.
    """
    try:
        meta_db = dataset_service._load_metadata()
        if upload_id not in meta_db:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset index not found in metadata.")
        
        meta = meta_db[upload_id]
        file_path = os.path.join(settings_upload_path(meta["saved_name"]))
        
        kpi_input = ExecutiveKPIsInput(
            file_path=file_path,
            category_filter=category,
            region_filter=region,
            product_filter=product
        )
        
        res = executive_kpi_calculator(kpi_input)
        if not res.get("success"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("error", "KPI calculation failed."))
            
        return res["data"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate analytics metrics: {str(e)}"
        )

@router.get("/theme/{upload_id}")
def get_theme_dashboard_layout(upload_id: str, theme: str = "revenue"):
    """
    Returns thematic widgets configuration layouts and calculations.
    """
    try:
        meta_db = dataset_service._load_metadata()
        if upload_id not in meta_db:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset metadata not found.")
        
        meta = meta_db[upload_id]
        file_path = os.path.join(settings_upload_path(meta["saved_name"]))
        
        res = theme_dashboard_generator(ThemeDashboardInput(file_path=file_path, theme=theme))
        if not res.get("success"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("error"))
            
        return res["data"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile theme dashboard: {str(e)}"
        )


def settings_upload_path(saved_name: str) -> str:
    from app.core.config import settings
    return os.path.join(settings.UPLOAD_DIR, saved_name)
