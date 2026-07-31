# Stickies

**Stickies is a shared sticky-note pad at any URL.** Visit `stickies.jpc.io/<room>` and you're on a
pad anyone with that link can read and edit — post text, paste links, share quick notes. A "room" is
just an identifier in the URL; it doesn't have to exist first, visiting it _is_ creating it. The home
page (no room in the URL) explains how it works and lists the ~10 most-recently-edited rooms to jump
into.

Architecture, quality bar, and toolchain descend from the **spork** app (`~/repo/spork`) — when a
pattern is unclear here, that's the reference implementation.

## How we work together (read this first)

The person directing you may be **non-technical** — an "idea guy" who owns the **product**. They
define **WHAT**: features, intent, and Gherkin acceptance scenarios. **You own the HOW**:
architecture, code quality, testing, and every technical decision below.

- **Never ask them to make a technical call.** Don't surface coverage numbers, CRAP, lint,
  file-length, library choices, or schema design as questions. Decide them yourself, silently.
- **Translate vague ideas into Gherkin.** When they describe a feature, propose concrete `.feature`
  scenarios (Given/When/Then) and confirm those — that's the spec you build to.
- **Only escalate genuine _product_ questions** — ambiguous behavior, scope, copy, what a screen does.

## Workflow: specs-first vertical slices

Every feature ships as one **thin vertical slice** — UI + hook + API + backend model + tests, just
enough for the scenario, nothing speculative.

1. **Spec first.** Write/confirm Gherkin scenarios in `e2e/features/<slice>/*.feature`, steps in
   `e2e/steps/`.
2. **Scaffold backend only as the slice needs it** — add Amplify models + seed in `amplify/` for
   exactly this slice's read patterns; don't model ahead of a UI.
3. **Implement to pass the spec** — follow the architecture and file conventions below.
4. **Run the full quality gate** (`npm run quality`) and get it green locally.
5. **Deploy + seed** the backend if it changed (`npx ampx sandbox`, `npm run seed`).
6. **Conventional commit, push, CI green.** Open a PR; CI blocks the merge.

### PR titles (what shipped, not the backstory)

`type(scope): what changed`, from the reader's POV. No phase numbers, no issue-number soup (reference
issues in the body with `Closes #N`). Good: `feat(room): paste a link and it becomes a safe tappable
sticky`.

### PR demo artifacts (screenshot or video of the new feature)

Any PR that changes something a user can see or interact with MUST include a screenshot or short video
in the description, generated from the slice's own Gherkin test (Playwright records `.webm` with
`VIDEO=1`). Upload to `files.jpc.io` and paste the permanent `/d/` URL — `.webm`/`.mp4`/`.png`/`.gif`
render inline in the PR body. A `curl -I` returning a 307 is expected; the `/d/` link never expires.
All `aws` calls use **`AWS_PROFILE=personal`**; never inline keys.

```bash
FILE_PATH="test-results/<…>/video.webm"
FILENAME=$(basename "$FILE_PATH")
HASH=$(LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 5)
AWS_PROFILE=personal aws s3 cp "$FILE_PATH" \
  "s3://amplify-d1wnjkkkrwiiql-mai-imagehostbucketaac3bfe7-aark0f5h8nw8/public/public/${HASH}-${FILENAME}" \
  --region us-west-2
echo "https://files.jpc.io/d/${HASH}-${FILENAME}"
```

## Stack

- **Client:** Ionic 8 + React 19 + TypeScript (strict), Vite, Capacitor (iOS/Android).
- **Backend:** AWS Amplify Gen2 — Cognito (guest identity pool) + AppSync (GraphQL) + DynamoDB.
- **Real-time:** Amplify `observeQuery` wired into react-query's cache so everyone on the same room
  URL sees edits live.

## The core structure

Stickies is deliberately tiny — two routes, two models:

- **`/` (HomePage)** — the explainer + the "open a room" box + the recent-rooms feed.
- **`/:room` (RoomPage)** — the shared pad: a grid of sticky cards + a composer, kept live.
- **`Sticky`** — one note on a room's pad (`room`, `kind`, `content`, `color`, `ord`). Partitioned by
  `room`. Users can recolor a sticky (`ColorPicker` → `useStickyArrange.recolor`) and **drag to
  reorder** it via a grip handle. Reorder is **POINTER-based** (`useDragReorder` — pointerdown on the
  grip, pointermove hit-tests card rects → an insert GAP index, pointerup persists) so it works with
  BOTH mouse and touch (native HTML5 DnD was the original impl and did NOT work — esp. on touch — a
  real bug that shipped once; don't reintroduce it). A drop writes a fractional `ord` (`reorder.ts:
computeReorder`) so one move = one row, no reindex; an insertion LINE renders in the target gap (not
  a drop-on-card outline). **Every sticky gets an `ord` at creation** (append = existingCount) so
  ordering is one numeric scale. **CRITICAL:** `listStickiesByRoom` (the initial fetch) AND the live
  subscription BOTH sort via `sortStickies` (ord, then createdAt) — if the fetch sorts differently, a
  reload silently reverts the drag (this bug shipped once).
- **`Room`** — a lazily-upserted **recents index** row (one per room ever touched), all sharing a
  constant `listKey` partition so the home feed is one GSI query sorted by `lastEditedAt`. A room does
  NOT need a Room row to work — stickies stand alone; the row exists only to power the recents list.
- **`Presence`** — ephemeral "N people here" (`usePresence` → `PresenceBadge`). One row per (room,
  tab-session id); each tab heartbeats every 10s, an observeQuery streams the room's rows, and
  `countLivePresence` counts those fresh within a 30s TTL (so a closed tab drops out even if its
  `pagehide` delete didn't flush). Count is seeded/floored at 1 (YOU are here) so the badge shows
  instantly without waiting for the round-trip. **Rows can't grow unbounded:** a crashed/killed tab
  never runs cleanup, so any live viewer OPPORTUNISTICALLY reaps rows older than 2× TTL
  (`reapableIds` → `reapPresence`) from each observeQuery snapshot — self-healing, no scheduled Lambda.
  All best-effort — presence never breaks the pad.

### Guest-first (no account, ever)

**Stickies is fully guest.** No sign-in to open a room, read, or edit. The room URL is the only key —
"security by obscurity" is the intended model for a quick-share pad. Both models grant `allow.guest()`
full CRUD; there is no owner scoping and no editor gate on content. The `editors` Cognito group exists
only to provide a signed-in identity for tooling/tests; it grants no extra content rights.

### Amplify auth contract (client mode ↔ schema rule MUST match)

A request is authorized only when the **client `authMode`** and the model's **`allow.*` rule** name
the same provider. The data client (`src/lib/dataClient.ts`) uses **`identityPool`** (the guest role)
for everything. New read/write models MUST keep the `allow.guest()` grant or guest access silently
returns empty.

### Code organization (vertical slices)

Features live under `src/features/<feature>/` (`shell`, `home`, `room`); tests are colocated. File
conventions:

- **`useX.ts`** — hooks hold all logic/orchestration; client state via Context + Hook + Provider.
- **`xApi.ts`** — all server state through react-query wrapping the Amplify client (`stickiesApi`,
  `recentsApi`). No server fetches in components.
- **`X.tsx`** — components only render.
- **`x.ts`** helpers — pure, unit-testable functions (`roomSlug`, `safeHref`, `detectKind`, …).
- **`X.css`** — consume the `--sk-*` design tokens / role classes from `src/theme/variables.css`,
  never hardcoded hex/px.

### Link safety (non-negotiable)

A room is world-writable, so every LINK sticky's URL is attacker-controlled. **Every user-supplied
href MUST pass through `safeHref`** (`src/features/room/safeHref.ts`), which rejects
`javascript:`/`data:`/`vbscript:` schemes. Never render a raw user URL as an `<a href>`.

LINK stickies also render a rich **OpenGraph preview card** (`LinkSticky` → `useLinkPreview` → the
guest-callable `linkPreview` resolver, which scrapes the URL server-side since browsers can't — CORS).
The resolver is **SSRF-guarded** (`amplify/linkpreview/safeFetchUrl.ts` blocks non-http(s) and
private/link-local/metadata hosts) and **fails soft** (all-null → the client shows the plain link).

## Design

- **Style only via design tokens** — the `--sk-*` CSS variables + role classes (`.sk-heading`,
  `.sk-kicker`, `.sk-muted`) in `src/theme/variables.css`. Never hardcoded hex/px in feature CSS.
- **Light + dark** ship as token sets (system default) plus an explicit in-app Light/Dark/System
  toggle (`useTheme` sets `[data-theme]` on `<html>`, persisted to localStorage).
- **Safe-area**: `index.html` has `viewport-fit=cover`; the toolbar top-pad is hardened with `max()`.

## Quality gates (non-negotiable — CI + husky pre-commit enforce them)

Run `npm run quality`. **Enforce them yourself; when one fails, fix the code, never the gate.** Scope
covers `src/` and `amplify/` LOGIC; only declarative files are exempt (`amplify/**/resource.ts`,
`amplify/backend.ts`, `amplify/**/fixtures/**`, `amplify/seed/seed.ts`).

- **No `any`, ever** (ESLint `@typescript-eslint/no-explicit-any: error`).
- **Every `.ts`/`.tsx` logic file ≤ 100 lines** (`npm run check:lines`). Over → extract a helper.
- **≥ 80% coverage** on every logic file. Fix by writing tests — never exclusions.
- **CRAP ≤ 15 per function** (`npm run crap`).
- **Acceptance tests are Gherkin** (`.feature` + steps), run via Playwright + playwright-bdd. Every
  `.feature` dir must map to a CI matrix area (`npm run check:features`).
- **Build + Prettier clean.** **Determinism:** inject randomness/time into logic under test.

### Honest e2e

Every data-reading flow asserts on **rendered real (seeded/created) data**, not just a URL or element
visibility — a created sticky must actually appear, persist across a reload, and surface the room on
the home recents feed. Reads against the shared sandbox are eventually consistent; reload-poll (see
`room.steps.ts`) rather than asserting a single possibly-stale fetch.

## Definition of done

1. `npm run quality` green locally (pre-commit enforces it on commit).
2. Gherkin acceptance scenarios + colocated unit tests added and passing.
3. Backend deployed + seeded if any Amplify model changed.
4. Conventional commit, branch pushed, PR open, **CI green**.
5. PR description includes a demo artifact for any user-visible change.

## Commands

```bash
npm run dev            # Vite dev server on :5173
npm run quality        # full gate: lint + format + check:lines + check:features + coverage + crap + build
npm run test:e2e       # Gherkin acceptance tests (bddgen + Playwright)
npm run seed           # seed demo rooms into the sandbox (idempotent, guest writes)
npm run e2e-config     # pull amplify_outputs.json from the sandbox stack
npm run gen:icons      # regenerate app icons from assets/icon{,-dark}.png
npx ampx sandbox       # personal cloud backend sandbox
```

## Key facts

- **Repo:** `johnpc/stickies`. **Bundle id:** `com.johncorser.stickies` (ASC bundle-id id
  `DNWALP27JH`, created via API). Region `us-west-2`, AWS profile `personal`. Apple team `JW5SC3NYUV`.
- **iOS App Store record — created ✅** (manually in App Store Connect on 2026-07-30; public name
  "Stickies — a shared sticky pad at any URL", SKU `stickies`). Note for future apps: `POST /v1/apps`
  is forbidden via the ASC API (403 FORBIDDEN_ERROR — GET/UPDATE only), so the app record must be made
  by hand in ASC → My Apps → **+** (the bundle id appears in the dropdown once created via API).
- **Sandbox stack:** `amplify-stickies-xss-sandbox-d7f764fcf6` (wired into `package.json` `e2e-config`).
- **DNS:** `stickies.jpc.io` is a Cloudflare CNAME → `dkayuh63j40ch.cloudfront.net` (DNS-only, NOT
  proxied, so CloudFront/Amplify Hosting serves its own TLS). jpc.io zone
  `40035c6af46b0d10bafb6d7ae37de567`. Created 2026-07-30.
- **Universal / App Links.** A shared `https://stickies.jpc.io/<room>` opens the installed app
  (iOS Associated Domains entitlement + Android `autoVerify` intent-filter) or falls back to the
  browser. The app-side `useDeepLinks` hook routes `appUrlOpen` events to the room. Domain must serve
  `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` (shipped in `public/`).
  **TODO before Android App Links verify:** replace `REPLACE_WITH_SIGNING_CERT_SHA256` in
  `assetlinks.json` with the release/debug signing cert's SHA-256 (`keytool -list -v -keystore …`).
  **iOS AASA limitation:** Amplify Hosting force-redirects extension-less paths (301 → trailing
  slash), which the `apple-app-site-association` file has no extension to escape — so it resolves to
  index.html (`text/html`), and a `/.well-known/*` passthrough custom rule does NOT override that
  platform redirect. iOS universal-link _verification_ would fail until this is solved (options:
  serve AASA from a path with a rewrite that wins, or a CloudFront function). Not blocking today —
  links degrade to the browser and no TestFlight build is live. `assetlinks.json` (has an extension)
  serves fine at 200.
- **SPA rewrite (Amplify Hosting) — APPLIED to prod app `d24w01u3ylemi2` on 2026-07-30, and REQUIRED.**
  Amplify's default `{"/<*>" → "/index.html", "404-200"}` does NOT stop a fresh `/:room` deep link
  from 301→404 (it appends a trailing slash first) — so EVERY shared room link was broken on first
  load until fixed. The live custom-rules (console/API only, NOT in the repo — re-apply if
  re-provisioned) are: assetlinks passthrough + the regex SPA-200 rule
  `</^[^.]+$|\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|xml|webmanifest)$)([^.]+$)/>`
  → `/index.html` status `200`. Verify after any re-provision:
  `curl -so/dev/null -w '%{http_code}' https://stickies.jpc.io/some-room` → 200.
- **Backend config for builds = the sandbox STACK, not an Amplify-Hosting branch.** Both `e2e-config`
  and `prod-config` pull `amplify_outputs.json` via `ampx generate outputs --stack
amplify-stickies-xss-sandbox-d7f764fcf6` (override the stack with `STICKIES_STACK`). `prod-config`
  adds retry-on-`DeploymentInProgressError`. It used to use an `--app-id/--branch main` model with a
  literal `PROD_APP_ID_PLACEHOLDER`, which hard-failed `StackDoesNotExist` and broke the iOS/Android
  deploy workflows — don't reintroduce that.
- **CI:** `.github/workflows/ci.yml` (quality + seed + Gherkin acceptance matrix: `home`, `room`).
  `ios-deploy.yml` / `android-deploy.yml` publish after CI on `main`. Secrets: `AWS_ACCESS_KEY_ID`,
  `AWS_SECRET_ACCESS_KEY`, `TEST_USERNAME`, `TEST_PASSWORD`, `ASC_KEY_ID`, `ASC_ISSUER_ID`,
  `ASC_KEY_CONTENT`, `TEAM_ID`.

## Conventions

- **Conventional commits** (`feat:`, `fix:`, `chore:`, `ci:`, `docs:` …). Throwaway scripts go in
  `/tmp`, not the repo.

## Decisions

Significant, hard-to-reverse choices — read before re-opening a settled question.

- **Guest-only, URL-as-key.** No account to open/read/edit a room; the room URL is the only access
  control. Chosen for zero-friction quick sharing. Revisit only if private/locked rooms are wanted.
- **Editor commit: Enter = newline, not save.** `StickyEditor` treats Enter as a literal newline so
  multi-line notes work on mobile (soft keyboards have no Shift+Enter — Enter-to-save shipped once and
  made multi-line notes impossible on the primary platform). Commit paths: the **Save** button
  (`sticky-save`, fires on `onPointerDown` so it beats the textarea blur), **Cmd/Ctrl+Enter**, and
  **blur**. e2e steps commit via `press('ControlOrMeta+Enter')`. Escape cancels; blank commit
  cancels (composer) or deletes (edit, via `onEmpty`).
- **A room is not an entity.** Rooms aren't pre-created; the `Room` model is only a recents INDEX
  (lazily upserted on write), never a gate. Stickies work in any room whether or not a Room row exists.
- **Recents via a constant-partition GSI.** Every `Room` shares `listKey="ALL"` so "most recently
  edited across all rooms" is one indexed query, not a Scan.
- **Live via observeQuery → react-query cache.** The shared-pad realtime sync is an `observeQuery`
  subscription writing into the same query key the fetch seeds; mutations also invalidate that key as
  a belt-and-suspenders refresh.
- **Sticky kinds: TEXT, LINK, CODE + media (IMAGE, PDF, VIDEO, FILE).** Typed content is classified by
  `classifyContent` (a ` ``` ` fence → CODE with a language hint; else `detectKind` → LINK/TEXT).
  A CODE sticky stores its body fence-STRIPPED (+ a separate `language`), so **editing must seed the
  editor via `editableContent` (which re-wraps the fence)** — feeding the bare body back through
  `classifyContent` on save re-classifies it as plain TEXT and silently destroys the snippet (a real
  bug that shipped once; the edit round-trip is unit-tested).
  Uploads are classified by `mediaKind` (MIME/ext → IMAGE/PDF/VIDEO, else generic FILE) and stored in
  S3 under `rooms/<slug>/*`, with the sticky's `content` holding the S3 path. `StickyBody` routes
  rendering by kind — CODE → `CodeSticky` (highlight.js + gutter), DOC (uploaded text/code file) →
  `DocSticky` (fetches the S3 text, highlighted preview of the first lines + expand + copy-all +
  download), other media → `MediaSticky` (inline image/video/PDF preview, or a download card for
  opaque files). `mediaKind` returns DOC for text-ish MIME/extensions, FILE otherwise. `CodeSticky`,
  `DocSticky`, and `MediaSticky` are all `React.lazy` so text/link pads don't load highlight.js or the
  storage client at first paint.
- **S3 uploads use the Gen2 `path` API, NOT the legacy `key` API.** `uploadData/getUrl/remove` take
  `{ path: 'rooms/...' }`; the legacy `{ key }` form prepends `public/` and 403s against our `rooms/*`
  guest grant. Deleting a sticky removes ONLY the DynamoDB row, NOT the S3 object — so delete stays
  **undoable** (`restoreSticky` re-creates the row pointing at the retained object) and a "Sticky
  deleted · Undo" toast is offered. (Reaping truly-orphaned objects is a separate background concern.)
