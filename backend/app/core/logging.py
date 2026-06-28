import os
import logging
from logging.handlers import RotatingFileHandler
from app.core.config import settings

def setup_logging():
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Root logger config
    logger = logging.getLogger()
    logger.setLevel(logging.INFO if not settings.DEBUG else logging.DEBUG)
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(log_format))
    logger.addHandler(console_handler)
    
    # Rotating File Handler
    log_file = os.path.join(settings.LOG_DIR, "app.log")
    try:
        file_handler = RotatingFileHandler(
            log_file, maxBytes=10*1024*1024, backupCount=5, encoding="utf-8"
        )
        file_handler.setFormatter(logging.Formatter(log_format))
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Failed to setup file logging: {e}")
        
    logging.info("Logging successfully initialized")
