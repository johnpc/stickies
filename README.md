<p align="center">
  <img src="assets/banner.png" alt="Stickies — a shared sticky pad at any URL" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/johnpc/stickies/actions/workflows/ci.yml"><img src="https://github.com/johnpc/stickies/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" />
</p>

# Stickies

**A shared sticky-note pad at any URL.** Visit `stickies.jpc.io/<room>` and you land on a pad that
anyone with that link can read and edit — post text, paste links, share quick notes. **No account, no
setup.** Play instantly as a guest.

A room is just an identifier in the URL. It doesn't have to exist first — visiting `.../grocery-list`
_is_ creating it. Share the link and everyone sees the same stickies, live, as they're added and
edited.

## How it works

1. **Pick any URL.** Add a room name after the address, like `/grocery-list`.
2. **Post stickies.** Jot a note or paste a link — it's saved instantly and shows up for everyone.
3. **Share the link.** Anyone with the same URL sees and edits the same pad, live.

The home page (no room in the URL) explains this and lists the **~10 most-recently-edited rooms** so
you can jump into whatever's active. You can also just **type a room name** in the box to jump in.

### Sharing & deep links

Every room has a **share button** in its header that copies the room URL to your clipboard. Because
rooms are **Universal Links (iOS) / App Links (Android)**, tapping a shared `stickies.jpc.io/<room>`
link **opens the installed app straight to that room** — and falls back to loading normally in the
browser if the app isn't installed. Same link, works everywhere.

## Sticky types

| Type      | Status | Notes                                                                     |
| --------- | ------ | ------------------------------------------------------------------------- |
| Text      | ✅     | Plain note; multi-line.                                                   |
| Link      | ✅     | Auto-detected from a pasted URL; rendered as a **safe** link.             |
| Code      | ✅     | Wrap in a ` ``` ` fence (` ```ts `) — syntax highlighting + line numbers. |
| Image     | ✅     | Upload — inline image preview.                                            |
| PDF/Video | ✅     | Upload — in-browser PDF viewer / video player.                            |
| Doc       | ✅     | Upload a text/code file — highlighted preview with expand + copy-all.     |
| File      | ✅     | Upload anything else (zip, binaries…) — a generic download card.          |

## Where the data lives

There's no AI or ingestion here — the content is whatever people type or upload. Every sticky and
every room's recents entry is stored in **DynamoDB via AWS AppSync**, and uploaded files (images,
PDFs, videos, anything) go to **S3** — all written directly by the **guest Cognito identity** (no
login). Real-time sync uses Amplify's `observeQuery` subscription, so an edit on one device appears on
every other device viewing the same room URL within moments.

> **Security model:** a room is protected only by the obscurity of its URL — anyone with the link can
> read and edit it. That's intentional for a frictionless quick-share pad. Don't put secrets in a room.

## Install

- **As a PWA:** open the site and use your browser's _Install app_ / _Add to Home Screen_.
- **iOS (TestFlight):** _link coming once the first build is live._

## Architecture

- **Ionic 8 + React 19 + TypeScript (strict) + Vite + Capacitor** on the client.
- **AWS Amplify Gen2** backend: Cognito guest identity pool + AppSync (GraphQL) + DynamoDB.
- Two models: `Sticky` (one note, partitioned by room) and `Room` (a lazily-upserted recents index
  sharing a constant partition so the home feed is a single sorted query).
- Vertical-slice code organization with a strict quality gate: no `any`, ≤100 lines/logic file, ≥80%
  coverage, CRAP ≤15, Gherkin acceptance tests via Playwright — all enforced by husky + CI.

## Development

```bash
npm install
npx ampx sandbox        # stand up a personal cloud backend (writes amplify_outputs.json)
npm run seed            # seed a few demo rooms
npm run dev             # http://localhost:5173
npm run quality         # the full local gate
npm run test:e2e        # Gherkin acceptance tests
```

See [CLAUDE.md](./CLAUDE.md) for the full project charter, conventions, and decisions.
