# TASK 27 - Container Live Endstone Parity

- **Status:** `[/]` active
- **Owner:** Codex / 2026-05-18
- **Scope:** Fix the live container integration path so container tests pass on Endstone/BDS and preserve Geyser behavior.
- **Owned files:** `docs/tasks/TASK-27-container-live-endstone-parity.md`, `test/recorded-bds/scenarios/chest-transfer-items.json`, `test/recorded-bds/bots/chest-transfer-items.js`, likely `repos/prismarine-bedrock/src/builtins/containers/index.js`, `repos/prismarine-bedrock/test/live/containers.test.js`, and related command/world-readiness helpers as investigation proves.
- **Related docs:** workspace `AGENTS.md`, `repos/prismarine-bedrock/test/rules.md`, `docs/tasks/README.md`

## Goal

Make `test/live/containers.test.js` pass reliably against Endstone/BDS while preserving the Java/Geyser path.

Success means the focused container live test passes on Endstone and Geyser, with any target-specific behavior documented in the test/helper layer rather than hidden in timing assumptions.

## Non-Goals

- Do not move packet-parity logs or raw e2e runtime artifacts into the base library.
- Do not broaden this into full live-suite stabilization unless the container failure depends on a shared live-test readiness bug.
- Do not treat Geyser as proven good from memory; the latest local confirmation run failed on Geyser too.

## Current Plan

- `[x]` Reproduce in a sterile focused packet trace.
- `[x]` Inspect container setup readiness and block-update observation for target-specific differences.
- `[x]` Inspect `openContainer` interaction packets on Endstone/BDS and compare with Geyser.
- `[x]` Patch the owning repo: base library runtime/world behavior.
- `[/]` Run the recorded BDS human-to-bot loop for `chest-transfer-items`.
- `[~]` Verify `test/live/containers.test.js` on both `--target=java` and `--target=endstone`.

## Current State

- Worktree state: base repo has task changes in `src/builtins/setup.js`, `src/builtins/world.js`, `src/utils.js`, `test/static/block-runtime-ids.test.js`, and `test/static/world-readiness.test.js`. AI repo still has this task log untracked; other AI/base dirty files were pre-existing or unrelated and were not edited for this task.
- Already implemented: fixed non-hash Geyser `update_block` mapping when no live block runtime palette is supplied; fixed outbound block interactions to read block state from the synchronous world mirror so `inventory_transaction.item_use.block_runtime_id` is not `0`.
- In progress: Endstone `container_open` parity is fixed for the open action, but the full live container suite now exposes a later Endstone disconnect on the first container `item_stack_request`.
- In progress: created the `chest-transfer-items` recorded-BDS scenario and scaffolded its bot script so the first human recording can capture the exact BDS packet shape for opening a chest, depositing apples, and withdrawing them.
- Next: run `node scripts/recorded-bds-gym.js record-human --scenario=chest-transfer-items` and have a Bedrock client complete the scenario.
- Known mismatch between notes and worktree: workspace/base/AI `AGENTS.md` and AI e2e launcher/runtime files are dirty but unrelated to this task and were left untouched.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-27-container-live-endstone-parity.md` | changed | Created task log with reproduction evidence and handoff notes. |
| `repos/prismarine-bedrock/src/builtins/setup.js` | changed | Records whether `start_game.block_properties` supplied a live block runtime palette. |
| `repos/prismarine-bedrock/src/builtins/world.js` | changed | Applies non-hash block updates as local state IDs when no live palette exists; documents the Geyser palette drift root cause. |
| `repos/prismarine-bedrock/src/utils.js` | changed | Uses `world.sync.getBlock` for outbound block runtime lookup, avoiding async-world fallback to `0`. |
| `repos/prismarine-bedrock/test/static/world-readiness.test.js` | changed | Covers non-hash no-live-palette update IDs and hash update IDs. |
| `repos/prismarine-bedrock/test/static/block-runtime-ids.test.js` | changed | Covers synchronous world lookup for outbound block runtime IDs. |
| `repos/prismarine-bedrock/test/live/containers.test.js` | inspected by execution | Focused live test target; not edited. |
| `test/recorded-bds/scenarios/chest-transfer-items.json` | added | Human oracle scenario for chest open, inventory-to-chest transfer, and chest-to-inventory transfer. |
| `test/recorded-bds/bots/chest-transfer-items.js` | added | Gym scaffold for bot recreation; still placeholder pending human trace. |

## Parallel Subtasks

None.

## Evidence Log

- `2026-05-18` - `git status --short` in workspace, `repos/prismarine-bedrock`, and `repos/prismarine-bedrock-ai` - PASS. Notes: all clean before edits/runs.
- `2026-05-18` - `node repos/prismarine-bedrock-ai/scripts/e2e-servers.js launch --target=java --world=superflat --exit-after-client --client-timeout-ms=900000 --client pnpm --dir ../prismarine-bedrock run test:live` - FAIL/INTERRUPTED. Notes: full Geyser-backed live suite failed early in `live chunk loading` and then hit a container failure before manual interruption; raw run directory `.e2e-servers/runs/2026-05-19T01-31-34-118Z`.
- `2026-05-18` - `node repos/prismarine-bedrock-ai/scripts/e2e-servers.js launch --target=java --world=superflat --exit-after-client --client-timeout-ms=900000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/containers.test.js` - FAIL. Notes: `1 passing, 4 failing`. All four failures timed out waiting for `stone` support blocks at `y=65`; observed `smooth_sandstone_slab` instead. Raw run directory `.e2e-servers/runs/2026-05-19T01-32-27-279Z`.
- `2026-05-18` - `node repos/prismarine-bedrock-ai/scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=900000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/containers.test.js` - FAIL. Notes: `1 passing, 4 failing`. Chest/furnace/brewing failures timed out waiting for `container_open`; double-chest setup timed out waiting for `chest` at `(4,65,0)` and saw `air`. Raw run directory `.e2e-servers/runs/2026-05-19T01-33-30-257Z`.
- `2026-05-18` - client-side packet trace script `scripts/tmp/container-open-world-trace.js` against Geyser - PASS/DIAG. Logs: `logs/container-trace-geyser.jsonl`. Notes: Geyser sent non-hash `update_block` IDs `2533` for `minecraft:stone` and `13314` for chest. Before the fix, local world state decoded `2533` as `smooth_sandstone_slab` because Geyser supplied no `start_game.block_properties` and the code remapped through the installed `bedrock_1.26.10` blockStates order.
- `2026-05-18` - client-side packet trace script `scripts/tmp/container-open-world-trace.js` against Endstone - PASS/DIAG. Logs: `logs/container-trace-endstone-client.jsonl`. Notes: Endstone sent hash runtime IDs (`-604749536` for air, `-1132117234` for chest, `-2144268767` for stone), local world state was correct, but outbound open interaction had `inventory_transaction.transaction_data.block_runtime_id=0`; BDS did not send `container_open`.
- `2026-05-18` - `pnpm exec mocha test/static/world-readiness.test.js test/static/block-runtime-ids.test.js` from base repo - PASS. Notes: `21 passing`.
- `2026-05-18` - post-fix Endstone trace - PASS. Logs: `logs/container-trace-endstone-client-after-fix.jsonl`. Notes: outbound open interaction now carries `block_runtime_id=-1132117234`, matching Endstone's chest update, and BDS sends `container_open`.
- `2026-05-18` - post-fix Geyser trace - PASS. Logs: `logs/container-trace-geyser-after-fix.jsonl`. Notes: support floor/stand remain local `stone` (`stateId=2533`), chest remains `chest` (`stateId=13314`), outbound open carries `block_runtime_id=13314`, and Geyser sends `container_open`.
- `2026-05-18` - `node scripts/e2e-servers.js launch --target=java --world=superflat --exit-after-client --client-timeout-ms=240000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/containers.test.js` - PASS. Notes: `5 passing`; external player `Generel7050` joined during the brewing section, but the run completed successfully. Raw run directory `.e2e-servers/runs/2026-05-19T01-45-40-970Z`.
- `2026-05-18` - same focused live command with `--target=endstone` - FAIL/NEXT-LAYER. Notes: `1 passing, 4 failing`; first chest opened, then BDS disconnected after first container item_stack_request (`Inventory action waiters cleared`), causing later setup commands to fail with `No targets matched selector` and later opens to time out. This is no longer the original `container_open`/world mirror failure. Raw run directory `.e2e-servers/runs/2026-05-19T01-47-18-323Z`.
- `2026-05-18` - `node -e "JSON.parse(require('fs').readFileSync('test/recorded-bds/scenarios/chest-transfer-items.json','utf8')); console.log('scenario json ok')"` - PASS. Notes: scenario JSON parses.
- `2026-05-18` - `node scripts/recorded-bds-gym.js status --scenario=chest-transfer-items` - PASS. Notes: scenario exists; no completed human/bot/compare runs yet.
- `2026-05-18` - `node scripts/recorded-bds-gym.js scaffold-bot --scenario=chest-transfer-items` - PASS. Notes: created placeholder bot script.

## Architecture Notes

- Launcher target `--target=java` is the Java/Paper server with Geyser and maps to the test helper's `geyser` family.
- Launcher target `--target=endstone` is Endstone/BDS and maps to the test helper's `endstone` family. It uses `E2E_BEDROCK_COMMAND_PACKET=server_command_file`, so command setup goes through the server-command bridge instead of Bedrock `command_request`.
- The latest local evidence did not confirm "Geyser passes, Endstone fails." It confirmed both fail, with different symptoms. Treat any prior "Geyser works" signal as needing a clean rerun or CI artifact comparison.
- The Endstone run had an unexpected external player connection (`Generel7050`) and a server command from that player near teardown. Repeat Endstone in a sterile environment before drawing final packet conclusions.
- Geyser/Paper `start_game` in the packet trace had `block_network_ids_are_hashes=false` and `block_properties=[]`. In that mode, the numeric `update_block.block_runtime_id` values are Geyser's translated Bedrock runtime IDs, not guaranteed indexes into this repo's installed `bedrock_1.26.10` `registry.blockStates`. The local fallback remap made `2533` become `smooth_sandstone_slab`; treating no-live-palette non-hash update IDs as local state IDs fixes the observed support block drift.
- Endstone/BDS `start_game` had `block_network_ids_are_hashes=true`; its block update IDs are hashes and must still be mapped through `registry.blocksByRuntimeId`. That path was correct for inbound world state.
- The Endstone open failure was caused by the outbound interaction path using async `world.getBlock` synchronously, so `getBlockRuntimeId` fell through to `0`. Endstone rejects/ignores that open, while Geyser tolerated it. Reading from `world.sync.getBlock` sends the matching hash runtime ID and opens the container.

## Handoff

The world/opening mismatch is fixed. Continue with a new packet comparison for Endstone's post-open `item_stack_request` disconnect: capture the first chest transfer after `container_open`, compare against the successful Geyser trace, and decide whether the request should be embedded in `player_auth_input`, should include different container/slot identity, or needs a BDS-specific request shape. Do not confuse this next-layer disconnect with the resolved `container_open` failure.

## Resume Notes

- Next step: run the `chest-transfer-items` human recording, then decode/index and compare the first human transfer packets against the bot recreation.
- Do not repeat: the original Geyser support-block diagnosis or Endstone open-only trace unless the world/runtime mapping changes again.
- Raw logs: `.e2e-servers/runs/2026-05-19T01-31-34-118Z`, `.e2e-servers/runs/2026-05-19T01-32-27-279Z`, `.e2e-servers/runs/2026-05-19T01-33-30-257Z`, `.e2e-servers/runs/2026-05-19T01-45-40-970Z`, `.e2e-servers/runs/2026-05-19T01-47-18-323Z`; packet summaries in `logs/container-trace-*.jsonl`. Keep them out of git.

## Final Summary

Fill this only when marking the task complete.

- Result:
- Files changed:
- Verification:
- Follow-up tasks:

## Failure Summary

Fill this when marking the task blocked or abandoned.

- Stopping reason:
- Last known good state:
- Last failure:
- Suspected cause:
- Required next decision or resource:

## Completion Checklist

- `[x]` Task log updated with final evidence.
- `[x]` Current State and Change Ledger reflect the worktree.
- `[x]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[x]` Static tests or focused tests run after code changes.
- `[ ]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
