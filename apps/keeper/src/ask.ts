// Ask a vault's question once (0.5 IMD): the Day 1 proof, and a manual verdict if a schedule run fails.
//
//   pnpm --filter @ship-or-burn/keeper ask [OWNER/REPO] [--chain 1] [--consumer 0x…] [--pay] [--approve-permit2]
//
// Without --pay it only runs IMD's free check.
import { parseArgs } from "node:util";
import { DEAD, SHIP_OR_BURN, scheduleBody, VAULT_ZERO_REPO } from "@ship-or-burn/shared";
import type { Address } from "viem";
import { fail, paidRequest } from "./pay.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    chain: { type: "string", default: "1" },
    consumer: { type: "string" },
    pay: { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    "approve-permit2": { type: "boolean", default: false },
  },
});

const repo = positionals[0] ?? VAULT_ZERO_REPO;
const chainId = Number(values.chain);
// before the launch any address works as consumer; a verdict a vault can settle needs the real one
const consumer = (values.consumer ?? SHIP_OR_BURN[chainId]?.address ?? DEAD) as Address;
if (consumer === DEAD) console.log("No ShipOrBurn address yet: this attestation is a wording test and cannot settle a vault.");

const { input } = scheduleBody({ repo, chainId, consumer, runs: 1 });
const paid = await paidRequest("oracle.request", input, { pay: values.pay, approve: values["approve-permit2"], force: values.force }).catch(fail);
if (paid?.result?.kind === "oracle") {
  console.log(`\nFollow it, then check the hash:\n  pnpm --filter @ship-or-burn/keeper verify-question ${paid.result.requestId}`);
}
