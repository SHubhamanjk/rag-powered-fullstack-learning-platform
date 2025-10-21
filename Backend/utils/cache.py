"""
Caching utilities for API endpoints.

Provides in-memory caching with TTL support for API responses.
Can be extended to use Redis for distributed caching in production.
"""

import json
import hashlib
from datetime import datetime, timedelta
from typing import Any, Callable, Optional
from functools import wraps
import asyncio

# In-memory cache store
_cache_store: dict[str, dict[str, Any]] = {}


def _generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a unique cache key based on function arguments"""
    key_parts = [prefix]
    
    # Add positional args
    for arg in args:
        if isinstance(arg, (str, int, float, bool)):
            key_parts.append(str(arg))
        else:
            # For complex objects, use hash
            key_parts.append(hashlib.md5(str(arg).encode()).hexdigest()[:8])
    
    # Add keyword args (sorted for consistency)
    for k, v in sorted(kwargs.items()):
        if isinstance(v, (str, int, float, bool)):
            key_parts.append(f"{k}:{v}")
        else:
            key_parts.append(f"{k}:{hashlib.md5(str(v).encode()).hexdigest()[:8]}")
    
    return ":".join(key_parts)


def _is_cache_valid(cache_entry: dict) -> bool:
    """Check if cache entry is still valid"""
    if "expires_at" not in cache_entry:
        return False
    
    expires_at = cache_entry["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    
    return datetime.now() < expires_at


def cache_response(ttl_seconds: int = 300, key_prefix: Optional[str] = None):
    """
    Decorator to cache API responses with TTL.
    
    Args:
        ttl_seconds: Time to live in seconds (default: 5 minutes)
        key_prefix: Custom prefix for cache key (default: function name)
    
    Usage:
        @cache_response(ttl_seconds=600)
        async def get_user_data(user_id: str):
            # expensive operation
            return data
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            prefix = key_prefix or f"{func.__module__}.{func.__name__}"
            cache_key = _generate_cache_key(prefix, *args, **kwargs)
            
            # Check cache
            if cache_key in _cache_store:
                cache_entry = _cache_store[cache_key]
                if _is_cache_valid(cache_entry):
                    return cache_entry["value"]
                else:
                    # Remove expired entry
                    del _cache_store[cache_key]
            
            # Call function
            result = await func(*args, **kwargs)
            
            # Store in cache
            _cache_store[cache_key] = {
                "value": result,
                "expires_at": datetime.now() + timedelta(seconds=ttl_seconds),
                "created_at": datetime.now()
            }
            
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            prefix = key_prefix or f"{func.__module__}.{func.__name__}"
            cache_key = _generate_cache_key(prefix, *args, **kwargs)
            
            # Check cache
            if cache_key in _cache_store:
                cache_entry = _cache_store[cache_key]
                if _is_cache_valid(cache_entry):
                    return cache_entry["value"]
                else:
                    # Remove expired entry
                    del _cache_store[cache_key]
            
            # Call function
            result = func(*args, **kwargs)
            
            # Store in cache
            _cache_store[cache_key] = {
                "value": result,
                "expires_at": datetime.now() + timedelta(seconds=ttl_seconds),
                "created_at": datetime.now()
            }
            
            return result
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def invalidate_cache(key_pattern: Optional[str] = None):
    """
    Invalidate cache entries.
    
    Args:
        key_pattern: Pattern to match keys (None = clear all)
    """
    global _cache_store
    
    if key_pattern is None:
        # Clear all cache
        _cache_store = {}
    else:
        # Clear matching keys
        keys_to_delete = [k for k in _cache_store.keys() if key_pattern in k]
        for key in keys_to_delete:
            del _cache_store[key]


def invalidate_user_cache(email: str):
    """Invalidate all cache entries for a specific user"""
    invalidate_cache(email)


def get_cache_stats() -> dict:
    """Get cache statistics"""
    total_entries = len(_cache_store)
    valid_entries = sum(1 for entry in _cache_store.values() if _is_cache_valid(entry))
    expired_entries = total_entries - valid_entries
    
    return {
        "total_entries": total_entries,
        "valid_entries": valid_entries,
        "expired_entries": expired_entries,
        "size_bytes": len(json.dumps({k: str(v) for k, v in _cache_store.items()}))
    }


def cleanup_expired_cache():
    """Remove all expired cache entries"""
    global _cache_store
    expired_keys = [k for k, v in _cache_store.items() if not _is_cache_valid(v)]
    for key in expired_keys:
        del _cache_store[key]
    return len(expired_keys)

