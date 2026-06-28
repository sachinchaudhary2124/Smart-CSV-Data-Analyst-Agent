import os
import uuid
import json
import logging
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Tuple
import pandas as pd
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatasetService:
    def __init__(self):
        self.metadata_path = os.path.join(settings.UPLOAD_DIR, "metadata.json")

    def _load_metadata(self) -> Dict[str, Any]:
        if os.path.exists(self.metadata_path):
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to read metadata file: {e}")
                return {}
        return {}

    def _save_metadata(self, data: Dict[str, Any]):
        try:
            with open(self.metadata_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to write metadata file: {e}")

    def upload_dataset(self, file: UploadFile) -> Dict[str, Any]:
        # 1. Validate File Extension
        if not file.filename.lower().endswith('.csv'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are supported."
            )

        # 2. Validate File Size
        file.file.seek(0, os.SEEK_END)
        size_bytes = file.file.tell()
        file.file.seek(0)

        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if size_bytes > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB."
            )

        # 3. Calculate Checksum to Validate Duplicates
        hasher = hashlib.md5()
        chunk = file.file.read(8192)
        while chunk:
            hasher.update(chunk)
            chunk = file.file.read(8192)
        file.file.seek(0)
        checksum = hasher.hexdigest()

        metadata_db = self._load_metadata()
        for uid, meta in metadata_db.items():
            if meta.get("checksum") == checksum:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Duplicate file. This dataset was already uploaded as '{meta['original_name']}'."
                )

        # 4. Check for Corrupted CSV
        try:
            # Try to read header and first row to verify formatting
            pd.read_csv(file.file, nrows=2)
            file.file.seek(0)
        except Exception as e:
            logger.error(f"CSV Ingestion corruption validation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Corrupted or invalid CSV file formatting: {str(e)}"
            )

        # 5. Read structure to count rows and columns
        try:
            df_structure = pd.read_csv(file.file)
            file.file.seek(0)
            columns = list(df_structure.columns)
            rows = len(df_structure)
        except Exception as e:
            logger.error(f"Failed parsing row structure: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not compile structure metrics on the CSV data."
            )

        # 6. Save File Safely using UUID
        upload_id = str(uuid.uuid4())
        saved_name = f"{upload_id}.csv"
        file_path = os.path.join(settings.UPLOAD_DIR, saved_name)

        try:
            with open(file_path, "wb") as buffer:
                file.file.seek(0)
                shutil_copy = file.file.read()
                buffer.write(shutil_copy)
        except Exception as e:
            logger.error(f"Failed to write file to local disk: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store uploaded file on the server."
            )

        # 7. Update Metadata registry
        upload_metadata = {
            "upload_id": upload_id,
            "original_name": file.filename,
            "saved_name": saved_name,
            "upload_time": datetime.utcnow().isoformat() + "Z",
            "file_size": size_bytes,
            "columns": columns,
            "rows": rows,
            "checksum": checksum,
            "status": "ready"
        }
        metadata_db[upload_id] = upload_metadata
        self._save_metadata(metadata_db)

        # Set active dataset session
        try:
            from app.services.session_manager import dataset_session_manager
            dataset_session_manager.set_active_dataset(upload_id)
        except Exception as e:
            logger.error(f"Failed to set active dataset session on upload: {e}")

        logger.info(f"File stored successfully: {file.filename} (ID: {upload_id})")
        return upload_metadata

    def list_datasets(self) -> List[Dict[str, Any]]:
        metadata_db = self._load_metadata()
        # Clean any missing items from disk
        cleaned = {}
        for uid, meta in metadata_db.items():
            path = os.path.join(settings.UPLOAD_DIR, meta["saved_name"])
            if os.path.exists(path):
                cleaned[uid] = meta
        if len(cleaned) != len(metadata_db):
            self._save_metadata(cleaned)
        return list(cleaned.values())

    def delete_dataset(self, upload_id: str):
        metadata_db = self._load_metadata()
        if upload_id not in metadata_db:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")
        
        meta = metadata_db[upload_id]
        path = os.path.join(settings.UPLOAD_DIR, meta["saved_name"])
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                logger.error(f"Failed to delete CSV file {path}: {e}")

        del metadata_db[upload_id]
        self._save_metadata(metadata_db)
        logger.info(f"Deleted dataset ID: {upload_id}")

        # Invalidate active session if deleted
        try:
            from app.services.session_manager import dataset_session_manager
            if dataset_session_manager.active_id == upload_id:
                dataset_session_manager.clear_active_dataset()
                # Auto fallback to first available if any
                remaining = self.list_datasets()
                if remaining:
                    dataset_session_manager.set_active_dataset(remaining[0]["upload_id"])
        except Exception as e:
            logger.error(f"Failed to clear active dataset session on delete: {e}")

    def get_df(self, upload_id: str) -> pd.DataFrame:
        metadata_db = self._load_metadata()
        if upload_id not in metadata_db:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")
        
        meta = metadata_db[upload_id]
        path = os.path.join(settings.UPLOAD_DIR, meta["saved_name"])
        if not os.path.exists(path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CSV file not found on disk.")
        
        try:
            return pd.read_csv(path)
        except Exception as e:
            logger.error(f"Failed loading dataframe: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to read CSV dataset: {str(e)}")

    def get_preview(self, upload_id: str) -> Dict[str, Any]:
        df = self.get_df(upload_id)
        
        # Limit columns/data sizes
        column_names = list(df.columns)
        number_of_rows = len(df)
        number_of_columns = len(column_names)
        
        # Get preview rows (first 10 records)
        preview_df = df.head(10)
        # Convert NaN values to None for proper JSON serialization
        preview_rows = preview_df.where(pd.notnull(preview_df), None).to_dict(orient="records")

        # Map pandas data types to reader friendly strings
        data_types = {}
        for col in df.columns:
            data_types[col] = str(df[col].dtype)

        # Count missing values
        missing_values_count = df.isnull().sum().to_dict()
        
        # Calculate file size
        metadata_db = self._load_metadata()
        file_size = metadata_db[upload_id]["file_size"]

        return {
            "upload_id": upload_id,
            "column_names": column_names,
            "data_types": data_types,
            "missing_values_count": {col: int(val) for col, val in missing_values_count.items()},
            "number_of_rows": number_of_rows,
            "number_of_columns": number_of_columns,
            "dataset_size": file_size,
            "preview_rows": preview_rows
        }

    def calculate_health(self, upload_id: str) -> Dict[str, Any]:
        df = self.get_df(upload_id)
        total_rows = len(df)
        total_cells = df.size

        if total_rows == 0:
            return {
                "upload_id": upload_id,
                "missing_percentage": 0.0,
                "duplicate_percentage": 0.0,
                "memory_usage": 0,
                "empty_columns": [],
                "constant_columns": [],
                "potential_date_columns": [],
                "potential_numeric_columns": [],
                "potential_category_columns": [],
                "health_score": 0.0,
                "health_grade": "Poor"
            }

        # 1. Missing Percentage
        missing_count = int(df.isnull().sum().sum())
        missing_pct = float((missing_count / total_cells) * 100.0) if total_cells > 0 else 0.0

        # 2. Duplicate Percentage
        duplicate_count = int(df.duplicated().sum())
        duplicate_pct = float((duplicate_count / total_rows) * 100.0)

        # 3. Memory usage
        memory_usage = int(df.memory_usage(deep=True).sum())

        # 4. Columns metrics
        empty_columns = []
        constant_columns = []
        potential_date_columns = []
        potential_numeric_columns = []
        potential_category_columns = []

        for col in df.columns:
            series = df[col]
            
            # Empty column (100% missing values)
            if series.isnull().all():
                empty_columns.append(col)
                continue # Skip further checks
            
            # Constant column
            if series.nunique(dropna=True) <= 1:
                constant_columns.append(col)
            
            # Potential Numeric Column
            if pd.api.types.is_numeric_dtype(series):
                potential_numeric_columns.append(col)
            else:
                # Try parsing sample
                sample = series.dropna().head(10)
                try:
                    pd.to_numeric(sample, errors='raise')
                    potential_numeric_columns.append(col)
                except (ValueError, TypeError):
                    pass

            # Potential Date Column
            # Simple pattern match and pandas parsing
            is_date = False
            if pd.api.types.is_datetime64_any_dtype(series):
                is_date = True
            else:
                sample_dates = series.dropna().head(10)
                if not sample_dates.empty:
                    parsed = 0
                    for val in sample_dates:
                        val_str = str(val).strip()
                        # common formats: digits with dash/slash
                        if len(val_str) >= 6 and any(char in val_str for char in ['-', '/']):
                            try:
                                pd.to_datetime(val_str, errors='raise')
                                parsed += 1
                            except (ValueError, TypeError):
                                pass
                    if parsed >= len(sample_dates) * 0.7:
                        is_date = True
            
            if is_date:
                potential_date_columns.append(col)

            # Potential Category Column
            # Criteria: non-numeric, object/string with cardinality < 15%
            if not pd.api.types.is_numeric_dtype(series) and not is_date:
                unique_count = series.nunique()
                if unique_count > 1 and (unique_count / total_rows) < 0.15:
                    potential_category_columns.append(col)

        # 5. Calculate Health Score
        health_score = 100.0
        health_score -= (missing_pct * 1.5)
        health_score -= (duplicate_pct * 1.0)
        health_score -= (len(empty_columns) * 10)
        health_score -= (len(constant_columns) * 5)

        health_score = float(max(0.0, min(100.0, health_score)))
        health_score = round(health_score, 1)

        if health_score >= 90:
            health_grade = "Excellent"
        elif health_score >= 75:
            health_grade = "Good"
        elif health_score >= 50:
            health_grade = "Average"
        else:
            health_grade = "Poor"

        return {
            "upload_id": upload_id,
            "missing_percentage": round(missing_pct, 2),
            "duplicate_percentage": round(duplicate_pct, 2),
            "memory_usage": memory_usage,
            "empty_columns": empty_columns,
            "constant_columns": constant_columns,
            "potential_date_columns": potential_date_columns,
            "potential_numeric_columns": potential_numeric_columns,
            "potential_category_columns": potential_category_columns,
            "health_score": health_score,
            "health_grade": health_grade
        }

    def create_demo_dataset(self) -> Dict[str, Any]:
        import random
        import hashlib
        from datetime import datetime, timedelta
        
        # Check if demo dataset already exists
        metadata_db = self._load_metadata()
        for uid, meta in metadata_db.items():
            if meta.get("original_name") == "financial_sales_demo.csv":
                return meta
                
        # Generate demo transaction records
        categories = ["Electronics", "Office Supplies", "Furniture", "Accessories"]
        products = {
            "Electronics": ["Smart Speaker Pro", "Quantum Headset", "LED Monitor 4K"],
            "Office Supplies": ["Ergonomic Stapler", "Sticky Notes Bulk", "Gel Pen Premium Pack"],
            "Furniture": ["Mesh Office Chair", "Adjustable Standing Desk", "LED Desk Lamp"],
            "Accessories": ["USB-C Travel Hub", "Wireless Trackpad", "Mechanical Keyboard"]
        }
        regions = ["North America", "Europe", "Asia", "Latin America"]
        
        data = []
        start_date = datetime(2025, 1, 1)
        
        for i in range(250):
            category = random.choice(categories)
            product = random.choice(products[category])
            region = random.choice(regions)
            qty = random.randint(1, 10)
            unit_price = round(random.uniform(15.0, 350.0), 2)
            total_rev = round(qty * unit_price, 2)
            profit_margin = random.uniform(0.15, 0.45)
            profit = round(total_rev * profit_margin, 2)
            
            date = start_date + timedelta(days=random.randint(0, 350))
            
            data.append({
                "Transaction_ID": f"TRX-{1000 + i}",
                "Date": date.strftime("%Y-%m-%d"),
                "Category": category,
                "Product": product,
                "Region": region,
                "Quantity": qty,
                "Unit_Price": unit_price,
                "Revenue": total_rev,
                "Profit": profit
            })
            
        df = pd.DataFrame(data)
        
        upload_id = "demo-dataset-id-9999"
        saved_name = f"{upload_id}.csv"
        file_path = os.path.join(settings.UPLOAD_DIR, saved_name)
        
        # Save CSV file
        df.to_csv(file_path, index=False)
        
        # Calculate size & checksum
        size_bytes = os.path.getsize(file_path)
        with open(file_path, "rb") as f:
            checksum = hashlib.md5(f.read()).hexdigest()
            
        # Register in metadata
        upload_metadata = {
            "upload_id": upload_id,
            "original_name": "financial_sales_demo.csv",
            "saved_name": saved_name,
            "upload_time": datetime.utcnow().isoformat() + "Z",
            "file_size": size_bytes,
            "columns": list(df.columns),
            "rows": len(df),
            "checksum": checksum,
            "status": "ready"
        }
        
        metadata_db[upload_id] = upload_metadata
        self._save_metadata(metadata_db)

        # Set active dataset session
        try:
            from app.services.session_manager import dataset_session_manager
            dataset_session_manager.set_active_dataset(upload_id)
        except Exception as e:
            logger.error(f"Failed to set active dataset session on demo: {e}")

        logger.info("Created and registered financial sales demo dataset.")
        return upload_metadata

    def get_profile(self, upload_id: str) -> Dict[str, Any]:
        df = self.get_df(upload_id)
        metadata_db = self._load_metadata()
        if upload_id not in metadata_db:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")
        meta = metadata_db[upload_id]
        
        rows = len(df)
        columns = len(df.columns)
        
        # 1. Basic Stats
        missing_values = int(df.isnull().sum().sum())
        duplicate_rows = int(df.duplicated().sum())
        memory_usage_bytes = int(df.memory_usage(deep=True).sum())
        
        # 2. Type Detection
        unique_columns = [col for col in df.columns if df[col].nunique() == rows]
        numeric_columns = list(df.select_dtypes(include=['number']).columns)
        
        # Datetime Columns
        datetime_columns = []
        for col in df.columns:
            if pd.api.types.is_datetime64_any_dtype(df[col]):
                datetime_columns.append(col)
            else:
                sample = df[col].dropna().head(10)
                if not sample.empty:
                    parsed = 0
                    for val in sample:
                        val_str = str(val).strip()
                        if len(val_str) >= 6 and any(char in val_str for char in ['-', '/']):
                            try:
                                pd.to_datetime(val_str, errors='raise')
                                parsed += 1
                            except Exception:
                                pass
                    if parsed >= len(sample) * 0.7:
                        datetime_columns.append(col)
                        
        # Boolean Columns
        boolean_columns = []
        for col in df.columns:
            if col in datetime_columns:
                continue
            unique_vals = set(df[col].dropna().unique())
            if unique_vals.issubset({True, False, 0, 1, '0', '1', 'true', 'false', 'True', 'False', 'y', 'n', 'Y', 'N'}) and len(unique_vals) <= 2:
                boolean_columns.append(col)
                
        # Categorical Columns
        categorical_columns = []
        for col in df.columns:
            if col in datetime_columns or col in boolean_columns:
                continue
            if not pd.api.types.is_numeric_dtype(df[col]):
                unique_count = df[col].nunique()
                if unique_count > 0 and (unique_count / rows) < 0.25:
                    categorical_columns.append(col)
                    
        # Text Columns
        text_columns = []
        for col in df.columns:
            if col in datetime_columns or col in boolean_columns or col in categorical_columns:
                continue
            if not pd.api.types.is_numeric_dtype(df[col]):
                text_columns.append(col)
                
        # 3. Possible Column Roles
        possible_identifier_columns = []
        for col in df.columns:
            col_l = col.lower()
            if any(k in col_l for k in ["id", "code", "key", "number", "num"]) or col in unique_columns:
                possible_identifier_columns.append(col)
                
        possible_currency_columns = []
        possible_monetary_columns = []
        for col in df.columns:
            col_l = col.lower()
            if any(k in col_l for k in ["revenue", "price", "profit", "sales", "cost", "amount", "budget", "spend", "salary", "margin"]):
                possible_currency_columns.append(col)
                possible_monetary_columns.append(col)
                
        possible_target_columns = []
        for col in df.columns:
            col_l = col.lower()
            if any(k in col_l for k in ["label", "target", "class", "y", "status", "revenue", "sales", "profit"]):
                possible_target_columns.append(col)
        if not possible_target_columns and df.columns.tolist():
            possible_target_columns.append(df.columns.tolist()[-1])
            
        potential_geographic_columns = []
        for col in df.columns:
            col_l = col.lower()
            if any(k in col_l for k in ["region", "country", "state", "city", "zip", "lat", "lon", "location", "address", "territory"]):
                potential_geographic_columns.append(col)
                
        potential_time_series_columns = datetime_columns
        
        potential_percentage_columns = []
        for col in df.columns:
            col_l = col.lower()
            if any(k in col_l for k in ["pct", "percent", "margin", "ratio", "rate"]):
                potential_percentage_columns.append(col)
                
        # 4. Health, Complexity, Quality Grade
        health_info = self.calculate_health(upload_id)
        health_score = health_info["health_score"]
        dataset_quality_grade = health_info["health_grade"]
        
        if rows < 1000 and columns < 8:
            dataset_complexity = "Simple"
        elif rows > 10000 or columns > 20:
            dataset_complexity = "Complex"
        else:
            dataset_complexity = "Medium"
            
        # 5. Capabilities List
        capabilities = [
            {
                "name": "Summary",
                "available": rows > 0,
                "reason": "Provides descriptive metrics and data dimensions." if rows > 0 else "Empty dataset."
            },
            {
                "name": "Charts",
                "available": len(numeric_columns) > 0,
                "reason": "Allows plotting numeric trends and aggregates." if len(numeric_columns) > 0 else "No numeric columns found to generate charts."
            },
            {
                "name": "KPI Analysis",
                "available": len(possible_monetary_columns) > 0 and len(numeric_columns) > 0,
                "reason": "Enables metric cards calculation based on financial values." if (len(possible_monetary_columns) > 0 and len(numeric_columns) > 0) else "Requires monetary/revenue columns to perform KPI audits."
            },
            {
                "name": "Forecasting",
                "available": len(datetime_columns) > 0 and len(numeric_columns) > 0,
                "reason": "Performs time-series projections of numeric trends over dates." if (len(datetime_columns) > 0 and len(numeric_columns) > 0) else "Missing date columns or numeric attributes to run forecasts."
            },
            {
                "name": "Correlation",
                "available": len(numeric_columns) >= 2,
                "reason": "Examines statistical relationships between multiple numeric variables." if len(numeric_columns) >= 2 else "Requires at least two numeric fields to analyze correlation structures."
            },
            {
                "name": "Executive Report",
                "available": health_score >= 50 and len(numeric_columns) > 0,
                "reason": "Compiles comprehensive summaries and metric gauge summaries." if (health_score >= 50 and len(numeric_columns) > 0) else "Requires average or better health and numerical attributes."
            },
            {
                "name": "Trend Analysis",
                "available": len(datetime_columns) > 0,
                "reason": "Extracts sequential trajectories over date fields." if len(datetime_columns) > 0 else "Requires a datetime dimension to monitor time trends."
            },
            {
                "name": "Distribution Analysis",
                "available": len(numeric_columns) > 0,
                "reason": "Analyzes the frequency spread and outliers of numeric fields." if len(numeric_columns) > 0 else "Requires numeric columns to plot histograms."
            },
            {
                "name": "Business Insights",
                "available": len(numeric_columns) > 0,
                "reason": "Deduces actionable recommendations and anomalies." if len(numeric_columns) > 0 else "No numeric columns to evaluate recommendations."
            },
            {
                "name": "Geographic Analysis",
                "available": len(potential_geographic_columns) > 0,
                "reason": "Maps transaction regions and locations." if len(potential_geographic_columns) > 0 else "No geographic columns detected."
            },
            {
                "name": "Profit Analysis",
                "available": any("profit" in col.lower() or "margin" in col.lower() for col in df.columns),
                "reason": "Audits net gains and profit margins." if any("profit" in col.lower() or "margin" in col.lower() for col in df.columns) else "Missing Profit column in the dataset."
            },
            {
                "name": "Time Forecasting",
                "available": len(datetime_columns) > 0 and len(numeric_columns) > 0,
                "reason": "Projects values over sequential periods." if (len(datetime_columns) > 0 and len(numeric_columns) > 0) else "Missing date columns or numeric attributes to run forecasts."
            }
        ]
        
        # 6. Suggestions
        suggested_questions = []
        if datetime_columns and possible_monetary_columns:
            date_col = datetime_columns[0]
            money_col = possible_monetary_columns[0]
            suggested_questions.append(f"Show monthly trend of {money_col}")
            suggested_questions.append(f"What is the {money_col} forecast for the next 3 months?")
        if categorical_columns and numeric_columns:
            cat_col = categorical_columns[0]
            num_col = numeric_columns[0]
            suggested_questions.append(f"Compare {num_col} across different {cat_col}")
            suggested_questions.append(f"Find the top performing {cat_col}")
        if numeric_columns:
            num_col = numeric_columns[0]
            suggested_questions.append(f"Find outliers in {num_col}")
            suggested_questions.append(f"Show distribution of {num_col}")
        suggested_questions.append("Identify anomalies in the dataset")
        suggested_questions.append("Generate an executive summary")
        suggested_questions.append("Analyze missing value occurrences")
        
        seen = set()
        suggestions_cleaned = []
        for s in suggested_questions:
            if s not in seen:
                seen.add(s)
                suggestions_cleaned.append(s)
        suggested_questions = suggestions_cleaned[:6]
        
        # 7. Summary Description
        summary_parts = [
            f"This dataset is named '{meta['original_name']}' and has {rows} rows with {columns} columns, occupying {memory_usage_bytes / 1024:.1f} KB of memory."
        ]
        
        if possible_monetary_columns and potential_geographic_columns and datetime_columns:
            summary_parts.append(
                f"It appears to be transactional business log containing metrics like {', '.join(possible_monetary_columns[:3])} segmented by {potential_geographic_columns[0]} over time."
            )
        elif datetime_columns:
            summary_parts.append(
                f"It represents a sequential time-series tracking variables like {', '.join(numeric_columns[:3])}."
            )
        else:
            summary_parts.append(
                f"It contains attributes like {', '.join(df.columns[:4])} suitable for category distributions."
            )
            
        summary_parts.append(
            f"The data quality is graded as {dataset_quality_grade} (Health Score: {health_score}/100) and is categorized as {dataset_complexity} complexity. "
            f"It is highly suitable for statistical summarization, category comparisons, and general insights."
        )
        
        human_readable_summary = " ".join(summary_parts)
        
        return {
            "upload_id": upload_id,
            "dataset_name": meta["original_name"],
            "rows": rows,
            "columns": columns,
            "memory_usage_bytes": memory_usage_bytes,
            "missing_values": missing_values,
            "duplicate_rows": duplicate_rows,
            "unique_columns": unique_columns,
            "numeric_columns": numeric_columns,
            "categorical_columns": categorical_columns,
            "boolean_columns": boolean_columns,
            "datetime_columns": datetime_columns,
            "text_columns": text_columns,
            "possible_identifier_columns": possible_identifier_columns,
            "possible_currency_columns": possible_currency_columns,
            "possible_target_columns": possible_target_columns,
            "potential_geographic_columns": potential_geographic_columns,
            "potential_time_series_columns": potential_time_series_columns,
            "potential_percentage_columns": potential_percentage_columns,
            "potential_monetary_columns": possible_monetary_columns,
            "health_score": health_score,
            "dataset_complexity": dataset_complexity,
            "dataset_quality_grade": dataset_quality_grade,
            "human_readable_summary": human_readable_summary,
            "capabilities": capabilities,
            "suggested_questions": suggested_questions
        }
