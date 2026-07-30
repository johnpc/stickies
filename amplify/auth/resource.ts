import { defineAuth } from '@aws-amplify/backend';

/**
 * Stickies is GUEST-FIRST: no account is needed to open a room, read, or edit
 * stickies (the room URL is the only key). Cognito still provisions a guest
 * identity pool so unauthenticated requests get scoped IAM credentials.
 *
 * The `editors` group exists only so there's a signed-in identity available for
 * tooling/tests (the Cognito test user); it grants no extra content privileges —
 * stickies are guest-editable by design.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['editors'],
});
