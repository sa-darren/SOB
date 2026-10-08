// One tick of the keeper: turn every new IMD attestation into a settle() transaction.
//
//   RPC_URL               required
//   KEEPER_PRIVATE_KEY    required unless DRY_RUN=1
//   CHAIN_ID              default 1
//   SHIP_OR_BURN_ADDRESS  overrides packages/shared constants (with DEPLOY_BLOCK)
//   WEBHOOK_URL           optional; receives {content} for each verdict and alert
//   LOG_CHUNK             blocks per getLogs call, default 10000
import { SHIP_OR_BURN, shipOrBurnAbi, toAttestationStruct } from "@ship-or-burn/shared";
import {
  type Address,
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  type Hex,
  http,
  parseEventLogs,
  zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";
import { type AttestedRequest, getOracleRequest, getSchedule } from "./imd.ts";

const env = process.env;
const chainId = Number(env.CHAIN_ID ?? 1);
const chain = [mainnet, sepolia].find((c) => c.id === chainId);
if (!chain) throw new Error(`CHAIN_ID ${chainId} is not supported: ShipOrBurn runs on Ethereum mainnet and Sepolia`);
if (!env.RPC_URL) throw new Error("RPC_URL is not set");

const deployed = env.SHIP_OR_BURN_ADDRESS
  ? { address: env.SHIP_OR_BURN_ADDRESS as Address, deployBlock: BigInt(env.DEPLOY_BLOCK ?? 0) }
  : SHIP_OR_BURN[chainId];
if (!deployed) throw new Error(`No ShipOrBurn address for chain ${chainId}: set SHIP_OR_BURN_ADDRESS and DEPLOY_BLOCK`);

const dryRun = env.DRY_RUN === "1";
const account = env.KEEPER_PRIVATE_KEY ? privateKeyToAccount(env.KEEPER_PRIVATE_KEY as Hex) : undefined;
if (!account && !dryRun) throw new Error("KEEPER_PRIVATE_KEY is not set (or run with DRY_RUN=1)");

const transport = http(env.RPC_URL);
const publicClient = createPublicClient({ chain, transport });
const walletClient = account ? createWalletClient({ account, chain, transport }) : undefined;
const contract = { address: deployed.address, abi: shipOrBurnAbi } as const;

async function notify(content: string) {
  console.log(content);
  if (!env.WEBHOOK_URL) return;
  try {
    await fetch(env.WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch (e) {
    console.error(`webhook failed: ${e instanceof Error ? e.message : e}`);
  }
}

/** Every vault's question prefix and the schedules its funder linked, from the deploy block to the head. */
async function readVaults(head: bigint) {
  const vaults = new Map<bigint, { prefix: Hex; schedules: Set<string> }>();
  const step = BigInt(env.LOG_CHUNK ?? 10_000);
  for (let from = deployed!.deployBlock; from <= head; from += step) {
    const to = from + step - 1n < head ? from + step - 1n : head;
    const logs = parseEventLogs({
      abi: shipOrBurnAbi,
      eventName: ["VaultCreated", "ScheduleLinked"],
      logs: await publicClient.getLogs({ address: deployed!.address, fromBlock: from, toBlock: to }),
    });
    for (const log of logs) {
      if (log.eventName === "VaultCreated") {
        vaults.set(log.args.id, { prefix: log.args.questionPrefix, schedules: new Set() });
      } else {
        vaults.get(log.args.id)?.schedules.add(log.args.scheduleId);
      }
    }
  }
  return vaults;
}

/** The attested oracle requests a vault's schedules have opened, oldest window first. */
async function attestedRequests(id: bigint, scheduleIds: Iterable<string>) {
  const out: (AttestedRequest & { attestation: NonNullable<AttestedRequest["attestation"]>; signature: Hex })[] = [];
  for (const scheduleId of scheduleIds) {
    const schedule = await getSchedule(scheduleId);
    if (schedule.status === "paused") {
      await notify(
        `Vault ${id}: schedule ${scheduleId} is paused (${schedule.statusReason ?? "no reason given"}). Any wallet can top it up to reactivate it.`,
      );
    }
    for (const run of schedule.latest) {
      if (run.status !== "opened" || run.result?.kind !== "oracle") continue;
      const r = await getOracleRequest(run.result.id);
      if (r.status === "attested" && r.attestation && r.signature) {
        out.push({ ...r, attestation: r.attestation, signature: r.signature });
      }
    }
  }
  return out.sort((a, b) => a.attestation.toBlock - b.attestation.toBlock);
}

function revertName(e: unknown): string {
  if (e instanceof BaseError) {
    const revert = e.walk((err) => err instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) return revert.data?.errorName ?? revert.shortMessage;
    return e.shortMessage;
  }
  return e instanceof Error ? e.message : String(e);
}

async function settleVault(id: bigint, prefix: Hex, schedules: Set<string>, now: bigint) {
  const vault = await publicClient.readContract({ ...contract, functionName: "getVault", args: [id] });
  if (vault.closed) return;
  if (now > vault.deadline) {
    console.log(`vault ${id}: past its deadline and still open; anyone can call expire(${id})`);
    return;
  }

  for (const r of await attestedRequests(id, schedules)) {
    const a = r.attestation;
    // read fresh each time: a settle earlier in this loop moves it
    const next = await publicClient.readContract({ ...contract, functionName: "nextVerdictBlock", args: [id] });
    if (BigInt(a.toBlock) < next) continue; // already counted, or too soon after the last verdict
    if (BigInt(a.expiresAt) < now) continue;

    const args = [id, toAttestationStruct(a), r.signature, prefix] as const;
    let request;
    try {
      ({ request } = await publicClient.simulateContract({
        ...contract,
        functionName: "settle",
        args,
        account: account ?? zeroAddress,
      }));
    } catch (e) {
      console.log(`vault ${id}: request ${r.id} would revert with ${revertName(e)}; skipped`);
      continue;
    }
    if (!walletClient) {
      console.log(`vault ${id}: request ${r.id} would settle (dry run)`);
      return; // later attestations depend on this one landing
    }

    const hash = await walletClient.writeContract(request);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") {
      await notify(`Vault ${id}: settle for request ${r.id} reverted on-chain in ${hash}`);
      return;
    }
    const [verdict] = parseEventLogs({
      abi: shipOrBurnAbi,
      eventName: ["Baseline", "Shipped", "Missed"],
      logs: receipt.logs,
    });
    const link = `https://api.imd.fun/oracle/requests/${r.id}`;
    if (verdict?.eventName === "Baseline") {
      await notify(`Vault ${id}: baseline set at ${verdict.args.count} merged PRs. ${link} tx ${hash}`);
    } else if (verdict?.eventName === "Shipped") {
      await notify(
        `Vault ${id} day ${verdict.args.day}: SHIPPED. Count ${verdict.args.count}, streak ${verdict.args.streak}. ${link} tx ${hash}`,
      );
    } else if (verdict?.eventName === "Missed") {
      await notify(`Vault ${id} day ${verdict.args.day}: BURNED. Count stayed at ${verdict.args.count}. ${link} tx ${hash}`);
    }
    if (verdict && verdict.eventName !== "Baseline" && verdict.args.day === vault.tranches) return;
  }
}

const head = await publicClient.getBlock();
const vaults = await readVaults(head.number);
console.log(`chain ${chainId} ${deployed.address}: ${vaults.size} vault(s) at block ${head.number}`);
for (const [id, { prefix, schedules }] of vaults) {
  try {
    await settleVault(id, prefix, schedules, head.timestamp);
  } catch (e) {
    // one vault's failure must not stop the others
    console.error(`vault ${id}: ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  }
}
