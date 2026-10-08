#!/bin/sh
# Run the keeper every 10 minutes on this Mac with launchd.
#
#   scripts/launchd.sh install     write the agent and start it
#   scripts/launchd.sh uninstall   stop it and remove the agent
#   scripts/launchd.sh status      is it loaded, and the last lines of the log
#
# launchd does not wake a sleeping Mac. To have it awake for the 00:05 UTC verdict, schedule a daily wake
# five minutes earlier in your local time, for example in Lagos (UTC+1):
#   sudo pmset repeat wakeorpoweron MTWRFSU 01:00:00
set -eu
LABEL="fun.shiporburn.keeper"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
TICK="$(cd "$(dirname "$0")" && pwd)/tick.sh"
LOG="$HOME/Library/Logs/shiporburn-keeper.log"
DOMAIN="gui/$(id -u)"

case "${1:-}" in
  install)
    mkdir -p "$HOME/Library/LaunchAgents"
    cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/sh</string><string>$TICK</string></array>
  <key>StartInterval</key><integer>600</integer>
  <key>RunAtLoad</key><true/>
  <key>ProcessType</key><string>Background</string>
</dict>
</plist>
PLIST
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    launchctl bootstrap "$DOMAIN" "$PLIST"
    echo "installed: $PLIST"
    echo "log: $LOG"
    ;;
  uninstall)
    launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "removed"
    ;;
  status)
    launchctl print "$DOMAIN/$LABEL" 2>/dev/null | grep -E "state =|last exit code|run interval" || echo "not loaded"
    [ -f "$LOG" ] && tail -n 12 "$LOG"
    ;;
  *)
    echo "usage: $0 install | uninstall | status" >&2
    exit 1
    ;;
esac
