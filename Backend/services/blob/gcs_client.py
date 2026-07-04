"""
Google Cloud Storage client initialization and management.
"""

import logging
import os
from datetime import timedelta
from typing import Optional, Dict

from google.cloud import storage
from google.auth.exceptions import DefaultCredentialsError

from services.blob.base import logger
from config import GCS_BUCKET_NAME


class GCSClient:
    """Google Cloud Storage client wrapper."""
    
    def __init__(self):
        """Initialize GCS client."""
        self.bucket_name = GCS_BUCKET_NAME
        self.client: Optional[storage.Client] = None
        self.bucket: Optional[storage.Bucket] = None
        self._initialize_client()
    
    def _initialize_client(self) -> None:
        """Initialize the GCS client."""
        logger.info("Initializing Google Cloud Storage client")
        
        if not self.bucket_name:
            logger.warning("GCS_BUCKET_NAME not set, GCS client will be unavailable")
            return

        try:
            self.client = storage.Client()
            # We skip calling self.bucket.exists() because it requires 'storage.buckets.get' permission, 
            # which is often omitted for security (Storage Object Admin only grants object access, not bucket access).
            self.bucket = self.client.bucket(self.bucket_name)
            logger.info("GCS client initialized successfully")
        except DefaultCredentialsError:
            self.client = None
        except Exception as e:
            logger.error(f"Failed to initialize GCS client: {e}", exc_info=True)
            self.client = None
            self.bucket = None
    
    def is_available(self) -> bool:
        """Check if GCS client is available."""
        return self.client is not None and self.bucket is not None
    
    def get_client(self) -> Optional[storage.Client]:
        """Get the GCS client instance."""
        return self.client
    
    def get_bucket(self) -> Optional[storage.Bucket]:
        """Get the GCS bucket instance."""
        return self.bucket
    
    def get_bucket_name(self) -> str:
        """Get the bucket name."""
        return self.bucket_name

    def generate_signed_url(
        self, 
        blob_name: str, 
        method: str, 
        expiry_minutes: int,
        content_type: str = None
    ) -> str:
        """
        Generate a signed URL for a blob.
        
        Args:
            blob_name: Name of the blob
            method: HTTP method (PUT for upload, GET for download)
            expiry_minutes: Expiration time in minutes
            content_type: Content type for uploads (optional)
        
        Returns:
            Signed URL string
        """
        if not self.is_available():
            raise Exception("GCS service unavailable")
            
        try:
            blob = self.bucket.blob(blob_name)
            expiration = timedelta(minutes=expiry_minutes)
            
            from google.auth import default
            import google.auth.transport.requests
            
            # Request necessary scopes for signing
            scopes = ['https://www.googleapis.com/auth/cloud-platform']
            credentials, project = default(scopes=scopes)
            
            if hasattr(credentials, 'service_account_email'):
                service_account_email = credentials.service_account_email
                
                # Handle Cloud Run "default" email
                if service_account_email == "default":
                    import requests
                    metadata_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email"
                    headers = {"Metadata-Flavor": "Google"}
                    response = requests.get(metadata_url, headers=headers, timeout=5)
                    service_account_email = response.text
                
                # Sign using the IAM signBlob logic (required for Cloud Run)
                try:
                    auth_request = google.auth.transport.requests.Request()
                    if not credentials.valid:
                        credentials.refresh(auth_request)
                    
                    url = blob.generate_signed_url(
                        version="v4",
                        expiration=expiration,
                        method=method,
                        content_type=content_type,
                        service_account_email=service_account_email,
                        access_token=credentials.token
                    )
                except Exception as sign_error:
                    logger.warning(f"Manual signing failed: {sign_error}, falling back to auto-signing")
                    # Fallback: Let the library use the private key from JSON if available
                    url = blob.generate_signed_url(
                        version="v4",
                        expiration=expiration,
                        method=method,
                        content_type=content_type
                    )
            else:
                # Local user credentials or ADC without email
                url = blob.generate_signed_url(
                    version="v4",
                    expiration=expiration,
                    method=method,
                    content_type=content_type
                )
            return url
        except Exception as e:
            logger.error(f"Failed to generate signed URL: {e}", exc_info=True)
            raise

    def get_blob_metadata(self, blob_name: str) -> Optional[Dict]:
        """
        Fetch metadata for a blob (size, md5_hash, content_type).
        
        Args:
            blob_name: Name of the blob
            
        Returns:
            Dictionary with metadata or None if blob not found
        """
        if not self.is_available():
            raise Exception("GCS service unavailable")
            
        try:
            blob = self.bucket.get_blob(blob_name)
            if not blob:
                logger.warning(f"Blob {blob_name} not found in GCS")
                return None
            
            return {
                "size": blob.size,
                "md5_hash": blob.md5_hash,  # Base64 encoded
                "content_type": blob.content_type,
                "updated": blob.updated
            }
        except Exception as e:
            logger.error(f"Failed to fetch metadata for blob {blob_name}: {e}", exc_info=True)
            return None
