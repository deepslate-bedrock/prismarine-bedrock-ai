# TASK 30 - Live Raycast Regression Followup

- **Status:** `[/] active`
- **Owner:** Agent / 2026-05-26
- **Scope:** Triage and begin fixing live-test failures found while validating raycast-based block interaction changes.
- **Owned files:** `repos/prismarine-bedrock-ai/docs/tasks/TASK-30-live-raycast-regression-followup.md`, `repos/prismarine-bedrock/test/live/crafting.test.js`; likely follow-up owners include `repos/prismarine-bedrock/test/live/enchanting.test.js`, `repos/prismarine-bedrock/src/builtins/setup.js`, and container inventory request files after narrower reproduction.
- **Related docs:** workspace `AGENTS.md`, `docs/tasks/README.md`, `docs/tasks/TASK-27-container-live-endstone-parity.md`

## Goal

Confirm which live failures remain after the raycast/sign work, preserve the evidence, and start reducing failures that are clearly test-harness or runtime regressions rather than sign raycast failures.

Success means sign editing remains covered by an enabled live run, the failed suite is documented with exact causes, and at least the first narrow fix is implemented with a focused rerun.

## Non-Goals

- Do not rewrite the raycast/sign implementation unless a focused failure proves it is the cause.
- Do not fold packet-parity logs or raw e2e output into the base repo.
- Do not solve the known broad container packet parity issue from `TASK-27` inside this task unless the narrow repro points to the current raycast change.

## Current Plan

- `[x]` Record live-test failures from the Endstone-backed run.
- `[x]` Verify sign editing with `SIGN_EDIT_LIVE=1`.
- `[x]` Fix the crafting live test's position wait to compare feet/block position rather than eye position.
- `[x]` Rerun focused live crafting.
- `[x]` Fix the remaining multi-pickaxe craft rejection caused by stack-size resolution.
- `[ ]` Reproduce/enrich the enchanting XP update failure and decide whether command setup or attribute tracking owns it.
- `[ ]` Reproduce/enrich the container disconnect against `TASK-27` before changing inventory action code.

## Current State

- Worktree state: workspace and base repo have pre-existing dirty files from the active raycast/sign work and user/peer live-test edits. AI repo is clean except for this new task log.
- Already implemented: sign raycast override code exists in the base repo; static tests passed before this task. Sign editing was explicitly enabled and passed live on Endstone.
- In progress: enchanting XP and container disconnect remain open follow-ups after crafting fixes passed focused live/static verification.
- Not started: enchanting XP tracking fix; container action disconnect fix.
- Known mismatch between notes and worktree: no mismatch for this task. Several base files are dirty from the prior raycast implementation and are intentionally left intact.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-30-live-raycast-regression-followup.md` | changed | New durable task log for the live regression follow-up requested after the raycast validation run. |
| `repos/prismarine-bedrock/test/live/crafting.test.js` | changed | `waitForBotPosition` now accepts either the stored `self.position` or a feet-position candidate derived from `authoritativeMovementFeetPosition` / eye height, so teleport-to-ground assertions match Bedrock runtime position semantics. |
| `repos/prismarine-bedrock/src/builtins/crafting.js` | changed | `outputSlot` now resolves merge stack size from the occupied inventory item's live name through the crafting planner registry, then durability/live registry fallback; this prevents damageable tools from being merged into an occupied output slot when static crafting/runtime ids collide. |
| `repos/prismarine-bedrock/test/live/block-entities.test.js` | inspected | Sign edit is gated by `SIGN_EDIT_LIVE=1`; no change needed for this task. |
| `repos/prismarine-bedrock/test/live/containers.test.js` | inspected | First failure is a disconnect during the chest item stack request after container open; relates to `TASK-27` and needs narrower reproduction before edits. |
| `repos/prismarine-bedrock/test/live/enchanting.test.js` | inspected | Setup sends `/experience ...` variants then `/xp 30L`; Endstone accepts `/xp`, but `botState.experienceLevel` remains below 30. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| None | Agent / 2026-05-26 | n/a | n/a | `[-]` |

## Evidence Log

- `2026-05-26` - `npx mocha --config .mocharc.live.json test/live/block-entities.test.js test/live/containers.test.js test/live/crafting.test.js test/live/enchanting.test.js` from `repos/prismarine-bedrock` - FAIL. Notes: no live server was running; all before hooks timed out waiting for spawn and bedrock-protocol reported `RakTimeout`.
- `2026-05-26` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=900000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/block-entities.test.js test/live/containers.test.js test/live/crafting.test.js test/live/enchanting.test.js` from `repos/prismarine-bedrock-ai` - FAIL. Notes: `6 passing`, `1 pending`, `5 failing`. Raw log path: `.e2e-servers/runs/2026-05-26T23-23-07-604Z`.
- `2026-05-26` - same Endstone run, block entities - PARTIAL PASS. Notes: sign block entity read and enchanting-table NBT read passed; sign edit was pending because `SIGN_EDIT_LIVE` was not set.
- `2026-05-26` - same Endstone run, containers - FAIL. Notes: `opens a chest, puts inventory items in, and takes them back out` opened the chest and sent outbound `item_stack_request { request_id: 1, actions: ['take'] }`; server disconnected, causing `Inventory action waiters cleared`. The next container test failed immediately due the prior disconnect.
- `2026-05-26` - same Endstone run, crafting - FAIL. Notes: both recursive wooden-pickaxe tests timed out waiting for position near `0 64 0`; actual was `0 65.6200100183487 0`, consistent with eye position over the target block.
- `2026-05-26` - same Endstone run, enchanting - FAIL. Notes: setup accepted `/xp 30L OpBot` after `/experience` variants were unknown, but the test timed out waiting for `botState.experienceLevel >= 30`; last predicate value was `false`.
- `2026-05-26` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=300000 --client cmd /d /s /c "set SIGN_EDIT_LIVE=1&& pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/block-entities.test.js"` from `repos/prismarine-bedrock-ai` - PASS. Notes: `3 passing`; sign editing through `botState.editSign` passed live. Raw log path: `.e2e-servers/runs/2026-05-26T23-25-20-797Z`.
- `2026-05-26` - `pnpm run e2e:servers:status` from `repos/prismarine-bedrock-ai` - PASS. Notes: no standalone e2e processes; Endstone/Java ports free after runs.
- `2026-05-26` - edited `repos/prismarine-bedrock/test/live/crafting.test.js` - CHANGED. Notes: position wait now treats `self.position` and feet-derived position as candidates before failing.
- `2026-05-26` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=420000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/crafting.test.js` from `repos/prismarine-bedrock-ai` - FAIL. Notes: old setup position timeout is fixed; `4 passing`, `1 failing`. Remaining failure is `Craft rejected: status=error` for request `-245` while crafting ten wooden pickaxes. The request attempted to place the second wooden pickaxe into hotbar slot `0` with destination stack id `66`, where a prior wooden pickaxe already existed. Raw log path: `.e2e-servers/runs/2026-05-26T23-29-35-081Z`.
- `2026-05-26` - edited `repos/prismarine-bedrock/src/builtins/crafting.js` - CHANGED. Notes: `outputSlot` no longer treats crafting-data id `341` for `wooden_pickaxe` as stackable just because the runtime registry lookup by numeric id misses or defaults.
- `2026-05-26` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=420000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/crafting.test.js` from `repos/prismarine-bedrock-ai` - FAIL. Notes: still `4 passing`, `1 failing`; first stack-size fix preferred `registry.items[341]` which is `bamboo_fence` with stack size 64, while crafting-data id `341` is `wooden_pickaxe`. Raw log path: `.e2e-servers/runs/2026-05-26T23-32-57-931Z`.
- `2026-05-26` - edited `repos/prismarine-bedrock/src/builtins/crafting.js` again - CHANGED. Notes: recipe-result stack-size lookup now explicitly prefers `botState.craftingItemNamesById[result.network_id]` before using runtime registry numeric id.
- `2026-05-26` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=420000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/crafting.test.js` from `repos/prismarine-bedrock-ai` - FAIL. Notes: still `4 passing`, `1 failing`; static `craftingItemNamesById[341]` was also wrong for the live packet id, so the request still targeted occupied slot `0`. Raw log path: `.e2e-servers/runs/2026-05-26T23-35-50-205Z`.
- `2026-05-26` - edited `repos/prismarine-bedrock/src/builtins/crafting.js` third pass - CHANGED. Notes: merge stack-size decision now uses the live occupied inventory item name (`wooden_pickaxe`) rather than any static id table.
- `2026-05-26` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=420000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/crafting.test.js` from `repos/prismarine-bedrock-ai` - FAIL. Notes: still `4 passing`, `1 failing`; occupied slot `0` remained selected, so live registry/name lookup still reported stackable. Raw log path: `.e2e-servers/runs/2026-05-26T23-39-35-857Z`.
- `2026-05-26` - edited `repos/prismarine-bedrock/src/builtins/crafting.js` fourth pass - CHANGED. Notes: merge stack-size decision now treats any item or registry entry with durability metadata as stack size 1 before using `stackSize`.
- `2026-05-26` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=420000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/crafting.test.js` from `repos/prismarine-bedrock-ai` - FAIL. Notes: still `4 passing`, `1 failing`; occupied slot `0` remained selected, so durability metadata was not available on the live registry path either. Raw log path: `.e2e-servers/runs/2026-05-26T23-42-27-351Z`.
- `2026-05-26` - edited `repos/prismarine-bedrock/src/builtins/crafting.js` fifth pass - CHANGED. Notes: merge stack-size decision now checks `botState.craftingRecipeRegistry.itemsByName[item.name]` first, which is keyed by live item name but retains static stack sizes such as `wooden_pickaxe.stackSize=1`.
- `2026-05-26` - `node scripts/e2e-servers.js launch --target=endstone --world=superflat --exit-after-client --client-timeout-ms=420000 --client pnpm --dir ../prismarine-bedrock exec mocha --config .mocharc.live.json test/live/crafting.test.js` from `repos/prismarine-bedrock-ai` - PASS. Notes: `5 passing`; old position setup timeout is fixed and the ten-pickaxe case now places each `wooden_pickaxe` into separate slots instead of merging into occupied slot `0`. Raw log path: `.e2e-servers/runs/2026-05-26T23-45-36-549Z`.
- `2026-05-26` - `npx mocha test/static/crafting.test.js test/static/container-raycast.test.js test/static/signs.test.js` from `repos/prismarine-bedrock` - PASS. Notes: `19 passing`.
- `2026-05-26` - `pnpm run e2e:servers:status` from `repos/prismarine-bedrock-ai` - PASS. Notes: no e2e processes left running; configured Bedrock/Java ports free.

## Architecture Notes

- The enabled sign-edit run is the direct live coverage for the sign raycast change. The broad-suite failures did not occur in sign editing.
- The crafting position failure is test-coordinate semantics: the live `self.position` value behaves as eye position, while setup wanted the player's feet/block to be at `standPos`.
- The ten-pickaxe failure was not raycast-related. It exposed a stack-size mapping bug when recipe outputs use live packet ids that can collide with static registry/crafting ids. For merge decisions, prefer the already-deserialized inventory item's live name against the crafting planner registry, then durability metadata, rather than static id maps.
- The container failure remains packet/inventory behavior, not opening/raycast behavior: `container_open` and inventory content arrived before the disconnect.
- The enchanting failure likely belongs either to XP attribute tracking or Endstone command behavior; the command log proves `/xp 30L` was accepted, but no observed state reached `experienceLevel >= 30`.

## Handoff

Focused live crafting and focused static tests now pass. Continue with enchanting XP and container disconnect as separate narrow reproductions.

For containers, compare the current failure with `TASK-27` before editing shared inventory action code. The chest opens successfully, so focus on the item stack request emitted by `putInventorySlot`.

For enchanting, add a focused observer for `update_attributes` during `/xp 30L` or inspect `src/builtins/setup.js` attribute names against the current Bedrock packet before changing the test.

## Resume Notes

- Next step: reproduce the enchanting XP failure alone with an `update_attributes` observer around `/xp 30L`, or split it to a dedicated task if container work takes priority.
- Do not repeat: broad four-file run or sign-edit rerun unless the implementation changes again; sign edit already passed with `SIGN_EDIT_LIVE=1`.
- Raw logs: `.e2e-servers/runs/2026-05-26T23-23-07-604Z` and `.e2e-servers/runs/2026-05-26T23-25-20-797Z`.

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
- `[ ]` Resume Notes say exactly what to do next, or Final Summary is filled.
- `[ ]` Static tests or focused tests run.
- `[ ]` Packet round-trip run for new packet shapes, if applicable.
- `[x]` Live test run or explicitly deferred with reason.
- `[x]` Raw debug logs kept out of git.
