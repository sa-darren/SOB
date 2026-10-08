// Buy a vault's daily schedule (0.5 IMD per run). Afterwards the funder calls linkSchedule(id, scheduleId).
//
//   pnpm --filter @ship-or-burn/keeper buy-schedule OWNER/REPO --tranches 10 [--runs N] [--start 2026-10-18T00:00:00Z] [--vault 0] [--chain 1] [--pay] [--approve-permit2]
//
// --start delays the first run to the first 00:05 UTC slot at or after that time. Without it the first run
// is the next 00:05 UTC, so create the vault first: the baseline must come after the vault.
//
// Without --pay it only runs IMD's free check and prints the price.
import { parseArgs } from "node:util";
import { SHIP_OR_BURN, scheduleBody } from "@ship-or-burn/shared";
import { formatUnits } from "viem";
import { fail, paidRequest } from "./pay.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    tranches: { type: "string" },
    runs: { type: "string" },
    start: { type: "string" },
    vault: { type: "string" },
    chain: { type: "string", default: "1" },
    pay: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    "approve-permit2": { type: "boolean", default: false },
  },
});

const repo = positionals[0];
const tranches = Number(values.tranches);
if (!repo || !Number.isInteger(tranches) || tranches < 1) {
  console.error("usage: buy-schedule OWNER/REPO --tranches N [--runs N] [--vault ID] [--chain 1] [--pay] [--approve-permit2]");
  process.exit(1);
}
const chainId = Number(values.chain);
const deployed = SHIP_OR_BURN[chainId];
if (!deployed) {
  console.error(`No ShipOrBurn address for chain ${chainId} yet. A schedule's consumer is frozen, so buy it after the launch.`);
  process.exit(1);
}

// one baseline, one verdict per tranche, one spare; --runs buys fewer, and any wallet can top up later
const runs = values.runs ? Number(values.runs) : tranches + 2;
if (!Number.isInteger(runs) || runs < 1) {
  console.error("--runs must be a whole number of at least 1");
  process.exit(1);
}
if (runs < tranches + 1) console.log(`${runs} runs cannot settle all ${tranches} tranches: that takes a baseline plus one run each.`);
const body = scheduleBody({
  repo,
  chainId,
  consumer: deployed.address,
  runs,
  startAt: values.start,
  label: values.vault ? `Ship or Burn vault ${values.vault}: ${repo}` : undefined,
});
console.log(`${runs} runs at 00:05 UTC${values.start ? ` from ${values.start}` : ""} for ${repo}, about ${formatUnits(BigInt(runs) * 5n * 10n ** 17n, 18)} IMD at today's listed price`);

const paid = await paidRequest("schedule.create", body, { pay: values.pay, approve: values["approve-permit2"], force: values.force }).catch(fail);
if (paid?.result?.kind === "schedule") {
  console.log(`\nSchedule ${paid.result.scheduleId} is live. Link it from the funder's wallet: linkSchedule(vaultId, "${paid.result.scheduleId}")`);
}
