from typing import List, Optional
import pandas as pd
import math
import numpy as np
from fastapi import APIRouter, UploadFile, File, status, HTTPException
from app.schemas.upload import UploadMetadata, CSVPreview, DatasetHealth, DatasetProfile
from app.services.dataset_service import DatasetService

router = APIRouter()
dataset_service = DatasetService()

def sanitize_value(v):
    if pd.isna(v):
        return None
    if isinstance(v, (np.integer, int)):
        return int(v)
    if isinstance(v, (np.floating, float)):
        if np.isnan(v) or np.isinf(v):
            return None
        return float(v)
    if isinstance(v, np.ndarray):
        return [sanitize_value(x) for x in v.tolist()]
    return v

@router.post("/upload", response_model=UploadMetadata, status_code=status.HTTP_201_CREATED)
def upload_file(file: UploadFile = File(...)):
    """
    Ingests a CSV dataset file.
    Validates file extension, size boundaries, duplicate content checksums, and structural integrity.
    """
    return dataset_service.upload_dataset(file)

@router.get("/recent", response_model=List[UploadMetadata])
def list_uploaded_datasets():
    """
    Returns lists of previously uploaded datasets.
    """
    return dataset_service.list_datasets()

@router.get("/{upload_id}/preview", response_model=CSVPreview)
def get_dataset_preview(upload_id: str):
    """
    Reads the dataset structure and yields columns metadata, types, missing statistics, and top 10 records.
    """
    return dataset_service.get_preview(upload_id)

@router.get("/{upload_id}/health", response_model=DatasetHealth)
def get_dataset_health_check(upload_id: str):
    """
    Triggers the high-fidelity health diagnostics engine to compute duplicate rows, columns cardinality, empty spaces, and final quality score.
    """
    return dataset_service.calculate_health(upload_id)

@router.get("/{upload_id}/records")
def get_dataset_records(upload_id: str):
    """
    Returns the complete records list of the dataset for search, pagination, and sorting.
    """
    df = dataset_service.get_df(upload_id)
    raw_records = df.to_dict(orient="records")
    records = []
    for r in raw_records:
        records.append({k: sanitize_value(v) for k, v in r.items()})
    return {
        "columns": list(df.columns),
        "data_types": {col: str(df[col].dtype) for col in df.columns},
        "records": records
    }

@router.delete("/{upload_id}", status_code=status.HTTP_200_OK)
def delete_uploaded_dataset(upload_id: str):
    """
    Deletes the saved dataset file and its metadata index.
    """
    dataset_service.delete_dataset(upload_id)
    return {"success": True, "message": "Dataset successfully deleted."}

@router.post("/demo", response_model=UploadMetadata, status_code=status.HTTP_201_CREATED)
def trigger_demo_mode_dataset():
    """
    Generates and persists the one-click demo CSV transaction log data.
    """
    return dataset_service.create_demo_dataset()

@router.get("/{upload_id}/profile", response_model=DatasetProfile, status_code=status.HTTP_200_OK)
def get_dataset_profile(upload_id: str):
    """
    Profiles the dataset using the Dataset Intelligence Engine, detecting types, roles, capabilities, and suggestions.
    """
    try:
        return dataset_service.get_profile(upload_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profiling failed: {str(e)}"
        )

@router.get("/{upload_id}/explorer", status_code=status.HTTP_200_OK)
def get_dataset_explorer_data(
    upload_id: str,
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_desc: bool = False
):
    """
    Returns search-filtered, paginated rows of a dataset along with comprehensive column-level descriptive statistics.
    """
    try:
        df = dataset_service.get_df(upload_id)
        
        # 1. Compute summary stats for each column dynamically
        columns_profile = {}
        for col in df.columns:
            series = df[col]
            missing_count = int(series.isnull().sum())
            missing_pct = float(missing_count / len(df) * 100.0) if len(df) > 0 else 0.0
            unique_count = int(series.nunique())
            
            stats = {
                "dtype": str(series.dtype),
                "unique_count": unique_count,
                "missing_pct": sanitize_value(round(missing_pct, 2)),
                "example_values": [str(x) for x in series.dropna().head(5).tolist()]
            }
            
            if pd.api.types.is_numeric_dtype(series):
                stats.update({
                    "min": sanitize_value(series.min()),
                    "max": sanitize_value(series.max()),
                    "mean": sanitize_value(series.mean()),
                    "median": sanitize_value(series.median()),
                })
            else:
                stats.update({
                    "min": None,
                    "max": None,
                    "mean": None,
                    "median": None,
                })
            columns_profile[col] = stats
            
        # 2. Search filtering
        filtered_df = df.copy()
        if search:
            search_lower = search.lower()
            mask = filtered_df.astype(str).apply(lambda x: x.str.lower().str.contains(search_lower)).any(axis=1)
            filtered_df = filtered_df[mask]
            
        # 3. Sort
        if sort_by and sort_by in filtered_df.columns:
            filtered_df = filtered_df.sort_values(by=sort_by, ascending=not sort_desc)
            
        # 4. Paginate
        total_rows = len(filtered_df)
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        paginated_df = filtered_df.iloc[start_idx:end_idx]
        
        # Replace NaN for proper JSON rendering
        raw_records = paginated_df.to_dict(orient="records")
        records = []
        for r in raw_records:
            records.append({k: sanitize_value(v) for k, v in r.items()})
        data_types = {col: str(df[col].dtype) for col in df.columns}
        
        return {
            "total_rows": total_rows,
            "columns": list(df.columns),
            "data_types": data_types,
            "columns_profile": columns_profile,
            "records": records
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explorer failed: {str(e)}"
        )

@router.get("/active", response_model=Optional[UploadMetadata])
def get_active_dataset():
    """
    Returns the metadata of the currently active dataset.
    """
    from app.services.session_manager import dataset_session_manager
    active_id = dataset_session_manager.get_active_dataset_id_or_fallback()
    if not active_id:
        return None
        
    meta_db = dataset_service._load_metadata()
    if active_id in meta_db:
        return meta_db[active_id]
    return None

@router.post("/active/{upload_id}", response_model=UploadMetadata)
def set_active_dataset(upload_id: str):
    """
    Sets the active dataset session.
    """
    from app.services.session_manager import dataset_session_manager
    dataset_session_manager.set_active_dataset(upload_id)
    if not dataset_session_manager.active_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset not found or failed to set active."
        )
    return dataset_session_manager.metadata
