import type { Address, Hex } from "viem";

export interface Verdict {
  kind: "baseline" | "shipped" | "missed" | "expired";
  /** 1-based verdict number; absent for the baseline and for expiry. */
  day?: number;
  /** The counter the panel attested (merged pull requests). */
  count?: bigint;
  amount: bigint;
  requestId?: Hex;
  txHash: Hex;
  blockNumber: bigint;
  /** Unix seconds of the settling block. */
  timestamp?: number;
}

export interface VaultView {
  id: bigint;
  /** OWNER/REPO, read from the vault's question prefix. */
  repo: string;
  /** The vault's canonical question prefix, sent with every settle. */
  prefix: Hex;
  token: Address;
  symbol: string;
  decimals: number;
  funder: Address;
  builder: Address;
  missTo: Address;
  refund: boolean;
  tranche: bigint;
  tranches: number;
  settled: number;
  shipped: number;
  streak: number;
  baselined: boolean;
  closed: boolean;
  deadline: number;
  lastCount: bigint;
  schedules: string[];
  verdicts: Verdict[];
}

export interface BoardData {
  /** False while the contract is not launched: the vaults are sample data. */
  live: boolean;
  vaults: VaultView[];
}
