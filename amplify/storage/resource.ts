import { defineStorage } from '@aws-amplify/backend';

/**
 * S3 storage for uploaded sticky media (images + files) under `rooms/*`.
 *
 * Stickies is fully guest, so — like the data models — GUESTS get read + write +
 * delete here (a room is world-editable; the URL is the only key). A sticky
 * stores the S3 key in its `content`; the client resolves it to a URL via
 * getUrl() for previews/downloads. Keys are namespaced by room slug
 * (`rooms/<slug>/<id>-<filename>`) so a room's media is grouped.
 */
export const storage = defineStorage({
  name: 'stickiesMedia',
  access: (allow) => ({
    'rooms/*': [
      allow.guest.to(['read', 'write', 'delete']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
  }),
});
