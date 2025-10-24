FROM python:3.11-slim

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        git \
        graphviz \
        ffmpeg \
    && rm -rf /var/lib/apt/lists/*
# Memory Vault Dependencies:
# - ffmpeg (audio conversion for MP3/M4A/AAC to WAV)
# TTS DEPENDENCIES - COMMENTED OUT TO REDUCE IMAGE SIZE
# espeak-ng (used by kokoro TTS)
# libsndfile1 (used by soundfile for audio processing)

WORKDIR /app

COPY requirements.txt ./

RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

COPY . .

# Expose the port
EXPOSE 8000

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Start the app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
