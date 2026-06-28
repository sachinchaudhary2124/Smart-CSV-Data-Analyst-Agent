from pydantic import BaseModel
from typing import List, Dict, Any

class ToolDefinition(BaseModel):
    name: str
    description: str
    required_roles: List[str]  # e.g. "numeric", "categorical", "date", "monetary", "profit"
    supported_data_types: List[str]
    expected_output: str
    estimated_execution_time_ms: float
    example_queries: List[str]
    confidence: float

TOOL_REGISTRY: Dict[str, ToolDefinition] = {
    "dataset_summary": ToolDefinition(
        name="dataset_summary",
        description="Generates overall dataset statistics, cell counts, memory footprint, and counts missing/duplicate entries.",
        required_roles=[],
        supported_data_types=["any"],
        expected_output="dictionary of cell metrics and memory sizes",
        estimated_execution_time_ms=10.0,
        example_queries=["summary of dataset", "show dataset overview", "data quality metrics"],
        confidence=1.0
    ),
    "column_information": ToolDefinition(
        name="column_information",
        description="Returns names, types, non-null value counts, and unique value counts for all columns.",
        required_roles=[],
        supported_data_types=["any"],
        expected_output="dictionary of column specifications",
        estimated_execution_time_ms=8.0,
        example_queries=["list columns", "show schemas", "data types"],
        confidence=1.0
    ),
    "basic_statistics": ToolDefinition(
        name="basic_statistics",
        description="Calculates descriptive stats (mean, std, min, max, median) for a list of target numeric columns.",
        required_roles=["numeric"],
        supported_data_types=["int", "float"],
        expected_output="dictionary of descriptive values",
        estimated_execution_time_ms=15.0,
        example_queries=["average of Sales", "standard deviation of price", "descriptive statistics"],
        confidence=1.0
    ),
    "groupby_analysis": ToolDefinition(
        name="groupby_analysis",
        description="Groups by a specific category column and calculates sum, mean, or count on a numeric column.",
        required_roles=["categorical", "numeric"],
        supported_data_types=["object", "category", "int", "float"],
        expected_output="dictionary of grouped categories and aggregate sums or means",
        estimated_execution_time_ms=25.0,
        example_queries=["compare Revenue by Category", "total quantity for each product", "region performance comparison"],
        confidence=0.95
    ),
    "trend_analysis": ToolDefinition(
        name="trend_analysis",
        description="Analyzes sequential changes in a numeric column over dates or time periods.",
        required_roles=["date", "numeric"],
        supported_data_types=["datetime", "int", "float"],
        expected_output="chronological lists of dates and value aggregates",
        estimated_execution_time_ms=30.0,
        example_queries=["show sales trend", "monthly sales growth over time", "temporal trend lines"],
        confidence=0.95
    ),
    "top_bottom_analysis": ToolDefinition(
        name="top_bottom_analysis",
        description="Finds the highest or lowest performing entities in a category column sorted by a numeric column.",
        required_roles=["categorical", "numeric"],
        supported_data_types=["object", "category", "int", "float"],
        expected_output="lists of top or bottom records and performance figures",
        estimated_execution_time_ms=20.0,
        example_queries=["find top products", "worst category performance", "bottom selling regions"],
        confidence=0.95
    ),
    "missing_value_analysis": ToolDefinition(
        name="missing_value_analysis",
        description="Performs detailed counts and percentages of missing cells across columns.",
        required_roles=[],
        supported_data_types=["any"],
        expected_output="column lists mapping missing counts and ratios",
        estimated_execution_time_ms=12.0,
        example_queries=["find missing values", "null occurrences list", "check null values"],
        confidence=1.0
    ),
    "duplicate_analysis": ToolDefinition(
        name="duplicate_analysis",
        description="Scans the dataset for identical rows and computes ratio percentage.",
        required_roles=[],
        supported_data_types=["any"],
        expected_output="total duplicate counts and percentages",
        estimated_execution_time_ms=14.0,
        example_queries=["check duplicate rows", "count duplicate records", "duplicates analysis"],
        confidence=1.0
    ),
    "correlation_analysis": ToolDefinition(
        name="correlation_analysis",
        description="Computes Pearson correlation coefficients matrix for numeric columns.",
        required_roles=["numeric", "numeric"],
        supported_data_types=["int", "float"],
        expected_output="correlation matrix mapping variables",
        estimated_execution_time_ms=45.0,
        example_queries=["correlation between variables", "show relation of sales and price", "variable matrix"],
        confidence=0.9
    ),
    "outlier_detection": ToolDefinition(
        name="outlier_detection",
        description="Identifies values exceeding 1.5 times the Interquartile Range (IQR) for a numeric column.",
        required_roles=["numeric"],
        supported_data_types=["int", "float"],
        expected_output="outliers listing count and limits boundaries",
        estimated_execution_time_ms=25.0,
        example_queries=["find outliers in price", "extreme revenue points", "anomalous data records"],
        confidence=0.9
    ),
    "chart_generator": ToolDefinition(
        name="chart_generator",
        description="Builds visual chart data structures (line, bar, pie, scatter, histogram) for dimensions.",
        required_roles=["numeric"],
        supported_data_types=["any"],
        expected_output="json chart configurations containing categories and plots",
        estimated_execution_time_ms=35.0,
        example_queries=["plot chart of Revenue", "draw bar graph of Quantity by Product", "sales distribution pie"],
        confidence=0.95
    ),
    "theme_dashboard_generator": ToolDefinition(
        name="theme_dashboard_generator",
        description="Assembles customized thematic card metrics and charts based on natural queries.",
        required_roles=["numeric"],
        supported_data_types=["any"],
        expected_output="dashboard dashboard widget list with components",
        estimated_execution_time_ms=60.0,
        example_queries=["create marketing dashboard", "financial sales metrics template dashboard"],
        confidence=0.88
    ),
    "anomaly_detection_extended": ToolDefinition(
        name="anomaly_detection_extended",
        description="Applies Z-score analysis to identify spikes or drops in numeric transaction values.",
        required_roles=["numeric"],
        supported_data_types=["int", "float"],
        expected_output="anomalies log list detailing dates and deviation intensities",
        estimated_execution_time_ms=40.0,
        example_queries=["detect spikes in Sales", "revenue drop anomalies", "outliers spike analysis"],
        confidence=0.92
    ),
    "time_series_forecast": ToolDefinition(
        name="time_series_forecast",
        description="Applies exponential smoothing trend algorithms to project future values over sequential date increments.",
        required_roles=["date", "numeric"],
        supported_data_types=["datetime", "int", "float"],
        expected_output="forecasted chronological values and dates",
        estimated_execution_time_ms=75.0,
        example_queries=["sales forecast for next 6 months", "predict future revenue trends", "value projections"],
        confidence=0.85
    ),
    "business_recommendation_engine": ToolDefinition(
        name="business_recommendation_engine",
        description="Deduces actionable business recommendations and health gauges based on performance trends.",
        required_roles=["numeric"],
        supported_data_types=["any"],
        expected_output="insight recommendation lists and priorities",
        estimated_execution_time_ms=50.0,
        example_queries=["business insights", "priority items suggestions", "recommendations summary"],
        confidence=0.9
    ),
    "report_builder": ToolDefinition(
        name="report_builder",
        description="Generates executive business reports with aggregated performance tables and priorities.",
        required_roles=["numeric"],
        supported_data_types=["any"],
        expected_output="structured paragraphs, sections, and ratings metrics",
        estimated_execution_time_ms=90.0,
        example_queries=["build executive report", "dataset report details summary", "kpi report"],
        confidence=0.92
    )
}
