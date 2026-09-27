Shift Pay HQ v9.10.3bf11.1 DEV — Teaching Result + Anchor Matcher

Fixes the supervised teaching action so it always gives an explicit success/failure result. Manual confirmed values are matched to OCR coordinates with nearby row-label context; repeated values are left ambiguous unless row context disambiguates them. A learned profile is only saved when at least three anchors are safely located. Stored profiles contain normalized positions and nearby label context, not the confirmed pay amounts. Also renames the three review quantity fields to Hours worked to match the payslip semantics.
