# TASK 29 - API Documentation Reference

- **Status:** `[x] complete`
- **Owner:** Codex / 2026-05-26
- **Scope:** Create and maintain the long-form primary API reference for the base library.
- **Owned files:** `repos/prismarine-bedrock/docs/API.md`, `repos/prismarine-bedrock/docs/README.md`, `repos/prismarine-bedrock-ai/docs/tasks/TASK-29-api-documentation.md`
- **Related docs:** `repos/prismarine-bedrock/docs/reference/mineflayer-feature-comparison.md`, Mineflayer API style reference: https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md

## Goal

Create a Mineflayer-style API reference at `repos/prismarine-bedrock/docs/API.md` that documents the current working-tree built-in API surface for humans and agents, with explicit maturity labels and a separate appendix for internal/agent helpers.

Success means the base docs index links to the API reference, this task log captures the plan and future handoff state, and static tests still pass after the documentation-only change.

## Non-Goals

- Do not change runtime behavior or source APIs.
- Do not create or update `arena.md`; no such workspace file is part of this task.
- Do not move packet-parity logs or task logs into the base library.
- Do not claim full Mineflayer compatibility where the Bedrock runtime only provides an adapter or partial behavior.

## Implementation Plan From Request

### API Documentation Reference

#### Summary

Create a long-form, Mineflayer-style API reference at `repos/prismarine-bedrock/docs/API.md`, using the current working-tree built-in surface as the source of truth. Link it from `docs/README.md`, and track unfinished coverage in a new durable task log: `repos/prismarine-bedrock-ai/docs/tasks/TASK-29-api-documentation.md`.

Style reference: Mineflayer's single-page API docs at https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md.

`arena.md` is out of scope for this pass because no such file exists in the workspace and the user clarified it is not part of the request.

#### Key Changes

- Add `docs/API.md` in the base library as the primary human/agent API source.
- Structure it as:
  - Getting started: `createBot(options)`, `BotState`, runtime options, connection lifecycle.
  - Bot properties/state roots: registry, client, world, self/entities/players, inventory/windows, game/player/environment/lifecycle/chunk/protocol state.
  - Events: emitted bot events grouped by subsystem.
  - Built-in methods by subsystem: chat, commands, auth input, world/chunks, entities/players, movement/physics/controls, flight, inventory, inventory actions, containers, crafting, digging, placing, entity interaction, emotes, food, environment, trading, respawn/setup.
  - Container window API and specialized container helpers for armor/hand, anvil, beacon, brewing stand, cartography, crafter, enchantment, furnace, grindstone, loom, smithing table, stonecutter, trading, and workbench.
  - Mineflayer compatibility facade: `bot.mineflayer`, `asMineflayerBot`, plugin loading aliases, compat methods/events, and known semantic differences.
  - Internal/agent appendix: underscore-prefixed hooks, helper bags such as `inventoryActionHelpers` and `tradeHelpers`, and non-auto-injected helper exports such as `inventory-simulation.js`.
- Each documented method should include signature, parameters, return value, side effects/events, preconditions, common failure modes, and a short example when useful.
- Mark maturity explicitly with small labels such as `stable`, `partial`, `compat`, `internal`, or `packet-level` so agents do not treat every exposed helper as equally safe.
- Update `docs/README.md` to link `API.md` as the main reference before the Mineflayer comparison docs.
- Add `TASK-29-api-documentation.md` with a checklist of covered subsystems, inspected source files, remaining gaps, and resume notes for future agents.

#### Coverage Checklist

- `[x]` Core/lifecycle/plugin loading: `createBot`, `BotState`, `start`, `disconnect`, `pluginLoader`, runtime options.
- `[x]` Chat/commands: `chat`, `whisper`, `command`, `commandWithOutput`, `chatCommand`, `rawCommand`, timeout/version/packet setters, waiter clearing.
- `[x]` Auth input/movement: `authInputFlags`, auth-input hook/edit/flush methods, `setControlState`, `getControlState`, `clearControlStates`, `setFlag`, `applyMovement`, `setPosition`, `look`, `lookAt`, `waitForLookComplete`, `syncLook`.
- `[x]` World/chunks: `resetWorld`, `setDimension`, `getBlock`, `getBlockStateIdAt`, `setBlockStateIdAt`, `areChunksLoadedAround`, `waitForChunksToLoad`.
- `[x]` Entities/players: `self`, `entities`, `playerEntities`, `players`, `playerList`, `playerListByUuid`, `nearestEntity`, entity metadata/effect/status helper methods.
- `[x]` Inventory: `inventory`, `windows`, `uiSlots`, `heldItem`, `getWindow`, `getUiSlot`, `getItem`, `findItem`, `count`, inventory response application.
- `[x]` Inventory actions: item stack request send/wait helpers, held-slot selection, equip/move/merge/split/drop/destroy helpers, response/update timeout setters.
- `[x]` Containers: open/wait/wrap/get APIs, container window transfer/swap/close methods, specialized container helpers and progress/enchant option APIs.
- `[x]` Crafting: recipe registries/maps, craft planning methods, auto/normal/recipe-book craft methods.
- `[x]` Interaction/action APIs: `dig`, `digTime`, `canDigBlock`, `stopDigging`, `placeBlock`, `placeEntity`, `mouseOverEntity`, `swingArm`, `interactEntity`, `interactAtEntity`, `attackEntity`, `queueItemUseOnEntity`.
- `[x]` Feature APIs: emotes, food/eating, flight, environment/time/weather, trading, respawn lifecycle state.
- `[x]` Mineflayer facade: compat properties/methods/events, pathfinder-facing aliases, native/compat differences.
- `[x]` Events: include subsystem event tables for chat, command output, entities, inventory, containers, crafting, physics ticks, player state, environment, emotes, trading, digging, placing, and compat aliases.

#### Test Plan

- Run `pnpm --dir repos/prismarine-bedrock run test:static` after docs edits to catch accidental code/package impact.
- Run a link/path sanity check manually by verifying `docs/README.md` links resolve to `docs/API.md` and existing reference docs.
- No live or fake-world tests are required because this is documentation-only, unless implementation accidentally touches source.

#### Assumptions

- Scope is `Public + appendix`: user-facing built-in methods are first-class docs; underscore/internal helpers are documented separately as internal/agent-facing, not recommended stable API.
- The API reference should describe the current working tree, including existing uncommitted changes, without reverting or normalizing them.
- The long-term work should be tracked in `TASK-29-api-documentation.md` in the AI lab, while the actual API reference belongs to the base library docs.
- No runtime API changes are part of this task.

## Current Plan

- `[x]` Inspect current built-in API assignments, events, and container specializations.
- `[x]` Add `repos/prismarine-bedrock/docs/API.md`.
- `[x]` Link the API reference from `repos/prismarine-bedrock/docs/README.md`.
- `[x]` Create this durable task log and embed the implementation plan.
- `[x]` Run static tests.
- `[x]` Update evidence/final summary after verification.

## Current State

- Worktree state: both submodules had pre-existing modifications before this task; do not revert them. This task added docs-only changes.
- Already implemented: `docs/API.md` added, `docs/README.md` linked, this task log created with the plan embedded.
- In progress: none.
- Not started: any future deeper per-method examples or generated API extraction.
- Known mismatch between notes and worktree: none known for docs added by this task.

## Change Ledger

| File | State | Notes |
| --- | --- | --- |
| `repos/prismarine-bedrock/docs/API.md` | changed | Added primary long-form API reference with maturity labels, method tables, events, compat facade, and internal appendix. |
| `repos/prismarine-bedrock/docs/README.md` | changed | Added API reference link before the Mineflayer feature comparison. |
| `repos/prismarine-bedrock-ai/docs/tasks/TASK-29-api-documentation.md` | changed | Added durable long-term task log and embedded implementation plan. |
| `repos/prismarine-bedrock/src/**` | inspected | Used as current API source of truth; no runtime files changed by this task. |

## Parallel Subtasks

| Subtask | Owner | Owned files | Expected output | Status |
| --- | --- | --- | --- | --- |
| Future API extraction | Unassigned | `repos/prismarine-bedrock/docs/API.md`, optional script/test | Check docs against built-in assignments to catch drift. | `[ ]` |

## Evidence Log

- `2026-05-26` - `git status --short` in workspace and both submodules - PASS. Notes: pre-existing dirty files in both submodules; docs task avoids reverting them.
- `2026-05-26` - inspected Mineflayer API style reference at `https://github.com/PrismarineJS/mineflayer/blob/master/docs/api.md` - PASS. Notes: used single-page API/table-of-contents style as reference only.
- `2026-05-26` - `Test-Path repos\prismarine-bedrock\docs\API.md; Select-String -Path repos\prismarine-bedrock\docs\README.md -Pattern 'API reference'; Test-Path repos\prismarine-bedrock-ai\docs\tasks\TASK-29-api-documentation.md` - PASS. Notes: API doc exists, README link resolves textually, task log exists.
- `2026-05-26` - `pnpm --dir repos/prismarine-bedrock run test:static` - PASS. Notes: 351 passing in 42s; Node emitted a `punycode` deprecation warning unrelated to docs.

## Architecture Notes

- The API is injected dynamically by built-ins; there is no single type file. Future updates should start with `rg "botState\\..*=" src/builtins` and `rg "botState.emit\\(" src/builtins`.
- Keep `docs/API.md` Bedrock-first. Mention Mineflayer only when documenting compatibility adapters or intentional differences.
- Internal helper bags are documented in an appendix to keep agents aware of available tools without implying stable support.

## Handoff

Future agents should first read `repos/prismarine-bedrock/docs/API.md`, then inspect only the built-in file for the subsystem they are changing. If a new public method/event is added, update the relevant API section and the event table in the same change.

## Resume Notes

- Next step: maintain `repos/prismarine-bedrock/docs/API.md` with future public API changes; start with the changed built-in file and update the relevant subsystem section plus the event table.
- Do not repeat: broad source inspection for the initial API surface unless source changed after this task.
- Raw logs: none.

## Final Summary

- Result: Added the primary API reference, linked it from the base docs index, and created this durable task log with the requested plan embedded.
- Files changed: `repos/prismarine-bedrock/docs/API.md`, `repos/prismarine-bedrock/docs/README.md`, `repos/prismarine-bedrock-ai/docs/tasks/TASK-29-api-documentation.md`.
- Verification: `pnpm --dir repos/prismarine-bedrock run test:static` passed with 351 tests.
- Follow-up tasks: consider adding a generated API drift checker for built-in `botState` assignments and `botState.emit` calls.

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
- `[x]` Packet round-trip run for new packet shapes, if applicable. Not applicable: docs-only.
- `[x]` Live test run or explicitly deferred with reason. Deferred: docs-only.
- `[x]` Raw debug logs kept out of git.
