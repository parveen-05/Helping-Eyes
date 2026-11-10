
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
