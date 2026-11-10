
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

// Image quality elements
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
// CAMERA VARIABLES
// =============================================

let cameraStream = null;
let capturedFile = null;
let capturedImageURL = null;


// =============================================
// DISPLAY IMAGE QUALITY REPORT
// =============================================

function displayQualityReport(quality) {

    qualityResult.style.display = "block";

    // Display image quality status
    if (quality.acceptable) {

        qualityStatus.textContent =
            "Image quality looks good. Ready for OCR.";

        qualityStatus.className = "quality-good";

    } else {

        qualityStatus.textContent =
            "Image quality needs improvement.";

        qualityStatus.className = "quality-warning";

    }

    // Display measurements
    sharpnessValue.textContent =
        Number(quality.sharpness).toFixed(2);

    brightnessValue.textContent =
        Number(quality.brightness).toFixed(2);

    contrastValue.textContent =
        Number(quality.contrast).toFixed(2);

    glareValue.textContent =
        (Number(quality.glare_fraction) * 100).toFixed(2) + "%";


    // Display detected problems
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


    // Display suggestions and summary
    qualitySuggestion.textContent =
        quality.suggestion || "No suggestions available.";

    qualitySummary.textContent =
        quality.summary || "";

}


// =============================================
// COMMON IMAGE UPLOAD FUNCTION
// Used by both file upload and camera capture
// =============================================

async function uploadImage(file, source) {

    if (!file) {
        uploadStatus.textContent =
            "Please select or capture an image first.";
        return;
    }

    const formData = new FormData();

    // Backend expects the field name "file"
    formData.append("file", file);

    uploadStatus.textContent =
        "Uploading image and extracting text...";

    ocrResult.style.display = "none";
    qualityResult.style.display = "none";

    extractedText.textContent = "";

    uploadButton.disabled = true;
    uploadCapturedButton.disabled = true;

    try {

        // Send image to existing FastAPI endpoint
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

        // Display successful upload
        uploadStatus.textContent =
            `${result.message} File: ${result.filename}`;

        // Display image quality report
        if (result.quality) {

            displayQualityReport(result.quality);

        }

        // Display extracted OCR text
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

        // Check browser camera support
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "Camera access is not supported by this browser."
            );

        }

        // Request camera access
        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },

                audio: false

            });

        // Connect camera stream to video element
        cameraPreview.srcObject = cameraStream;

        cameraPreview.style.display = "block";

        await cameraPreview.play();

        // Enable camera controls
        startCameraButton.disabled = true;
        captureButton.disabled = false;
        stopCameraButton.disabled = false;

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
// CAPTURE IMAGE
// =============================================

captureButton.addEventListener("click", () => {

    if (!cameraStream) {

        cameraStatus.textContent =
            "Please start the camera first.";

        return;

    }

    // Check camera readiness
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

    // Set canvas dimensions
    cameraCanvas.width = width;
    cameraCanvas.height = height;

    const context = cameraCanvas.getContext("2d");

    if (!context) {

        cameraStatus.textContent =
            "Unable to create image canvas.";

        return;

    }

    // Draw current camera frame on canvas
    context.drawImage(
        cameraPreview,
        0,
        0,
        width,
        height
    );

    cameraStatus.textContent =
        "Capturing image...";

    // Convert canvas to JPEG
    cameraCanvas.toBlob((blob) => {

        if (!blob || blob.size === 0) {

            cameraStatus.textContent =
                "Image capture failed. Please try again.";

            return;

        }

        // Create a File from the captured image
        capturedFile = new File(
            [blob],
            "camera-capture.jpg",
            {
                type: "image/jpeg"
            }
        );

        // Remove previous preview URL
        if (capturedImageURL) {

            URL.revokeObjectURL(capturedImageURL);

        }

        // Create preview URL
        capturedImageURL =
            URL.createObjectURL(blob);

        // Display captured image
        capturedPreview.src = capturedImageURL;

        capturedPreview.style.display = "block";

        // Enable upload button
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

    if (cameraStream) {

        // Stop all camera tracks
        cameraStream.getTracks().forEach((track) => {

            track.stop();

        });

        cameraStream = null;

    }

    // Disconnect camera preview
    cameraPreview.srcObject = null;

    cameraPreview.style.display = "none";

    // Reset camera controls
    startCameraButton.disabled = false;
    captureButton.disabled = true;
    stopCameraButton.disabled = true;

    // Do not clear capturedFile here.
    // The user may still want to upload it.

    cameraStatus.textContent =
        "Camera stopped.";

    console.log("Camera stopped.");

}


// =============================================
// CLEANUP WHEN PAGE IS CLOSED
// =============================================

window.addEventListener("pagehide", () => {

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

});


// =============================================
// INITIALIZATION
// =============================================

console.log(
    "Helping Eyes frontend loaded successfully!"
);
