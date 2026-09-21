Shift Pay HQ v9.10.3r DEV

DEV Cache Reliability Fix

Built directly from v9.10.3q Row Identity Mapper. Scanner, rota, pay, payroll calendar and navigation logic are preserved.

DEV /test reliability changes:
- /test no longer registers a service worker.
- any existing /test service-worker registrations are unregistered on load.
- old Shift Pay HQ Cache Storage entries are cleared on load.
- sw.js is a network-only cleanup worker for any browser that still checks the old registration.
- index.html is never cached by the worker.
- badge and header both identify v9.10.3r.

This intentionally sacrifices offline PWA caching only in the DEV /test route so each scanner build can be tested reliably. The live root PWA is untouched.
