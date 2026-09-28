Shift Pay HQ v9.10.3bf11.4 DEV — OCR Recovery + Stage Diagnostics

Builds on 3bf11.2 coordinate capture. Adds split-number anchor reconstruction, duplicate-position de-duplication, and snapshots/restores every manually reviewed field so teaching cannot alter the values the user entered. Learned profiles continue to store positions/labels only, never historical pay amounts.

Fixes applyLearnedLayout's undeclared hits counter. The faulty return comma expression first appeared in commit 124371c (3bf11) and was inherited by both 3bf11.2 and 3bf11.3; a saved profile and word coordinates expose it. The block/TSV collector from 3bf11.2 is retained.

Full-page coordinates are captured before detail OCR/payroll matching and retained on later failures. If the selected full-page pass lacks coordinates, the other full-page pass is tried without combining coordinate frames. New scans discard old evidence, and teaching requires full-page coordinates rather than substituting a crop. Failures report the active stage and retained word count. Missing coordinates stop automatic processing with an explicit diagnostic.

Learned positions require one candidate and the learned nearby label, obey existing value ranges, and cannot overwrite populated review fields. Manual snapshot/restore, earnings safety checks, local-only processing, and explicit confirmation before payslip saving remain in place. DEV cache cleanup is restricted to the test-specific cache prefix so it cannot delete live app caches.

Local checks: node test/scanner-regression.test.js and node --check test/sw.js (from repository root). The regression test reads the actual inline script in test/index.html. test/check-syntax.js and test/src are older copies, not the current /test entry point.

Synthetic tests do not establish real-device OCR accuracy or a particular teaching hit count. Re-scan the real payslip locally on the target device to verify coordinate counts and teaching results. No personal payslip image is included in these tests.
