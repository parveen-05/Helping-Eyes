# Helping Eyes 2.0 👁️

### An AI-Powered Accessibility Application for OCR, Real-Time Text Recognition, Text-to-Speech and Document Question Answering

Helping Eyes 2.0 is an accessibility-focused application designed to make printed and digital text easier to access through computer vision, Optical Character Recognition (OCR), real-time camera recognition, Text-to-Speech (TTS), and locally powered Artificial Intelligence.

The application allows users to upload images or capture text using a live camera feed. Recognized text can be read aloud using Text-to-Speech or queried using a locally running AI assistant.

By integrating OCR with local Large Language Models (LLMs), Helping Eyes provides an interactive way to understand and access information from captured documents.

---

## ✨ Features

### 1. Image Upload and OCR
- Upload images containing printed or digital text.
- Assess image quality before OCR processing.
- Apply image enhancement to improve recognition.
- Extract text from uploaded images.
- Display recognized text through the application interface.

### 2. Image Quality Assessment
- Evaluate uploaded image quality.
- Identify conditions that may affect OCR accuracy.
- Automatically select suitable image enhancement techniques.
- Improve image input before text recognition.

### 3. Live Camera Integration
- Access the device camera through the browser.
- Capture live camera frames.
- Process camera input without requiring manual uploads.

### 4. Real-Time OCR
- Extract text from live camera frames.
- Display recognized text dynamically.
- Continuously update OCR results.

### 5. Text-to-Speech
- Convert extracted OCR text into speech.
- Read text recognized through live camera processing.
- Select available browser voices.
- Adjust speech speed.
- Pause, resume, and stop speech playback.
- Display speech playback status.

### 6. AI-Powered Document Question Answering
- Ask natural-language questions about uploaded documents.
- Generate answers using extracted OCR text.
- Use Ollama for locally hosted LLM inference.
- Integrate the Qwen 3.5 4B model.
- Provide document-grounded answers instead of relying on unrelated external information.
- Handle questions whose answers are unavailable in the captured text.
- Keep document content separate from system instructions.

---

## 🧠 AI Integration

Helping Eyes integrates a locally running Large Language Model through Ollama.

**AI Technology Stack:**
- **Ollama:** Local LLM inference and model management.
- **Qwen 3.5 4B:** Language model used for question answering.
- **Python:** Backend integration and request handling.
- **FastAPI:** API endpoint for AI question answering.

### AI Question Answering Workflow

1. The user uploads an image containing text.
2. The backend processes the image and extracts text using OCR.
3. Extracted text is stored and associated with a document ID.
4. The user enters a question through the Ask Helping Eyes interface.
5. The frontend sends the question and document ID to the backend.
6. The backend retrieves the corresponding OCR text.
7. The extracted text and question are passed to the local Ollama model.
8. The model generates an answer based on the captured document content.
9. The generated answer is returned and displayed to the user.

The AI assistant is designed to answer using the supplied OCR content and to indicate when requested information cannot be found in the captured text.

---

## 🏗️ System Architecture

Helping Eyes follows a frontend-backend architecture.

### Image Upload and OCR Pipeline

User Image → FastAPI Backend → Image Quality Assessment → Image Enhancement → OCR Processing → Extracted Text → Frontend Display

### Real-Time OCR Pipeline

Live Camera → Frame Capture → FastAPI Backend → Image Processing → OCR → Recognized Text → Frontend Display

### Text-to-Speech Pipeline

Recognized Text → Voice Selection → Speech Synthesis → Audio Playback → Pause / Resume / Stop

### AI Question Answering Pipeline

Uploaded Document → OCR Extraction → Document Text Storage → User Question → FastAPI `/api/ask` → Ollama → Qwen 3.5 4B → Generated Answer → Frontend Display

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
| Ollama | Local Large Language Model inference |
| Qwen 3.5 4B | AI-powered question answering |
| Uvicorn | ASGI server |

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

- `app/__init__.py` – FastAPI application, backend routes, document text storage and API handling.
- `app/assistant.py` – Ollama integration and AI-powered document question answering.
- `app/vision.py` – Image processing, image quality assessment, enhancement and OCR functionality.
- `app/templates/index.html` – Main application interface.
- `app/static/app.js` – Frontend functionality, camera integration, API interaction and Text-to-Speech.
- `app/static/style.css` – Application styling.
- `requirements.txt` – Python dependencies.

---

## ⚙️ Installation and Setup

### Prerequisites

- Python 3 installed.
- Git.
- A modern web browser.
- macOS for Apple Vision OCR integration.
- Ollama installed and running for AI question answering.
- Camera access for real-time OCR.

### 1. Clone the Repository

```bash
git clone https://github.com/parveen-05/HelpingEyes-Parveen.git

cd HelpingEyes-Parveen
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

Start Ollama:

```bash
ollama serve
```

Ensure that the local Ollama service is available at:

```text
http://127.0.0.1:11434
```

### 6. Start the FastAPI Application

Open another terminal, activate the virtual environment, navigate to the project directory and run:

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
| POST | `/api/upload` | Image upload and OCR processing |
| POST | `/api/ocr/frame` | Real-time camera-frame OCR |
| POST | `/api/ask` | AI-powered document question answering |

---

## 🧪 Testing and Validation

The application was tested for the following functionalities:

- Image upload and OCR extraction.
- Image quality assessment.
- Image enhancement.
- Browser camera access.
- Real-time camera-frame OCR.
- Text-to-Speech for uploaded images.
- Text-to-Speech for live OCR results.
- Voice selection and speech-rate adjustment.
- Pause, resume and stop functionality.
- AI question submission.
- Ollama integration.
- Document-specific question answering.
- AI-generated answer display.
- Browser console error verification.

### JavaScript Syntax Validation

```bash
node --check app/static/app.js
```

### FastAPI Application Loading Validation

```bash
python -c "from app import app; print('FastAPI application loaded successfully')"
```

---

## 🌍 Project Objective

Helping Eyes aims to improve accessibility by combining computer vision, speech technologies and locally hosted Artificial Intelligence.

By integrating OCR, real-time camera recognition, Text-to-Speech and document-based question answering, the application provides users with multiple ways to interact with and understand captured text.

The integration of local LLM inference also enables document question answering without depending on cloud-based AI APIs.

---

## 🚀 Future Scope

- Multilingual OCR and speech support.
- Improved recognition under difficult lighting conditions.
- Support for additional document and image formats.
- Voice-based interaction with the AI assistant.
- Improved document understanding and contextual question answering.
- Further accessibility and usability improvements.

---

## 👨‍💻 Developer

**Parveen RT**  
Computer Science and Engineering  
RV University, Bengaluru

**GitHub:** [parveen-05](https://github.com/parveen-05)

**Project Repository:** [HelpingEyes-Parveen](https://github.com/parveen-05/HelpingEyes-Parveen)

---

## 📄 License

This project is developed for educational and demonstration purposes.
