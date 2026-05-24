# TASK 28 - Repeat Respawn Endstone

- **Status:** `[x] complete`
- **Owner:** Agent / 2026-05-24
- **Scope:** Add Endstone-backed regression coverage for consecutive player respawns.
- **Owned files:** `repos/prismarine-bedrock/src/builtins/setup.js`, `repos/prismarine-bedrock/test/live/respawn.test.js`, `repos/prismarine-bedrock-ai/test/recorded-bds/scenarios/repeat-respawn.json`, `docs/tasks/TASK-28-repeat-respawn-endstone.md`
- **Related docs:** `AGENTS.md`, `test/recorded-bds/README.md`

## Goal

Catch the packet-handling regression where a Bedrock client/bot does not successfully respawn after repeated deaths. Success means the bot can be killed and server-confirmed revived three times in one live Endstone session, and a real-client recorded-BDS scenario exists for packet capture of the same repeated respawn flow.

## Non-Goals

- Do not fix the respawn packet handler in this task unless explicitly requested after the regression is captured.
- Do not move raw e2e logs or packet recordings into the base library.

## Current Plan

- `[x]` Add a focused base-library live test for three consecutive respawns.
- `[x]` Add a recorded-BDS scenario for human packet capture of three respawns.
- `[x]` Run focused Endstone live test first.
- `[x]` Investigate/fix respawn packet handling in `src/builtins/setup.js` after confirming expected packet shape from human trace.

## Current State

- Worktree state: base repo has changed `src/builtins/setup.js` and new `test/live/respawn.test.js`; AI lab has new `test/recorded-bds/scenarios/repeat-respawn.json`, this task log, and `scripts/query-packet-db.js` dirty with event-query support.
- Already implemented: live regression test, scenario JSON, human `repeat-respawn` recording, and a handler fix matching the human packet order.
- In progress: none.
- Not started: optional Java/Geyser cross-target respawn run.
- Known mismatch between notes and worktree: none known.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `repos/prismarine-bedrock/test/live/respawn.test.js` | added | Focused live Mocha regression that kills the bot three times and requires `death_info`, outbound respawn packets, and `set_health > 0` after each death. |
| `repos/prismarine-bedrock/src/builtins/setup.js` | changed | Implements human-matched death respawn ordering: send client `respawn state=2`, then send `player_action respawn` after server ready `respawn state=1`; clears per-death handshake state when health/spawn confirms revival. |
| `repos/prismarine-bedrock-ai/test/recorded-bds/scenarios/repeat-respawn.json` | added | Endstone scenario that kills the real client three times and waits for `PlayerRespawnEvent` after the player presses Respawn each time. |
| `docs/tasks/TASK-28-repeat-respawn-endstone.md` | added | Durable evidence and handoff log for this respawn investigation. |
| `repos/prismarine-bedrock-ai/scripts/query-packet-db.js` | changed | Adds `--events` support for listing indexed recording events; AI static suite passes. |

## Evidence Log

- `2026-05-24` - `node --check test/live/respawn.test.js` from `repos/prismarine-bedrock` - PASS.
- `2026-05-24` - `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('test/recorded-bds/scenarios/repeat-respawn.json','utf8')); console.log('repeat-respawn scenario json ok')"` from `repos/prismarine-bedrock-ai` - PASS.
- `2026-05-24` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=240000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/respawn.test.js` - FAIL. Server: Endstone 0.11.3 / BDS 1.26.12.2. Result: `0 passing, 1 failing`; timeout waiting for `server-confirmed revive for respawn cycle 1`. The trace showed `death_info`, outbound `respawn(state=1 ack)`, fallback `respawn(state=2)`, then another server `respawn` state `0` and state `1` pair, but no `set_health > 0` before timeout.
- `2026-05-24` - exploratory handler reruns after replacing state `1` echo with `player_action(respawn)` - FAIL. Raw runs: `.e2e-servers/runs/2026-05-24T21-38-10-199Z`, `.e2e-servers/runs/2026-05-24T21-39-29-997Z`, `.e2e-servers/runs/2026-05-24T21-40-43-069Z`, `.e2e-servers/runs/2026-05-24T21-41-55-299Z`. Notes: `player_action(respawn)` was emitted, but Endstone did not advance to server-confirmed health before timeout. These edits are not a verified fix.
- `2026-05-24` - `node scripts/recorded-bds-gym.js record-human --scenario=repeat-respawn` - PASS. Human run: `logs/recorded-bds/repeat-respawn/human/2026-05-24T21-43-08-237Z/packets.jsonl`; indexed SQLite: `logs/recorded-bds/repeat-respawn/human/2026-05-24T21-43-08-237Z/packets.sqlite`. Result: scenario complete after three death-screen respawns; index reported 805 packets and 52 events.
- `2026-05-24` - human respawn packet trace query - PASS. Command used direct SQLite projection over packet ids `36`, `42`, `45`, and `189`. Per death cycle the real client/server flow is: server `death_info`; server `respawn state=0` with runtime `0`; client `respawn state=2` with position `{0,0,0}` and runtime `1`; server `respawn state=0`; server `respawn state=1`; client `player_action action=respawn` with position/result `{0,0,0}`, face `-1`, runtime `1`; server `set_health health=20`. This repeated for all three cycles at sequences `614-641`, `682-708`, and `748-773`.
- `2026-05-24` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=240000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/respawn.test.js` - PASS. Server: Endstone 0.11.3 / BDS 1.26.12.2. Result: `1 passing`; bot survived three consecutive `/kill` cycles and received `set_health health=20` after each respawn. Raw run: `.e2e-servers/runs/2026-05-24T21-48-54-448Z`.
- `2026-05-24` - `pnpm run test:static` from `repos/prismarine-bedrock` - PASS. Result: `344 passing`.
- `2026-05-24` - `pnpm run test:static` from `repos/prismarine-bedrock-ai` - PASS. Result: `35 passing`.

## Architecture Notes

- The test intentionally treats `set_health > 0` as the server-confirmed revive signal. Queuing a local respawn packet is not enough evidence that BDS accepted the respawn.
- The scenario uses delayed step-start `kill {player}` commands so the death occurs after the step marker is written and packet/event evidence stays step-bounded.
- Human Bedrock does not request death-screen respawn by sending `player_action(respawn)` first. It first sends `respawn state=2` after the server's first `respawn state=0`, then sends `player_action(respawn)` after the server sends the ready `respawn state=1`.

## Handoff

No handoff required for the Endstone repeat-respawn regression. Optional follow-up: run the same focused respawn test through the Java/Geyser target if cross-target coverage is desired.

## Resume Notes

- Next step: optional Java/Geyser live check for `test/live/respawn.test.js`.
- Do not repeat: the human scenario and Endstone focused bot run already pass.
- Raw logs: `.e2e-servers/runs/2026-05-24T21-34-13-559Z`, `.e2e-servers/runs/2026-05-24T21-38-10-199Z`, `.e2e-servers/runs/2026-05-24T21-39-29-997Z`, `.e2e-servers/runs/2026-05-24T21-40-43-069Z`, `.e2e-servers/runs/2026-05-24T21-41-55-299Z`, `.e2e-servers/runs/2026-05-24T21-43-13-529Z`, `.e2e-servers/runs/2026-05-24T21-48-54-448Z`

## Final Summary

- Result: Endstone repeat respawn fixed and covered by a focused live regression plus human packet evidence.
- Files changed: `src/builtins/setup.js`, `test/live/respawn.test.js`, `test/recorded-bds/scenarios/repeat-respawn.json`, `docs/tasks/TASK-28-repeat-respawn-endstone.md`, `scripts/query-packet-db.js`.
- Verification: Endstone focused live test passed (`1 passing`), base static passed (`344 passing`), AI static passed (`35 passing`).
- Follow-up tasks: optional Java/Geyser live check for the same focused respawn test.

## Failure Summary

- Stopping reason:
- Last known good state:
- Last failure:
- Suspected cause:
- Required next decision or resource:

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes, if applicable. Not needed; this only reorders existing packet types and fields.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
