Shift Pay HQ v9.10.3bf7 DEV — Printed Row Reconstruction

Builds on 3bf6 but removes the OCR description baseline as the numeric-row anchor. 3bf7 detects physical printed earnings lines from the Amount-column ink pattern, then OCRs Description, Hours worked, Units paid, Rate and Amount from the same reconstructed row band. Existing arithmetic safety gates remain: Basic needs an isolated Amount; enhancement/OT rows need Pay quantity × Rate = Amount; incomplete OT sets are withheld.
