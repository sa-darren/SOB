import { IMD_API } from "@ship-or-burn/shared";
import { Link, useParams } from "react-router-dom";
import { Flaps } from "../components/Flaps.tsx";
import { DayGrid, DemoBanner, Lamps, vaultStatus } from "../components/parts.tsx";
import { SettlePanel } from "../components/SettlePanel.tsx";
import { VerifyBox } from "../components/VerifyBox.tsx";
import { useLatestRequest, useVault } from "../data/hooks.ts";
import type { VaultView, Verdict } from "../data/types.ts";
import { amount, requestUuid, shortAddress, utcDate } from "../lib/format.ts";

const etherscan = (path: string) => `https://etherscan.io/${path}`;

function verdictLabel(x: Verdict, v: VaultView) {
  if (x.kind === "baseline") return { text: "Baseline", cls: "text-text-2" };
  if (x.kind === "shipped") return { text: "Shipped", cls: "text-signal-green" };
  if (x.kind === "expired") return { text: v.refund ? "Expired, refunded" : "Expired, burned", cls: "text-signal-red" };
  return { text: v.refund ? "Missed, refunded" : "Burned", cls: "text-signal-red" };
}

function Ledger({ vault, live }: { vault: VaultView; live: boolean }) {
  if (vault.verdicts.length === 0) {
    return <p className="text-text-2 text-base">No verdicts yet. The first attestation after creation sets the baseline.</p>;
  }
  let previous: bigint | undefined;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-base">
        <thead className="text-text-2">
          <tr className="border-rule border-b">
            <th className="py-2 pr-4 font-normal">Day</th>
            <th className="py-2 pr-4 font-normal">When</th>
            <th className="py-2 pr-4 font-normal">Merged PRs</th>
            <th className="py-2 pr-4 font-normal">Verdict</th>
            <th className="py-2 pr-4 font-normal">Amount</th>
            <th className="py-2 font-normal">Proof</th>
          </tr>
        </thead>
        <tbody>
          {vault.verdicts.map((x) => {
            const label = verdictLabel(x, vault);
            const before = previous;
            if (x.count !== undefined) previous = x.count;
            return (
              <tr key={x.txHash} className="border-rule border-b last:border-b-0">
                <td className="py-3 pr-4">{x.day ?? "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{x.timestamp ? utcDate(x.timestamp) : "—"}</td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  {x.count === undefined ? "—" : before === undefined ? `${x.count}` : `${before} → ${x.count}`}
                </td>
                <td className={`py-3 pr-4 font-semibold whitespace-nowrap ${label.cls}`}>{label.text}</td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  {x.amount > 0n ? `${amount(x.amount, vault.decimals)} ${vault.symbol}` : "—"}
                </td>
                <td className="py-3 whitespace-nowrap">
                  {live ? (
                    <span className="flex gap-3">
                      {x.requestId && (
                        <a className="underline" href={`${IMD_API}/oracle/requests/${requestUuid(x.requestId)}`}>
                          Oracle request
                        </a>
                      )}
                      <a className="underline" href={etherscan(`tx/${x.txHash}`)}>
                        Transaction
                      </a>
                    </span>
                  ) : (
                    <span className="text-text-2">Sample</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-text-2 text-base">{label}</dt>
      <dd className="text-lg">{children}</dd>
    </div>
  );
}

export function Vault() {
  const { id } = useParams();
  const { vault, data, isPending, refetch } = useVault(id);
  const latest = useLatestRequest(vault?.schedules.at(-1));

  if (isPending) return <p className="text-text-2 text-base">Reading the vault from the chain…</p>;
  if (!vault || !data) {
    return (
      <p className="text-base">
        There is no vault {id}.{" "}
        <Link className="underline" to="/">
          Back to the board
        </Link>
      </p>
    );
  }

  const status = vaultStatus(vault);
  const address = (a: string) =>
    data.live ? (
      <a className="underline" href={etherscan(`address/${a}`)}>
        {shortAddress(a)}
      </a>
    ) : (
      shortAddress(a)
    );
  const r = latest.data;
  const lastRequestId = [...vault.verdicts].reverse().find((x) => x.requestId)?.requestId;

  return (
    <>
      {!data.live && <DemoBanner />}
      <p className="mb-4 text-base">
        <Link className="underline" to="/">
          Ship Board
        </Link>{" "}
        <span className="text-text-2">/ Vault {vault.id.toString()}</span>
      </p>

      <section className="bg-board mb-8 rounded-lg p-4 ring-1 ring-[#2a2e32] md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-ivory truncate text-xl font-bold md:text-2xl">
              {data.live ? (
                <a className="underline" href={`https://github.com/${vault.repo}`}>
                  {vault.repo}
                </a>
              ) : (
                vault.repo
              )}
            </h1>
            <p className="mt-1 text-base text-[#a4a9ad]">
              Day {vault.settled} of {vault.tranches} · Streak {vault.streak}
            </p>
          </div>
          <Flaps text={status.text} cells={7} tone={status.tone} scorched={status.scorched} className="text-2xl md:text-4xl" />
        </div>
        <div className="mt-4">
          <DayGrid vault={vault} />
        </div>
        {r && (
          <div className="mt-5 border-t border-[#2a2e32] pt-4 text-[#a4a9ad]">
            <Lamps
              seats={r.panelSize}
              answered={r.status === "attested" ? (r.attestation?.agreed ?? 0) : (r.members?.length ?? 0)}
              signed={r.status === "attested"}
              label={r.status === "attested" ? "Latest panel: signed by IMD" : `Latest panel: ${r.status}`}
            />
          </div>
        )}
      </section>

      <dl className="mb-10 grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
        <Fact label="Builder">{address(vault.builder)}</Fact>
        <Fact label="Funder">{address(vault.funder)}</Fact>
        <Fact label="A missed day">{vault.refund ? "Refunds the funder" : "Burns to 0x…dEaD"}</Fact>
        <Fact label="Per verdict">
          {amount(vault.tranche, vault.decimals)} {vault.symbol}
        </Fact>
        <Fact label="Released">
          {amount(BigInt(vault.shipped) * vault.tranche, vault.decimals)} {vault.symbol}
        </Fact>
        <Fact label="Still locked">
          {vault.closed ? "0" : amount(BigInt(vault.tranches - vault.settled) * vault.tranche, vault.decimals)} {vault.symbol}
        </Fact>
        <Fact label="Deadline">{utcDate(vault.deadline)}</Fact>
        <Fact label="State">{vault.closed ? "Closed" : vault.baselined ? "Open" : "Waiting for a baseline"}</Fact>
      </dl>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-bold">Verdicts</h2>
        <Ledger vault={vault} live={data.live} />
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-xl font-bold">Settle a verdict</h2>
        <p className="text-text-2 mb-3 max-w-2xl text-base">
          The keeper settles each verdict within minutes. If it has not, anyone can, from their own wallet, within about two
          hours of the oracle run. The contract runs its six checks either way.
        </p>
        <SettlePanel
          vault={vault}
          suggested={r?.status === "attested" ? r.id : undefined}
          onSettled={() => {
            void refetch();
            void latest.refetch();
          }}
        />
      </section>

      <section>
        <h2 className="mb-1 text-xl font-bold">Verify a verdict yourself</h2>
        <p className="text-text-2 mb-3 max-w-2xl text-base">
          Your browser fetches the oracle request from IMD, rebuilds its question hash, and recovers who signed the answer.
        </p>
        <VerifyBox initial={lastRequestId ? requestUuid(lastRequestId) : ""} />
      </section>
    </>
  );
}
