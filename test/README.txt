Shift Pay HQ v9.10.3at DEV — Physical Earnings Row Separation

Built from v9.10.3as. Scanner-only patch.

- Reconstructs OCR lines with vertical overlap and median baselines instead of a drifting running average.
- Splits spatially separate earnings and deductions labels on a shared scan line for diagnostics.
- Rejects mixed Basic Pay / tax or deduction rows even if OCR still merges them.
- Preserves strict printed earnings region, semantic column and same-row arithmetic gates; uncertain amounts stay blank.
- No payroll rules, rota, pay check, or timeline changes.

Test with the same sideways payslip. A blank Basic Pay is safer than an invented amount.
