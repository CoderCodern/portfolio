#!/usr/bin/env python3
"""Convert CV PDF → profile.raw.md using the embedded PDF converter.

Writes to profile.raw.md (not profile.md) so the curated file is never
overwritten. Diff the two files to cherry-pick new content.
"""
import sys
import logging
from pathlib import Path

logging.disable(logging.WARNING)

ROOT = Path(__file__).parent
CV_PDF = ROOT / "Nguyen-Viet-Hoang-March-2026.pdf"
PROFILE_MD = ROOT / "profile.raw.md"

sys.path.insert(0, str(ROOT))

from tools._stream_info import StreamInfo
from tools._pdf_converter import PdfConverter


def main() -> None:
    if not CV_PDF.exists():
        print(f"Error: CV not found at {CV_PDF}")
        sys.exit(1)

    print(f"Converting {CV_PDF.name} ...")
    converter = PdfConverter()
    stream_info = StreamInfo(extension=".pdf", mimetype="application/pdf")

    with open(CV_PDF, "rb") as f:
        result = converter.convert(f, stream_info)

    PROFILE_MD.write_text(result.markdown, encoding="utf-8")
    print(f"Done → {PROFILE_MD.name} ({len(result.markdown):,} characters)")


if __name__ == "__main__":
    main()