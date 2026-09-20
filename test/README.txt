Shift Pay HQ v9.10.3h DEV

Scanner execution fix built from the confirmed-working v9.10.3f route/cache build.

Fix: restores the missing setScanField helper used by OCR payroll-row mapping. This was the exact runtime error exposed by v9.10.3f: setScanField is not defined.

No payroll rules, rota logic, navigation, or pay calculations were changed.

Test: confirm Rota / Pay / Payslips / Settings, then scan the same payslip and watch the OCR stage/result.
