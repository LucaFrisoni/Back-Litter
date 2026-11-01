#!/usr/bin/env bash
# Waits until the API serves the expected commit with a healthy database; fails otherwise.
set -u

url="$1"
sha="$2"
attempts="${3:-60}"
delay="${4:-15}"

for ((attempt = 1; attempt <= attempts; attempt++)); do
  body=$(curl --silent --fail --max-time 90 "$url/health" || true)
  if [[ "$body" == *"\"commit\":\"$sha\""* ]]; then
    echo "Commit $sha is live and healthy"
    exit 0
  fi
  echo "Attempt $attempt/$attempts: commit $sha is not live yet"
  sleep "$delay"
done

echo "::error::Commit $sha never went live. Render keeps serving the previous version; check its deploy logs."
exit 1
