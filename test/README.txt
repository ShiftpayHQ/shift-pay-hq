Shift Pay HQ v9.10.3aa DEV

Column Semantics Resolver

Builds directly on v9.10.3z. Detected NHS earnings-table headings now carry meaning as well as geometry: Source hours, Pay quantity, Rate and Amount remain distinct throughout the OCR row model. Arithmetic can validate Pay quantity × Rate ≈ Amount without overwriting Source hours.

No benchmark payroll values are hard-coded. Multiple overtime rows remain separate and review-only unless uniquely resolved. Ambiguous/incomplete rows stay blank in Review payslip data. No pay-engine, rota, payroll-calendar or navigation changes.
