Shift Pay HQ v9.10.3bf DEV — OT Row Classification + Safe Aggregation

Changes from v9.10.3be:
- Keeps the proven Basic / Sunday / Mon–Sat cell-reading logic.
- Stops treating PAIAW/unknown OCR labels as overtime.
- Classifies only explicit overtime labels as OT.
- Never publishes a partial overtime total.
- OT review fields are populated only when the complete detected OT set is independently verified.
- Ambiguous earnings rows force OT totals to remain blank for manual review.
- Nothing is saved until the user confirms the reviewed payslip.

Deploy to /test/ only. Keep the live root untouched.
