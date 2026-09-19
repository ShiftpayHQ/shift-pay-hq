SHIFT PAY HQ v9.1 — iPhone Polished PWA

This is the installable-web-app version of the v8 prototype.

IMPORTANT:
Opening index.html directly from a downloaded ZIP is useful for desktop testing,
but iPhone installation/offline caching requires these files to be served over HTTPS.

IPHONE INSTALL:
1. Host the entire ShiftPayHQ_v9_PWA folder on an HTTPS web host.
2. Open the hosted index page in Safari on the iPhone.
3. Tap Share.
4. Tap Add to Home Screen.
5. Tap Add.
6. Launch Shift Pay HQ from the Home Screen.

The app includes a service worker for offline use after the first successful hosted load,
a web-app manifest, iPhone home-screen metadata, icons, and JSON backup/restore.

Keep backups: Safari/site data can be cleared by the user or system, so local browser storage
should not be the only long-term copy of important rota/payroll information.

V9.1 POLISH
- Better iPhone safe-area handling around Dynamic Island/home indicator.
- Larger, more reliable touch targets.
- Improved small-screen grid behaviour.
- Improved calendar density and bottom-tab scrolling.
- Better portrait/landscape handling.
- Prevents unwanted iOS text resizing/tap highlighting.
