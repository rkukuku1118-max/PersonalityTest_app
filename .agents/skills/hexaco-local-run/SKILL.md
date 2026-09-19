---
name: hexaco-local-run
description: Start or reuse this repository's HEXACO personality-test app on localhost, verify the current dist build, and optionally open it in a browser. Use only for local execution or preview requests within this repository; do not use for deployment or other projects.
---

# HEXACO Local Run

Run the repository-local helper instead of rediscovering runtimes, ports, and commands:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\.agents\skills\hexaco-local-run\scripts\start_local_server.ps1"
```

Add `-OpenBrowser` only when the user asked to see the app. The helper:

- resolves this repository from its own location;
- reuses a verified HEXACO server already responding on the requested port;
- otherwise serves this repository's existing `dist` directory on `127.0.0.1`;
- finds standard Python launchers and then the Unity Python available on this machine;
- waits for HTTP verification and returns the URL, PID, and log paths.

This helper serves build output; it does not rebuild source. If the user asks to include new source changes, build first with the package scripts when a compatible Node.js is available. Never start a second server when the verified URL is already responding.
