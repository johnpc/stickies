/**
 * linkPreview resolver — guest-callable custom query that fetches a user-supplied
 * URL server-side and extracts its OpenGraph/meta preview (title, description,
 * image, siteName). Browsers can't do this (CORS), so a small Lambda does. Thin
 * + fast (single outbound fetch, capped); SSRF-guarded in the handler.
 */
import { defineFunction } from '@aws-amplify/backend';

export const linkPreview = defineFunction({
  name: 'link-preview',
  entry: './handler.ts',
  timeoutSeconds: 10,
  memoryMB: 256,
  // Custom-query resolver → data stack (avoids the data<->function nested-stack
  // circular dependency CloudFormation rejects).
  resourceGroupName: 'data',
});
