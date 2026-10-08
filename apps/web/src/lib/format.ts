import { formatUnits, type Hex } from "viem";

/** Token amounts with at most four decimals and no trailing zeros. */
export function amount(value: bigint, decimals: number): string {
  const [whole = "0", frac = ""] = formatUnits(value, decimals).split(".");
  const trimmed = frac.slice(0, 4).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** IMD carries a request's UUID as sixteen raw bytes, left-aligned in a bytes32. */
export function requestUuid(requestId: Hex): string {
  const h = requestId.slice(2, 34);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** The next daily verdict: 00:05 UTC. */
export function nextVerdictAt(now: Date): Date {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 5, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

export const utcDate = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }) + " UTC";
