#!/bin/sh
# One keeper tick, for a timer on a Mac: runs settle once and appends to a log.
# Installed by scripts/launchd.sh; safe to run by hand.
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd "$(dirname "$0")/.." || exit 1

LOG="${KEEPER_LOG:-$HOME/Library/Logs/shiporburn-keeper.log}"
# keep the log small: start over past 1 MB
if [ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 1048576 ]; then : > "$LOG"; fi

{
  echo "--- $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  # caffeinate keeps the Mac awake until the tick finishes
  caffeinate -i ../../node_modules/.bin/tsx --env-file-if-exists=.env src/settle.ts 2>&1
  echo "exit $?"
} >> "$LOG" 2>&1
