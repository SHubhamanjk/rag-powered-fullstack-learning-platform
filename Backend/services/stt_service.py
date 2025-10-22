import os
import tempfile
import requests
from groq import Groq
from fastapi import UploadFile

client = Groq()

async def speech_to_text(audio_url):
    response = requests.get(audio_url)
    response.raise_for_status()

    with tempfile.NamedTemporaryFile(suffix=".m4a", delete=False) as temp_file:
        temp_file.write(response.content)
        temp_file.flush()
        temp_path = temp_file.name

    try:
        with open(temp_path, "rb") as file_handle:
            transcription = client.audio.transcriptions.create(
                file=(temp_path, file_handle.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
            )
        return transcription.text
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass

async def speech_to_text_from_file(audio_file: UploadFile):
    """Convert uploaded audio file to text using Groq Whisper"""
    try:
        # Read the uploaded file content
        audio_content = await audio_file.read()
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_content)
            temp_file.flush()
            temp_path = temp_file.name

        try:
            with open(temp_path, "rb") as file_handle:
                transcription = client.audio.transcriptions.create(
                    file=(temp_path, file_handle.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                )
            return transcription.text
        finally:
            try:
                os.remove(temp_path)
            except OSError:
                pass
                
    except Exception as e:
        return "Sorry, I couldn't understand the audio. Please try again."
