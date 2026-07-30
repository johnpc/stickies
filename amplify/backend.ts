import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

/**
 * STICKIES backend.
 *
 * Guest-first auth + a two-model data layer (Sticky + Room recents index) + an
 * S3 bucket for uploaded media (image/file stickies) under `rooms/*`. A media
 * sticky stores its S3 key in `content`; the client resolves it via getUrl().
 * All model writes go through AppSync under the guest identity; uploads go to S3
 * under the same guest identity.
 */
defineBackend({
  auth,
  data,
  storage,
});
