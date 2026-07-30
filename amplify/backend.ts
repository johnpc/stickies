import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * STICKIES backend.
 *
 * Deliberately minimal: guest-first auth + a two-model data layer (Sticky +
 * Room recents index). No Lambdas, no media pipeline yet — file/image stickies
 * are a later slice and will add a storage resource then (don't model ahead of
 * a UI). All content writes go through AppSync under the guest identity.
 */
defineBackend({
  auth,
  data,
});
