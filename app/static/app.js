
const imageInput = document.getElementById("imageInput");
const uploadButton = document.getElementById("uploadButton");
const uploadStatus = document.getElementById("uploadStatus");

uploadButton.addEventListener("click", async () => {

    // Check whether an image is selected
    const file = imageInput.files[0];

    if (!file) {
        uploadStatus.textContent = "Please select an image first.";
        return;
    }

    // Prepare image data for upload
    const formData = new FormData();
    formData.append("file", file);

    uploadStatus.textContent = "Uploading image...";
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

        uploadStatus.textContent =
            `${result.message} File: ${result.filename}`;

        console.log("Upload response:", result);

    } catch (error) {
        uploadStatus.textContent = error.message;
        console.error("Upload error:", error);

    } finally {
        uploadButton.disabled = false;
    }
});

console.log("Helping Eyes frontend loaded successfully!");
