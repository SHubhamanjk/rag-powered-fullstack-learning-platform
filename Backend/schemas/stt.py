from pydantic import BaseModel

class STTRequest(BaseModel):
    audio_url: str
    model_config = {
        "json_schema_extra": {
            "examples": [{"audio_url": "https://example.com/audio.wav"}]
        }
    }

class STTResponse(BaseModel):
    text: str
    model_config = {
        "json_schema_extra": {
            "examples": [{"text": "Hello, this is a test."}]
        }
    }
