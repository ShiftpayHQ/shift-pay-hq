Shift Pay HQ v9.10.3bf11.2 DEV — Coordinate Capture

Changes:
- Captures OCR word coordinates during the main payslip scan.
- Adds TSV coordinate fallback for iPhone/Safari when OCR text is available but nested word boxes are not.
- Keeps manual-guided teaching safety gate: no coordinates = no learned profile.
- Learned profile stores normalized positions/nearby labels, not historical pay amounts.
- Existing review-before-save workflow retained.
