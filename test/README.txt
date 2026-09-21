Shift Pay HQ v9.10.3x DEV

NHS Earnings Table Model

Built from the working v9.10.3w scanner. This build models OCR earnings as structured rows: Description / Hours / Pay quantity / Rate / Amount. Hours and pay quantity remain separate, and multiple overtime rows are preserved instead of being silently combined.

The existing review fields and Pay Check are deliberately unchanged while the structured row model is validated. The NHS Earnings Table Model is diagnostic-only and nothing is saved until the user confirms the payslip.

No benchmark payroll amounts are hard-coded. Unresolved rows remain unresolved. No rota, pay-engine, payroll-calendar or navigation changes.
