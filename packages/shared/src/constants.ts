import type { Address } from "viem";
import type { AnswerType } from "./question.ts";

/**
 * Public mainnet endpoints that serve event logs from weeks back, in order of preference.
 * Many free endpoints refuse old logs or wide ranges, so readers fall back through these
 * and ask for at most LOG_CHUNK blocks at a time.
 */
export const PUBLIC_RPCS = ["https://rpc.mevblocker.io", "https://gateway.tenderly.co/public/mainnet"] as const;
export const LOG_CHUNK = 5_000n;

export const IMD_API = "https://api.imd.fun";

/** The `attester` that api.imd.fun reports for every oracle request; hardcoded in ShipOrBurnIMD. */
export const IMD_ORACLE_SIGNER: Address = "0x5598Aa9146215Bc13eb26f2c692Ad1461Fd32982";

export const DEAD: Address = "0x000000000000000000000000000000000000dEaD";

/** Minimum blocks between counted verdicts (ShipOrBurn.MIN_SPACING). */
export const MIN_SPACING = 6_000n;

/** The uint8 the attestation carries for each answer type name. */
export const ANSWER_TYPE_CODE: Record<AnswerType, number> = {
  bool: 0,
  address: 1,
  bytes32: 2,
  uint256: 3,
  "address[]": 4,
  "bytes32[]": 5,
};

/** The repo vault 0 watches: this monorepo. */
export const VAULT_ZERO_REPO = "sa-darren/SOB";

/** ShipOrBurnIMD by chain id. Filled in once the swarm launch reads live. */
export const SHIP_OR_BURN: Partial<Record<number, { address: Address; deployBlock: bigint }>> = {};
