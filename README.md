# Browser Native Orchestrator Mobile PWA

This is the mobile browser version designed to run in Brave Mobile as a web app.

## What it does
- Build and manage app projects
- Generate source drafts and manifests
- Run a multi-stage browser-native compiler flow
- Export a real ZIP bundle of the workspace and project outputs
- Simulate install/run behavior in the built-in virtual device lab
- Save state in browser storage
- Work offline once cached by the service worker

## Current buttons
- **Generate draft** creates a new app shell from the current prompt
- **Run compiler** runs the staged planner → architect → builder → critic → tester → packager → runner flow
- **Install** simulates installing the compiled app into the virtual device
- **Run** launches the app preview on the virtual device
- **Export ZIP** downloads a real bundle of the workspace and project files
- **Save** stores the current state locally in the browser

## Install path on Brave Mobile
1. Open the GitHub Pages site in Brave Mobile.
2. Use the browser menu to add it to the home screen or install it as a web app if the browser offers the option.
3. Open it from the home screen like a normal app.

## Files
- `index.html`
- `app.js`
- `styles.css`
- `manifest.webmanifest`
- `sw.js`
- `icon-192.png`
- `icon-512.png`

## Notes
The app now has a real compiler pipeline, a functional virtual device lab, local persistence, and a ZIP export that includes both the workspace and generated project files. The current build also uses root-level icons so export and install stay aligned with the repository layout.

## Final upload check
Upload the extracted contents from this folder into the GitHub repository root and remove any old ZIP archives left in the repo.
