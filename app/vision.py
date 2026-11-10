
import re
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

import cv2
import numpy as np


Box = Tuple[int, int, int, int]


@dataclass
class TextLine:
    text: str
    confidence: float
    box: Box
    words: List[Tuple[int, int, Box]] = field(default_factory=list)
    quad: Optional[List[Tuple[float, float]]] = None
    word_quads: List[List[Tuple[float, float]]] = field(default_factory=list)


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
