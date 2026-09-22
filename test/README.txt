Shift Pay HQ v9.10.3am DEV — Row-Column Geometry Resolver

Built from v9.10.3al.

Changes:
- Learns repeated physical Quantity | Rate | Amount columns across labelled NHS earnings rows.
- Assigns OCR values by x-position first; arithmetic validates rather than choosing columns.
- Basic Pay amount must occupy the proved Amount column.
- Keeps source/worked hours separate and does not invent them.
- Keeps overtime rows separate and retains T1/2 / T2 semantics.
- Ambiguous or incomplete rows remain review-only.
