from pydantic import BaseModel

class TTSRequest(BaseModel):
    text: str
    model_config = {
        "json_schema_extra": {
            "examples": [{"text": "Generate audio for this sentence."}]
        }
    }

class TTSResponse(BaseModel):
    audio_url: str
    model_config = {
        "json_schema_extra": {
            "examples": [{"audio_url": "/static/12345.wav"}]
        }
    }
