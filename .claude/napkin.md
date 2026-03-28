
# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-03-11] Build FreeRDP before building the app**
   Do instead: Run `npm run freerdp:build` to ensure native libraries are available before starting development or building the Tauri app.

## Shell & Command Reliability
1. **[2026-03-11] Use `npm run tauri dev` for local testing**
   Do instead: Always use the Tauri CLI via npm scripts to ensure the correct development environment is set up.

## Domain Behavior Guardrails
1. **[2026-03-11] Handle RDP connection states**
   Do instead: Monitor logs and handle disconnection events in the frontend to provide a better user experience for remote desktop sessions.

## User Directives
1. **[2026-03-11] Use the Napkin skill**
   Do instead: Read, apply, and curate `.claude/napkin.md` at the start of every session to maintain high-signal project-specific knowledge.
