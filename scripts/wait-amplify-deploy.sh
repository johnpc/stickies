#!/usr/bin/env bash
# Wait until the Amplify Hosting branch deployment is idle before reading its
# outputs. Every push to main starts an Amplify build (frontend + backend
# CloudFormation deploy) at the same moment as this repo's CI, and
# `ampx generate outputs` refuses with DeploymentInProgressError while that
# deploy runs (main CI failed this way on 2026-11-07: Amplify job 136 ran
# 22:31-22:35 UTC, CI read the outputs at 22:33). On a push to main we also wait
# for THIS commit's Amplify job, so the tests run against the backend they ship.
set -euo pipefail

APP_ID="${AMPLIFY_APP_ID:-d24w01u3ylemi2}"
BRANCH="${AMPLIFY_BRANCH:-main}"
PROFILE="${AWS_PROFILE_NAME:-personal}"
REGION="${AWS_REGION_NAME:-us-west-2}"
APPEAR_LIMIT_S="${AMPLIFY_APPEAR_LIMIT_S:-180}"
IDLE_LIMIT_S="${AMPLIFY_IDLE_LIMIT_S:-1800}"
POLL_S=15

jobs() {
  aws amplify list-jobs --app-id "$APP_ID" --branch-name "$BRANCH" \
    --max-items 10 --profile "$PROFILE" --region "$REGION" \
    --query "jobSummaries[].[jobId,status,commitId]" --output text
}

if [[ "${GITHUB_EVENT_NAME:-}" == "push" && "${GITHUB_REF:-}" == "refs/heads/$BRANCH" ]]; then
  waited=0
  until jobs | awk -v sha="$GITHUB_SHA" '$3 == sha { found = 1 } END { exit !found }'; do
    if (( waited >= APPEAR_LIMIT_S )); then
      echo "No Amplify job for $GITHUB_SHA after ${APPEAR_LIMIT_S}s; continuing against the current backend."
      break
    fi
    sleep "$POLL_S"; waited=$((waited + POLL_S))
  done
fi

waited=0
while busy=$(jobs | awk '$2 == "PENDING" || $2 == "PROVISIONING" || $2 == "RUNNING" || $2 == "CANCELLING" { print "job " $1 " (" $2 ", " $3 ")" }') && [[ -n "$busy" ]]; do
  if (( waited >= IDLE_LIMIT_S )); then
    echo "Amplify $BRANCH still deploying after ${IDLE_LIMIT_S}s: $busy" >&2
    exit 1
  fi
  echo "Waiting for Amplify $BRANCH deploy to finish: $busy"
  sleep "$POLL_S"; waited=$((waited + POLL_S))
done
echo "Amplify $BRANCH has no deployment in progress."
