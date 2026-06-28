import uuid
import logging
import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class ChatSessionManager:
    def __init__(self):
        self.sessions: Dict[str, List[Dict[str, str]]] = {}

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = []
        logger.info(f"Created chat session: {session_id}")
        return session_id

    def get_messages(self, session_id: str) -> List[Dict[str, str]]:
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        return self.sessions[session_id]

    def add_message(self, session_id: str, role: str, content: str):
        messages = self.get_messages(session_id)
        messages.append({"role": role, "content": content})
        if len(messages) > 100:
            messages.pop(0)
        logger.debug(f"Added {role} message to session {session_id}")

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id] = []
            logger.info(f"Cleared session history for: {session_id}")


class QueryHistoryManager:
    def __init__(self):
        self.history_path = os.path.join(settings.UPLOAD_DIR, "query_history.json")
        
    def _load_history(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.history_path):
            try:
                with open(self.history_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to read query history file: {e}")
                return []
        return []
        
    def _save_history(self, history: List[Dict[str, Any]]):
        try:
            with open(self.history_path, "w", encoding="utf-8") as f:
                json.dump(history, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to write query history file: {e}")

    def add_history_item(self, session_id: str, question: str, response: Dict[str, Any]):
        history = self._load_history()
        item = {
            "history_id": str(uuid.uuid4()),
            "session_id": session_id,
            "question": question,
            "answer": response.get("answer", ""),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "execution_time_ms": response.get("execution_time_ms", 0.0),
            "selected_tool": response.get("selected_tool", "N/A"),
            "detected_intent": response.get("detected_intent", "N/A"),
            "has_chart": response.get("chart_data") is not None,
            "has_report": response.get("selected_tool") == "report_builder"
        }
        history.append(item)
        if len(history) > 100:
            history.pop(0)
        self._save_history(history)
        logger.info(f"Logged query history item: {item['history_id']}")
        
    def get_history(self, search_query: Optional[str] = None) -> List[Dict[str, Any]]:
        history = self._load_history()
        history.reverse()
        if search_query:
            sq = search_query.lower()
            history = [h for h in history if sq in h["question"].lower() or sq in h["answer"].lower()]
        return history

    def delete_history_item(self, history_id: str) -> bool:
        history = self._load_history()
        updated = [h for h in history if h["history_id"] != history_id]
        if len(updated) != len(history):
            self._save_history(updated)
            logger.info(f"Deleted history item: {history_id}")
            return True
        return False


chat_service = ChatSessionManager()
query_history_service = QueryHistoryManager()

