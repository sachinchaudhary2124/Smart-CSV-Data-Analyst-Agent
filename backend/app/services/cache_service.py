import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class SmartCacheManager:
    def __init__(self, default_ttl_seconds: int = 3600):
        # Maps cache_key -> {"value": data, "expires_at": timestamp, "dataset_id": dataset_id}
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl_seconds
        self.hits = 0
        self.misses = 0

    def get(self, dataset_id: Optional[str], namespace: str, key: str) -> Optional[Any]:
        cache_key = f"{dataset_id}:{namespace}:{key.strip().lower()}"
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if time.time() < entry["expires_at"]:
                self.hits += 1
                logger.info(f"SmartCache HIT for namespace={namespace} key={key}")
                return entry["value"]
            else:
                # Cache expired, invalidate
                logger.info(f"SmartCache EXPIRED for namespace={namespace} key={key}")
                del self._cache[cache_key]
        self.misses += 1
        return None

    def set(self, dataset_id: Optional[str], namespace: str, key: str, value: Any, ttl: Optional[int] = None):
        cache_key = f"{dataset_id}:{namespace}:{key.strip().lower()}"
        ttl_val = ttl if ttl is not None else self.default_ttl
        self._cache[cache_key] = {
            "value": value,
            "expires_at": time.time() + ttl_val,
            "dataset_id": dataset_id
        }
        logger.info(f"SmartCache SET for namespace={namespace} key={key} with ttl={ttl_val}s")
        
        # Bounded cache eviction to prevent memory growth leaks
        if len(self._cache) > 200:
            now = time.time()
            # Clear all expired ones first
            expired_keys = [k for k, v in self._cache.items() if now >= v["expires_at"]]
            for k in expired_keys:
                del self._cache[k]
            # If still full, drop the oldest item (FIFO)
            if len(self._cache) > 200:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]

    def invalidate_dataset(self, dataset_id: str):
        keys_to_del = [k for k, v in self._cache.items() if v["dataset_id"] == dataset_id]
        for k in keys_to_del:
            del self._cache[k]
        logger.info(f"SmartCache INVALIDATED all keys for dataset_id={dataset_id}")

    def clear(self):
        self._cache.clear()
        self.hits = 0
        self.misses = 0
        logger.info("SmartCache manually purged and reset.")

    def get_metrics(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        hit_rate = (self.hits / total) if total > 0 else 1.0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "size": len(self._cache),
            "hit_rate": round(hit_rate, 4)
        }

cache_service = SmartCacheManager()
