# DSH | dsh-plugin-idle-new-session | Auto-start a fresh session after a real gap

If you close the tab/PWA and come back hours later, DSH reopens whatever session you left open - which usually means picking up a stale, possibly unrelated conversation instead of a clean start. This plugin starts a brand-new session automatically when the app is opened (page load, or a backgrounded tab/PWA coming back to the foreground) 30+ minutes after the last time it was opened.

## How it works

Purely client-side and stateless on the host: it timestamps every "app opened" moment in `localStorage`, and if the gap since the last one is 30 minutes or more, it triggers a new session the same way clicking "New Session" would. A quick reopen (switching apps, a short break) does nothing - you land back exactly where you left off, same as today.

**"Client-side" here means it runs in the browser, on any device - desktop or mobile, not mobile-only.** "Host" is DSH's own backend/server process; "client" is the web page (Chrome on a laptop counts exactly the same as a phone browser or an installed PWA). Page load and tab/PWA-foreground are just the two moments a desktop browser tab and a mobile PWA each expose for "the app was just opened" - the same 30-minute-gap check applies identically either way.

## How it integrates with DSH

A pure client-side patch (`src/client.js`, no build step). The host half is a no-op - it exists only so DSH's own plugin-discovery scan finds and serves the client bundle.

## Install

```sh
dsh plugin --profile web add @gz2016/dsh-plugin-idle-new-session
```

No configuration - the 30-minute threshold is fixed today.

---
*Unofficial project, independently developed and maintained by a community member. Not affiliated with or endorsed by DeepSeek.*
