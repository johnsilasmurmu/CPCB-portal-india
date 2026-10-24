# CPCB Industry Inspection Portal – Textile

A mobile/tablet-first, offline-capable web application for CPCB / SPCB inspection officers to fill the
**Textile Industry Inspection Format 2025-26 (Water Quality Management-II)** during site visits.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production bundle in dist/
npm run preview    # serve the production build (service worker active)
```

On first use, register an officer account on the device (name, designation, official email, password
of at least 8 characters). The password hashes officer credentials with PBKDF2-SHA-256 and derives the
AES-GCM key used to encrypt sensitive fields such as OCEMS portal credentials.

## What is included

- **Home** – official header, Start New Inspection / Resume Draft, recent inspections, search by unit
  code / name / city, per-draft completion and compliance.
- **Sections A–J, ETP, Photographs, Documents, Review & Export**, each as its own route, with a
  section progress bar, required-field validation, autosave and Save / Previous / Next controls.
- **Calculations** – GSM, freshwater KLD totals, KL/MT, effluent discharge, BOD load, ETP retention
  time, IS 10500:2012 groundwater comparison, water-balance check.
- **Compliance colour coding** – automatic Comply / Non-comply against editable norms for effluent,
  treated sewage and groundwater parameters.
- **Repeatable tables** with add/delete for water sources, machines, chemicals, dyes, ETP units,
  hazardous waste, fuel, chimneys, DG sets and the inspection team.
- **Photographs** – 13 labelled slots with camera capture, compression, caption, timestamp and GPS tag.
  Images are stored in IndexedDB so they survive reloads offline.
- **Documents checklist** – 23 records (consents, 9 logbooks, 9 other documents) with status, attachment
  name and remarks.
- **Exports** – the full official format as PDF (jsPDF) and Word (docx), including photographs,
  compliance verdicts and a list of fields still pending.
- **Offline** – installable PWA; the production build registers a service worker that caches the app
  shell. Drafts autosave to the device and changes are queued by a sync queue that flushes when the
  browser is back online.

## Storage model

| Data | Where |
| --- | --- |
| Drafts, officer account, encrypted OCEMS vault, sync queue | `localStorage` |
| Photographs (JPEG data URLs) | IndexedDB (`cpcb-textile-photos`) |

There is no remote server in this build: drafts stay on the device and the sync queue checkpoint is
local. To connect a backend, POST the entries in `flushSyncQueue()` (`src/lib/storage.js`) to your API
before clearing the queue, and keep authentication/authorisation on the server.

## Project layout

```
src/
  components/   Layout, PageShell, UI kit
  lib/          calc, defaults, sections, storage, crypto, report, export
  pages/        Login, Home and one page per format section
  state/        AppState provider (auth, drafts, autosave, vault, sync)
public/         manifest.webmanifest, sw.js, favicon
```

## Notes

- A sample inspection (`TXT-2025-014`) is seeded on first launch so the dashboard, review and export
  can be explored immediately. Delete it from the home screen before official use.
- The GSM calculator uses the formula specified in the format:
  `GSM = PW × 39.37 × 1000 ÷ (PL × FW)`.
- Norms are prefilled with the general textile standards and can be edited per inspection to match the
  unit's consent conditions.
