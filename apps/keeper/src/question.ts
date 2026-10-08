// Print a vault's question prefix (for createVault) and its schedule body (for schedule.create).
//
//   pnpm --filter @ship-or-burn/keeper question [OWNER/REPO] [chainId] [tranches]
import {
  mergedPrQuestion,
  prefixHash,
  questionPrefix,
  SHIP_OR_BURN,
  scheduleBody,
  VAULT_ZERO_REPO,
} from "@ship-or-burn/shared";

const [repo = VAULT_ZERO_REPO, chainArg = "1", tranchesArg = "10"] = process.argv.slice(2);
const chainId = Number(chainArg);
const prefix = questionPrefix({ ...mergedPrQuestion(repo), chainId });
// until the launch is live the consumer is a placeholder: replace it before buying a schedule
const consumer = SHIP_OR_BURN[chainId]?.address ?? "0x0000000000000000000000000000000000000000";

console.log(`prefix (pass to createVault as bytes):\n${prefix}\n\nkeccak256(prefix): ${prefixHash(prefix)}`);
console.log(
  `\nschedule body:\n${JSON.stringify(scheduleBody({ repo, chainId, consumer, runs: Number(tranchesArg) + 2 }), null, 2)}`,
);
