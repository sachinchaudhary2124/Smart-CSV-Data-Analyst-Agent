import logging
from langgraph.graph import StateGraph, END
from app.graph.state import AgentState
from app.graph.nodes import (
    intent_analyzer,
    dataset_validator,
    tool_planner,
    tool_executor,
    insight_generator,
    response_formatter,
    conversation_memory
)
from app.graph.router import check_dataset_validity

logger = logging.getLogger(__name__)

# Compile complete workflow state graph
workflow = StateGraph(AgentState)

# 1. Register 7 Nodes
workflow.add_node("intent_analyzer", intent_analyzer)
workflow.add_node("dataset_validator", dataset_validator)
workflow.add_node("tool_planner", tool_planner)
workflow.add_node("tool_executor", tool_executor)
workflow.add_node("insight_generator", insight_generator)
workflow.add_node("response_formatter", response_formatter)
workflow.add_node("conversation_memory", conversation_memory)

# 2. Configure Entrypoint
workflow.set_entry_point("intent_analyzer")

# 3. Configure Edges
workflow.add_edge("intent_analyzer", "dataset_validator")

# Conditional Router Transition from Validator
workflow.add_conditional_edges(
    "dataset_validator",
    check_dataset_validity,
    {
        "bypass_to_formatter": "response_formatter",
        "continue_to_planner": "tool_planner"
    }
)

workflow.add_edge("tool_planner", "tool_executor")
workflow.add_edge("tool_executor", "insight_generator")
workflow.add_edge("insight_generator", "response_formatter")
workflow.add_edge("response_formatter", "conversation_memory")
workflow.add_edge("conversation_memory", END)

# Compile Graph
compiled_graph = workflow.compile()
logger.info("LangGraph 7-node workspace workflow successfully compiled")
