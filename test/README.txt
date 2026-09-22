Shift Pay HQ v9.10.3an DEV — Header-Anchored Table Scanner

Built directly from v9.10.3am.

Changes:
- Locates and bounds the labelled NHS earnings-table region before assigning payroll values.
- Prefers OCR table headings to lock Source Hours | Pay Quantity | Rate | Amount lanes.
- PAYE, NI, pension, gross and net figures outside the earnings region cannot become earnings evidence.
- If headings are incomplete, fallback geometry is learned only from labelled earnings rows inside the bounded table.
- Arithmetic validates already-assigned columns; it does not decide column meaning.
- Basic Pay remains blank unless an amount is safely present in the proved Amount lane.
- Multiple overtime rows remain separate and review-only when ambiguous.
- No benchmark payroll values are embedded in the scanner.

Test with the same sideways payslip used for 3am.
