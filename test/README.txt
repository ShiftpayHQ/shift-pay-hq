Shift Pay HQ v9.10.3bf11.5 DEV — Learned Layout Diagnostics

bf11.5 investigates zero learned-anchor hits without relaxing the bf11.4 distance, ambiguity, label, existing-value, or value-range checks. The DEV panel always reports storage status, saved anchor count, profile version, source/processed image dimensions, rotation, selected coordinate OCR pass, teaching coordinate metadata, current token bounds/count, and each anchor's nearest token/numeric candidate and rejection reason. Old pay amounts are not stored or compared. Diagnostics remain local.

The existing sphq_scanner_layout_v1 key is retained and re-read at each new scan. Missing keys, unreadable storage/JSON, empty anchors and unsupported profiles are reported explicitly. Cache cleanup does not delete localStorage. The actual iPhone storage contents cannot be determined from the repository; inspect this panel on that device.

Legacy v2 profiles normalized against OCR token extrema and did not record teaching dimensions. Their original matching path is retained with an explicit compatibility warning; no image dimensions are invented or profiles silently migrated. New teaching saves v3 profiles normalized against the full enhanced image, plus dimensions, rotation, OCR pass and token bounds (no historical amounts). Matching v3 requires the recorded coordinate scheme and a processed-image aspect ratio within 2%; otherwise it stops with an incompatibility message. Exact nearby-label matching remains deliberately conservative and is now diagnosable.

For the next local iPhone test, inspect the legacy profile's rejection reasons before re-teaching. Re-teaching after reviewing the printed values records v3 metadata. Synthetic regression tests verify stable normalization when edge tokens disappear, uniform scaling, incompatible dimensions, storage errors, label rejection and ambiguity; they do not establish real-device accuracy.

Builds on 3bf11.2 coordinate capture. Adds split-number anchor reconstruction, duplicate-position de-duplication, and snapshots/restores every manually reviewed field so teaching cannot alter the values the user entered. Learned profiles continue to store positions/labels only, never historical pay amounts.

Fixes applyLearnedLayout's undeclared hits counter. The faulty return comma expression first appeared in commit 124371c (3bf11) and was inherited by both 3bf11.2 and 3bf11.3; a saved profile and word coordinates expose it. The block/TSV collector from 3bf11.2 is retained.

Full-page coordinates are captured before detail OCR/payroll matching and retained on later failures. If the selected full-page pass lacks coordinates, the other full-page pass is tried without combining coordinate frames. New scans discard old evidence, and teaching requires full-page coordinates rather than substituting a crop. Failures report the active stage and retained word count. Missing coordinates stop automatic processing with an explicit diagnostic.

Learned positions require one candidate and the learned nearby label, obey existing value ranges, and cannot overwrite populated review fields. Manual snapshot/restore, earnings safety checks, local-only processing, and explicit confirmation before payslip saving remain in place. DEV cache cleanup is restricted to the test-specific cache prefix so it cannot delete live app caches.

Local checks: node test/scanner-regression.test.js and node --check test/sw.js (from repository root). The regression test reads the actual inline script in test/index.html. test/check-syntax.js and test/src are older copies, not the current /test entry point.

Synthetic tests do not establish real-device OCR accuracy or a particular teaching hit count. Re-scan the real payslip locally on the target device to verify coordinate counts and teaching results. No personal payslip image is included in these tests.
