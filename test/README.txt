Shift Pay HQ v9.10.3s DEV

Sunday + OT Row Lock

Built from v9.10.3r. Keeps the DEV cache reliability fix intact.

Scanner changes only:
- Locks Sunday and OT candidates to their labelled OCR row.
- Separates displayed hours from effective pay quantity when NHS payroll prints both.
- Validates amount arithmetic using the document-derived base hourly rate.
- Preserves Basic and Mon-Sat mapping.
- No benchmark payroll amounts are hard-coded.
- Uncertain fields remain blank.

No pay-engine, rota, payroll-calendar or navigation changes.
