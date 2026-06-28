from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class UploadMetadata(BaseModel):
    upload_id: str = Field(..., description="Unique identifier generated as a UUID")
    original_name: str = Field(..., description="Original filename uploaded by the user")
    saved_name: str = Field(..., description="UUID filename saved on the storage server")
    upload_time: str = Field(..., description="ISO 8601 formatted timestamp of the upload")
    file_size: int = Field(..., description="File size in bytes")
    columns: List[str] = Field(..., description="List of columns parsed from the CSV header")
    rows: int = Field(..., description="Total row count of the dataset")
    status: str = Field(..., description="Status of processing, e.g., 'ready', 'failed'")

class CSVPreview(BaseModel):
    upload_id: str = Field(..., description="Identifier of the uploaded dataset")
    column_names: List[str] = Field(..., description="List of dataset columns")
    data_types: Dict[str, str] = Field(..., description="Key-value mapping of column name to data type")
    missing_values_count: Dict[str, int] = Field(..., description="Key-value mapping of column name to missing values count")
    number_of_rows: int = Field(..., description="Total number of rows in the dataset")
    number_of_columns: int = Field(..., description="Total number of columns in the dataset")
    dataset_size: int = Field(..., description="Size of the file in bytes")
    preview_rows: List[Dict[str, Any]] = Field(..., description="First 10 rows of dataset records")

class DatasetHealth(BaseModel):
    upload_id: str = Field(..., description="Identifier of the uploaded dataset")
    missing_percentage: float = Field(..., description="Overall missing values percentage across all cells")
    duplicate_percentage: float = Field(..., description="Overall percentage of duplicate rows")
    memory_usage: int = Field(..., description="Memory footprint of dataset in bytes")
    empty_columns: List[str] = Field(..., description="List of column names with 100% missing values")
    constant_columns: List[str] = Field(..., description="List of column names with only one unique value")
    potential_date_columns: List[str] = Field(..., description="List of columns parsed as dates")
    potential_numeric_columns: List[str] = Field(..., description="List of columns parsed as numbers")
    potential_category_columns: List[str] = Field(..., description="List of columns parsed as low-cardinality categories")
    health_score: float = Field(..., description="Computed health index score from 0 to 100")
    health_grade: str = Field(..., description="Assigned grade, e.g., 'Excellent', 'Good', 'Average', 'Poor'")

class CapabilityItem(BaseModel):
    name: str = Field(..., description="The capability name")
    available: bool = Field(..., description="Availability flag")
    reason: str = Field(..., description="Short explanation of why it is available or unavailable")

class DatasetProfile(BaseModel):
    upload_id: str = Field(..., description="Unique dataset ID")
    dataset_name: str = Field(..., description="Dataset name")
    rows: int = Field(..., description="Number of rows")
    columns: int = Field(..., description="Number of columns")
    memory_usage_bytes: int = Field(..., description="Memory usage in bytes")
    missing_values: int = Field(..., description="Total missing cell values")
    duplicate_rows: int = Field(..., description="Total duplicate rows count")
    
    unique_columns: List[str] = Field(..., description="Columns with completely unique values")
    numeric_columns: List[str] = Field(..., description="Columns containing numbers")
    categorical_columns: List[str] = Field(..., description="Columns containing categorical factors")
    boolean_columns: List[str] = Field(..., description="Columns representing true/false")
    datetime_columns: List[str] = Field(..., description="Columns containing timestamps")
    text_columns: List[str] = Field(..., description="Columns containing text descriptions")
    
    possible_identifier_columns: List[str] = Field(..., description="Columns likely serving as record identifiers")
    possible_currency_columns: List[str] = Field(..., description="Columns likely serving as currency quantities")
    possible_target_columns: List[str] = Field(..., description="Columns representing targets or outcomes")
    potential_geographic_columns: List[str] = Field(..., description="Columns mapping geographical states or locations")
    potential_time_series_columns: List[str] = Field(..., description="Columns tracking timestamp series")
    potential_percentage_columns: List[str] = Field(..., description="Columns representing margins or ratios")
    potential_monetary_columns: List[str] = Field(..., description="Columns representing finance values")
    
    health_score: float = Field(..., description="Overall health index")
    dataset_complexity: str = Field(..., description="Complexity score (Simple, Medium, Complex)")
    dataset_quality_grade: str = Field(..., description="Quality grade assessment")
    human_readable_summary: str = Field(..., description="General overview summary statement")
    
    capabilities: List[CapabilityItem] = Field(..., description="List of platform capability metrics and explanations")
    suggested_questions: List[str] = Field(..., description="Dynamically generated list of recommended questions")
