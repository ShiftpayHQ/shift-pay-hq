Shift Pay HQ v9.10.3ak DEV — Payroll Row Association

Built from v9.10.3aj.

Changes:
- Stops forcing a four-number Hours | Pay quantity | Rate | Amount model onto NHS earnings rows.
- Learns the common printed Quantity/Units | Rate | Amount geometry from repeated same-row arithmetic.
- Uses a separate Source Hours column only when OCR explicitly detects both Hours and Quantity headings.
- Prevents one OCR number from owning more than one semantic cell.
- Summary units now come from the proven payroll quantity cell, not a guessed source-hours cell.
- T1/2 and T2 labels remain review evidence; effective-rate calculations require genuine source-hours evidence.
- Multiple overtime rows remain separate and are never silently combined.
- Nothing is saved until the user confirms the reviewed payslip.
