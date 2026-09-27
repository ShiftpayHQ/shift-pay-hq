Shift Pay HQ v9.10.3bf9 DEV — High-Resolution Row Scanner

Built directly from v9.10.3bf8.

Changes:
- preserves substantially more source-photo resolution before earnings OCR
- orientation detection still uses a smaller working copy for speed
- final upright payslip and earnings table are rebuilt at higher resolution
- printed-row reconstruction and strict row/column ownership remain intact
- isolated cell recovery now works from the higher-resolution earnings source
- no neighbouring row/column may donate a value
- uncertain values remain blank; nothing is silently guessed
- review/confirmation remains mandatory before Pay Check

Development build only. Root/live release remains untouched.
