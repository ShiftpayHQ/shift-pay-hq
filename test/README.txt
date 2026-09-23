Shift Pay HQ v9.10.3as DEV — Strict Basic Row Lock Fix

Built from v9.10.3aq. Scanner-only surgical change.

Changes:
- Basic Pay can auto-fill only when the same reconstructed physical row proves Quantity × Rate = Amount.
- Removed the nearby-amount fallback that allowed a deductions figure such as PAYE to become Basic Pay.
- Requires left-to-right Basic label → Quantity → Rate → Amount geometry.
- Adds a temporary Basic Row Lock diagnostic with row text, number x-coordinates and arithmetic candidates.
- If proof is missing or ambiguous, Basic stays blank.

Rota, Pay, Pay Check, payroll timeline and existing scanner safety gates are otherwise unchanged.
