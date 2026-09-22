Shift Pay HQ v9.10.3ai DEV — Earnings Table Geometry Fix

Built from v9.10.3ag.

Changes:
- Every OCR value has one evidence owner.
- PAYE/Net totals cannot leak into Basic or earnings fields.
- Structured resolver may explain an earnings candidate but cannot populate a field unless the spatial earnings scanner already proved/owned it.
- Arithmetic validates owned evidence only; it never creates evidence.
- New scans clear ownership, earnings candidates and prior Pay Check state.
- Existing iPhone OCR pipeline, row diagnostics and Pay Check bridge preserved.

Expected stress-test behaviour: if OCR only proves PAYE and Net, Basic and all earnings summary fields remain blank.
