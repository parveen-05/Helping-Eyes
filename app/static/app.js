
const imageInput = document.getElementById("imageInput");
const uploadButton = document.getElementById("uploadButton");
const uploadStatus = document.getElementById("uploadStatus");
const ocrResult = document.getElementById("ocrResult");
const extractedText = document.getElementById("extractedText");

uploadButton.addEventListener("click", async () => {

    // Check whether an image is selected
    const file = imageInput.files[0];

    if (!file) {
        uploadStatus.textContent = "Please select an image first.";
        ocrResult.style.display = "none";
        return;
    }

    // Prepare image data for upload
    const formData = new FormData();
    formData.append("file", file);

    uploadStatus.textContent = "Uploading image and extracting text...";
    ocrResult.style.display = "none";
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

        // Display upload success message
        uploadStatus.textContent =
            `${result.message} File: ${result.filename}`;

        // Display extracted OCR text
        extractedText.textContent =
            result.extracted_text || "No text detected in the image.";

        ocrResult.style.display = "block";

        console.log("Upload response:", result);
        console.log("Extracted text:", result.extracted_text);

    } catch (error) {

        uploadStatus.textContent = error.message;
        ocrResult.style.display = "none";

        console.error("Upload error:", error);

    } finally {

        uploadButton.disabled = false;

    }
});

console.log("Helping Eyes frontend loaded successfully!");
