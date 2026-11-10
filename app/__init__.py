
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Request, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

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

    # Check whether the uploaded file is an image
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    # Read the uploaded image
    image_data = await file.read()

    # Limit image size to 10 MB
    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image size must be less than 10 MB."
        )

    # Generate a unique filename
    extension = Path(file.filename or "").suffix.lower()
    if not extension or len(extension) > 10:
        extension = ".img"

    filename = f"{uuid4().hex}{extension}"

    # Save the image
    file_path = UPLOAD_DIR / filename
    file_path.write_bytes(image_data)

    return {
        "message": "Image uploaded successfully!",
        "filename": filename,
        "size": len(image_data)
    }
