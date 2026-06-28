from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SessionInitResponse(BaseModel):
    session_id: str = Field(..., description="Unique generated session identifier")

class ChatHistoryMessage(BaseModel):
    role: str = Field(..., description="Role of the sender, e.g., 'user', 'assistant'")
    content: str = Field(..., description="Message string content")

class ChatQueryRequest(BaseModel):
    session_id: str = Field(..., description="Active session ID for tracking history")
    message: str = Field(..., description="The user natural language request")
    dataset_id: Optional[str] = Field(None, description="Active uploaded dataset ID in memory context")

class BusinessInsightDetail(BaseModel):
    observation: str = Field(..., description="Specific business metric observation")
    reason: str = Field(..., description="Causality explanation of observation")
    business_impact: str = Field(..., description="Financial/operational impact metric")
    recommendation: str = Field(..., description="Actionable strategy suggestions")
    confidence_score: float = Field(..., description="Confidence percentage index")

class ChatQueryResponse(BaseModel):
    answer: str = Field(..., description="Compiled textual response answering user request")
    supporting_statistics: str = Field(..., description="Markdown table summaries of parsed calculations")
    business_insight: BusinessInsightDetail = Field(..., description="Computed business recommendation variables")
    chart_data: Optional[Dict[str, Any]] = Field(None, description="Packaged coordinate values for charts libraries")
    selected_tool: Optional[str] = Field(None, description="Target tool node executed")
    detected_intent: Optional[str] = Field(None, description="Parsed user query goal intent")
    thoughts: List[str] = Field(..., description="Internal trace logs of LangGraph nodes executions")
    execution_time_ms: float = Field(..., description="Aggregate execution timing")
    confidence_score: float = Field(..., description="Confidence score coefficient")
