
// =============================================
// HELPING EYES - FRONTEND ELEMENTS
// =============================================

// Image upload elements
const imageInput = document.getElementById("imageInput");
const uploadButton = document.getElementById("uploadButton");
const uploadStatus = document.getElementById("status");

// OCR result elements
const ocrResult = document.getElementById("resultSection");
const extractedText = document.getElementById("result");

// =============================================
// PART 6: AI QUESTION ANSWERING ELEMENTS
// =============================================

let currentDocumentId = null;
let aiRequestInProgress = false;

const askSection = document.getElementById("askSection");
const askForm = document.getElementById("askForm");
const questionInput = document.getElementById("questionInput");
const askButton = document.getElementById("askButton");
const askStatus = document.getElementById("askStatus");
const answerResult = document.getElementById("answerResult");

// Voice AI elements
const voiceQuestionButton =
    document.getElementById("voiceQuestionButton");

const voiceQuestionStatus =
    document.getElementById("voiceQuestionStatus");

// =============================================
// IMAGE QUALITY ELEMENTS
// =============================================

const qualityResult = document.getElementById("qualitySection");
const qualityStatus = document.getElementById("qualityStatus");

const sharpnessValue = document.getElementById("sharpnessValue");
const brightnessValue = document.getElementById("brightnessValue");
const contrastValue = document.getElementById("contrastValue");
const glareValue = document.getElementById("glareValue");

const qualityProblems = document.getElementById("qualityProblems");
const qualitySuggestion = document.getElementById("qualitySuggestion");
const qualitySummary = document.getElementById("qualitySummary");

// =============================================
// CAMERA ELEMENTS
// =============================================

const cameraPreview = document.getElementById("cameraPreview");
const cameraCanvas = document.getElementById("cameraCanvas");

const startCameraButton =
    document.getElementById("startCameraButton");

const captureButton =
    document.getElementById("captureButton");

const stopCameraButton =
    document.getElementById("stopCameraButton");

const cameraStatus =
    document.getElementById("cameraStatus");

const capturedPreview =
    document.getElementById("capturedPreview");

const uploadCapturedButton =
    document.getElementById("uploadCapturedButton");

// =============================================
// PART 4: REAL-TIME OCR ELEMENTS
// =============================================

const startRealtimeButton =
    document.getElementById("startRealtimeButton");

const stopRealtimeButton =
    document.getElementById("stopRealtimeButton");

const realtimeStatus =
    document.getElementById("realtimeStatus");

const realtimeResult =
    document.getElementById("realtimeResult");

const realtimeConfidence =
    document.getElementById("realtimeConfidence");

// =============================================
// CAMERA AND REAL-TIME VARIABLES
// =============================================

let cameraStream = null;

let capturedFile = null;
let capturedImageURL = null;

let realtimeActive = false;
let realtimeTimer = null;
let processingFrame = false;

const REALTIME_INTERVAL = 1500;

// =============================================
// DISPLAY IMAGE QUALITY REPORT
// =============================================

function displayQualityReport(quality) {

    qualityResult.style.display = "block";

    if (quality.acceptable) {

        qualityStatus.textContent =
            "Image quality looks good. Ready for OCR.";

        qualityStatus.className = "quality-good";

    } else {

        qualityStatus.textContent =
            "Image quality needs improvement.";

        qualityStatus.className = "quality-warning";

    }

    sharpnessValue.textContent =
        Number(quality.sharpness).toFixed(2);

    brightnessValue.textContent =
        Number(quality.brightness).toFixed(2);

    contrastValue.textContent =
        Number(quality.contrast).toFixed(2);

    glareValue.textContent =
        (Number(quality.glare_fraction) * 100).toFixed(2) + "%";

    qualityProblems.replaceChildren();

    if (quality.problems && quality.problems.length > 0) {

        quality.problems.forEach((problem) => {

            const listItem = document.createElement("li");

            listItem.textContent =
                problem.replaceAll("_", " ");

            qualityProblems.appendChild(listItem);

        });

    } else {

        const listItem = document.createElement("li");

        listItem.textContent =
            "No quality problems detected.";

        qualityProblems.appendChild(listItem);

    }

    qualitySuggestion.textContent =
        quality.suggestion || "No suggestions available.";

    qualitySummary.textContent =
        quality.summary || "";

}

// =============================================
// RESET AI QUESTION ANSWERING
// =============================================

function resetAISection() {

    currentDocumentId = null;

    askSection.style.display = "none";

    askStatus.textContent = "";

    answerResult.textContent = "";

    questionInput.value = "";

    askButton.disabled = false;

    aiRequestInProgress = false;

    if (voiceRecognitionActive && voiceRecognition) {

        voiceRecognition.abort();

    }

    voiceQuestionButton.disabled = false;

    voiceQuestionStatus.textContent =
        "Microphone ready.";

}

// =============================================
// COMMON IMAGE UPLOAD FUNCTION
// =============================================

async function uploadImage(file, source) {

    if (!file) {

        uploadStatus.textContent =
            "Please select or capture an image first.";

        return;

    }

    const formData = new FormData();

    formData.append("file", file);

    uploadStatus.textContent =
        "Uploading image and extracting text...";

    ocrResult.style.display = "none";
    qualityResult.style.display = "none";

    resetAISection();

    extractedText.textContent = "";

    uploadButton.disabled = true;
    uploadCapturedButton.disabled = true;

    try {

        const response = await fetch("/api/upload", {

            method: "POST",

            body: formData

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.detail || "Image upload failed."
            );

        }

        currentDocumentId = result.document_id;

        if (currentDocumentId) {

            askSection.style.display = "block";

        }

        uploadStatus.textContent =
            `${result.message} File: ${result.filename}`;

        if (result.quality) {

            displayQualityReport(result.quality);

        }

        extractedText.textContent =
            result.extracted_text ||
            "No text detected in the image.";

        ocrResult.style.display = "block";

        console.log(
            `${source} upload response:`,
            result
        );

        if (source === "camera") {

            cameraStatus.textContent =
                "Camera image processed successfully!";

        }

    } catch (error) {

        uploadStatus.textContent = error.message;

        console.error("Image upload error:", error);

        if (source === "camera") {

            cameraStatus.textContent =
                "Camera upload failed: " + error.message;

        }

    } finally {

        uploadButton.disabled = false;

        uploadCapturedButton.disabled =
            !capturedFile;

    }

}

// =============================================
// NORMAL IMAGE UPLOAD
// =============================================

uploadButton.addEventListener("click", async () => {

    const file = imageInput.files[0];

    if (!file) {

        uploadStatus.textContent =
            "Please select an image first.";

        ocrResult.style.display = "none";
        qualityResult.style.display = "none";

        resetAISection();

        return;

    }

    await uploadImage(file, "normal");

});

// =============================================
// START CAMERA
// =============================================

startCameraButton.addEventListener("click", async () => {

    try {

        cameraStatus.textContent =
            "Requesting camera permission...";

        startCameraButton.disabled = true;

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "Camera access is not supported by this browser."
            );

        }

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },

                audio: false

            });

        cameraPreview.srcObject = cameraStream;

        cameraPreview.style.display = "block";

        await cameraPreview.play();

        startCameraButton.disabled = true;
        captureButton.disabled = false;
        stopCameraButton.disabled = false;

        startRealtimeButton.disabled = false;

        realtimeStatus.textContent =
            "Camera ready. Start Real-Time OCR when ready.";

        cameraStatus.textContent =
            "Camera started. Position the text clearly.";

        console.log("Camera started successfully.");

    } catch (error) {

        cameraStatus.textContent =
            "Unable to start camera: " + error.message;

        console.error("Camera error:", error);

        stopCamera();

    }

});

// =============================================
// PART 4: PROCESS CAMERA FRAME
// =============================================

async function processRealtimeFrame() {

    if (!realtimeActive || !cameraStream) {
        return;
    }

    if (processingFrame) {
        return;
    }

    if (
        cameraPreview.readyState < 2 ||
        !cameraPreview.videoWidth ||
        !cameraPreview.videoHeight
    ) {
        return;
    }

    processingFrame = true;

    try {

        const width = cameraPreview.videoWidth;
        const height = cameraPreview.videoHeight;

        cameraCanvas.width = width;
        cameraCanvas.height = height;

        const context = cameraCanvas.getContext("2d");

        if (!context) {

            throw new Error(
                "Unable to access camera canvas."
            );

        }

        context.drawImage(
            cameraPreview,
            0,
            0,
            width,
            height
        );

        realtimeStatus.textContent =
            "Capturing frame and recognizing text...";

        const blob = await new Promise((resolve, reject) => {

            cameraCanvas.toBlob((imageBlob) => {

                if (!imageBlob) {

                    reject(
                        new Error("Unable to capture camera frame.")
                    );

                    return;

                }

                resolve(imageBlob);

            }, "image/jpeg", 0.8);

        });

        const formData = new FormData();

        formData.append(
            "file",
            blob,
            "realtime-frame.jpg"
        );

        const response = await fetch("/api/ocr/frame", {

            method: "POST",

            body: formData

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.detail || "Real-time OCR failed."
            );

        }

        realtimeResult.textContent =
            result.extracted_text ||
            "No text detected. Adjust the camera position.";

        realtimeConfidence.textContent =
            `Average OCR confidence: ${(result.average_confidence * 100).toFixed(1)}%`;

        realtimeStatus.textContent =
            `Live OCR running. ${result.line_count} text lines detected.`;

        console.log("Real-time OCR result:", result);

    } catch (error) {

        realtimeStatus.textContent =
            "OCR error: " + error.message;

        console.error("Real-time OCR error:", error);

    } finally {

        processingFrame = false;

    }

}

// =============================================
// START REAL-TIME OCR
// =============================================

startRealtimeButton.addEventListener("click", () => {

    if (!cameraStream) {

        realtimeStatus.textContent =
            "Please start the camera first.";

        return;

    }

    if (realtimeActive) {
        return;
    }

    realtimeActive = true;

    startRealtimeButton.disabled = true;
    stopRealtimeButton.disabled = false;

    realtimeStatus.textContent =
        "Starting real-time OCR...";

    processRealtimeFrame();

    realtimeTimer = setInterval(
        processRealtimeFrame,
        REALTIME_INTERVAL
    );

    console.log("Real-time OCR started.");

});

// =============================================
// STOP REAL-TIME OCR
// =============================================

function stopRealtimeOCR() {

    realtimeActive = false;

    if (realtimeTimer !== null) {

        clearInterval(realtimeTimer);

        realtimeTimer = null;

    }

    processingFrame = false;

    startRealtimeButton.disabled =
        !cameraStream;

    stopRealtimeButton.disabled = true;

    realtimeStatus.textContent =
        "Real-time OCR stopped.";

    console.log("Real-time OCR stopped.");

}

stopRealtimeButton.addEventListener("click", () => {

    stopRealtimeOCR();

});

// =============================================
// CAPTURE IMAGE MANUALLY
// =============================================

captureButton.addEventListener("click", () => {

    if (!cameraStream) {

        cameraStatus.textContent =
            "Please start the camera first.";

        return;

    }

    if (
        cameraPreview.readyState < 2 ||
        !cameraPreview.videoWidth ||
        !cameraPreview.videoHeight
    ) {

        cameraStatus.textContent =
            "Camera frame is not ready. Please wait.";

        return;

    }

    const width = cameraPreview.videoWidth;
    const height = cameraPreview.videoHeight;

    cameraCanvas.width = width;
    cameraCanvas.height = height;

    const context = cameraCanvas.getContext("2d");

    if (!context) {

        cameraStatus.textContent =
            "Unable to create image canvas.";

        return;

    }

    context.drawImage(
        cameraPreview,
        0,
        0,
        width,
        height
    );

    cameraStatus.textContent =
        "Capturing image...";

    cameraCanvas.toBlob((blob) => {

        if (!blob || blob.size === 0) {

            cameraStatus.textContent =
                "Image capture failed. Please try again.";

            return;

        }

        capturedFile = new File(
            [blob],
            "camera-capture.jpg",
            {
                type: "image/jpeg"
            }
        );

        if (capturedImageURL) {

            URL.revokeObjectURL(capturedImageURL);

        }

        capturedImageURL =
            URL.createObjectURL(blob);

        capturedPreview.src = capturedImageURL;

        capturedPreview.style.display = "block";

        uploadCapturedButton.disabled = false;

        cameraStatus.textContent =
            `Image captured successfully! (${width} × ${height})`;

        console.log(
            "Captured image:",
            capturedFile.name,
            capturedFile.size,
            "bytes"
        );

    }, "image/jpeg", 0.9);

});

// =============================================
// UPLOAD CAPTURED IMAGE
// =============================================

uploadCapturedButton.addEventListener("click", async () => {

    if (!capturedFile) {

        cameraStatus.textContent =
            "Please capture an image first.";

        return;

    }

    await uploadImage(capturedFile, "camera");

});

// =============================================
// STOP CAMERA
// =============================================

stopCameraButton.addEventListener("click", () => {

    stopCamera();

});

function stopCamera() {

    stopRealtimeOCR();

    if (cameraStream) {

        cameraStream.getTracks().forEach((track) => {

            track.stop();

        });

        cameraStream = null;

    }

    cameraPreview.srcObject = null;

    cameraPreview.style.display = "none";

    startCameraButton.disabled = false;
    captureButton.disabled = true;
    stopCameraButton.disabled = true;

    startRealtimeButton.disabled = true;
    stopRealtimeButton.disabled = true;

    cameraStatus.textContent =
        "Camera stopped.";

    realtimeStatus.textContent =
        "Start the camera to enable real-time OCR.";

    console.log("Camera stopped.");

}

// =============================================
// CLEANUP WHEN PAGE IS CLOSED
// =============================================

window.addEventListener("pagehide", () => {

    realtimeActive = false;

    if (realtimeTimer !== null) {

        clearInterval(realtimeTimer);

        realtimeTimer = null;

    }

    if (cameraStream) {

        cameraStream.getTracks().forEach((track) => {

            track.stop();

        });

        cameraStream = null;

    }

    if (capturedImageURL) {

        URL.revokeObjectURL(capturedImageURL);

        capturedImageURL = null;

    }

    if (voiceRecognitionActive && voiceRecognition) {

        voiceRecognition.abort();

    }

});

// =============================================
// INITIALIZATION
// =============================================

console.log(
    "Helping Eyes frontend loaded successfully!"
);

// =============================================
// PART 5: TEXT-TO-SPEECH (TTS)
// =============================================

// TTS HTML elements

const voiceSelect = document.getElementById("voiceSelect");

const speechRate = document.getElementById("speechRate");

const speechRateValue = document.getElementById("speechRateValue");

const speakButton = document.getElementById("speakButton");

const pauseButton = document.getElementById("pauseButton");

const resumeButton = document.getElementById("resumeButton");

const stopSpeechButton = document.getElementById("stopSpeechButton");

const speechStatus = document.getElementById("speechStatus");

// Browser Speech Synthesis API

const speechEngine = window.speechSynthesis;

let currentUtterance = null;

// Store latest OCR results

const recognizedTexts = {

    upload: {
        text: "",
        updatedAt: 0
    },

    realtime: {
        text: "",
        updatedAt: 0
    }

};

// =============================================
// CHECK BROWSER TTS SUPPORT
// =============================================

if (!speechEngine) {

    speechStatus.textContent =
        "Text-to-Speech is not supported by this browser.";

    speakButton.disabled = true;

}

// =============================================
// UPDATE RECOGNIZED TEXT
// =============================================

function updateRecognizedText(source, element) {

    const text = element.textContent.trim();

    recognizedTexts[source] = {
        text: text,
        updatedAt: Date.now()
    };

}

// =============================================
// MONITOR OCR RESULT CHANGES
// =============================================

const uploadTextObserver = new MutationObserver(() => {

    updateRecognizedText("upload", extractedText);

});

uploadTextObserver.observe(extractedText, {

    childList: true,
    characterData: true,
    subtree: true

});

const realtimeTextObserver = new MutationObserver(() => {

    updateRecognizedText("realtime", realtimeResult);

});

realtimeTextObserver.observe(realtimeResult, {

    childList: true,
    characterData: true,
    subtree: true

});

// =============================================
// GET LATEST VALID OCR TEXT
// =============================================

function getLatestRecognizedText() {

    const latestResults = [

        recognizedTexts.upload,
        recognizedTexts.realtime

    ].sort((a, b) => b.updatedAt - a.updatedAt);

    for (const result of latestResults) {

        const text = result.text.trim();

        if (!text) {
            continue;
        }

        const invalidMessages = [

            "Your extracted text will appear here.",
            "Recognized text will appear here.",
            "No text detected in the image.",
            "No text detected. Adjust the camera position."

        ];

        if (invalidMessages.includes(text)) {
            continue;
        }

        return text;

    }

    return "";

}

// =============================================
// LOAD AVAILABLE SPEECH VOICES
// =============================================

function loadSpeechVoices() {

    if (!speechEngine) {
        return;
    }

    const voices = speechEngine.getVoices();

    const selectedVoice = voiceSelect.value;

    voiceSelect.replaceChildren();

    const defaultOption = document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent = "Default Voice";

    voiceSelect.appendChild(defaultOption);

    voices.forEach((voice, index) => {

        const option = document.createElement("option");

        option.value = String(index);

        option.textContent =
            `${voice.name} (${voice.lang})`;

        voiceSelect.appendChild(option);

    });

    if (
        selectedVoice !== "" &&
        voices[Number(selectedVoice)]
    ) {

        voiceSelect.value = selectedVoice;

    }

    console.log(
        "Available speech voices:",
        voices.length
    );

}

if (speechEngine) {

    loadSpeechVoices();

    speechEngine.addEventListener(
        "voiceschanged",
        loadSpeechVoices
    );

}

// =============================================
// SPEECH SPEED CONTROL
// =============================================

speechRate.addEventListener("input", () => {

    speechRateValue.textContent =
        `${speechRate.value}x`;

});

// =============================================
// UPDATE SPEECH CONTROL BUTTONS
// =============================================

function updateSpeechControls(isSpeaking, isPaused) {

    speakButton.disabled = isSpeaking || isPaused;

    pauseButton.disabled = !isSpeaking;

    resumeButton.disabled = !isPaused;

    stopSpeechButton.disabled =
        !isSpeaking && !isPaused;

}

// =============================================
// SPEAK TEXT
// Supports OCR text and AI answers
// =============================================

function speakRecognizedText(textOverride = "") {

    if (!speechEngine) {

        speechStatus.textContent =
            "Text-to-Speech is unavailable.";

        return;

    }

    const text =
        typeof textOverride === "string" && textOverride.trim()
            ? textOverride.trim()
            : getLatestRecognizedText();

    if (!text) {

        speechStatus.textContent =
            "No recognized text available. Upload an image or start Real-Time OCR first.";

        return;

    }

    speechEngine.cancel();

    currentUtterance = null;

    updateSpeechControls(false, false);

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.rate = Number(speechRate.value);

    const voices = speechEngine.getVoices();

    const selectedVoice = voiceSelect.value;

    if (
        selectedVoice !== "" &&
        voices[Number(selectedVoice)]
    ) {

        utterance.voice =
            voices[Number(selectedVoice)];

    }

    utterance.onstart = () => {

        speechStatus.textContent =
            textOverride
                ? "Speaking AI-generated answer..."
                : "Speaking recognized text...";

        updateSpeechControls(true, false);

    };

    utterance.onend = () => {

        speechStatus.textContent =
            "Speech completed successfully.";

        currentUtterance = null;

        updateSpeechControls(false, false);

    };

    utterance.onerror = (event) => {

        if (
            event.error === "canceled" ||
            event.error === "interrupted"
        ) {

            return;

        }

        speechStatus.textContent =
            "Speech error: " + event.error;

        currentUtterance = null;

        updateSpeechControls(false, false);

        console.error(
            "Text-to-Speech error:",
            event.error
        );

    };

    currentUtterance = utterance;

    speechEngine.speak(utterance);

    speechStatus.textContent =
        "Preparing speech...";

    console.log(
        textOverride
            ? "Speaking AI answer:"
            : "Speaking OCR text:",
        text
    );

}

// =============================================
// SPEAK BUTTON
// =============================================

speakButton.addEventListener("click", () => {

    speakRecognizedText();

});

// =============================================
// PAUSE SPEECH
// =============================================

pauseButton.addEventListener("click", () => {

    if (
        speechEngine &&
        speechEngine.speaking &&
        !speechEngine.paused
    ) {

        speechEngine.pause();

        speechStatus.textContent =
            "Speech paused.";

        updateSpeechControls(false, true);

        console.log("Speech paused.");

    }

});

// =============================================
// RESUME SPEECH
// =============================================

resumeButton.addEventListener("click", () => {

    if (
        speechEngine &&
        speechEngine.paused
    ) {

        speechEngine.resume();

        speechStatus.textContent =
            "Resuming speech...";

        updateSpeechControls(true, false);

        console.log("Speech resumed.");

    }

});

// =============================================
// STOP SPEECH
// =============================================

stopSpeechButton.addEventListener("click", () => {

    if (speechEngine) {

        speechEngine.cancel();

        currentUtterance = null;

        updateSpeechControls(false, false);

        speechStatus.textContent =
            "Speech stopped.";

        console.log("Speech stopped.");

    }

});

// =============================================
// PART 5: TTS INITIALIZATION
// =============================================

updateSpeechControls(false, false);

speechRateValue.textContent =
    `${speechRate.value}x`;

console.log(
    "Helping Eyes Text-to-Speech module initialized!"
);

// =============================================
// PART 6: AI QUESTION ANSWERING
// =============================================

// COMMON AI QUESTION SUBMISSION FUNCTION

async function submitQuestion(question, speakAnswer = false) {

    if (!currentDocumentId) {

        askStatus.textContent =
            "Please upload an image first.";

        return;

    }

    if (!question || !question.trim()) {

        askStatus.textContent =
            "Please enter a question.";

        return;

    }

    if (aiRequestInProgress) {

        askStatus.textContent =
            "An AI question is already being processed.";

        return;

    }

    aiRequestInProgress = true;

    askButton.disabled = true;
    voiceQuestionButton.disabled = true;

    askStatus.textContent =
        "Thinking... Please wait while Helping Eyes finds the answer.";

    answerResult.textContent = "";

    try {

        const response = await fetch("/api/ask", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                document_id: currentDocumentId,

                question: question.trim()

            })

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.detail || "Unable to generate an answer."
            );

        }

        const answer =
            result.answer || "No answer was returned.";

        answerResult.textContent = answer;

        askStatus.textContent =
            "Answer generated successfully!";

        console.log("AI question response:", result);

        // AUTOMATICALLY SPEAK VOICE-BASED AI ANSWERS

        if (speakAnswer && result.answer) {

            speakRecognizedText(result.answer);

        }

    } catch (error) {

        askStatus.textContent =
            error.message;

        console.error("AI question error:", error);

    } finally {

        aiRequestInProgress = false;

        askButton.disabled = false;
        voiceQuestionButton.disabled = false;

    }

}

// =============================================
// EXISTING TEXT-BASED QUESTION SUBMISSION
// =============================================

askForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const question = questionInput.value.trim();

    await submitQuestion(question, false);

});

// =============================================
// PART 7: VOICE-BASED AI QUESTION INPUT
// =============================================

// Browser Speech Recognition API

const SpeechRecognitionAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let voiceRecognition = null;

let voiceRecognitionActive = false;

// =============================================
// CHECK SPEECH RECOGNITION SUPPORT
// =============================================

if (SpeechRecognitionAPI) {

    voiceRecognition = new SpeechRecognitionAPI();

    voiceRecognition.lang = "en-IN";

    voiceRecognition.continuous = false;

    voiceRecognition.interimResults = false;

    voiceRecognition.maxAlternatives = 1;

    // =========================================
    // MICROPHONE STARTED
    // =========================================

    voiceRecognition.onstart = () => {

        voiceRecognitionActive = true;

        voiceQuestionButton.textContent =
            "Stop Listening";

        voiceQuestionStatus.textContent =
            "Listening... Please ask your question.";

    };

    // =========================================
    // SPEECH RECOGNIZED
    // =========================================

    voiceRecognition.onresult = async (event) => {

        const question =
            event.results[0][0].transcript.trim();

        if (!question) {

            voiceQuestionStatus.textContent =
                "No question detected. Please try again.";

            return;

        }

        console.log(
            "Voice question recognized:",
            question
        );

        // Put recognized question into existing input

        questionInput.value = question;

        voiceQuestionStatus.textContent =
            "Question recognized: " + question;

        // Submit question to existing AI endpoint
        // Automatically speak the generated answer

        await submitQuestion(question, true);

    };

    // =========================================
    // MICROPHONE ERROR
    // =========================================

    voiceRecognition.onerror = (event) => {

        voiceQuestionStatus.textContent =
            "Voice recognition error: " + event.error;

        console.error(
            "Voice recognition error:",
            event.error
        );

    };

    // =========================================
    // MICROPHONE STOPPED
    // =========================================

    voiceRecognition.onend = () => {

        voiceRecognitionActive = false;

        voiceQuestionButton.textContent =
            "Ask by Voice 🎤";

        if (
            voiceQuestionStatus.textContent.startsWith("Listening")
        ) {

            voiceQuestionStatus.textContent =
                "Microphone ready.";

        }

    };

    // =========================================
    // MICROPHONE BUTTON
    // =========================================

    voiceQuestionButton.addEventListener("click", () => {

        if (!currentDocumentId) {

            voiceQuestionStatus.textContent =
                "Please upload an image first.";

            return;

        }

        if (aiRequestInProgress) {

            voiceQuestionStatus.textContent =
                "Please wait for the current AI answer.";

            return;

        }

        if (voiceRecognitionActive) {

            voiceRecognition.stop();

            return;

        }

        try {

            voiceQuestionStatus.textContent =
                "Requesting microphone access...";

            voiceRecognition.start();

        } catch (error) {

            voiceQuestionStatus.textContent =
                "Unable to start microphone: " + error.message;

            console.error(
                "Microphone start error:",
                error
            );

        }

    });

} else {

    voiceQuestionButton.disabled = true;

    voiceQuestionStatus.textContent =
        "Speech recognition is not supported by this browser. Try Chrome or another supported browser.";

}

// =============================================
// VOICE AI INITIALIZATION
// =============================================

console.log(
    "Helping Eyes Voice AI module initialized!"
);

console.log(
    "Helping Eyes AI Question Answering module initialized!"
);
