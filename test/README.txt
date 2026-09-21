Shift Pay HQ v9.10.3u DEV

Table Row Arithmetic Parser

Built from v9.10.3t. OCR/crop/rotation and the working Basic Pay / Mon-Sat mapping are preserved. Earnings rows are now accepted only when the printed row identity and row arithmetic agree. For the validated local profile, displayed Mon-Sat, Sunday and T1/2 hours are recovered from Amount / (Basic hourly rate × enhancement), then matched back to a number actually present on that OCR row. This prevents effective-pay quantities from being mistaken for hours.

No benchmark payroll amounts are hard-coded. The scanner reports the selected payslip, not a preselected month. Uncertain fields remain blank. PAYE/Net remain review-only. No pay-engine, rota, payroll-calendar or navigation changes.
