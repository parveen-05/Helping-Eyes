
from pathlib import Path
from uuid import uuid4

import cv2
import numpy as np

from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.vision import assess_quality, read_text_enhanced, recognize_text


app = FastAPI(
    title="Helping Eyes",
    description="An AI-powered assistive reading application",
    version="1.0.0"
)


# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# Serve CSS and JavaScript files
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# Load HTML templates
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


@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):

    # 1. Validate uploaded file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    # 2. Read uploaded image
    image_data = await file.read()

    # 3. Check image size (maximum 10 MB)
    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image size must be less than 10 MB."
        )

    # 4. Decode image using OpenCV
    image_array = np.frombuffer(image_data, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to read the uploaded image."
        )

    # 5. Generate a unique filename
    extension = Path(file.filename or "").suffix.lower()

    if not extension or len(extension) > 10:
        extension = ".img"

    filename = f"{uuid4().hex}{extension}"

    # 6. Save uploaded image
    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(image_data)

    # 7. Assess image quality
    quality_report = assess_quality(image)

    print("Image Quality Report:")
    print(quality_report.summary())

    # 8. Extract text using enhanced OCR
    extracted_text, best_variant = read_text_enhanced(image)

    print(f"Best OCR image variant: {best_variant}")

    # 9. Prepare quality information for API response
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

    # 10. Return upload, quality and OCR results
    return {
        "message": "Image uploaded successfully!",
        "filename": filename,
        "size": len(image_data),
        "extracted_text": extracted_text,
        "quality": quality_data
    }
# ============================================================
# PART 4: REAL-TIME OCR
# ============================================================

@app.post("/api/ocr/frame")
async def process_camera_frame(file: UploadFile = File(...)):

    # 1. Validate uploaded frame type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please send a valid image frame."
        )

    # 2. Read frame data into memory
    image_data = await file.read()

    # 3. Validate frame size (maximum 5 MB)
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

    # 4. Decode frame using OpenCV
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

    # 5. Perform fast Apple Vision OCR
    lines = recognize_text(
        image,
        fast=True
    )

    # 6. Combine recognized text
    extracted_text = "\n".join(
        line.text for line in lines
    )

    # 7. Calculate average OCR confidence
    average_confidence = (
        sum(line.confidence for line in lines) / len(lines)
        if lines else 0.0
    )

    # 8. Return OCR results
    return {
        "message": "Camera frame processed successfully.",
        "extracted_text": extracted_text,
        "line_count": len(lines),
        "average_confidence": round(
            average_confidence,
            3
        )
    }    
