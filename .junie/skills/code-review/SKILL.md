---
name: code-review
description: >
  Perform a structured code review and write the
  results to a Markdown file under `.junie/reviews/`. Use this skill when the
  user asks for a code review, a review of a file or module, a PR review, or
  asks to "review" any source file in the project. Also triggers on phrases like
  "check my code", "what do you think of this file", "find issues in", or
  "audit this". The skill covers Rust (Tauri backend), TypeScript/Vue 3
  (Vuetify frontend), shell scripts, CI workflow files, and configuration files.
  Always produces a saved Markdown report in addition to any inline commentary.
---
 
## Purpose
 
Produce a clear, actionable code-review report for the **rdp-connector**
Tauri/Vue application and save it as a Markdown file so both human reviewers
and AI coding assistants (Claude, Junie) can reference it later.
 
---
 
## Step 0 — Read the file(s) to review
 
Before writing a single comment, read every file that is in scope.  
Use the `view` tool (or `Filesystem:read_file` when working on the user's
machine) to load each file.  Do **not** rely on the contents already visible
in the conversation — always fetch fresh.
 
If the user names a directory (e.g. `src/stores/` or `src-tauri/src/`), list
and read all relevant source files inside it.
 
---
 
## Step 1 — Determine the output file path
 
Reviews are written to:
 
```
.junie/reviews/<YYYY-MM-DD>-<slug>.md
```
 
Where:
 
- `<YYYY-MM-DD>` is today's date.
- `<slug>` is a short kebab-case label derived from the scope of the review,
  e.g. `rdp-connection-store`, `advanced-commands`, `build-workflow`, or
  `full-project`.
Examples:
 
```
.junie/reviews/2025-07-04-rdp-connection-store.md
.junie/reviews/2025-07-04-advanced-commands-rs.md
.junie/reviews/2025-07-04-full-project.md
```
 
Create the `.junie/reviews/` directory if it does not exist.
 
---
 
## Step 2 — Run the review
 
Evaluate the code across the dimensions below.  
Not every dimension applies to every file — skip dimensions that are
irrelevant and say so briefly in the report.
 
### 2.1 Correctness & Logic
 
- Does the code do what it claims?  Look for off-by-one errors, wrong
  conditions, incorrect state transitions, and silent failures.
- For Rust: are `unwrap()` / `expect()` calls appropriate, or should they be
  propagated as `Result`?
- For Vue stores (Pinia): are reactive state mutations safe?  Is async state
  correctly awaited?
- For shell scripts: are paths quoted?  Are edge cases (spaces in filenames,
  missing binaries) handled?
### 2.2 Error Handling & Resilience
 
- Are errors surfaced to the user or silently swallowed?
- In Rust `#[tauri::command]` functions: do they return `Result<_, String>`
  consistently?
- In TypeScript: are `invoke()` calls wrapped in `try/catch`?  Are errors
  logged via `logStore`?
- In CI workflows: are failure modes (missing secrets, network errors) handled
  with sensible defaults?
### 2.3 Security
 
- Is user-supplied input validated before being passed to subprocesses
  (e.g. `program` / `args` in `start_pty`)?
- Are OAuth redirect URLs sanitised before being injected into `window.location`
  via `eval`?
- Are sensitive values (tokens, redirect URLs with `code=`) excluded from logs
  via `suppressLogsWith`?
- Is the Tauri CSP (`csp: null`) acceptable, or should it be tightened?
### 2.4 Performance & Resource Management
 
- Are PTY readers / writers properly cleaned up on `stop_pty`?
- Are Tauri event listeners (`listen`) unsubscribed when components are
  destroyed?
- Are polling intervals (`setInterval`) cleared in all exit paths?
- Are large structures cloned unnecessarily (use `structuredClone` only when
  needed)?
### 2.5 Code Style & Conventions
 
Check against the patterns already established in the project:
 
| Layer | Conventions |
|---|---|
| Rust | `snake_case`, explicit `Result` returns, `Arc<Mutex<…>>` for shared state |
| TypeScript | `camelCase`, Pinia `defineStore` with `actions`, no raw `console.log` (use `log()` from `logger.ts`) |
| Vue SFC | `<script setup lang="ts">` on top, `<template>` below, `<style scoped lang="sass">` last |
| CSS/SASS | Scoped styles, Vuetify utility classes preferred over custom CSS |
| Shell | `set -euo pipefail`, quoted variables, `SCRIPT_DIR=$(dirname "$0")` pattern |
 
Flag deviations clearly.
 
### 2.6 Test Coverage
 
- Are new actions / getters in Pinia stores covered by Vitest specs?
- Are Tauri commands testable?  If not, note the gap.
- Are edge cases (empty config, process already running, OAuth window closed
  unexpectedly) represented in tests?
### 2.7 Documentation & Maintainability
 
- Are non-obvious behaviours explained with inline comments?
- Are public Rust functions and TypeScript store actions documented well enough
  for another developer to use them without reading the implementation?
- Is the `CHANGELOG.md` or `RELEASE_NOTES.md` likely to need an update?
### 2.8 Dependency & Configuration Hygiene
 
- Are new Cargo or npm dependencies justified?
- Is `Cargo.lock` / `package-lock.json` consistent with `Cargo.toml` /
  `package.json`?
- Are GitHub Actions pinned to specific versions (preferred) or floating tags?
- Does `tauri.conf.json` declare only the bundle targets and capabilities that
  are actually used?
---
 
## Step 3 — Write the Markdown report
 
Use the template below.  Fill every section; write "Nothing to report." for
sections with no findings.
 
```markdown
# Code Review — <scope>
 
**Date:** YYYY-MM-DD  
**Reviewer:** Claude (AI)  
**Files reviewed:**
- `path/to/file1`
- `path/to/file2`
 
---
 
## Summary
 
One short paragraph describing the overall quality and the single most
important finding.
 
---
 
## Findings
 
### 🔴 Critical
 
Issues that must be fixed before merging / releasing.
 
- **[File: line]** Description of the problem.  
  _Suggestion:_ How to fix it.
 
### 🟠 Major
 
Issues that are likely to cause bugs or security problems in production.
 
- **[File: line]** Description.  
  _Suggestion:_ …
 
### 🟡 Minor
 
Style violations, missing tests, documentation gaps, small inefficiencies.
 
- **[File: line]** Description.  
  _Suggestion:_ …
 
### 🟢 Positive observations
 
Things done well — worth calling out so they are repeated.
 
- …
 
---
 
## Recommended next steps
 
Ordered list of the top 3–5 actions the author should take.
 
1. …
2. …
3. …
 
---
 
## Checklist
 
| Dimension | Status |
|---|---|
| Correctness & Logic | ✅ / ⚠️ / ❌ |
| Error Handling | ✅ / ⚠️ / ❌ |
| Security | ✅ / ⚠️ / ❌ |
| Performance / Resource Management | ✅ / ⚠️ / ❌ |
| Code Style & Conventions | ✅ / ⚠️ / ❌ |
| Test Coverage | ✅ / ⚠️ / ❌ |
| Documentation | ✅ / ⚠️ / ❌ |
| Dependency / Config Hygiene | ✅ / ⚠️ / ❌ |
```
 
Legend: ✅ No issues found · ⚠️ Minor issues · ❌ Critical or major issues.
 
---
 
## Step 4 — Save the file
 
Write the completed report to `.junie/reviews/<YYYY-MM-DD>-<slug>.md` using
`Filesystem:write_file` (when operating on the user's machine) or
`create_file` (when operating in the container).
 
After saving, confirm the path to the user and give a 2–3 sentence verbal
summary of the most important findings.
 
---
 
## Step 5 — Optional: inline discussion
 
If the user wants to discuss a specific finding in more detail, do so
conversationally.  Do **not** re-run the full review; reference the saved
report instead.
 
---
 
## Project-specific context
 
Keep the following in mind throughout every review:
 
- **Architecture:** Tauri v2 desktop app — Rust backend, Vue 3 / Vuetify 4
  frontend, Pinia stores, `@tauri-apps/api` IPC bridge.
- **FreeRDP integration:** `xfreerdp` is launched as a subprocess via
  `portable-pty` (not linked as a library).  PTY output is streamed to the
  frontend as `pty-output` events.
- **OAuth flow:** The backend opens a child webview window and polls its URL
  for an `?code=` parameter, then forwards it to the PTY via stdin.  This
  polling loop must always be cleaned up.
- **Bundle targets:** DEB, RPM, AppImage.  `resource_dir()` is the canonical
  way to locate bundled binaries at runtime.
- **State management:** All shared Rust state lives in
  `Arc<Mutex<PtyState>>`.  All Vue state lives in Pinia stores; no component
  local state for business logic.
- **Logging:** Frontend uses `log()` from `src/types/logger.ts` (gated on
  `VITE_CONSOLE_LOGGING_ENABLED`); user-visible output goes through
  `logStore`.  Never call `console.log` directly.
- **Tests:** Vitest with `jsdom`; Tauri APIs are mocked with `vi.mock`.
  Rust code is not unit-tested yet — note gaps but do not flag as critical
  unless there is a bug risk.
- **No FFI rewrite:** The subprocess approach is intentional; do not suggest
  switching to FreeRDP library FFI.