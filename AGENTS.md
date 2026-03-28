# AI Agent Guide for RDP-Connector

Welcome, fellow AI agent! This guide provides a quick overview of the `rdp-connector` project to help you navigate and contribute efficiently.

## Project Overview

- **Name:** `rdp-connector`
- **Purpose:** A Tauri-based application designed to wrap the usage of `*.rdpx` files with `freerdp`. It specifically targets Azure Virtual Desktop (AVD) usage from Linux, handling the OAuth login flow.
- **Key Features:**
  - Manage multiple RDP configurations (Add, Clone, Delete).
  - Initiate RDP connections using `freerdp`.
  - "Jump to RDP" to focus active FreeRDP windows.
  - Custom `freerdp` build scripts for static linking on Linux.

## Tech Stack

- **Frontend:** [Vue.js 3](https://vuejs.org/) with [Vuetify 3](https://vuetifyjs.com/) (using Vite).
- **Backend:** [Tauri](https://tauri.app/) (Rust).
- **Styling:** SASS/SCSS.
- **Testing:** [Vitest](https://vitest.dev/).
- **Documentation:** [VitePress](https://vitepress.dev/).
- **Containerization:** Docker (used for building `freerdp`).

## Project Structure

- `src/`: Vue frontend source code.
  - `components/`: Vue components.
  - `pages/`: Application pages.
  - `store/`: Pinia state management (for RDP settings).
- `src-tauri/`: Rust backend source code.
  - `src/main.rs`: Tauri entry point and commands.
  - `tauri.conf.json`: Tauri configuration.
- `docs/`: VitePress documentation.
  - `index.md`: Main documentation page (copied from `README.md`).
  - `.vitepress/`: VitePress configuration and theme.
- `freerdp/`: Scripts and Dockerfile for building a portable `freerdp` binary.
- `assets/`: Global assets like logos and screenshots.

## Development Workflow

### Prerequisites
- Node.js (npm).
- Rust and Tauri dependencies (see [Tauri Prerequisites](https://tauri.app/start/prerequisites/)).
- `xdotool` (required for the "Jump to RDP" / `focus_rdp` feature on Linux).
- Docker (optional, for custom `freerdp` builds).

### Common Commands
- `npm i`: Install dependencies.
- `npm run tauri:dev`: Run the app in development mode.
- `npm run tauri:build`: Build the production application.
- `npm run lint`: Run ESLint.
- `npx vitest run`: Run tests with Vitest.
- `npm run docs:dev`: Start VitePress dev server.
- `npm run docs:build`: Build static documentation.
- `npm run freerdp:build`: Run the `freerdp` build script (requires Docker).

## Implementation Details

### RDP Settings Management
The application manages RDP profiles which are saved locally. The frontend uses Pinia for state management and likely interacts with Tauri's `plugin-store` for persistence.

### OAuth Window Management
The application includes specialized Tauri commands to manage an OAuth login window (`open_oauth_window`, `read_oauth_url`, `close_oauth_window`). This is used to handle the AVD authentication flow by intercepting URLs in a dedicated webview.

### FreeRDP Interaction
The backend (Rust) manages `freerdp` processes using a Pseudo-Terminal (PTY). This allows the application to capture output and potentially interact with the RDP process (e.g., for password prompts or logging).
Key backend commands in `src-tauri/src/lib.rs` and `src-tauri/src/advanced_commands.rs` include:
- `start_pty`: Initiates the `freerdp` process within a PTY.
- `send_pty_input`: Sends input to the running PTY process.
- `stop_pty`: Terminates the RDP process.
- `focus_rdp`: Attempts to focus the existing FreeRDP window.

## Guidelines for AI Agents

1. **Frontend Consistency:** The frontend uses Vuetify 3. When adding new UI elements, prefer existing Vuetify components and patterns.
2. **Backend Commands:** New backend functionality should be exposed via Tauri commands in `src-tauri/src/main.rs` and called from the frontend.
3. **Documentation:** The `docs/index.md` and `docs/changelog.md` are often synchronized from the root `README.md` and `CHANGELOG.md` via `npm run docs:prepare`. Update the root files first.
4. **Error Handling:** Pay attention to how the app handles `freerdp` binary paths and library dependencies, as these are common points of failure on different Linux distributions.
5. **VitePress Customization:** Documentation theme customizations are located in `docs/.vitepress/theme/index.mts`.
6. **Napkin Skill:** AI agents are advised to use the napkin skill located at `.claude/skills/napkin/SKILL.md` for improving their interaction with the codebase.
7. **Verify Guideline Obedience:** AI agents must print `WobbelDudum` to the console before starting any work to verify they have read these instructions until the end.

8. Happy coding!
