# Helping Eyes 2.0 👁️

### An AI-Powered Accessibility Application for Intelligent Document Reading, Real-Time OCR, Voice Interaction and AI-Based Question Answering

Helping Eyes 2.0 is an AI-powered accessibility application designed to make printed and digital text easier to access and understand.

The application combines Computer Vision, Optical Character Recognition (OCR), automatic document perspective correction, real-time camera recognition, Text-to-Speech (TTS), Speech-to-Text and locally hosted Large Language Models (LLMs).

Users can upload document images or capture text through a live camera. The application automatically processes images, extracts text, reads recognized content aloud and allows users to ask natural-language questions about uploaded documents using a local AI assistant.

By integrating computer vision, speech technologies and local AI, Helping Eyes aims to provide an interactive and accessible document-reading experience.

---

## ✨ Features

### 1. Intelligent Image Upload and Processing

- Upload images containing printed or digital text.
- Validate uploaded image formats and file sizes.
- Decode images using OpenCV.
- Preserve the original uploaded image.
- Process images through an automated computer vision pipeline.

### 2. Automatic Document Perspective Correction

- Automatically identify document boundaries.
- Estimate document corners using image segmentation and geometric analysis.
- Fit document boundary lines.
- Calculate corner intersections.
- Apply perspective transformation using OpenCV.
- Correct tilted and perspective-distorted document images.
- Safely retain the original image when reliable correction is unavailable.

### 3. Image Quality Assessment

- Evaluate image sharpness using Laplacian variance.
- Analyze image brightness and contrast.
- Detect overexposed regions.
- Identify potential glare.
- Generate image quality reports.
- Provide suggestions when image conditions may affect OCR accuracy.

### 4. Enhanced Optical Character Recognition (OCR)

- Extract text from uploaded images.
- Integrate Apple Vision OCR through Python.
- Process original, enhanced and binarized image variants.
- Apply CLAHE-based image enhancement.
- Use adaptive thresholding for improved text visibility.
- Select a suitable OCR result based on recognition confidence and extracted text.
- Store extracted text for subsequent AI question answering.

### 5. Live Camera Integration

- Access the device camera through the browser.
- Capture images directly from the live camera feed.
- Process camera frames through the backend.
- Support manual image capture and upload.

### 6. Real-Time OCR

- Recognize text from live camera frames.
- Continuously process camera input.
- Display recognized text dynamically.
- Calculate average OCR confidence.

### 7. Text-to-Speech

- Convert extracted document text into speech.
- Read recognized live camera text aloud.
- Select available browser speech voices.
- Adjust speech rate.
- Pause, resume and stop speech playback.
- Display speech playback status.

### 8. Voice-Based AI Interaction

- Accept questions through microphone input.
- Integrate browser-based Speech Recognition.
- Support Indian English (`en-IN`) recognition.
- Convert spoken questions into text.
- Send recognized questions to the AI question-answering backend.
- Read generated AI answers aloud using Text-to-Speech.
- Retain support for typed questions.

### 9. AI-Powered Document Question Answering

- Ask natural-language questions about uploaded documents.
- Generate answers using extracted OCR text.
- Integrate Ollama for locally hosted LLM inference.
- Use the Qwen 3.5 4B model.
- Associate extracted document text with unique document IDs.
- Maintain temporary OCR sessions with automatic expiry.
- Provide document-grounded answers.
- Handle questions whose answers are unavailable in the extracted text.

---

## 🧠 AI Integration

Helping Eyes integrates a locally running Large Language Model through Ollama.

**AI Technology Stack**

| Technology | Purpose |
|---|---|
| Ollama | Local LLM inference and model management |
| Qwen 3.5 4B | Document question-answering model |
| Python | Backend AI integration |
| FastAPI | AI request handling |
| Web Speech API | Voice input and speech output |

### AI Question Answering Workflow

1. The user uploads a document image.
2. The backend validates and decodes the image.
3. Image quality is assessed.
4. Automatic document perspective correction is attempted.
5. Enhanced OCR extracts text from the processed image.
6. Extracted text is stored in a temporary session associated with a unique document ID.
7. The user enters a question or speaks through the microphone.
8. The frontend sends the question and document ID to the backend.
9. The backend retrieves the corresponding OCR text.
10. The question and extracted document content are passed to Ollama.
11. Qwen 3.5 4B generates a response.
12. The answer is displayed and can be spoken aloud.

The AI assistant uses the uploaded document's extracted text as its context rather than depending on external cloud-based AI APIs.

---

## 🏗️ System Architecture

Helping Eyes follows a frontend-backend architecture.

### 1. Image Processing and OCR Pipeline

```text
User Uploads Image
        |
        v
FastAPI Backend
        |
        v
Image Validation and Decoding
        |
        v
Image Quality Assessment
        |
        v
Automatic Document Detection
        |
        v
Perspective Correction
        |
        v
Image Enhancement
        |
        v
OCR Processing
        |
        v
Extracted Text
        |
        v
Temporary Document Session
        |
        v
Frontend Display
```

### 2. Real-Time OCR Pipeline

```text
Live Camera
     |
     v
Camera Frame Capture
     |
     v
FastAPI /api/ocr/frame
     |
     v
OpenCV Image Processing
     |
     v
Apple Vision OCR
     |
     v
Recognized Text
     |
     v
Frontend Display
```

### 3. Voice Interaction Pipeline

```text
User Speaks
     |
     v
Browser Speech Recognition
     |
     v
Recognized Question
     |
     v
FastAPI /api/ask
     |
     v
Ollama + Qwen 3.5 4B
     |
     v
Generated Answer
     |
     v
Frontend Display
     |
     v
Browser Text-to-Speech
     |
     v
Spoken Response
```

### 4. Text-to-Speech Pipeline

```text
Extracted OCR Text
       |
       v
Speech Synthesis
       |
       v
Voice Selection
       |
       v
Audio Playback
       |
       v
Pause / Resume / Stop
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Python | Backend development |
| FastAPI | Backend framework and REST APIs |
| OpenCV | Image processing, segmentation and perspective correction |
| NumPy | Image and numerical operations |
| Apple Vision | OCR processing on macOS |
| PyObjC | Python integration with Apple frameworks |
| HTML5 | Frontend structure |
| CSS3 | Application styling |
| JavaScript | Frontend functionality and API interaction |
| Web Speech API | Speech recognition and speech synthesis |
| Ollama | Local LLM inference |
| Qwen 3.5 4B | AI document question answering |
| Uvicorn | ASGI application server |
| Git and GitHub | Version control and project hosting |

---

## 📁 Project Structure

```text
HelpingEyes-Parveen/
│
├── app/
│   ├── __init__.py
│   ├── assistant.py
│   ├── vision.py
│   │
│   ├── static/
│   │   ├── app.js
│   │   └── style.css
│   │
│   └── templates/
│       └── index.html
│
├── uploads/
├── test_images/
│
├── .gitignore
├── README.md
└── requirements.txt
```

### Important Files

- `app/__init__.py` – FastAPI application, API endpoints, OCR session management, image upload and AI request handling.
- `app/vision.py` – Image quality assessment, document boundary detection, perspective correction, image enhancement and OCR.
- `app/assistant.py` – Ollama integration and AI-powered document question answering.
- `app/templates/index.html` – Main application interface.
- `app/static/app.js` – Frontend functionality, camera interaction, voice input, API communication and speech synthesis.
- `app/static/style.css` – Application styling.
- `requirements.txt` – Python dependencies.

---

## ⚙️ Installation and Setup

### Prerequisites

- Python 3 installed.
- Git.
- A modern web browser.
- macOS for the current Apple Vision OCR integration.
- Ollama installed and running for AI question answering.
- Camera access for live camera functionality.

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

### 5. Set Up Ollama

Install Ollama and download the required model:

```bash
ollama pull qwen3.5:4b
```

Start the Ollama service:

```bash
ollama serve
```

The default local Ollama service address is:

```text
http://127.0.0.1:11434
```

### 6. Start the FastAPI Application

Open another terminal, activate the virtual environment and navigate to the project directory.

Run:

```bash
uvicorn app:app --reload
```

### 7. Open the Application

Visit:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Main application interface |
| GET | `/api/health` | Application health check |
| POST | `/api/upload` | Image upload, perspective correction and OCR |
| POST | `/api/ocr/frame` | Real-time camera-frame OCR |
| POST | `/api/ask` | AI-powered document question answering |

### Document Session Management

Extracted OCR text is associated with a unique document ID.

The backend maintains temporary OCR sessions with:

- A maximum of 10 active sessions.
- A 30-minute session expiry.
- A maximum stored OCR text length of 20,000 characters per session.
- Thread-safe session access.

This allows AI questions to retrieve the correct document content without repeatedly uploading the image.

---

## 🧪 Testing and Validation

The following functionalities have been implemented and tested:

- Image upload and validation.
- Original image preservation.
- Image quality assessment.
- Automatic document boundary detection.
- Perspective correction.
- Enhanced OCR extraction.
- OCR result storage.
- Browser camera access.
- Live camera-frame OCR.
- Dynamic recognized-text display.
- Text-to-Speech.
- Voice selection and speech-rate adjustment.
- Pause, resume and stop speech functionality.
- Microphone-based voice input.
- Voice-based AI question submission.
- Ollama integration.
- Document-specific question answering.
- AI answer generation and display.
- Browser console error verification.
- Python syntax compilation.

### JavaScript Syntax Validation

```bash
node --check app/static/app.js
```

### Python Syntax Validation

```bash
python -m py_compile app/__init__.py app/vision.py app/assistant.py
```

### FastAPI Application Loading Validation

```bash
python -c "from app import app; print('FastAPI application loaded successfully')"
```

---

## 🌍 Project Objective

Helping Eyes aims to improve accessibility by combining computer vision, OCR, speech technologies and locally hosted Artificial Intelligence.

The application provides multiple ways to interact with captured text:

- Visual text extraction through OCR.
- Automatic document alignment through perspective correction.
- Audio-based access through Text-to-Speech.
- Hands-free interaction through voice input.
- Contextual document understanding through local AI question answering.

By bringing these capabilities together, Helping Eyes 2.0 aims to make document reading and information access more interactive and accessible.

---

## 🚀 Future Scope

- Multilingual OCR and speech recognition.
- Improved document detection across different backgrounds and orientations.
- Better recognition under difficult lighting conditions.
- Support for additional document formats.
- Improved contextual understanding of complex documents.
- More advanced accessibility controls.
- Cross-platform OCR support beyond the current macOS implementation.

---

## 👨‍💻 Developer

**Parveen RT**

Computer Science and Engineering  
RV University, Bengaluru

**GitHub:** [parveen-05](https://github.com/parveen-05)

**Project Repository:** [Helping Eyes 2.0](https://github.com/parveen-05/Helping-Eyes)

---

## 📄 License

This project is developed for educational and demonstration purposes.
