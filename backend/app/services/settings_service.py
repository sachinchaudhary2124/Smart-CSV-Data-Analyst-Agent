import json
import os
import logging
from typing import Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class SettingsService:
    def __init__(self):
        self.settings_path = os.path.join(settings.UPLOAD_DIR, "app_settings.json")
        self.default_settings = {
            "llm_provider": "ollama",
            "ollama_endpoint": settings.OLLAMA_BASE_URL,
            "model_name": settings.LLM_MODEL,
            "theme": "glassmorphism",
            "chart_theme": "neon",
            "report_template": "executive",
            "export_preference": "json",
            "auto_save": True,
            "conversation_memory": True
        }

    def load_settings(self) -> Dict[str, Any]:
        if os.path.exists(self.settings_path):
            try:
                with open(self.settings_path, "r", encoding="utf-8") as f:
                    user_settings = json.load(f)
                    # merge with defaults
                    return {**self.default_settings, **user_settings}
            except Exception as e:
                logger.error(f"Failed to load application settings: {e}")
                return self.default_settings
        return self.default_settings

    def save_settings(self, new_settings: Dict[str, Any]) -> Dict[str, Any]:
        current = self.load_settings()
        updated = {**current, **new_settings}
        try:
            with open(self.settings_path, "w", encoding="utf-8") as f:
                json.dump(updated, f, indent=4)
            # Sync settings with app config variables in memory if updated
            if "ollama_endpoint" in new_settings:
                settings.OLLAMA_BASE_URL = new_settings["ollama_endpoint"]
            if "model_name" in new_settings:
                settings.LLM_MODEL = new_settings["model_name"]
            logger.info("Persisted updated application settings.")
        except Exception as e:
            logger.error(f"Failed to save application settings: {e}")
        return updated

settings_service = SettingsService()
