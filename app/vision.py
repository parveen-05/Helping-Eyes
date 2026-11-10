
import re
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import cv2
import numpy as np


Box = Tuple[int, int, int, int]


# ============================================================
# PART 2: IMAGE QUALITY REPORT
# ============================================================

@dataclass
class QualityReport:
    """Stores image quality measurements and detected problems."""

    sharpness: float = 0.0
    brightness: float = 0.0
    contrast: float = 0.0
    clipped_bright: float = 0.0
    glare_fraction: float = 0.0
    glare_center: Optional[Tuple[int, int]] = None
    problems: List[str] = field(default_factory=list)

    def ok(self) -> bool:
        """Return True when no quality problems are detected."""
        return len(self.problems) == 0

    def hint(self) -> str:
        """Generate suggestions to improve image quality."""

        if not self.problems:
            return "Image quality looks good. Ready for OCR."

        hints = []

        for problem in self.problems:

            if problem == "blurry":
                hints.append(
                    "Hold your camera steady and focus on the text."
                )

            elif problem == "too_dark":
                hints.append(
                    "Increase the lighting around the page."
                )

            elif problem == "too_bright":
                hints.append(
                    "Reduce excessive lighting and adjust exposure."
                )

            elif problem == "low_contrast":
                hints.append(
                    "Improve lighting so the text is easier to distinguish."
                )

            elif problem == "glare":
                hints.append(
                    "Change the camera angle to avoid reflections."
                )

        return " ".join(hints)

    def summary(self) -> str:
        """Return a readable summary of image quality."""

        detected = (
            ", ".join(self.problems)
            if self.problems
            else "None"
        )

        return (
            f"Sharpness: {self.sharpness:.2f}, "
            f"Brightness: {self.brightness:.2f}, "
            f"Contrast: {self.contrast:.2f}, "
            f"Overexposed pixels: {self.clipped_bright:.2%}, "
            f"Glare: {self.glare_fraction:.2%}, "
            f"Problems: {detected}"
        )


# ============================================================
# PART 1: OCR DATA STRUCTURE
# ============================================================

@dataclass
class TextLine:
    text: str
    confidence: float
    box: Box
    words: List[Tuple[int, int, Box]] = field(default_factory=list)
    quad: Optional[List[Tuple[float, float]]] = None
    word_quads: List[List[Tuple[float, float]]] = field(default_factory=list)


# ============================================================
# PART 2: IMAGE QUALITY ASSESSMENT
# ============================================================

def assess_quality(image: np.ndarray) -> QualityReport:
    """
    Analyse an image for blur, brightness, contrast and glare.

    Returns a QualityReport containing measurements,
    detected problems and an approximate glare location.

    Thresholds are initial heuristics and may need tuning
    using real book images.
    """

    if image is None or image.size == 0:
        raise ValueError("Input image is empty.")

    if image.ndim == 2:
        gray = image.copy()

    elif image.ndim == 3 and image.shape[2] == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    elif image.ndim == 3 and image.shape[2] == 4:
        gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)

    else:
        raise ValueError("Unsupported image format.")

    # 1. Sharpness: variance of Laplacian
    sharpness = float(
        cv2.Laplacian(gray, cv2.CV_64F).var()
    )

    # 2. Brightness: average grayscale intensity
    brightness = float(np.mean(gray))

    # 3. Contrast: standard deviation of grayscale intensity
    contrast = float(np.std(gray))

    # 4. Overexposure: fraction of pixels close to pure white
    clipped_bright = float(
        np.count_nonzero(gray > 245) / gray.size
    )

    # 5. Glare detection
    # Look for very bright, nearly white regions.
    glare_mask = cv2.inRange(
        gray,
        250,
        255
    )

    # Remove tiny isolated bright pixels.
    kernel = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (7, 7)
    )

    glare_mask = cv2.morphologyEx(
        glare_mask,
        cv2.MORPH_OPEN,
        kernel
    )

    # Find connected bright regions.
    count, labels, stats, centroids = (
        cv2.connectedComponentsWithStats(
            glare_mask,
            connectivity=8
        )
    )

    total_pixels = gray.size

    minimum_area = max(
        20,
        int(total_pixels * 0.0001)
    )

    glare_pixels = 0
    glare_center = None
    weighted_x = 0.0
    weighted_y = 0.0

    for index in range(1, count):

        area = int(
            stats[index, cv2.CC_STAT_AREA]
        )

        if area < minimum_area:
            continue

        glare_pixels += area

        weighted_x += centroids[index][0] * area
        weighted_y += centroids[index][1] * area

    glare_fraction = float(
        glare_pixels / total_pixels
    )

    if glare_pixels > 0:
        glare_center = (
            int(weighted_x / glare_pixels),
            int(weighted_y / glare_pixels)
        )

    # 6. Identify quality problems.
    problems = []

    if sharpness < 60:
        problems.append("blurry")

    if brightness < 50:
        problems.append("too_dark")

    if brightness > 205 and clipped_bright > 0.40:
        problems.append("too_bright")

    if contrast < 25:
        problems.append("low_contrast")

    if glare_fraction >= 0.01:
        problems.append("glare")

    return QualityReport(
        sharpness=sharpness,
        brightness=brightness,
        contrast=contrast,
        clipped_bright=clipped_bright,
        glare_fraction=glare_fraction,
        glare_center=glare_center,
        problems=problems
    )


# ============================================================
# PART 1: APPLE VISION COORDINATE CONVERSION
# ============================================================

def _vision_box(rect, w: int, h: int) -> Box:
    """Convert Vision's normalised bounding box to pixel coordinates."""

    x, y = rect.origin.x, rect.origin.y
    bw, bh = rect.size.width, rect.size.height

    return (
        max(0, int(x * w)),
        max(0, int((1 - y - bh) * h)),
        min(w, int((x + bw) * w)),
        min(h, int((1 - y) * h))
    )


def _vision_quad(obs, w: int, h: int):
    """Convert Vision's four corner points to image pixel coordinates."""

    return [
        (p.x * w, (1 - p.y) * h)
        for p in (
            obs.topLeft(),
            obs.topRight(),
            obs.bottomRight(),
            obs.bottomLeft()
        )
    ]


# ============================================================
# PART 1: APPLE VISION OCR
# ============================================================

def recognize_text(
    image: np.ndarray,
    word_boxes: bool = False,
    fast: bool = False
) -> List[TextLine]:
    """Recognise text in an image using Apple's Vision framework."""

    import Foundation
    import Vision

    h, w = image.shape[:2]

    ok, png = cv2.imencode(".png", image)

    if not ok:
        return []

    data = Foundation.NSData.dataWithBytes_length_(
        png.tobytes(), len(png)
    )

    handler = Vision.VNImageRequestHandler.alloc().initWithData_options_(
        data, None
    )

    request = Vision.VNRecognizeTextRequest.alloc().init()

    request.setRecognitionLevel_(
        Vision.VNRequestTextRecognitionLevelFast if fast
        else Vision.VNRequestTextRecognitionLevelAccurate
    )

    request.setUsesLanguageCorrection_(not fast)
    request.setRecognitionLanguages_(["en-US"])

    ok, error = handler.performRequests_error_([request], None)

    if not ok:
        print(f"Apple Vision failed: {error}")
        return []

    lines = []

    for observation in request.results() or []:

        candidates = observation.topCandidates_(1)

        if not candidates:
            continue

        candidate = candidates[0]
        text = str(candidate.string())

        line = TextLine(
            text,
            float(candidate.confidence()),
            _vision_box(observation.boundingBox(), w, h),
            quad=_vision_quad(observation, w, h)
        )

        if word_boxes:

            for match in re.finditer(r"\S+", text):

                start = len(
                    text[:match.start()].encode("utf-16-le")
                ) // 2

                length = len(
                    match.group().encode("utf-16-le")
                ) // 2

                box, _ = candidate.boundingBoxForRange_error_(
                    Foundation.NSMakeRange(start, length), None
                )

                if box is not None:

                    line.words.append((
                        match.start(),
                        match.end(),
                        _vision_box(box.boundingBox(), w, h)
                    ))

                    line.word_quads.append(
                        _vision_quad(box, w, h)
                    )

        lines.append(line)

    lines.sort(key=lambda line: (line.box[1], line.box[0]))

    return lines


# ============================================================
# PART 1: TEXT REGION DETECTION
# ============================================================

def find_text_region(
    image: np.ndarray,
    min_chars: int = 8
) -> Tuple[Optional[Box], List[TextLine]]:
    """
    Detect readable text and return the bounding box
    surrounding all recognised text.
    """

    lines = [
        line for line in recognize_text(image)
        if len(
            re.sub(r"[^0-9A-Za-z\u0080-\uFFFF]", "", line.text)
        ) >= 2
    ]

    chars = sum(
        len(re.sub(r"\s", "", line.text))
        for line in lines
    )

    if chars < min_chars:
        return None, lines

    x1 = min(line.box[0] for line in lines)
    y1 = min(line.box[1] for line in lines)
    x2 = max(line.box[2] for line in lines)
    y2 = max(line.box[3] for line in lines)

    return (x1, y1, x2, y2), lines


# ============================================================
# PART 1: IMAGE ENHANCEMENT
# ============================================================

def enhance_tone(
    image: np.ndarray,
    clahe_clip: float = 2.0
) -> np.ndarray:
    """
    Reduce uneven lighting and improve local contrast.
    Image dimensions remain unchanged.
    """

    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)

    light = lab[:, :, 0]

    small = cv2.resize(
        light,
        None,
        fx=0.25,
        fy=0.25,
        interpolation=cv2.INTER_AREA
    )

    size = max(3, int(min(small.shape[:2]) * 0.06)) | 1

    background = cv2.dilate(
        small,
        cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (size, size)
        )
    )

    background = cv2.GaussianBlur(
        background,
        (0, 0),
        size
    )

    background = cv2.resize(
        background,
        (light.shape[1], light.shape[0]),
        interpolation=cv2.INTER_LINEAR
    )

    flat = cv2.divide(
        light,
        np.maximum(background, 1),
        scale=245
    )

    lab[:, :, 0] = cv2.createCLAHE(
        clipLimit=clahe_clip,
        tileGridSize=(8, 8)
    ).apply(flat)

    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def binarize(image: np.ndarray) -> np.ndarray:
    """
    Convert an image into a black-and-white version
    using adaptive thresholding.
    """

    gray = (
        cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        if image.ndim == 3
        else image
    )

    block = max(15, (min(gray.shape) // 25) | 1)

    binary = cv2.adaptiveThreshold(
        cv2.GaussianBlur(gray, (3, 3), 0),
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        block,
        15
    )

    return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)


# ============================================================
# PART 1: AUTOMATIC OCR ENHANCEMENT AND SELECTION
# ============================================================

def read_text_enhanced(image: np.ndarray):
    """
    Try OCR on original, tone-enhanced and binarized images.
    Select the version that produces the strongest text result.
    """

    candidates = [
        ("original", image),
        ("enhanced", enhance_tone(image)),
        ("binarized", binarize(image))
    ]

    best_text = ""
    best_score = -1
    best_variant = "original"

    for name, candidate_image in candidates:

        lines = recognize_text(candidate_image)

        score = sum(
            line.confidence * len(line.text.strip())
            for line in lines
        )

        print(f"{name}: {len(lines)} lines, score={score:.2f}")

        if score > best_score:
            best_score = score
            best_variant = name
            best_text = "\n".join(
                line.text for line in lines
            )

    return best_text, best_variant

