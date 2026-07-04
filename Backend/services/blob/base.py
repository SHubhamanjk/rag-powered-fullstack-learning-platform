"""
Base blob service with common functionality and logging.
"""

import logging

# Set up logger for blob services (shared across all blob modules)
logger = logging.getLogger('services.blob')


class BaseBlobService:
    """Base class for blob services with common functionality"""
    
    def __init__(self):
        """Initialize base blob service."""
        logger.debug(f"Initializing {self.__class__.__name__}")
