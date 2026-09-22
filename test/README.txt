Shift Pay HQ v9.10.3al DEV — Arithmetic Column Resolver

Built from v9.10.3ak.

Changes:
- Resolves each labelled earnings row from its own OCR arithmetic candidates.
- Requires distinct left-to-right Quantity × Rate = Amount tokens.
- Uses the Basic Pay amount column only as an amount-position anchor.
- If more than one arithmetic combination fits a row, the row remains review-only instead of guessing.
- Keeps PAYE/Net evidence isolated from earnings rows.
- Keeps multiple overtime rows separate.
- Never creates payroll quantity from source/worked hours or OT multipliers.
