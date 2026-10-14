# Suncola iPhone app — Windows sideloading

This standalone launcher loads https://suncola.hyperoms.xyz/ and includes the
native BLE, file sharing and splash plugins. It contains no backend source,
customer records or account credentials. Sign in to Suncola after installation.
Internet access and BLE-capable printer firmware are required for those functions.

The GitHub workflow builds a real ARM64 iPhone app with Xcode 26 and packages an
**unsigned IPA**. It requires no Apple signing certificate or paid developer
membership to compile. The IPA must then be signed locally with your own free
Apple ID using Sideloadly or AltStore Classic before it can run on your phone.
It is not an App Store/TestFlight build, and not a simulator app.

## Windows installation with Sideloadly

1. Download Sideloadly from https://sideloadly.io/ and follow its current Windows
   requirements for Apple iTunes/iCloud drivers.
2. Connect your iPhone to the PC by USB. Unlock it and trust the PC if asked.
3. Open Sideloadly, select your iPhone, and drag the Suncola IPA into it.
4. Sign in with your own free Apple ID in Sideloadly on your PC. Complete Apple's
   verification prompts there. Do not send account passwords or codes in chat.
5. Start installation, then follow the iPhone's trust/Developer Mode prompts if
   shown. Open Suncola and use your existing ERP account.
6. Enable Sideloadly's automatic refresh. Keep its daemon available with your
   iPhone connected by USB or set up Wi-Fi sideloading on the same network.

Free Apple ID signing expires after seven days. Automatic refresh requires a
working PC/device connection; it does not remove Apple's expiry. Free accounts
also have app limits. Read the tool's current requirements before installation.

For AltStore Classic on Windows, use:
https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows

## Local macOS build

Install Node 22+ and Xcode 26. Run `bash build-unsigned-ios.sh` from this directory.
Output: `out/Suncola-iOS-1.1.0-sideload.ipa`. The script rejects simulator builds
and checks the compiled app has an ARM64 executable before creating the archive.

The native printer path requests Bluetooth only when Connect printer is pressed.
Some PT-210 firmware is Classic-only; that hardware is not made BLE by sideloading.
Physical phone/printer pairing and bill output still need a device acceptance test.

Primary references:
- https://sideloadly.io/faq.html
- https://developer.apple.com/help/account/basics/about-your-developer-account/
- https://github.com/actions/runner-images/blob/main/images/macos/macos-15-Readme.md
