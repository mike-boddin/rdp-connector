### Code Review — Unstaged changes (Teams feature flag, CI matrix, frontend gating)

**Date:** 2026-04-29  
**Reviewer:** Junie (AI)  
**Files reviewed:**
- `.github/workflows/build.yml`
- `.junie/plans/make-teams-feature-optional-via-build-flags-and-offer-different-release-types.md`
- `CHANGELOG.md`
- `README.md`
- `src-tauri/Cargo.toml`
- `src-tauri/src/lib.rs`
- `src/App.vue`

---

### Summary

This change set introduces a compile-time `teams` feature flag to the Rust backend, runtime feature detection for the frontend, and CI matrix builds to produce "full" (with Teams) and "lite" (without Teams) variants. Overall, the approach is solid: feature-gated Rust commands, a simple `get_features` query for the UI, and conditional rendering/invocation in Vue. Main concerns are around Rust error handling (multiple `unwrap()` calls that could panic) and a potential injection risk in `open_oauth_window` where a URL is interpolated into `window.eval()`.

---

### Findings

#### 🔴 Critical

Nothing to report.

#### 🟠 Major

- [src-tauri/src/lib.rs:64] `window.eval(&format!("window.location.replace('{}')", url));` uses string interpolation into JavaScript code. If `url` contains quotes or malicious payload, this could enable code injection.  
  Suggestion: Avoid `eval` interpolation. Prefer using a neutral API: e.g., send a typed command to the webview to call `window.location.replace(url)` without string formatting, or at least escape/sanitize the URL (e.g., JSON-encode it: `format!("window.location.replace({})", serde_json::to_string(&url).unwrap())`).

- [src-tauri/src/lib.rs:81, 87, 101, 111, 118, 137] Multiple `unwrap()` calls (`builder.build().unwrap()`, `emit(...).unwrap()`, `w.close().unwrap()`, `w.url().unwrap()`, `.run(...).expect(...)`). These can panic the entire app on recoverable errors (e.g., webview close race).  
  Suggestion: Return `Result<_, String>` from Tauri commands and propagate errors instead of panicking. For event emission and window ops, handle errors gracefully (log and continue, or send a failure event to the UI).

#### 🟡 Minor

- [src-tauri/src/lib.rs:119] The opener plugin is always initialized: `.plugin(tauri_plugin_opener::init())`. The actual use (via `app.opener()`) is gated behind the `teams` feature. This is harmless but slightly unnecessary when building the lite variant.  
  Suggestion: Consider gating the plugin init under `#[cfg(feature = "teams")]` as well to reduce footprint.

- [src-tauri/Cargo.toml] `features.default = ["teams"]` keeps local DX consistent, and CI uses `--no-default-features` for the lite build. This is fine; document in `README.md` how to explicitly opt-in/out during local builds.  
  Suggestion: Add a short "Build variants" section with the exact commands used in CI.

- [src/App.vue] Uses `ref` and `onMounted` without explicit imports. Given `unplugin-auto-import` is configured to import from `vue` in `vite.config.mts`, this is acceptable.  
  Suggestion: None, but ensure ESLint/TS are happy (auto-generated `src/auto-imports.d.ts` kept up-to-date).

- [src/App.vue] `openTeams()` defensively checks `activeFeatures` again even though the button is conditionally rendered. It’s a good guard; alternatively, you could rely solely on the conditional render to avoid double checks.  
  Suggestion: Keep as-is for safety.

- [.github/workflows/build.yml] Matrix builds for `full` vs `lite` correctly pass `--features teams` vs `--no-default-features`. Ensure artifact names are unique per variant and release packaging collects both.  
  Suggestion: Verify upload-artifact names and release upload steps include variant suffixes consistently.

- Documentation (README/CHANGELOG) appears updated to reflect variants.  
  Suggestion: Add a brief note that the Teams button is hidden entirely in lite builds and the backend command is not registered.

#### 🟢 Positive observations

- Clean feature gating in Rust using `#[cfg(feature = "teams")]` for constants, function, and `generate_handler!` registration.
- Simple and effective runtime feature detection via `get_features()` returning a string list — future-proof for more flags.
- Frontend conditionally renders the Teams button and also guards the invocation method.
- CI matrix approach is straightforward and keeps default local behavior intact.

---

### Recommended next steps

1. Replace `eval` string interpolation with a safe mechanism (JSON-encoded string or a non-eval API) to set `window.location`.
2. Audit and refactor `unwrap()`/`expect()` calls in Tauri commands and window/event code to return `Result` and avoid panics.
3. Optionally gate `tauri_plugin_opener::init()` behind the `teams` feature to minimize lite build surface.
4. Double-check CI artifact naming and release upload steps to ensure both variants are clearly distinguishable and published.
5. Extend README with a concise section on building variants locally (with/without Teams).

---

### Checklist

| Dimension | Status |
|---|---|
| Correctness & Logic | ✅ |
| Error Handling | ⚠️ |
| Security | ⚠️ |
| Performance / Resource Management | ✅ |
| Code Style & Conventions | ✅ |
| Test Coverage | ⚠️ |
| Documentation | ✅ |
| Dependency / Config Hygiene | ✅ |