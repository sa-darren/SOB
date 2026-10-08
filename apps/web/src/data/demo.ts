// Sample vaults shown only until the contract is launched. Nothing here is on-chain.
import { DEAD } from "@ship-or-burn/shared";
import type { Hex } from "viem";
import type { VaultView, Verdict } from "./types.ts";

const E18 = 10n ** 18n;
const NOW = Math.floor(Date.now() / 1000);
const DAY = 86_400;
const tx = (n: number) => `0x${n.toString(16).padStart(64, "0")}` as Hex;

function history(results: ("shipped" | "missed")[], startCount: bigint, tranche: bigint): Verdict[] {
  let count = startCount;
  const out: Verdict[] = [
    { kind: "baseline", count, amount: 0n, txHash: tx(1), blockNumber: 1n, timestamp: NOW - (results.length + 1) * DAY },
  ];
  results.forEach((kind, i) => {
    if (kind === "shipped") count += 1n + BigInt(i % 2);
    out.push({
      kind,
      day: i + 1,
      count,
      amount: tranche,
      txHash: tx(i + 2),
      blockNumber: BigInt(i + 2),
      timestamp: NOW - (results.length - i) * DAY,
    });
  });
  return out;
}

function vault(id: number, repo: string, results: ("shipped" | "missed")[], tranches: number, refund = false): VaultView {
  const tranche = E18;
  let streak = 0;
  for (const r of results) streak = r === "shipped" ? streak + 1 : 0;
  return {
    id: BigInt(id),
    repo,
    token: "0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7",
    symbol: "IMD",
    decimals: 18,
    funder: "0x1111111111111111111111111111111111111111",
    builder: "0x2222222222222222222222222222222222222222",
    missTo: refund ? "0x1111111111111111111111111111111111111111" : DEAD,
    refund,
    tranche,
    tranches,
    settled: results.length,
    shipped: results.filter((r) => r === "shipped").length,
    streak,
    baselined: true,
    closed: results.length === tranches,
    deadline: NOW + (tranches - results.length + 2) * DAY,
    lastCount: 0n,
    schedules: [],
    verdicts: history(results, 12n, tranche),
  };
}

export const demoVaults: VaultView[] = [
  vault(0, "sample/ship-or-burn", ["shipped", "shipped", "shipped", "shipped", "shipped", "shipped"], 10),
  vault(1, "sample/raffle", ["shipped", "missed", "missed"], 7),
  vault(2, "sample/indexer", ["shipped", "shipped", "missed", "shipped"], 5, true),
  { ...vault(3, "sample/new-vault", [], 4), baselined: false, verdicts: [] },
];
