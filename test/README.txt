Shift Pay HQ v9.10.3ap DEV — Earnings Table Geometry

Built directly from v9.10.3ao Printed Column Ownership.

Changes:
- Reconstructs printed earnings-table headings when OCR splits them into separate words.
- Accepts a proved printed Quantity | Rate | Amount header as sufficient column ownership.
- Treats Source/Worked Hours as a separate optional column; it is never invented when absent.
- Supports both genuine 3-column and 4-column earnings layouts.
- Requires physical left-to-right column order and minimum spacing before fields can be promoted.
- Same-row arithmetic remains validation only; it cannot assign payroll column meaning.
- Arithmetic-only geometry remains diagnostic and cannot auto-fill review fields.
- Preserves multiple overtime rows, confirmation gate and local-only payslip processing.

Next test target:
Use the same sideways August payslip on iPhone. Check whether the scanner now recognises printed Quantity / Rate / Amount geometry. Correct values may populate only where both printed geometry and row arithmetic agree. Anything unproved must remain blank/review-only.
