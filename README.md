# Helping Eyes 👁️

### An OCR-Based Accessibility Application with Real-Time Text Recognition and Text-to-Speech

Helping Eyes is an accessibility-focused application designed to make printed and digital text easier to access through image processing, Optical Character Recognition (OCR), real-time camera recognition, and Text-to-Speech (TTS).

Users can upload an image or use a live camera feed to extract text. The recognized text can then be converted into speech, allowing users to listen instead of relying entirely on visual reading.

---

## ✨ Features

### 1. Image Upload and OCR
- Upload images containing text.
- Assess image quality before OCR processing.
- Apply image enhancement to improve recognition.
- Extract text from uploaded images.
- Display recognized text.

### 2. Image Quality Assessment
- Evaluate uploaded image quality.
- Identify issues affecting OCR.
- Automatically select suitable image enhancement.
- Improve input images before text recognition.

### 3. Live Camera Integration
- Access the device camera through the browser.
- Capture live camera frames.
- Process camera input without manual uploads.

### 4. Real-Time OCR
- Extract text from live camera frames.
- Display recognized text dynamically.
- Continuously update OCR results.

### 5. Text-to-Speech
- Convert uploaded-image OCR results into speech.
- Convert real-time OCR results into speech.
- Select available browser voices.
- Adjust speech speed.
- Pause, resume, and stop playback.
- Display speech playback status.

Speech is activated manually to avoid repeatedly reading the same text during continuous camera recognition.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Python | Backend development |
| FastAPI | Backend framework and API endpoints |
| OpenCV | Image processing and enhancement |
| NumPy | Image and numerical operations |
| Apple Vision | OCR processing on macOS |
| HTML5 | Frontend structure |
| CSS3 | Frontend styling |
| JavaScript | Frontend functionality and camera interaction |
| Web Speech API | Browser-based Text-to-Speech |
| Uvicorn | ASGI server |

---

## 🏗️ System Architecture

The application follows a frontend-backend architecture.

### Image Upload Workflow
1. User uploads an image.
2. The frontend sends it to the FastAPI backend.
3. Image quality is assessed.
4. Image enhancement is applied when appropriate.
5. OCR extracts text from the processed image.
6. Recognized text is returned to the frontend.
7. The user can read or listen to the extracted text.

### Real-Time Camera Workflow
1. User grants camera permission.
2. The browser captures camera frames.
3. Frames are sent to the OCR backend.
4. Image processing and OCR are performed.
5. Recognized text is returned to the frontend.
6. The frontend displays updated results.
7. The user can manually activate Text-to-Speech.

### Text-to-Speech Workflow
1. The application retrieves the latest recognized text.
2. The user selects a voice and speech rate.
3. A SpeechSynthesisUtterance is created.
4. The browser's SpeechSynthesis engine reads the text.
5. The user can pause, resume, or stop playback.

---

## 📁 Project Structure

```text
Helping-Eyes/
├── app/
│   ├── __init__.py
│   ├── vision.py
│   ├── static/
│   │   ├── app.js
│   │   └── style.css
│   └── templates/
│       └── index.html
├── test_images/
├── tests/
├── uploads/
├── .gitignore
├── README.md
└── requirements.txt
```

### Important Files
- `app/__init__.py` – FastAPI application and backend routes.
- `app/vision.py` – Image processing, quality assessment, enhancement, and OCR functionality.
- `app/templates/index.html` – Main application interface.
- `app/static/app.js` – Frontend logic, camera integration, OCR interaction, and Text-to-Speech.
- `app/static/style.css` – Application styling.
- `requirements.txt` – Python dependencies.

---

## ⚙️ Installation and Setup

### Prerequisites
- Python 3 installed.
- Git.
- A modern web browser.
- macOS for Apple Vision OCR integration.
- Camera access for real-time OCR.

### 1. Clone the Repository

```bash
git clone https://github.com/parveen-05/Helping-Eyes.git
cd Helping-Eyes
```

### 2. Create a Virtual Environment

```bash
python3 -m venv .venv
```

### 3. Activate the Environment

```bash
source .venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Start the Application

```bash
uvicorn app:app --reload
```

### 6. Open in Browser

Visit:

http://127.0.0.1:8000

---

## 🔌 API Endpoints

| Endpoint | Purpose |
|---|---|
| `/` | Main application interface |
| `/api/health` | Application health check |
| `/api/upload` | Image upload and OCR processing |
| `/api/ocr/frame` | Real-time camera-frame OCR processing |

Interactive API documentation:

http://127.0.0.1:8000/docs

---

## 🧪 Testing

The application was tested for:

- Image upload and OCR extraction.
- Image quality assessment.
- Image enhancement.
- Browser camera access.
- Real-time camera-frame OCR.
- Text-to-Speech for uploaded images.
- Text-to-Speech for live OCR results.
- Voice selection and speech-rate adjustment.
- Pause, resume, and stop functionality.
- Empty OCR text handling.

JavaScript syntax validation:

```bash
node --check app/static/app.js
```

FastAPI application loading validation:

```bash
python -c "from app import app; print('FastAPI application loaded successfully')"
```

---

## 🌍 Project Objective

Helping Eyes aims to improve accessibility by combining computer vision and speech technologies. It provides an alternative way to interact with printed and digital text through image processing, OCR, live camera recognition, and Text-to-Speech.

---

## 🚀 Future Scope

- Multilingual OCR and speech support.
- Improved recognition under difficult lighting conditions.
- Support for additional document and image formats.
- Further accessibility and usability improvements.
- Additional language and voice options.

---

## 👨‍💻 Developer

**Parveen RT**  
Computer Science and Engineering  
RV University

**GitHub:** https://github.com/parveen-05/Helping-Eyes

---

## 📄 License

This project is developed for educational and demonstration purposes.