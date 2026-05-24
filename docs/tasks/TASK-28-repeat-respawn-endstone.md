# TASK 28 - Repeat Respawn Endstone

- **Status:** `[x] complete`
- **Owner:** Agent / 2026-05-24
- **Scope:** Add Endstone-backed regression coverage for consecutive player respawns and split respawn handling into its own base-library builtin.
- **Owned files:** `repos/prismarine-bedrock/src/builtins/respawn.js`, `repos/prismarine-bedrock/src/builtins/setup.js`, `repos/prismarine-bedrock/src/plugin-loader.js`, `repos/prismarine-bedrock/test/live/respawn.test.js`, `repos/prismarine-bedrock/test/static/respawn.test.js`, `repos/prismarine-bedrock-ai/test/recorded-bds/scenarios/repeat-respawn.json`, `docs/tasks/TASK-28-repeat-respawn-endstone.md`
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
- `[x]` Investigate/fix respawn packet handling after confirming expected packet shape from human trace.
- `[x]` Move respawn lifecycle handling from `setup.js` into a dedicated `respawn.js` builtin.
- `[x]` Extend coverage to Java/Geyser, immediate respawn, fallback completion, and active movement controls.

## Current State

- Worktree state: base repo has changed respawn builtin/test files; AI lab only has this task log updated for the follow-up documentation.
- Already implemented: live regression test, scenario JSON, human `repeat-respawn` recording, a handler fix matching the human packet order, a dedicated respawn builtin, and cross-target live coverage.
- In progress: none.
- Not started: dimension-transition respawn coverage, which is intentionally separate from overworld repeated-death coverage.
- Known mismatch between notes and worktree: none known.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `repos/prismarine-bedrock/src/builtins/respawn.js` | added | Owns death/respawn lifecycle, human-matched death-screen packet ordering, fallback action, and revive completion from `set_health`, `spawn`, or Geyser `entity_event(respawn)`. |
| `repos/prismarine-bedrock/src/builtins/setup.js` | changed | Reduced back to login/setup concerns; respawn lifecycle code moved to `respawn.js`. |
| `repos/prismarine-bedrock/src/plugin-loader.js` | changed | Adds explicit builtin load priority so `world.js`, `setup.js`, then `respawn.js` load before remaining builtins. |
| `repos/prismarine-bedrock/test/live/respawn.test.js` | changed | Focused live Mocha regression that kills the bot three times, keeps movement controls active, verifies server-confirmed revive completion, covers immediate respawn, and asserts Endstone inventory preservation. Java/Geyser uses `entity_event(respawn)` completion and target-specific gamerule spelling. |
| `repos/prismarine-bedrock/test/static/respawn.test.js` | added | Static coverage for initial respawn ack, death-screen packet order, fallback action, and Geyser `event_id: respawn` completion. |
| `repos/prismarine-bedrock-ai/test/recorded-bds/scenarios/repeat-respawn.json` | added | Endstone scenario that kills the real client three times and waits for `PlayerRespawnEvent` after the player presses Respawn each time. |
| `docs/tasks/TASK-28-repeat-respawn-endstone.md` | changed | Durable evidence and coverage log for this respawn investigation. |
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
- `2026-05-24` - `node --check src/builtins/setup.js; node --check src/builtins/respawn.js; node --check src/plugin-loader.js; node --check test/static/respawn.test.js; node --check test/live/respawn.test.js` from `repos/prismarine-bedrock` - PASS.
- `2026-05-24` - `pnpm exec mocha test/static/respawn.test.js` from `repos/prismarine-bedrock` - PASS. Result: `4 passing`.
- `2026-05-24` - `pnpm exec mocha test/static/respawn.test.js test/static/runtime-options.test.js` from `repos/prismarine-bedrock` - PASS. Result: `16 passing`.
- `2026-05-24` - `node scripts/e2e-servers.js launch --target=java --world=superflat --exit-after-client --client-timeout-ms=300000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/respawn.test.js` - PASS. Server: Paper 26.1.2 with Geyser/Floodgate. Result: `2 passing`; three repeated deaths and immediate respawn completed via `entity_event(respawn)`. Raw run: `.e2e-servers/runs/2026-05-24T22-11-48-798Z`.
- `2026-05-24` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=300000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/respawn.test.js` - PASS. Server: Endstone 0.11.3 / BDS 1.26.12.2. Result: `2 passing`; repeated respawn and immediate respawn pass, and Endstone inventory preservation stays asserted. Raw run: `.e2e-servers/runs/2026-05-24T22-12-33-585Z`.
- `2026-05-24` - `pnpm run test:static` from `repos/prismarine-bedrock` - PASS. Result: `348 passing`.

## Architecture Notes

- The test intentionally treats `set_health > 0` as the server-confirmed revive signal. Queuing a local respawn packet is not enough evidence that BDS accepted the respawn.
- The scenario uses delayed step-start `kill {player}` commands so the death occurs after the step marker is written and packet/event evidence stays step-bounded.
- Human Bedrock does not request death-screen respawn by sending `player_action(respawn)` first. It first sends `respawn state=2` after the server's first `respawn state=0`, then sends `player_action(respawn)` after the server sends the ready `respawn state=1`.
- For Java/Geyser, revive completion is observed as upstream `entity_event` with `event_id: respawn`, not as `set_health > 0`. The respawn builtin treats this as equivalent completion only while its death lifecycle is active and the event targets the local runtime entity.
- Java/Geyser accepts Java-style gamerules (`keepInventory`, `doImmediateRespawn`) while Endstone/BDS uses lowercase Bedrock command spelling. The live test maps these per target.
- Geyser currently emits empty inventory and item drops after the `/kill` path even with `keepInventory` set, so inventory preservation remains asserted only on Endstone. Respawn packet/lifecycle completion is still covered on both targets.
- Current overworld coverage is considered sufficient for plain death/respawn: repeated death-screen respawn, immediate respawn, active movement controls, Endstone inventory preservation, and Geyser completion semantics are all covered.
- The remaining meaningful respawn gap is dimension-transition respawn: Nether/End death, invalid bed/anchor paths, and respawn flows that overlap `change_dimension`, `move_player`, and chunk readiness.

## Handoff

No handoff required for the overworld repeat-respawn regression. Optional follow-up: add a separate dimension-transition respawn task if Nether/End or invalid bed/anchor respawn behavior becomes a target.

## Resume Notes

- Next step: none for overworld repeat respawn.
- Do not repeat: the human scenario, Endstone focused bot run, Java/Geyser focused bot run, and base static suite already pass.
- Raw logs: `.e2e-servers/runs/2026-05-24T21-34-13-559Z`, `.e2e-servers/runs/2026-05-24T21-38-10-199Z`, `.e2e-servers/runs/2026-05-24T21-39-29-997Z`, `.e2e-servers/runs/2026-05-24T21-40-43-069Z`, `.e2e-servers/runs/2026-05-24T21-41-55-299Z`, `.e2e-servers/runs/2026-05-24T21-43-13-529Z`, `.e2e-servers/runs/2026-05-24T21-48-54-448Z`

## Final Summary

- Result: Overworld repeat respawn fixed and covered by focused static and live regressions plus human packet evidence.
- Files changed in the follow-up: `src/builtins/respawn.js`, `src/builtins/setup.js`, `src/plugin-loader.js`, `test/static/respawn.test.js`, `test/live/respawn.test.js`, and this task log.
- Verification: Endstone focused live test passed (`2 passing`), Java/Geyser focused live test passed (`2 passing`), base static passed (`348 passing`), focused respawn static passed (`4 passing`).
- Follow-up tasks: dimension-transition respawn coverage only if Nether/End or invalid bed/anchor flows become in scope.

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
