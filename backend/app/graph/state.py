from typing import TypedDict, List, Dict, Any, Optional

class AgentState(TypedDict):
    """
    Defines the shared memory state of the LangGraph analytical agent pipeline.
    """
    uploaded_dataset: Optional[str]
    """Active dataset upload ID in memory context"""
    
    user_question: str
    """The raw natural language query provided by the user"""
    
    conversation_history: List[Dict[str, str]]
    """Short-term conversational message logs (role and content values)"""
    
    detected_intent: Optional[str]
    """Parsed goal type, e.g., 'stats', 'filter', 'chart', 'report'"""
    
    selected_tool: Optional[str]
    """Current tool node selected by the router"""
    
    execution_steps: List[str]
    """Chronological logging of planner executions"""
    
    generated_result: Optional[Dict[str, Any]]
    """Final answer content, code output, or chart image paths"""
