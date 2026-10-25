# Device display font

Noto Sans variable font, Copyright 2022 The Noto Project Authors, SIL Open Font License 1.1. License: [OFL.txt](OFL.txt).

Source: https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth,wght%5D.ttf

`python3 scripts/generate-display-font.py` (Pillow) rasterises weight 600 at 36, 26, 18, 14 and 12 px into the checked-in `firmware/display-font.h`. The header records the exact source SHA256. The full font is an authoring input only; the device links the compact four-bit glyph subset, with no runtime font engine or allocation.
