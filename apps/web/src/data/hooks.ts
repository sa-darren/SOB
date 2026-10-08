import { IMD_API, type ImdAttestation, type OracleRequest } from "@ship-or-burn/shared";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Hex } from "viem";
import { loadBoard } from "./chain.ts";
import type { VaultView } from "./types.ts";

export const useBoard = () => useQuery({ queryKey: ["board"], queryFn: loadBoard, refetchInterval: 60_000 });

export function useVault(id: string | undefined) {
  const board = useBoard();
  const vault: VaultView | undefined = board.data?.vaults.find((v) => v.id.toString() === id);
  return { ...board, vault };
}

/** A clock that ticks once a second. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export interface LiveRequest extends OracleRequest {
  panelSize: number;
  quorum: number;
  members?: unknown[];
  attestation: ImdAttestation | null;
  signature: Hex | null;
  consumer?: { chainId: number; verifyingContract: Hex };
}

async function imd<T>(path: string): Promise<T> {
  const res = await fetch(`${IMD_API}${path}`);
  if (!res.ok) throw new Error(`IMD returned ${res.status}`);
  return (await res.json()) as T;
}

export const fetchRequest = (id: string) => imd<LiveRequest>(`/oracle/requests/${id}`);

/** The newest oracle request a vault's schedule has opened, polled faster while its panel is answering. */
export function useLatestRequest(scheduleId: string | undefined) {
  return useQuery({
    queryKey: ["latest-request", scheduleId],
    enabled: !!scheduleId,
    queryFn: async () => {
      const schedule = await imd<{ latest: { status: string; result: { kind: string; id: string } | null }[] }>(
        `/schedules/${scheduleId}`,
      );
      const run = schedule.latest.find((r) => r.status === "opened" && r.result?.kind === "oracle");
      return run?.result ? fetchRequest(run.result.id) : null;
    },
    // public reads are capped per IP: poll every 15 s only during a live verdict
    refetchInterval: (q) => (q.state.data && !["attested", "disagreed", "refused", "failed"].includes(q.state.data.status) ? 15_000 : 60_000),
  });
}
