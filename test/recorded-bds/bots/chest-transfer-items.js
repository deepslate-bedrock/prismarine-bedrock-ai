"use strict";

const {
  connectScenarioBot,
  disconnectQuietly,
  wait
} = require("./helpers");

async function step_open_chest(bot) {
  // TODO: Recreate scenario step "open-chest": Open the chest in front of you.
  // Prefer existing bot APIs first. If needed, send manual packets here while keeping the experiment local.
  await wait(1000);
}

async function step_deposit_apples(bot) {
  // TODO: Recreate scenario step "deposit-apples": Move all 8 apples from your inventory into the chest.
  // Prefer existing bot APIs first. If needed, send manual packets here while keeping the experiment local.
  await wait(1000);
}

async function step_withdraw_apples(bot) {
  // TODO: Recreate scenario step "withdraw-apples": Move the 8 apples from the chest back into your inventory.
  // Prefer existing bot APIs first. If needed, send manual packets here while keeping the experiment local.
  await wait(1000);
}

async function main() {
  const bot = await connectScenarioBot();
  try {
  await step_open_chest(bot);
  await step_deposit_apples(bot);
  await step_withdraw_apples(bot);
    await wait(1000);
  } finally {
    disconnectQuietly(bot, "recorded-bds gym bot complete");
  }
}

main().catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
