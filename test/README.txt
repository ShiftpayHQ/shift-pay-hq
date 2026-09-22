Shift Pay HQ v9.10.3ag DEV — Scan Isolation + Column Lock

Built directly from v9.10.3af iPhone Review + Pay Check Bridge.

Changes:
- New photo immediately isolates the scan from any previously confirmed Pay Check.
- Previous green comparison is hidden until the current scan is explicitly reviewed and confirmed.
- Automatic earnings promotion now requires all four OCR table semantics: Hours → Pay quantity → Rate → Amount.
- Column headings must have sane left-to-right geometry before values can be trusted.
- Tightened numeric-to-column distance gates.
- Arithmetic coincidence alone can no longer rescue or assign an earnings row.
- Multiple overtime rows remain separate; uncertain OT stays review-only.
- Existing local OCR pipeline, rota, pay engine and navigation remain unchanged.

Safety rule: label + locked column + same-row arithmetic must agree before an earnings value is promoted.
Package: 8 files plus ocr-data folder.
