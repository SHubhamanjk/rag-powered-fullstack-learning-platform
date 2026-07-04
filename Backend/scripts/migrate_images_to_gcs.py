import os
import sys
import base64
import uuid
import logging
from dotenv import load_dotenv

# Add Backend to path so we can import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from utils.db import get_tutorial_support_collection
from services.blob.gcs_client import GCSClient

def migrate_images():
    logger.info("Starting image migration to GCS...")
    collection = get_tutorial_support_collection()
    gcs = GCSClient()
    
    if not gcs.is_available():
        logger.error("GCS Client is not available. Please check credentials and bucket name.")
        return

    tutorials = collection.find({})
    total_migrated = 0
    
    for tutorial in tutorials:
        tutorial_id = tutorial.get("tutorial_id")
        notes = tutorial.get("notes", [])
        updated = False
        
        for i, note in enumerate(notes):
            image = note.get("image")
            if image and image.startswith("data:image/"):
                try:
                    logger.info(f"Migrating image for note {note.get('note_id')} in tutorial {tutorial_id}")
                    header, base64_data = image.split(",", 1)
                    content_type = header.split(":")[1].split(";")[0]
                    
                    image_bytes = base64.b64decode(base64_data)
                    file_key = f"notes/{uuid.uuid4().hex}.png"
                    
                    blob = gcs.get_bucket().blob(file_key)
                    blob.upload_from_string(image_bytes, content_type=content_type)
                    
                    public_url = f"https://storage.googleapis.com/{gcs.get_bucket_name()}/{file_key}"
                    notes[i]["image"] = public_url
                    updated = True
                    total_migrated += 1
                except Exception as e:
                    logger.error(f"Failed to migrate note {note.get('note_id')}: {e}")
                    
        # Migrate mindmaps
        mindmaps = tutorial.get("mindmaps", [])
        for i, mindmap in enumerate(mindmaps):
            image_b64 = mindmap.get("image_b64")
            if image_b64 and image_b64.startswith("data:image/"):
                try:
                    logger.info(f"Migrating image for mindmap {mindmap.get('mindmap_id')} in tutorial {tutorial_id}")
                    header, base64_data = image_b64.split(",", 1)
                    content_type = header.split(":")[1].split(";")[0]
                    
                    image_bytes = base64.b64decode(base64_data)
                    file_key = f"mindmaps/{uuid.uuid4().hex}.png"
                    
                    blob = gcs.get_bucket().blob(file_key)
                    blob.upload_from_string(image_bytes, content_type=content_type)
                    
                    public_url = f"https://storage.googleapis.com/{gcs.get_bucket_name()}/{file_key}"
                    mindmaps[i]["image_url"] = public_url
                    mindmaps[i].pop("image_b64", None)
                    updated = True
                    total_migrated += 1
                except Exception as e:
                    logger.error(f"Failed to migrate mindmap {mindmap.get('mindmap_id')}: {e}")
            
        if updated:
            # Save back to database
            collection.update_one(
                {"_id": tutorial["_id"]},
                {"$set": {"notes": notes, "mindmaps": mindmaps}}
            )
            logger.info(f"Updated tutorial {tutorial_id} in database.")
            
    logger.info(f"Migration completed. Total images migrated: {total_migrated}")

if __name__ == "__main__":
    migrate_images()
