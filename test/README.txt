Shift Pay HQ v9.10.3ao DEV — Printed Column Ownership

Built from v9.10.3an.

Changes:
- Stops arithmetic-only geometry from owning payroll fields.
- Only printed semantic table headings can promote Quantity / Rate / Amount into review fields.
- Arithmetic fallback remains visible for diagnostics but cannot silently create trusted evidence.
- Prevents mathematically equivalent enhancement values (for example 23.4 × base rate) being mistaken for the payslip's printed quantity/rate pair.
- Preserves earnings-region isolation, OT row separation, evidence ownership and confirmation gate.

Next test target:
Same sideways August payslip. We expect fewer false green fields. If headings are not OCR-readable, fields should stay blank rather than promoting equivalent arithmetic values.
