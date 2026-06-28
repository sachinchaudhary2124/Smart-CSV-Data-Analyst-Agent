import logging
from app.graph.state import AgentState

logger = logging.getLogger(__name__)

def check_dataset_validity(state: AgentState) -> str:
    """
    Evaluates dataset validation status. If failed, routes straight to response formatter
    to yield user-friendly upload prompts, otherwise routes to tool planner.
    """
    result = state.get("generated_result") or {}
    logger.info(f"LangGraph Router: evaluating validation success: '{result.get('success')}'")
    
    if result.get("success") is False:
        return "bypass_to_formatter"
    return "continue_to_planner"
