# Browser Native Orchestrator Mobile PWA

This is the mobile browser version designed to run in Brave Mobile as a web app.

## What it does
- Build and manage app projects
- Generate source drafts and manifests
- Export a handoff ZIP
- Simulate install/run behavior in the built-in virtual device lab
- Save state in browser storage
- Work offline once cached by the service worker

## What it does not do
- It does not install a true Android APK on your phone
- It does not replace Android Studio for native compilation
- It does not load as a desktop extension on mobile Brave

## Install path on Brave Mobile
1. Host this folder on a website with HTTPS.
2. Open the site in Brave Mobile.
3. Use the browser menu to add it to the home screen or install it as a web app if the browser offers the option.
4. Open it from the home screen like a normal app.

## Files
- `index.html`
- `app.js`
- `styles.css`
- `manifest.webmanifest`
- `sw.js`
- `assets/icon-192.png`
- `assets/icon-512.png`

## Notes
The web app includes its own project builder, export flow, and virtual device lab so you can keep using it from a phone.