Shift Pay HQ v9.10.3ad DEV — Review UX + OT Classification

Built directly from v9.10.3ac.

Changes:
- Human-readable review flow: Source/worked hours → Pay quantity × Rate → Amount.
- Keeps source hours and payroll quantity distinct.
- Keeps every overtime row separate; never invents a combined OT total.
- Cautiously classifies T1/2, T2/double time, or extended duty only when the OCR row label supports it.
- Ambiguous overtime remains “Type needs checking”.
- Existing OCR, pay engine, rota and navigation otherwise unchanged.

Package: 8 files plus ocr-data folder.
