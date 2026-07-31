import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';
import { type Bucket } from 'aws-cdk-lib/aws-s3';
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
const backend = defineBackend({
  auth,
  data,
  storage,
});

/**
 * Reap orphaned media objects. Deleting a media sticky removes ONLY its DynamoDB
 * row (so the delete stays undoable — restoreSticky re-creates the row pointing
 * at the retained object); nothing ever deletes the S3 object. On a world-
 * writable pad that leaks storage without bound (a griefing/cost vector). An S3
 * lifecycle rule expires objects 30 days after creation — vastly longer than the
 * seconds-long undo window, so a live/undoable sticky's object is never affected,
 * but a truly-orphaned object is eventually cleaned up. Also aborts stuck
 * multipart uploads. (CDK escape hatch: defineStorage has no lifecycle option.)
 */
(backend.storage.resources.bucket as Bucket).addLifecycleRule({
  id: 'expire-media-objects',
  enabled: true,
  expiration: Duration.days(30),
  abortIncompleteMultipartUploadAfter: Duration.days(1),
});
