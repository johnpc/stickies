import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { linkPreview } from '../linkpreview/resource';

/**
 * STICKIES data schema.
 *
 * The whole app is GUEST-FIRST and unauthenticated by design (see CLAUDE.md):
 * a "room" is just an identifier in a URL, never a pre-created entity. Anyone
 * who knows the room name can read AND write its stickies. So both models grant
 * guest full CRUD (plus the authenticated providers for parity); there is no
 * owner scoping and no editor gate on content.
 *
 * Two models:
 *  - Sticky: one note on a room's pad. Partitioned by `room` for the pad read
 *    (all stickies in a room). `kind` is TEXT or LINK (files/images are a later
 *    slice — don't model ahead of a UI).
 *  - Room: a lazily-upserted RECENTS INDEX row, one per room that's ever been
 *    touched. It's NOT required for a room to work (stickies stand alone); it
 *    exists only so the home page can list the ~10 most-recently-edited rooms.
 *    Every row shares a constant `listKey` so a single GSI query sorted by
 *    `lastEditedAt` returns the global recents feed. The row id IS the room slug
 *    so touches are idempotent upserts.
 */
const schema = a.schema({
  Sticky: a
    .model({
      room: a.string().required(), // the room slug this sticky belongs to
      kind: a.enum(['TEXT', 'LINK', 'CODE', 'IMAGE', 'PDF', 'VIDEO', 'DOC', 'FILE']),
      content: a.string().required(), // text/URL/code, OR the S3 key for media kinds
      color: a.string(), // palette token name, e.g. "yellow" | "pink" | "blue"
      ord: a.float(), // manual pad order (fractional so a drop between two rows needs no reindex)
      language: a.string(), // CODE: detected/selected language hint for highlighting
      fileName: a.string(), // media kinds: original filename (download label + type sniff)
      mimeType: a.string(), // media kinds: uploaded content type
      authorLabel: a.string(), // optional friendly attribution ("someone")
    })
    // Pad read path: every sticky in a room (sorted client-side by updatedAt).
    .secondaryIndexes((index) => [index('room')])
    .authorization((allow) => [
      allow.guest().to(['read', 'create', 'update', 'delete']),
      allow.authenticated('identityPool').to(['read', 'create', 'update', 'delete']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  Room: a
    .model({
      slug: a.string().required(), // the room name as it appears in the URL
      listKey: a.string().required(), // constant partition ("ALL") for the recents GSI
      stickyCount: a.integer().default(0),
      lastEditedAt: a.datetime().required(),
    })
    // Recents read path: newest-edited rooms first, across all rooms.
    .secondaryIndexes((index) => [index('listKey').sortKeys(['lastEditedAt'])])
    .authorization((allow) => [
      allow.guest().to(['read', 'create', 'update', 'delete']),
      allow.authenticated('identityPool').to(['read', 'create', 'update', 'delete']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  // Ephemeral presence: one row per (room, session) that a client heartbeats
  // while viewing a room, so the header can show "N people here". The row id is
  // the sessionId so heartbeats are idempotent upserts; `heartbeatAt` lets the
  // client ignore stale rows (a tab that closed without cleanup). Partitioned by
  // `room` for the per-room observeQuery. Guest-writable like everything else.
  Presence: a
    .model({
      room: a.string().required(),
      heartbeatAt: a.datetime().required(),
    })
    .secondaryIndexes((index) => [index('room')])
    .authorization((allow) => [
      allow.guest().to(['read', 'create', 'update', 'delete']),
      allow.authenticated('identityPool').to(['read', 'create', 'update', 'delete']),
      allow.authenticated().to(['read', 'create', 'update', 'delete']),
    ]),

  // Guest-callable OpenGraph link preview: fetches a user-supplied URL server-side
  // (browsers can't — CORS) and returns its title/description/image/siteName for a
  // LINK sticky's preview card. The handler guards against SSRF (blocks non-public
  // hosts) and fails soft (nulls) so a bad/unreachable URL just yields no preview.
  linkPreview: a
    .query()
    .arguments({ url: a.string().required() })
    .returns(
      a.customType({
        title: a.string(),
        description: a.string(),
        image: a.string(),
        siteName: a.string(),
      }),
    )
    .authorization((allow) => [allow.guest(), allow.authenticated()])
    .handler(a.handler.function(linkPreview)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});
