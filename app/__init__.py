
import asyncio
import threading
import time

from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np

from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

from app.vision import (
    assess_quality,
    correct_document_perspective,
    read_text_enhanced,
    recognize_text
)

from app.assistant import ask_ollama


app = FastAPI(
    title="Helping Eyes",
    description="An AI-powered assistive reading application",
    version="2.0.0"
)


# ============================================================
# PART 1: OCR SESSION STORAGE
# ============================================================

OCR_SESSIONS = {}

SESSION_EXPIRY_SECONDS = 30 * 60
MAX_OCR_SESSIONS = 10
MAX_OCR_TEXT_LENGTH = 20000

OCR_SESSIONS_LOCK = threading.Lock()


def clean_expired_sessions_locked():
    """Remove expired OCR sessions. Caller must hold the lock."""

    current_time = time.time()

    expired_ids = [
        document_id
        for document_id, session in OCR_SESSIONS.items()
        if current_time - session["created_at"] > SESSION_EXPIRY_SECONDS
    ]

    for document_id in expired_ids:
        del OCR_SESSIONS[document_id]


def store_ocr_text(extracted_text: str) -> str:
    """Store OCR text and return a unique document ID."""

    with OCR_SESSIONS_LOCK:
        clean_expired_sessions_locked()

        if len(OCR_SESSIONS) >= MAX_OCR_SESSIONS:
            oldest_id = min(
                OCR_SESSIONS,
                key=lambda key: OCR_SESSIONS[key]["created_at"]
            )

            del OCR_SESSIONS[oldest_id]

        document_id = uuid4().hex

        stored_text = extracted_text[:MAX_OCR_TEXT_LENGTH]

        if len(extracted_text) > MAX_OCR_TEXT_LENGTH:
            stored_text += "\n[OCR text truncated due to length.]"

        OCR_SESSIONS[document_id] = {
            "text": stored_text,
            "created_at": time.time()
        }

        return document_id


def get_ocr_text(document_id: str):
    """Retrieve OCR text using its document ID."""

    with OCR_SESSIONS_LOCK:
        clean_expired_sessions_locked()

        session = OCR_SESSIONS.get(document_id)

        if session is None:
            return None

        return session["text"]


# ============================================================
# PART 2: AI QUESTION REQUEST MODEL
# ============================================================

class AskRequest(BaseModel):
    document_id: str = Field(min_length=1, max_length=64)
    question: str = Field(min_length=1, max_length=500)


# ============================================================
# PART 3: APPLICATION SETUP
# ============================================================

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)

templates = Jinja2Templates(directory="app/templates")


@app.get("/")
def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={}
    )


@app.get("/api/health")
def health_check():
    return {
        "message": "Helping Eyes API is working!",
        "status": "running"
    }


# ============================================================
# PART 4: IMAGE UPLOAD, PERSPECTIVE CORRECTION AND ENHANCED OCR
# ============================================================

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):

    # 1. Validate uploaded file type.
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    # 2. Read uploaded image data.
    image_data = await file.read()

    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image size must be less than 10 MB."
        )

    # 3. Decode image using OpenCV.
    image_array = np.frombuffer(image_data, dtype=np.uint8)

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to read the uploaded image."
        )

    # 4. Generate a unique filename.
    extension = Path(file.filename or "").suffix.lower()

    if not extension or len(extension) > 10:
        extension = ".img"

    filename = f"{uuid4().hex}{extension}"

    # 5. Save the ORIGINAL uploaded image.
    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(image_data)

    # 6. Assess quality of the original image.
    quality_report = assess_quality(image)

    print("Image Quality Report:")
    print(quality_report.summary())

    # 7. Automatically detect and correct document perspective.
    processing_image, perspective_corrected = (
        correct_document_perspective(image)
    )

    print(
        "Perspective correction:",
        "Applied" if perspective_corrected else "Not applied"
    )

    # 8. Perform enhanced OCR on the processed image.
    extracted_text, best_variant = read_text_enhanced(
        processing_image
    )

    print(f"Best OCR image variant: {best_variant}")

    # 9. Prepare image quality information.
    quality_data = {
        "acceptable": quality_report.ok(),
        "sharpness": quality_report.sharpness,
        "brightness": quality_report.brightness,
        "contrast": quality_report.contrast,
        "clipped_bright": quality_report.clipped_bright,
        "glare_fraction": quality_report.glare_fraction,
        "glare_center": (
            list(quality_report.glare_center)
            if quality_report.glare_center is not None
            else None
        ),
        "problems": quality_report.problems,
        "suggestion": quality_report.hint(),
        "summary": quality_report.summary()
    }

    # 10. Store extracted OCR text for later AI questions.
    document_id = store_ocr_text(extracted_text)

    # 11. Return upload results.
    return {
        "message": "Image uploaded successfully!",
        "filename": filename,
        "size": len(image_data),
        "extracted_text": extracted_text,
        "document_id": document_id,
        "quality": quality_data,
        "perspective_corrected": perspective_corrected
    }


# ============================================================
# PART 5: REAL-TIME CAMERA OCR
# ============================================================

@app.post("/api/ocr/frame")
async def process_camera_frame(file: UploadFile = File(...)):

    # 1. Validate camera frame.
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please send a valid image frame."
        )

    # 2. Read image data.
    image_data = await file.read()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="Received an empty camera frame."
        )

    if len(image_data) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Camera frame is too large."
        )

    # 3. Decode camera frame.
    image_array = np.frombuffer(
        image_data,
        dtype=np.uint8
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to decode camera frame."
        )

    # 4. Recognize text in the camera frame.
    lines = recognize_text(
        image,
        fast=True
    )

    extracted_text = "\n".join(
        line.text for line in lines
    )

    # 5. Calculate average OCR confidence.
    average_confidence = (
        sum(line.confidence for line in lines) / len(lines)
        if lines else 0.0
    )

    return {
        "message": "Camera frame processed successfully.",
        "extracted_text": extracted_text,
        "line_count": len(lines),
        "average_confidence": round(
            average_confidence,
            3
        )
    }


# ============================================================
# PART 6: AI-POWERED DOCUMENT QUESTION ANSWERING
# ============================================================

@app.post("/api/ask")
async def ask_question(request: AskRequest):

    # 1. Validate question.
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Please enter a question."
        )

    # 2. Retrieve OCR text using document ID.
    ocr_text = get_ocr_text(request.document_id)

    if ocr_text is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found or session expired. Please upload the image again."
        )

    # 3. Generate AI answer using Ollama.
    try:
        answer = await asyncio.to_thread(
            ask_ollama,
            ocr_text,
            question
        )

    except RuntimeError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error)
        ) from error

    except Exception as error:
        print(f"AI question answering error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Unable to generate an answer. Please try again."
        ) from error

    # 4. Return AI-generated answer.
    return {
        "message": "Answer generated successfully.",
        "document_id": request.document_id,
        "question": question,
        "answer": answer
    }
