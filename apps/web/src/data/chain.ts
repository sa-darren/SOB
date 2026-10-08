// Reads every vault and its history straight from the chain: no indexer, no server.
import { DEAD, LOG_CHUNK, PUBLIC_RPCS, SHIP_OR_BURN, shipOrBurnAbi } from "@ship-or-burn/shared";
import { createPublicClient, erc20Abi, fallback, hexToString, http, parseEventLogs, type Address } from "viem";
import { mainnet } from "viem/chains";
import { demoVaults } from "./demo.ts";
import type { BoardData, VaultView, Verdict } from "./types.ts";

export const CHAIN_ID = 1;
export const deployed = SHIP_OR_BURN[CHAIN_ID];

const client = createPublicClient({
  chain: mainnet,
  transport: fallback([
    ...(import.meta.env.VITE_RPC_URL ? [http(import.meta.env.VITE_RPC_URL as string)] : []),
    ...PUBLIC_RPCS.map((url) => http(url)),
  ]),
  batch: { multicall: true },
});

/** "…in the GitHub repository OWNER/REPO have been merged…" */
function repoFromPrefix(prefix: string): string {
  return /GitHub repository (\S+) have been merged/.exec(prefix)?.[1] ?? "unknown question";
}

async function readLogs(address: Address, fromBlock: bigint, head: bigint) {
  const ranges: [bigint, bigint][] = [];
  for (let from = fromBlock; from <= head; from += LOG_CHUNK) {
    ranges.push([from, from + LOG_CHUNK - 1n < head ? from + LOG_CHUNK - 1n : head]);
  }
  const chunks = await Promise.all(
    ranges.map(([from, to]) => client.getLogs({ address, fromBlock: from, toBlock: to })),
  );
  return parseEventLogs({ abi: shipOrBurnAbi, logs: chunks.flat() });
}

export async function loadBoard(): Promise<BoardData> {
  if (!deployed) return { live: false, vaults: demoVaults };
  const { address, deployBlock } = deployed;
  const head = await client.getBlockNumber();
  const logs = await readLogs(address, deployBlock, head);

  const created = logs.filter((l) => l.eventName === "VaultCreated");
  const states = await Promise.all(
    created.map((l) => client.readContract({ address, abi: shipOrBurnAbi, functionName: "getVault", args: [l.args.id] })),
  );

  // token symbol and decimals, once per token
  const tokens = [...new Set(states.map((s) => s.token))];
  const meta = new Map<Address, { symbol: string; decimals: number }>();
  await Promise.all(
    tokens.map(async (token) => {
      const [symbol, decimals] = await Promise.all([
        client.readContract({ address: token, abi: erc20Abi, functionName: "symbol" }).catch(() => "TOKEN"),
        client.readContract({ address: token, abi: erc20Abi, functionName: "decimals" }).catch(() => 18),
      ]);
      meta.set(token, { symbol, decimals });
    }),
  );

  // settling blocks carry the time each verdict landed
  const verdictLogs = logs.filter((l) => ["Baseline", "Shipped", "Missed", "Expired"].includes(l.eventName));
  const blockTimes = new Map<bigint, number>();
  await Promise.all(
    [...new Set(verdictLogs.map((l) => l.blockNumber))].map(async (n) => {
      blockTimes.set(n, Number((await client.getBlock({ blockNumber: n })).timestamp));
    }),
  );

  const vaults: VaultView[] = created.map((log, i) => {
    const s = states[i]!;
    const id = log.args.id;
    const verdicts: Verdict[] = [];
    const schedules: string[] = [];
    for (const l of logs) {
      if (!("id" in l.args) || l.args.id !== id) continue;
      const base = { txHash: l.transactionHash, blockNumber: l.blockNumber, timestamp: blockTimes.get(l.blockNumber) };
      if (l.eventName === "ScheduleLinked") schedules.push(l.args.scheduleId);
      else if (l.eventName === "Baseline") {
        verdicts.push({ kind: "baseline", count: l.args.count, amount: 0n, requestId: l.args.requestId, ...base });
      } else if (l.eventName === "Shipped" || l.eventName === "Missed") {
        verdicts.push({
          kind: l.eventName === "Shipped" ? "shipped" : "missed",
          day: l.args.day,
          count: l.args.count,
          amount: l.args.amount,
          requestId: l.args.requestId,
          ...base,
        });
      } else if (l.eventName === "Expired") {
        verdicts.push({ kind: "expired", amount: l.args.amount, ...base });
      }
    }
    return {
      id,
      repo: repoFromPrefix(hexToString(log.args.questionPrefix)),
      token: s.token,
      ...(meta.get(s.token) ?? { symbol: "TOKEN", decimals: 18 }),
      funder: s.funder,
      builder: s.builder,
      missTo: s.missTo,
      refund: s.missTo !== DEAD,
      tranche: s.tranche,
      tranches: s.tranches,
      settled: s.settled,
      shipped: s.shipped,
      streak: s.streak,
      baselined: s.baselined,
      closed: s.closed,
      deadline: Number(s.deadline),
      lastCount: s.lastCount,
      schedules,
      verdicts,
    };
  });
  return { live: true, vaults };
}
