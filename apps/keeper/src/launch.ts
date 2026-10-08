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
    force: { type: "boolean", default: false },
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

// The audit panel parks a launch on an unresolved critical or high finding, so the objective states what the
// contract is for and which trade-offs are deliberate.
const objective = [
  "Deploy ShipOrBurnIMD (src/ShipOrBurnIMD.sol) unchanged to Ethereum mainnet. Deploy only ShipOrBurnIMD: no token, distributor or pool. It has no constructor arguments, no owner, no admin, no upgrade and no pause, and the factory receives no privileges. The constructor makes no external calls and needs no code at any other address.",
  "What it does: vesting by shipping. A funder locks tranche * tranches of an ERC-20 in a vault for a builder. Each verdict is one IMD oracle attestation of a counter that never goes down (merged pull requests of a GitHub repository). If the count rose since the last counted attestation, one tranche goes to the builder; if it stayed flat, one tranche goes to missTo (0xdEaD, or the funder for refund vaults). After the deadline anyone can call expire, which sends the rest to missTo.",
  "How it uses IMD: settle() verifies an IMD OracleAttestation. The EIP-712 domain name IdentityMD Oracle and version 2 are IMD's own, with this contract as verifyingContract, and the signer is IMD's oracle attester 0x5598Aa9146215Bc13eb26f2c692Ad1461Fd32982; both are required for IMD's signatures to verify and must not change. questionHash() rebuilds IMD's question hash (keccak256 of the request's canonical JSON, whose last key is the window) from the vault's stored prefix, so only the vault's own question counts.",
  "Keep the code as it is unless the audit reproduces a critical or high issue. A keeper and a web app call this exact ABI: do not change function signatures, the Attestation struct, events, errors, constants or the typehash. forge test must pass (35 tests, including golden vectors from real IMD attestations). The build uses solc 0.8.26, optimizer 200 runs and bytecode_hash none, with dependencies vendored under lib; nothing needs installing.",
  "This commit already went through a full swarm launch job (d8208131-5e99-4362-9e61-fe6b6e22088e): its audit reproduced one high finding, a stale attestation settled beside a fresh one, and the adaptation fixed it by rejecting a window that has not ended or is more than 600 blocks old. That fix, its tests, ADAPTATION.md and launch.json are in this commit, and the four specialists and the judge then found nothing above low. Every step of that job was accepted; only its repository delivery failed, because the tree held a .github/workflows file, which has been removed. Keep the 600-block freshness check exactly as it is.",
  "Accepted by the owner, do not change:",
  "(1) settle and expire are permissionless, and whoever calls settle chooses which valid attestation to submit. A verdict can be taken at any time at least MIN_SPACING (6,000 blocks, about 20 hours) after the last counted one, by anyone who pays IMD for an oracle request. The rule is therefore that a builder must ship within every spacing window, and a flat window costs one tranche. Attestations must be settled in block order, within 600 blocks of the end of their window; one older than the last counted is rejected.",
  "(2) Any merged pull request counts as a ship; the contract does not judge substance.",
  "(3) The IMD signer and the hash format are fixed. If IMD rotates its signer or changes the format, vaults stop settling and expire to missTo at their deadline. Vaults are meant to be short.",
  "(4) Deposits are balance-checked, so fee-on-transfer tokens are refused at creation; rebasing tokens and tokens that block transfers to 0xdEaD are unsupported and are the funder's risk.",
  "(5) MIN_SPACING assumes 12-second blocks: Ethereum mainnet and Sepolia only.",
  "(6) The question prefix is checked only for its opening (a uint256 answer about this chain) and its ending (the window key). The funder chooses the question and the builder accepts it by taking part.",
  "(7) linkSchedule only emits an event. The same attestation may settle several vaults that share a question.",
  "(8) Already reported as low or informational and accepted: the deadline floor assumes 12-second blocks; nextVerdictBlock ignores the freshness bound; one over-reported count is sticky until the real count passes it; issuedAt and blockHash are not checked; panelSize and quorum are the requester's choice above the contract's minimums of 5 seats and 4 matching answers.",
].join("\n\n");

const input = {
  objective,
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

const paid = await paidRequest("launch.open", input, { pay: values.pay, approve: values["approve-permit2"], force: values.force }).catch(fail);
if (paid?.result?.kind === "job") {
  console.log(`\nJob ${paid.result.jobId} is open. Follow ${IMD_API}${paid.result.statusUrl} until the launch reads live.`);
}
