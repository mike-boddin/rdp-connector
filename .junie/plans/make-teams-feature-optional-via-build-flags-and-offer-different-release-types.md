---
sessionId: session-260429-040423-14wy
isActive: true
---

# Requirements

### Overview & Goals
The goal is to make the MS Teams shortcut button an optional feature that can be included or excluded at build time. This allows producing different release artifacts (e.g., a "full" version with Teams and a "lite" version without it), satisfying requirements where some users or organizations might want a minimal footprint.

### Scope
- **In Scope**:
  - Implementation of a Cargo feature flag `teams` in the Rust backend.
  - Compile-time gating of Teams-specific code (constants, commands, and registration).
  - Runtime feature detection in the Vue frontend via a new `get_features` command.
  - CI/CD pipeline updates to automate the creation of multiple release variants.
  - Updating `CHANGELOG.md` and `README.md` with information about the new build flavors.
- **Out of Scope**:
  - Adding a runtime settings toggle for the Teams button (the goal is build-time exclusion).
  - Modifying the Teams integration logic itself.


# Technical Design

### Current Implementation
- **Backend**: `TEAMS_URL` and `open_teams_window` are permanently defined in `src-tauri/src/lib.rs` and registered in the `invoke_handler!`.
- **Frontend**: The Teams button is hardcoded in the `App.vue` app bar.
- **CI**: A single build process produces one set of artifacts.

### Proposed Changes

#### Backend (Rust)
- **`src-tauri/Cargo.toml`**:
  - Define a `teams` feature.
  - Set `teams` as a member of the `default` features to maintain backward compatibility for local development.
- **`src-tauri/src/lib.rs`**:
  - Add `#[tauri::command] fn get_features() -> Vec<String>` which returns `["teams"]` if the feature is enabled using `#[cfg(feature = "teams")]`.
  - Apply `#[cfg(feature = "teams")]` to the `TEAMS_URL` constant and `open_teams_window` command.
  - Conditionally register `open_teams_window` in the `invoke_handler!` using `tauri::generate_handler!`.

#### Frontend (Vue)
- **`src/App.vue`**:
  - Fetch available features from the backend during the `onMounted` hook using `invoke('get_features')`.
  - Use a reactive variable `activeFeatures` (ref) to store the results.
  - Apply `v-if="activeFeatures.includes('teams')"` to the Teams button in the `<v-app-bar>` template.

#### CI/CD (GitHub Actions)
- **`.github/workflows/build.yml`**:
  - Implement a `strategy/matrix` with `variant: [full, lite]`.
  - For the `full` variant, run `npm run tauri build -- --features teams`.
  - For the `lite` variant, run `npm run tauri build -- --no-default-features`.
  - Rename generated binaries and bundles to include the variant suffix (e.g., `rdp-connector-${{ matrix.variant }}-${{ github.ref_name }}.tar.gz`).
  - Update the `release` job to correctly collect all artifacts from the matrix build.

#### Documentation & Changelog
- **`CHANGELOG.md`**: Add entry for the new optional Teams feature and multiple release variants.
- **`README.md`**: Add instructions on how to build the "full" and "lite" versions locally using the new feature flag.

### Key Decisions
- **Option C (Feature Flag + Capability Query)**: We chose this approach because it provides true compile-time gating (no dead code in the lite binary) while maintaining a single source of truth in the Rust backend. The frontend remains decoupled from build-time environment variables and dynamically adapts to whatever the backend supports.

### File Structure
- `src-tauri/Cargo.toml` (Modified)
- `src-tauri/src/lib.rs` (Modified)
- `src/App.vue` (Modified)
- `.github/workflows/build.yml` (Modified)
- `CHANGELOG.md` (Modified)
- `README.md` (Modified)


# Delivery Steps

###   Step 1: Implement Backend Feature Gating
Add the `teams` feature to the Rust backend and gate Teams-specific code.

- Modify `src-tauri/Cargo.toml` to include the `teams` feature in `[features]` and add it to `default`.
- Implement the `get_features` Tauri command in `src-tauri/src/lib.rs` that returns a `Vec<String>` containing `"teams"` if enabled.
- Gate `TEAMS_URL`, `open_teams_window`, and its registration in the invoke handler with `#[cfg(feature = "teams")]`.
- Register the new `get_features` command in the `tauri::generate_handler!`.

###   Step 2: Implement Frontend Capability Detection
Update the frontend to dynamically detect and show/hide the Teams feature.

- Add `const activeFeatures = ref<string[]>([])` to the `<script setup>` in `src/App.vue`.
- Update `onMounted` to call `invoke('get_features')` and assign the result to `activeFeatures.value`.
- Use `v-if="activeFeatures.includes('teams')"` to conditionally render the Teams button in the app bar.
- Add a check in `openTeams` function to ensure it doesn't try to invoke the missing command if somehow called.

###   Step 3: Configure CI/CD Matrix Builds and Artifact Naming
Update the GitHub Actions workflow to produce multiple release variants.

- Modify `.github/workflows/build.yml` to use a `strategy/matrix` with `variant: [full, lite]`.
- Update the build step: `npm run tauri build -- --features teams` for `full` and `npm run tauri build -- --no-default-features` for `lite`.
- Add a renaming step to add the `-${{ matrix.variant }}` suffix to the tar.gz binary and bundles.
- Ensure `upload-artifact` uses unique names for each variant's results to avoid collisions.
- Update the `release` job to download and include all variant artifacts in the GitHub Release.

###   Step 4: Update Documentation and Changelog
Document the new build-time options and update the project history.

- Add a new entry to `CHANGELOG.md` describing the optional Teams feature and the split into "full" and "lite" releases.
- Update `README.md` with instructions for building different variants using the `--features teams` flag.
- Run `npm run docs:prepare` to synchronize the changes to the `docs/` folder.