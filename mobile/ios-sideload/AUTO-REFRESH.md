# Automatic Suncola renewal on Windows

Sideloadly handles renewal locally with a free Apple ID. The GitHub build produces
the IPA; it does not sign the app with your account or communicate with your phone.

1. Install Suncola with Sideloadly and enable its automatic refresh option before
   starting. The app is enrolled after installation succeeds.
2. In the Sideloadly Daemon menu, enable launch on startup. After restarting Windows,
   check the daemon is running in the notification area.
3. For wireless renewal, connect your iPhone once by USB, unlock it and trust the
   PC. In iTunes choose the device → Summary → Options → Sync with this iPhone over
   Wi-Fi, then Sync/Done. Keep the PC and phone on the same network. USB also works.
4. Keep the PC powered on and logged in regularly, with the daemon running and
   internet available. Ensure the phone is detected; unlock it if necessary.
5. After the first automatic renewal, check the daemon reports a successful refresh
   and Suncola still opens. Resolve any authentication or connection notifications.

Free signing still expires after seven days. Renewal cannot complete while the
PC is off or the phone is unavailable. If a profile expires, reconnect and sign
the same IPA with the same Apple ID and bundle ID. Business data remains on the
existing Suncola server; keep the same signing identity for local app continuity.

No Apple ID password or device pairing record belongs in GitHub or this package.
Enter credentials and complete verification only in Sideloadly on your own PC.
This setup has not been installed or tested on your physical PC/iPhone here.

Official references:
- https://sideloadly.io/faq.html
- https://sideloadly.io/changelog.html
