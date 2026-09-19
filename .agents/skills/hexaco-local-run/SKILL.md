---
name: hexaco-local-run
description: Start or reuse this repository's HEXACO personality-test app on localhost, verify the current dist build, and optionally open it in a browser. Use only for local execution or preview requests within this repository; do not use for deployment or other projects.
---

# HEXACO Local Run

Run the repository-local helper instead of rediscovering runtimes, ports, and commands:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\.agents\skills\hexaco-local-run\scripts\start_local_server.ps1"
```

Add `-OpenBrowser` only when the user asked to see the app. When the user explicitly authorizes deleting this app origin's saved browser data, use `-ClearBrowserData`; it opens a one-time cleanup endpoint that deletes HTTP cache and origin storage, then redirects to the stable app URL. Do not use that switch merely to refresh a build.

The helper:

- resolves this repository from its own location;
- always returns the stable URL `http://127.0.0.1:<port>/` without a cache-busting query;
- reuses a server only when it returns the current build's asset references with `Cache-Control: no-store` and `Clear-Site-Data: "cache"`;
- otherwise serves this repository's existing `dist` directory with browser caching disabled and instructs the browser to remove prior HTTP cache data;
- preserves local storage during ordinary runs; only the explicit `-ClearBrowserData` flow deletes diagnosis history and saved drafts;
- finds standard Python launchers and then the Unity Python available on this machine;
- waits for HTTP verification and returns the URL, PID, and log paths.

HTTP cache removal is a required invariant for every run, not an optional recovery step. Always use the bundled no-cache server; never fall back to `python -m http.server` or another server that permits caching. Before reporting the app as ready, verify the stable URL returns all three of the following:

- the current `dist/index.html` asset references;
- `Cache-Control` containing `no-store`;
- `Clear-Site-Data` containing `cache`.

If any check fails, do not provide the URL as ready. Resolve the stale server and rerun the helper. Ordinary cache removal must preserve local storage; use `-ClearBrowserData` only with explicit authorization because it also deletes diagnosis history and saved drafts.

This helper serves build output; it does not rebuild source. If the user asks to include new source changes, build first with the package scripts when a compatible Node.js is available. Never start a second server when the verified URL is already responding. If the port is occupied by a stale or unrelated server, stop only the verified owning process before retrying; do not treat an arbitrary HEXACO page as current.
