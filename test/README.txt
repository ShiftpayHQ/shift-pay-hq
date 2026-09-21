Shift Pay HQ v9.10.3z DEV

Column Geometry Resolver

Builds on v9.10.3y. The scanner now looks for OCR-visible NHS earnings-table headings before interpreting numeric columns. Detected heading coordinates are used where available; missing headings fall back to recurring numeric-column geometry and the diagnostic UI says which source was used.

No benchmark payroll values are hard-coded. Multiple overtime rows remain separate. Ambiguous or incomplete components remain review-only. No pay-engine, rota, payroll-calendar or navigation changes.
