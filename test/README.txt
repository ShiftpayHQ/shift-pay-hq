Shift Pay HQ v9.10.3m DEV

Column-aware payslip mapper built from v9.10.3l OCR coordinate diagnostics.

Changes:
- splits reconstructed OCR rows into spatial column segments before payroll mapping
- Basic Pay can map from a labelled Basic Pay segment when the amount is clearly recognised
- unsocial, Sunday and overtime only turn green when Description + Units + Rate + Amount occur in the same spatial segment and Units × Rate ≈ Amount
- clears unsafe legacy earnings candidates before applying column-aware results
- retains Developer OCR debug for validation
- no pay-engine, rota, payroll-calendar or navigation changes
