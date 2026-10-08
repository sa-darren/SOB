// Launch ShipOrBurnIMD through the IMD swarm (0.5 IMD): import the contracts repo, check the plan, pay.
//
//   pnpm --filter @ship-or-burn/keeper launch [--chain 1] [--repo https://github.com/sa-darren/SOB-2] [--pay]
//
// Without --pay it only imports and checks, which is free. Pay from the wallet that should receive the prize.
import { parseArgs } from "node:util";
import { IMD_API } from "@ship-or-burn/shared";
import { fail, paidRequest } from "./pay.ts";

const { values } = parseArgs({
  options: {
    chain: { type: "string", default: "1" },
    repo: { type: "string", default: "https://github.com/sa-darren/SOB-2" },
    pay: { type: "boolean", default: false },
    "approve-permit2": { type: "boolean", default: false },
  },
});

// pin the commit IMD will read
const res = await fetch(`${IMD_API}/requests/import`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: values.repo, kind: "contracts" }),
});
const imported = (await res.json()) as { ok: boolean; source?: { repoUrl: string; baseCommit: string }; problems?: unknown };
if (!imported.ok || !imported.source) fail(new Error(`import refused: ${JSON.stringify(imported.problems ?? imported)}`));
const { repoUrl, baseCommit } = imported.source;
console.log(`importing ${repoUrl} at ${baseCommit}`);

const input = {
  objective:
    "Launch ShipOrBurnIMD from this repository: vesting vaults that release or burn one tranche per IMD oracle verdict. Deploy it unchanged unless launch rules require a change. It has no constructor arguments and no owner.",
  repoUrl,
  baseCommit,
  contracts: ["src/ShipOrBurnIMD.sol"],
  // a launch from our own repository must start with an audit; the planner swaps the final review for its audit panel
  shape: "chain",
  steps: [{ skill: "audit-imported-code" }, { skill: "adapt-contract-project" }, { skill: "adversarial-review" }],
  references: ["evm-contracts-launch"],
  onchain: "evm_contracts",
  chainId: Number(values.chain),
  github: true,
};

const paid = await paidRequest("launch.open", input, { pay: values.pay, approve: values["approve-permit2"] }).catch(fail);
if (paid?.result?.kind === "job") {
  console.log(`\nJob ${paid.result.jobId} is open. Follow ${IMD_API}${paid.result.statusUrl} until the launch reads live.`);
}
