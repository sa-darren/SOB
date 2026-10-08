import { nextVerdictAt } from "../lib/format.ts";
import { useNow } from "../data/hooks.ts";
import type { VaultView } from "../data/types.ts";
import { Flaps, type Tone } from "./Flaps.tsx";

/** What the status cell of a vault's board line reads. */
export function vaultStatus(v: VaultView): { text: string; tone: Tone; scorched: boolean } {
  const last = [...v.verdicts].reverse().find((x) => x.kind !== "baseline");
  if (!last) return { text: "WAITING", tone: "yellow", scorched: false };
  if (last.kind === "shipped") return { text: "SHIPPED", tone: "green", scorched: false };
  if (last.kind === "expired") return { text: "EXPIRED", tone: "red", scorched: !v.refund };
  // a refund vault returns the tranche to its funder: nothing burns
  return v.refund ? { text: "MISSED", tone: "red", scorched: false } : { text: "BURNED", tone: "red", scorched: true };
}

/** Hours and minutes to the next 00:05 UTC verdict in flaps; seconds in plain figures. */
export function Countdown({ className = "" }: { className?: string }) {
  const now = useNow();
  const left = Math.max(0, Math.floor((nextVerdictAt(now).getTime() - now.getTime()) / 1000));
  const hh = String(Math.floor(left / 3600)).padStart(2, "0");
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className={`flex items-end gap-1 ${className}`} role="timer" aria-label={`Next verdict in ${hh} hours ${mm} minutes`}>
      <Flaps text={hh} tone="yellow" />
      <span className="font-display text-signal-yellow pb-[0.1em] font-extrabold" aria-hidden="true">
        :
      </span>
      <Flaps text={mm} tone="yellow" />
      <span className="text-text-2 ml-1 pb-[0.2em] text-base" aria-hidden="true">
        {ss}s
      </span>
    </div>
  );
}

/** One lamp per panel seat: lit as answers arrive, green together once IMD signs. */
export function Lamps({ seats, answered, signed, label }: { seats: number; answered: number; signed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5" role="img" aria-label={`${answered} of ${seats} panel seats answered${signed ? ", signed" : ""}`}>
        {Array.from({ length: seats }, (_, i) => (
          <span key={i} className={`lamp${i < answered ? (signed ? " lamp-signed" : " lamp-on") : ""}`} />
        ))}
      </div>
      <span className="text-text-2 text-base">{label}</span>
    </div>
  );
}

/** One square per tranche: green shipped, charred red burned, empty still to come. */
export function DayGrid({ vault }: { vault: VaultView }) {
  const days = vault.verdicts.filter((x) => x.kind === "shipped" || x.kind === "missed");
  const expired = vault.verdicts.some((x) => x.kind === "expired");
  return (
    <div className="flex flex-wrap gap-1" role="img" aria-label={`${vault.shipped} shipped, ${vault.settled - vault.shipped} missed, of ${vault.tranches} days`}>
      {Array.from({ length: vault.tranches }, (_, i) => {
        const d = days[i];
        const cls = d
          ? d.kind === "shipped"
            ? "bg-signal-green"
            : "bg-signal-red"
          : expired
            ? "bg-signal-red/40"
            : "border-rule border bg-transparent";
        return <span key={i} className={`h-3.5 w-3.5 rounded-[2px] ${cls}`} />;
      })}
    </div>
  );
}

export function DemoBanner() {
  return (
    <p className="border-signal-yellow bg-signal-yellow/15 text-text mb-6 rounded border px-3 py-2 text-base">
      Sample data. The contract is not launched yet, so these vaults are examples and nothing here is on-chain.
    </p>
  );
}
