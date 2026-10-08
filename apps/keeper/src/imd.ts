// Public reads from api.imd.fun.
import { IMD_API, type ImdAttestation, type OracleRequest } from "@ship-or-burn/shared";
import type { Hex } from "viem";

export interface AttestedRequest extends OracleRequest {
  attestation: ImdAttestation | null;
  signature: Hex | null;
}

export interface ScheduleRun {
  seq: number;
  status: "opened" | "skipped" | "failed" | "opening";
  failure: unknown;
  result: { kind: string; id: string; url: string } | null;
}

export interface Schedule {
  id: string;
  status: "active" | "paused" | "exhausted" | "expired" | "cancelled";
  statusReason?: string | null;
  runsRemaining: number;
  latest: ScheduleRun[];
}

// IMD_API_URL points the keeper at another host, for local end-to-end tests
const api = process.env.IMD_API_URL ?? IMD_API;

export async function imdGet<T>(path: string): Promise<T> {
  const res = await fetch(`${api}${path}`);
  if (!res.ok) throw new Error(`IMD GET ${path} returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

export const getSchedule = (id: string) => imdGet<Schedule>(`/schedules/${id}`);

/** The request without its members; `attestation` and `signature` are set once it reads attested. */
export const getOracleRequest = (id: string) => imdGet<AttestedRequest>(`/oracle/requests/${id}?members=0`);
