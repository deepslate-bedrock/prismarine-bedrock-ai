# TASK 31 - Predictive Inventory

- **Status:** `[~] simulator-first player inventory prediction live-verified; destroy live parity pending`
- **Owner:** Agent / 2026-05-27
- **Scope:** Add predictive player-inventory state and cursor tracking to `prismarine-bedrock`, then verify batching assumptions against vanilla/server-authoritative packet traces.
- **Owned files:** `repos/prismarine-bedrock/src/builtins/inventory-actions.js`, `repos/prismarine-bedrock/src/builtins/inventory-simulation.js`, `repos/prismarine-bedrock/src/builtins/inventory.js`, `repos/prismarine-bedrock/test/static/*inventory*`, `repos/prismarine-bedrock/test/live/inventory-actions.test.js`, `repos/prismarine-bedrock/docs/API.md`, `repos/prismarine-bedrock/docs/reference/inventory-and-actions.md`, `repos/prismarine-bedrock-ai/docs/tasks/TASK-31-predictive-inventory.md`
- **Related docs:** workspace `AGENTS.md`, `docs/tasks/README.md`, `repos/prismarine-bedrock/docs/reference/inventory-and-actions.md`

## Goal

Build first-class predictive inventory support for inventory stack requests. Success means callers can inspect a unified predicted inventory/cursor/window state, batch multiple player actions into one packet with ordered request entries, and treat server mismatches as prediction failures while preserving the existing action APIs.

## Non-Goals

- Do not move trading or enchanting helpers onto prediction in this task.
- Do not treat local prediction as a broad pre-send rejection gate beyond existing malformed argument errors.
- Do not move packet-parity or task logs into the base library.

## Current Plan

- `[x]` Create this durable task log.
- `[x]` Add pure stack-request prediction helpers for player inventory and cursor state.
- `[x]` Wire prediction, reconciliation, and batching into `inventory-actions`.
- `[x]` Document public prediction APIs.
- `[x]` Add focused static coverage.
- `[x]` Reconcile batching/cursor assumptions after user-recorded vanilla scenario.
- `[x]` Refactor simulator toward unified predicted slots/cursor/window/crafting state.
- `[x]` Live packet evidence collected from bot-generated requests and vanilla recorder scenario; focused live rerun passed for non-destroy player inventory actions.
- `[~]` Destroy action live parity is pending because the human scenario did not capture the item data needed to verify it.

## Current State

- Worktree state: base repo has predictive inventory implementation/docs/tests in progress; AI repo has this task log and the packet recorder scenario. Workspace shows dirty submodule pointers because both submodules have uncommitted task changes.
- Already implemented in base repo: `InventorySimulationState`, unified array-compatible prediction snapshots, predictive player inventory slots/cursor, response reconciliation, cursor pickup/place APIs, pure stack-request simulation helpers, docs, and static coverage.
- Live evidence collected from bot-generated requests on Endstone/BDS 1.26.12.2. This evidence changed the assumptions: one-request cursor pickup+place and repeated mutation of the same destination slot were rejected by the server with the request shapes currently known.
- Human trace collected at `logs/recorded-bds/inventory-simulation-parity/human/2026-05-27T21-18-11-991Z/`. Player inventory and crafting steps are usable. Chest steps exposed a scenario bug: several clearances counted one request when the vanilla client emits separate `take` and `place` requests for a single visible move.
- Complete patched human trace collected at `logs/recorded-bds/inventory-simulation-parity/human/2026-05-28T01-25-41-672Z/`. This is now the primary evidence source for implementation corrections.
- Implemented in the refactor pass: packet-level multi-request batching, provisional stack IDs, broader slot-space simulation, container/crafting metadata action tolerance, virtual closed-inventory cursor pickup, coalescing for rejected split-then-merge shapes, and `destroy` action generation.
- Scenario for user packet recording: `test/recorded-bds/scenarios/inventory-simulation-parity.json`.
- Known mismatch resolved in implementation direction: batching now follows the trace shape of one `item_stack_request` packet containing multiple ordered request entries, not one request id with many actions. The closed-inventory split-then-merge helper shape is coalesced into one direct `take` because BDS rejected the two-request provisional-destination form.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `docs/tasks/TASK-31-predictive-inventory.md` | changed | Durable task log and final evidence for predictive inventory work. |
| `repos/prismarine-bedrock/src/builtins/inventory-actions.js` | changed | Kept public helper APIs, delegated prediction snapshots to the simulator, switched batching to one packet with ordered request entries, added response deferral/reconciliation, virtualized closed-inventory cursor pickup until placement, coalesced rejected split-then-merge shapes, and fixed destroy helpers to emit `destroy`. |
| `repos/prismarine-bedrock/src/builtins/inventory-simulation.js` | changed | Added `InventorySimulationState`, unified predicted state snapshots, broader slot lookup, provisional stack IDs, exact movement actions, metadata/crafting pass-through actions, and server response reconciliation helpers. |
| `repos/prismarine-bedrock/src/builtins/inventory.js` | changed | Defers generic response application while a predictive transaction owns that response. |
| `repos/prismarine-bedrock/test/static/inventory-prediction.test.js` | changed | Static coverage for idle sync, packet-level batching, provisional stack IDs, cursor pickup/place, container/crafting metadata simulation, destroy-vs-drop behavior, and mismatch failure. |
| `repos/prismarine-bedrock/test/live/inventory-actions.test.js` | changed | Added focused live batch and cursor prediction tests. Destroy tests are intentionally skipped pending a corrected live scenario capture. |
| `repos/prismarine-bedrock/docs/API.md` | changed | Documented prediction APIs/events/helpers. |
| `repos/prismarine-bedrock/docs/reference/inventory-and-actions.md` | changed | Documented prediction behavior, cursor APIs, batch API, and events. |
| `test/recorded-bds/scenarios/inventory-simulation-parity.json` | changed | Human-operated packet recording scenario for player inventory, crafting, and chest containers. Chest clearances patched after the first human run because vanilla moves emit separate `take` and `place` requests. |

## Parallel Subtasks

No parallel subtasks yet.

## Evidence Log

- `2026-05-27` - `git status --short` in workspace and both submodules - PASS. Notes: all clean before edits.
- `2026-05-27` - `npx mocha "test/static/inventory-mirror.test.js" "test/static/inventory-prediction.test.js"` - PASS. Notes: focused prediction and existing mirror coverage passed.
- `2026-05-27` - `npx mocha "test/static/inventory-prediction.test.js"` - PASS. Notes: rerun after unconfirmed stack-id adjustment; 4 passing.
- `2026-05-27` - `pnpm run test:static` - PASS. Notes: final run 194 passing.
- `2026-05-27` - `pnpm run test:fake-world` - PASS. Notes: final run 3 passing.
- `2026-05-27` - targeted live crafting trace regenerated - PASS. Notes: accepted requests used negative request IDs, `cause: -1`, omitted `dynamic_container_id`, and used server-returned cursor stack IDs between separate `take` and `place` requests.
- `2026-05-27` - player split request before packet-shape fix - FAIL. Notes: positive request id / `cause: chat_public` disconnected BDS with `BinaryStream read() incomplete readNoHeader failed! packetId: 147`.
- `2026-05-27` - player split after negative id and `cause: -1`, with dynamic container names - FAIL. Notes: server responded status `49` (`FailedToValidateSrcSlot`).
- `2026-05-27` - player split after omitting `dynamic_container_id` - PARTIAL PASS. Notes: server accepted one direct `take` from hotbar slot 2 to hotbar slot 3 and inventory reached dirt x3/x4. The automated assertion had a helper call-shape bug at that time.
- `2026-05-27` - cursor batch `take` then `place` in one request with cursor source stack id `0` - FAIL. Notes: server responded status `50` (`FailedToValidateDstSlot`).
- `2026-05-27` - cursor batch with cursor source stack id equal to request id - FAIL. Notes: server responded status `50`.
- `2026-05-27` - cursor batch with cursor source stack id `1` - FAIL. Notes: server responded status `50`.
- `2026-05-27` - direct batch `split -> merge` as two `take` actions touching same destination slot - FAIL. Notes: server responded status `50`; repeated same-destination mutation in one request is not currently proven valid.
- `2026-05-27` - authored JSON human recorder scenario - PASS. Path: `test/recorded-bds/scenarios/inventory-simulation-parity.json`. Validation: JSON parsed with 24 steps, and `node scripts/recorded-bds-gym.js status --scenario=inventory-simulation-parity` resolved the scenario successfully.
- `2026-05-27` - human recorder run `2026-05-27T21-18-11-991Z` - PARTIAL PASS. Notes: scenario completed with `scenario_end status=complete`. Player inventory/crafting packets are usable. Chest H2-H8 clearances were too low and completed before several intended multi-click actions; post-completion packets contain additional freeform chest/inventory actions that can still be used as supporting evidence.
- `2026-05-27` - patched chest scenario clearances - PASS. Notes: H2-H5 now require two request/response pairs each; H6 requires five; H7 requires four; H8 requires three item-stack request/response pairs plus close/time. JSON parse and scenario status validation passed after patch.
- `2026-05-28` - human recorder run `2026-05-28T01-25-41-672Z` - PASS. Notes: scenario completed with `scenario_end status=complete` and all 24 steps completed under patched clearances. This run proves the vanilla client uses separate request IDs for chained visible actions, sometimes bundled in one packet, and uses negative request IDs as provisional stack IDs inside the same packet.
- `2026-05-28` - simulator-first refactor implementation - PASS. Notes: added `InventorySimulationState`, unified predicted snapshot fields, broader slot-space lookup, packet-level request batching, provisional stack IDs, container/crafting metadata action tolerance, and destroy-action generation.
- `2026-05-28` - `npx mocha "test/static/inventory-prediction.test.js"` - PASS. Notes: 7 passing after packet-level batch and simulator coverage updates.
- `2026-05-28` - `pnpm run test:static` - PASS. Notes: 197 passing.
- `2026-05-28` - `pnpm run test:fake-world` - PASS. Notes: 3 passing.
- `2026-05-28` - focused Endstone live inventory actions against simulator refactor - PASS. Notes: 11 passing, 2 pending. Pending tests are `destroyOneInventoryItem` and `destroyInventorySlot` by request because the live scenario did not capture destroy item data well enough. Recorder output: `.e2e-servers/endstone-bds/logs/inventory-actions-live-refactor-final.jsonl`; run directory: `.e2e-servers/runs/2026-05-28T02-04-52-134Z`.
- `2026-05-28` - AI lab `pnpm run test:static` - PASS. Notes: 36 passing after task/scenario updates.

## Human Trace Mapping

Latest human run:

- Raw packets: `logs/recorded-bds/inventory-simulation-parity/human/2026-05-27T21-18-11-991Z/packets.jsonl`
- SQLite index: `logs/recorded-bds/inventory-simulation-parity/human/2026-05-27T21-18-11-991Z/packets.sqlite`
- Decoded local summary: `logs/recorded-bds/inventory-simulation-parity/human/2026-05-27T21-18-11-991Z/decoded-ui-stack-summary.jsonl`

Bounded chest mapping from the first run:

- H2 captured only the pickup half of "move diamond into chest": request `-83`, `take(3) hotbar:0#57 -> cursor:0#0`.
- H3 captured the placement half of the same diamond move: request `-85`, `place(3) cursor:0#57 -> container:0#0`.
- H4 captured only the pickup/split half of "move dirt into chest": request `-87`, `take(4) hotbar:2#61 -> cursor:0#0`.
- H5 captured the placement half of the dirt move: request `-89`, `place(4) cursor:0#62 -> container:2#0`.
- H6 bounded window captured opening a fresh chest and moving diamond into chest slot 0: requests `-91` take from hotbar and `-93` place into container. The intended stick/diamond swap happened later outside the original step bounds.
- H7 bounded window captured opening a fresh chest and moving diamond into chest slot 0: requests `-95` take from hotbar and `-97` place into container. The intended move-within-chest action was not cleanly bounded.
- H8 bounded window captured opening a fresh chest and moving diamond into chest slot 0: requests `-99` take from hotbar and `-101` place into container. The cursor pickup happened immediately after scenario completion.

Post-completion mapping:

- Sequences `12971-13014`: continuation of H8, but the player placed the cursor diamond back into player inventory before closing. Requests: `-103` take `container:0#70 -> cursor`, `-105` place `cursor:0#70 -> hotbar_and_inventory:0#0`, then close window 19. This is not clean evidence for "close while carrying cursor item".
- Sequences `13270-13437`: clean replay of the H6 chest swap shape. Open window 20, then `-107` take diamond from hotbar, `-109` place diamond into chest, `-111` take stick stack from hotbar, `-113` swap cursor stick with chest diamond, `-115` place cursor diamond back into hotbar.
- Sequences `13460-13706`: additional freeform chest/player stack movements after the H6 replay. Useful as supporting evidence for container take/place/swap and partial-stack behavior, but not attributable to one scenario step.
- Sequences `13860-14606`: freeform player inventory stack distribution in an inventory window, not chest-specific. Useful stress evidence for repeated `place` requests, negative request IDs, and provisional stack ids returned from prior responses.

Completed trace mapping from `2026-05-28T01-25-41-672Z`:

- P1/P2 cursor pickup/place: `take(7) hotbar:2#22 -> cursor:0#0`, then `place(7) cursor:0#22 -> hotbar:2#0`.
- P4/P5 partial cursor placement and merge: `place(1) cursor:0#28 -> hotbar:3#0` returns new destination stack `#29`; later merge uses destination `hotbar:3#29`.
- P6 incompatible swap: separate requests `take`, `swap cursor:0#31 -> hotbar:1#33`, then `place cursor:0#33 -> hotbar:0#0`.
- U1 fast chain: one packet carried multiple request IDs, not one request with multiple actions. `-33` placed cursor to hotbar, then `-35` moved the just-created hotbar stack using provisional stack id `hotbar:0#-33`.
- C4 manual crafting table: one packet carried requests `-61` and `-63`; request `-63` used provisional cursor stack id `cursor:0#-61` from the previous request in the same packet.
- C1/C2/C4 crafting uses unsupported simulation actions today: `craft_recipe`, `results_deprecated`, `consume`, and `place/take` involving `crafting_input` and `creative_output`.
- H6 chest swap: direct `place(3) hotbar:0#71 -> container:0#0`, then `take(5) hotbar:1#73 -> cursor`, `swap cursor:0#73 -> container:0#71`, `place(3) cursor:0#71 -> hotbar:0#0`.
- H7 move within chest: `take` from hotbar to cursor, `place` into container slot 0, `take` from container slot 0, `place` into container slot 1.
- H8 close with cursor item: `take` from hotbar, `place` into container, then `take` from container to cursor followed by close. No final placement happened before close.

## Implementation Status Against Human Trace

- **Batching model mismatch:** Addressed. `bot.inventory.actions.batch(fn)` now records ordered request entries and sends one `item_stack_request` packet containing multiple request IDs.
- **Provisional stack IDs:** Addressed for predicted newly-created stacks. Simulation can stamp destination stack IDs from the current request ID so later requests can reference shapes such as `hotbar:0#-33` and `cursor:0#-61`.
- **Same-packet response reconciliation:** Partially addressed. The action layer now waits/reconciles each response entry in order. A later cleanup should remove the remaining duplicated prediction bookkeeping from `inventory-actions`.
- **Request id parity:** Addressed for focused live player actions. Negative odd request IDs were required; even negative request IDs disconnected BDS in bot-generated live tests.
- **Closed-inventory cursor pickup:** Addressed for focused live player actions. Pickup is predicted locally, then placement flushes a direct source-slot request because a cursor `take`/`place` chain in the closed-inventory path was rejected by BDS.
- **Closed-inventory split then merge:** Addressed for focused live player actions by coalescing the same-source/same-destination pair into one `take`. BDS rejected the repeated provisional destination mutation shape.
- **Empty-slot swap helper:** Addressed for focused live player actions. Swapping an occupied slot with an empty slot uses the accepted direct move/take shape instead of a `swap` action to an empty destination.
- **Container slot spaces:** Addressed in simulator primitives for `container`, `crafting_input`, `creative_output`, windows, armor, offhand, and UI slots. High-level container helper APIs are still not fully migrated.
- **Crafting action types:** Addressed as tolerant simulation/pass-through for `craft_recipe`, `craft_recipe_auto`, `craft_creative`, `optional`, `craft_grindstone_request`, `craft_loom_request`, `results_deprecated`, `create`, and related metadata actions. Unknown generated outputs still reconcile from server truth.
- **Direct slot-to-slot place:** Supported by simulator movement primitives. Public helper coverage remains player-action focused.
- **Cursor close/drop finalization:** H8 proves a valid terminal state where a container closes while the cursor still carries an item. The implementation has predicted cursor state, but no modeled close-container reconciliation path for returning or retaining carried items after close.
- **Destroy helper bug:** Static action generation addressed. `destroyInventorySlot()` and `destroyOneInventoryItem()` build `destroy` actions instead of `drop` actions. Live parity remains pending because the recorded scenario did not capture the destroyed item data cleanly enough to validate the server shape.
- **Response stack-id naming:** Addressed for focused non-destroy live player actions. Existing parser normalization reconciled accepted responses in the live run.

## Architecture Notes

- V1 prediction scope is player inventory actions only.
- Original V1 batching assumed one `ItemStackRequest` containing many actions. Human and bot-generated traces show the safe model is one packet containing ordered request entries with distinct request IDs, plus specific coalescing for rejected closed-inventory repeated-destination shapes.
- Server responses are authoritative; accepted response mismatch is a prediction failure and rejected responses roll prediction back from current actual state.
- Predicted slots sync from actual inventory when no predicted transactions are pending. During pending transactions, ordinary inventory updates do not overwrite prediction.
- Newly occupied predicted slots/cursor use provisional negative stack IDs when later requests in the same packet need to reference the unconfirmed stack.
- Accepted crafting traces show that a later cursor `place` uses the cursor stack id returned by the earlier accepted `take`; using `0`, request id, or `1` as an unconfirmed cursor source id inside the same request did not pass BDS validation in our bot-generated probes. Closed-inventory cursor pickup is therefore local prediction until a later flush can be represented as a direct source-slot request.

## Handoff

Next handoff is destroy parity and broader simulator cleanup. The non-destroy focused live inventory action tests pass. Correct the destroy scenario capture before re-enabling `destroyOneInventoryItem` and `destroyInventorySlot` live tests, then continue moving remaining high-level container/crafting helper prediction out of `inventory-actions`.

## Resume Notes

- Next step: correct the destroy item capture in the live scenario before re-enabling destroy live tests. Non-destroy focused live inventory actions already passed against the simulator-first refactor.
- Do not repeat: request-id/cause/dynamic-container probes already listed in Evidence Log.
- Raw logs from prior probes were kept under ignored Endstone/BDS logs paths.

## Final Summary

- Result so far: Added simulator-owned predictive state, unified prediction snapshots, cursor pickup/place helpers, packet-level request batching, provisional stack IDs, broader stack-request simulation helpers, and server-authoritative prediction reconciliation. Focused non-destroy player inventory live tests now pass.
- Files changed: `src/builtins/inventory-actions.js`, `src/builtins/inventory-simulation.js`, `src/builtins/inventory.js`, `test/static/inventory-prediction.test.js`, `test/live/inventory-actions.test.js`, `docs/API.md`, `docs/reference/inventory-and-actions.md`, and this task log.
- Verification: `npx mocha "test/static/inventory-prediction.test.js"` PASS; base `pnpm run test:static` PASS; base `pnpm run test:fake-world` PASS; AI lab `pnpm run test:static` PASS; focused Endstone live inventory actions PASS with 11 passing and 2 pending destroy tests.
- Follow-up tasks: correct destroy live capture and re-enable destroy tests, audit close-with-cursor behavior, and migrate remaining high-level container/crafting helpers fully onto simulator primitives.

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
- `[x]` Static tests or focused tests run.
- `[x]` Packet round-trip run for new packet shapes; bot-generated and vanilla human traces collected, and non-destroy refactor rerun passed.
- `[~]` Destroy live test/scenario run pending against the simulator-first refactor.
- `[x]` Raw debug logs kept out of git.
