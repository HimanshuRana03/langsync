from fastapi import FastAPI, File, UploadFile
import whisper
import os
import tempfile

app = FastAPI()
model = whisper.load_model("base")  

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
        temp_audio.write(await file.read())
        temp_audio.flush()
        result = model.transcribe(temp_audio.name)
        os.remove(temp_audio.name)
        return {"text": result["text"]}
