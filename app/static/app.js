
const imageInput = document.getElementById("imageInput");
const uploadButton = document.getElementById("uploadButton");
const uploadStatus = document.getElementById("uploadStatus");

const ocrResult = document.getElementById("ocrResult");
const extractedText = document.getElementById("extractedText");

const qualityResult = document.getElementById("qualityResult");
const qualityStatus = document.getElementById("qualityStatus");

const sharpnessValue = document.getElementById("sharpnessValue");
const brightnessValue = document.getElementById("brightnessValue");
const contrastValue = document.getElementById("contrastValue");
const glareValue = document.getElementById("glareValue");

const qualityProblems = document.getElementById("qualityProblems");
const qualitySuggestion = document.getElementById("qualitySuggestion");
const qualitySummary = document.getElementById("qualitySummary");


// Display the image quality report
function displayQualityReport(quality) {

    qualityResult.style.display = "block";

    // Display whether the image is acceptable
    if (quality.acceptable) {
        qualityStatus.textContent =
            "Image quality looks good. Ready for OCR.";

        qualityStatus.className = "quality-good";

    } else {
        qualityStatus.textContent =
            "Image quality needs improvement.";

        qualityStatus.className = "quality-warning";
    }

    // Display quality measurements
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

            listItem.textContent = problem.replaceAll("_", " ");

            qualityProblems.appendChild(listItem);

        });

    } else {

        const listItem = document.createElement("li");

        listItem.textContent = "No quality problems detected.";

        qualityProblems.appendChild(listItem);

    }

    // Display suggestion and summary
    qualitySuggestion.textContent =
        quality.suggestion || "No suggestions available.";

    qualitySummary.textContent =
        quality.summary || "";

}


// Handle image upload
uploadButton.addEventListener("click", async () => {

    const file = imageInput.files[0];

    if (!file) {

        uploadStatus.textContent = "Please select an image first.";

        ocrResult.style.display = "none";
        qualityResult.style.display = "none";

        return;
    }

    // Prepare image data
    const formData = new FormData();

    formData.append("file", file);

    uploadStatus.textContent =
        "Uploading image and extracting text...";

    ocrResult.style.display = "none";
    qualityResult.style.display = "none";

    extractedText.textContent = "";

    uploadButton.disabled = true;

    try {

        // Send image to FastAPI backend
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Image upload failed.");
        }

        // Display upload success
        uploadStatus.textContent =
            `${result.message} File: ${result.filename}`;

        // Display image quality information
        if (result.quality) {
            displayQualityReport(result.quality);
        }

        // Display extracted OCR text
        extractedText.textContent =
            result.extracted_text || "No text detected in the image.";

        ocrResult.style.display = "block";

        console.log("Upload response:", result);

    } catch (error) {

        uploadStatus.textContent = error.message;

        ocrResult.style.display = "none";
        qualityResult.style.display = "none";

        console.error("Upload error:", error);

    } finally {

        uploadButton.disabled = false;

    }

});

console.log("Helping Eyes frontend loaded successfully!");
