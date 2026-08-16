# 300 DAYS WITH YOU — Clean Rebuild

Private digital relationship archive for **시현 & 강원**.

This branch is a clean rebuild. It intentionally does **not** load the old V24–V40 patch stack.

## Architecture

- `index.html` — stable app shell only
- `assets/app.js` — one router/action layer + view renderers
- `assets/app-data.js` — chronology and feature configuration
- `assets/app-store.js` — one Firebase/shared-data adapter with legacy key compatibility
- `assets/app.css` — mobile-first scrapbook/editorial design system
- `sw.js` + `manifest.webmanifest` — PWA shell

## Core routes

- `#/home`
- `#/days`
- `#/diary`
- `#/special`
- `#/future`
- `#/special/<feature>`

All date cards enter the same `openMemory(date)` flow. All main navigation enters the same route system. There are no versioned click hotfix layers.

## Preserved legacy shared keys

The rebuild intentionally reads/writes the existing Firebase `memories` collection keys where practical:

- `photos:<date>`
- `hero:<date>`
- `fav:<date>`
- `checkin:<date>:<user>`
- `dailyline:<date>:<user>`
- `gratitude:<date>:<user>`
- `qanswer:<date>:<user>`
- `identitypin:<user>`
- `photometa:<date>:<photo-id>`
- `comebackplaces`
- `futurebucket:v26`
- `futureletters:v26`

## Photo rule

Real photographs are source assets. The UI uses `object-fit: contain` for archive/detail views and never generates substitute people or fills empty slots with AI imagery. Uploads send the original browser `File` bytes to Firebase Storage. If Storage is unavailable, only small original files can fall back to Firestore as an unmodified Data URL; large originals are rejected rather than recompressed or altered.

## Important PWA note

The in-browser daily reminder and partner watcher work while the web app is running. Reliable notifications while the app is fully closed require a true push backend (for example Firebase Cloud Messaging + server/Cloud Functions), which is intentionally not faked in this static rebuild.
