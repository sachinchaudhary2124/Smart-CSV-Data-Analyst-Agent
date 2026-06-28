from typing import List, Optional
import io
import csv
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from app.schemas.chat import SessionInitResponse, ChatHistoryMessage, ChatQueryRequest, ChatQueryResponse
from app.services.chat_service import chat_service, query_history_service
from app.graph.workflow import compiled_graph

router = APIRouter()

@router.post("/session", response_model=SessionInitResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session():
    """
    Initializes a new conversational session thread and returns a UUID token.
    """
    session_id = chat_service.create_session()
    return SessionInitResponse(session_id=session_id)

@router.get("/history/{session_id}", response_model=List[ChatHistoryMessage])
def get_chat_history(session_id: str):
    """
    Fetches all user and assistant chat history messages belonging to the target session token.
    """
    history = chat_service.get_messages(session_id)
    return [ChatHistoryMessage(role=msg["role"], content=msg["content"]) for msg in history]

@router.post("/query", response_model=ChatQueryResponse)
async def query_ai_agent(payload: ChatQueryRequest):
    """
    Queries the multi-agent graph planner. Stores message history, executes
    validations and tools via LangGraph, and formats structured business answers.
    """
    # 1. Log user question into history
    chat_service.add_message(payload.session_id, "user", payload.message)

    # 2. Build initial graph state
    initial_state = {
        "uploaded_dataset": payload.dataset_id,
        "user_question": payload.message,
        "conversation_history": chat_service.get_messages(payload.session_id)[:-1],
        "detected_intent": None,
        "selected_tool": None,
        "execution_steps": [],
        "generated_result": None
    }

    try:
        import time
        from app.services.metrics_service import metrics_service
        
        # 3. Asynchronously invoke LangGraph compiled workflow
        start_time = time.time()
        final_state = await compiled_graph.ainvoke(initial_state)
        elapsed_ms = (time.time() - start_time) * 1000
        
        result = final_state.get("generated_result") or {}
        
        if not isinstance(result, dict) or "answer" not in result:
            raise ValueError("LangGraph execution yielded invalid results dictionary.")
            
        # Update result timing trace
        result["execution_time_ms"] = round(elapsed_ms, 2)
        metrics_service.record_query(elapsed_ms)
        
        # 4. Save assistant answer to chat history
        chat_service.add_message(payload.session_id, "assistant", result.get("answer", ""))
        
        # 5. Log details to persistent Query History registry
        query_history_service.add_history_item(payload.session_id, payload.message, result)
        
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangGraph query routing pipeline encountered a critical error: {str(e)}"
        )

@router.delete("/session/{session_id}", status_code=status.HTTP_200_OK)
def clear_chat_session(session_id: str):
    """
    Purges all message caches associated with the target session.
    """
    chat_service.clear_session(session_id)
    return {"success": True, "message": f"Session {session_id} history cleared."}


# ----------------- Query History Routes -----------------
@router.get("/history/list")
def list_query_history(search: Optional[str] = None):
    """
    Returns query history items, optionally filtered by keyword query.
    """
    return query_history_service.get_history(search)


@router.delete("/history/item/{history_id}")
def delete_query_history_item(history_id: str):
    """
    Deletes a specific query history item by its unique UUID.
    """
    deleted = query_history_service.delete_history_item(history_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Query history item not found.")
    return {"success": True, "message": "History item deleted."}


@router.get("/history/export/download")
def export_query_history(format: str = "json"):
    """
    Exports the entire query history log as a CSV or JSON file download.
    """
    items = query_history_service.get_history()
    
    if format.lower() == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["history_id", "session_id", "question", "answer", "timestamp", "execution_time_ms", "selected_tool", "detected_intent", "has_chart"])
        for item in items:
            writer.writerow([
                item.get("history_id"),
                item.get("session_id"),
                item.get("question"),
                item.get("answer"),
                item.get("timestamp"),
                item.get("execution_time_ms"),
                item.get("selected_tool"),
                item.get("detected_intent"),
                item.get("has_chart")
            ])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=query_history.csv"}
        )
    else:
        return items
