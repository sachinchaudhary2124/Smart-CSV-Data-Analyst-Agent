import os
import json
import logging
import pandas as pd
from typing import Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatasetSessionManager:
    def __init__(self):
        self.active_file_path = os.path.join(settings.UPLOAD_DIR, "active_dataset.json")
        self._active_id: Optional[str] = None
        self._df: Optional[pd.DataFrame] = None
        self._metadata: Optional[Dict[str, Any]] = None
        self._profile: Optional[Dict[str, Any]] = None
        self._schema: Optional[Dict[str, str]] = None
        self._inferred_types: Optional[Dict[str, Any]] = None
        self._statistics: Optional[Dict[str, Any]] = None
        
        # Load persisted active ID if exists
        self.load_active_session()

    def load_active_session(self):
        if os.path.exists(self.active_file_path):
            try:
                with open(self.active_file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    active_id = data.get("active_dataset_id")
                    if active_id:
                        # Call set_active_dataset without reloading during __init__ to avoid circular imports or double work
                        self._active_id = active_id
            except Exception as e:
                logger.error(f"Failed to load active dataset session: {e}")

    def save_active_session(self, upload_id: str):
        try:
            with open(self.active_file_path, "w", encoding="utf-8") as f:
                json.dump({"active_dataset_id": upload_id}, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to save active dataset session: {e}")

    def set_active_dataset(self, upload_id: str):
        from app.services.dataset_service import DatasetService
        ds = DatasetService()
        
        meta_db = ds._load_metadata()
        if upload_id not in meta_db:
            logger.warning(f"Attempted to set active dataset to non-existent ID: {upload_id}")
            if meta_db:
                upload_id = list(meta_db.keys())[0]
            else:
                self.clear_active_dataset()
                return

        self._active_id = upload_id
        self._metadata = meta_db[upload_id]
        
        try:
            # 1. Load DataFrame
            self._df = ds.get_df(upload_id)
            
            # 2. Get profile
            self._profile = ds.get_profile(upload_id)
            
            # 3. Save schema (column names and types)
            self._schema = {col: str(self._df[col].dtype) for col in self._df.columns}
            
            # 4. Save inferred column types
            self._inferred_types = {
                "numeric": self._profile.get("numeric_columns", []),
                "categorical": self._profile.get("categorical_columns", []),
                "boolean": self._profile.get("boolean_columns", []),
                "datetime": self._profile.get("datetime_columns", []),
                "text": self._profile.get("text_columns", [])
            }
            
            # 5. Save statistics (describe or similar)
            stats = {}
            for col in self._inferred_types["numeric"]:
                series = self._df[col].dropna()
                if not series.empty:
                    stats[col] = {
                        "mean": float(series.mean()),
                        "median": float(series.median()),
                        "max": float(series.max()),
                        "min": float(series.min()),
                        "std": float(series.std()) if len(series) > 1 else 0.0,
                        "missing_count": int(self._df[col].isnull().sum())
                    }
            self._statistics = stats
            
            # Save persisted session state to disk
            self.save_active_session(upload_id)
            logger.info(f"DatasetSessionManager: active dataset set to {upload_id}")
            
        except Exception as e:
            logger.error(f"Failed to profile active dataset {upload_id}: {e}")

    def get_active_dataset_id_or_fallback(self) -> Optional[str]:
        if not self._active_id:
            from app.services.dataset_service import DatasetService
            ds = DatasetService()
            datasets = ds.list_datasets()
            if datasets:
                self.set_active_dataset(datasets[0]["upload_id"])
        
        # If still none, check if memory has _active_id but not loaded
        if self._active_id and self._df is None:
            self.set_active_dataset(self._active_id)
            
        return self._active_id

    def clear_active_dataset(self):
        self._active_id = None
        self._df = None
        self._metadata = None
        self._profile = None
        self._schema = None
        self._inferred_types = None
        self._statistics = None
        if os.path.exists(self.active_file_path):
            try:
                os.remove(self.active_file_path)
            except Exception:
                pass

    @property
    def active_id(self) -> Optional[str]:
        return self._active_id

    @property
    def df(self) -> Optional[pd.DataFrame]:
        if self._df is None and self._active_id:
            self.set_active_dataset(self._active_id)
        return self._df

    @property
    def metadata(self) -> Optional[Dict[str, Any]]:
        if self._metadata is None and self._active_id:
            self.set_active_dataset(self._active_id)
        return self._metadata

    @property
    def profile(self) -> Optional[Dict[str, Any]]:
        if self._profile is None and self._active_id:
            self.set_active_dataset(self._active_id)
        return self._profile

    @property
    def schema(self) -> Optional[Dict[str, str]]:
        if self._schema is None and self._active_id:
            self.set_active_dataset(self._active_id)
        return self._schema

    @property
    def inferred_types(self) -> Optional[Dict[str, Any]]:
        if self._inferred_types is None and self._active_id:
            self.set_active_dataset(self._active_id)
        return self._inferred_types

    @property
    def statistics(self) -> Optional[Dict[str, Any]]:
        if self._statistics is None and self._active_id:
            self.set_active_dataset(self._active_id)
        return self._statistics

dataset_session_manager = DatasetSessionManager()
