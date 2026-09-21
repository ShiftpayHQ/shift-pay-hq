Shift Pay HQ v9.10.3y DEV

Earnings Component Resolver

Built from v9.10.3x. OCR and the NHS earnings table model are preserved. 3y adds a downstream resolver that keeps Hours, Pay quantity, Rate and Amount separate, resolves only unique arithmetically validated labelled rows, and preserves multiple overtime rows rather than silently collapsing them.

No benchmark payroll amounts are hard-coded. Ambiguous components remain review-only. Existing rota/payroll calendar/navigation are unchanged.
