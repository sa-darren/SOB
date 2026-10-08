import { Link } from "react-router-dom";
import { Flaps } from "../components/Flaps.tsx";
import { Countdown, DayGrid, DemoBanner, vaultStatus } from "../components/parts.tsx";
import { useBoard } from "../data/hooks.ts";
import type { VaultView } from "../data/types.ts";
import { amount } from "../lib/format.ts";

/** Released and burned per token, summed over every vault. */
function totals(vaults: VaultView[]) {
  const by = new Map<string, { symbol: string; decimals: number; released: bigint; burned: bigint }>();
  for (const v of vaults) {
    const t = by.get(v.token) ?? { symbol: v.symbol, decimals: v.decimals, released: 0n, burned: 0n };
    for (const x of v.verdicts) {
      if (x.kind === "shipped") t.released += x.amount;
      else if ((x.kind === "missed" || x.kind === "expired") && !v.refund) t.burned += x.amount;
    }
    by.set(v.token, t);
  }
  return [...by.values()];
}

function BoardLine({ vault, index }: { vault: VaultView; index: number }) {
  const status = vaultStatus(vault);
  const released = BigInt(vault.shipped) * vault.tranche;
  return (
    <li className="border-b border-[#2a2e32] last:border-b-0">
      <Link
        to={`/v/${vault.id}`}
        className="grid min-h-11 gap-x-6 gap-y-2 px-4 py-4 hover:bg-white/5 md:grid-cols-[1fr_auto_auto] md:items-center"
      >
        <div className="min-w-0">
          <div className="text-ivory truncate text-lg font-semibold">{vault.repo}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-[#a4a9ad]">
            <span>
              Day {vault.settled} of {vault.tranches}
            </span>
            <span>Streak {vault.streak}</span>
            <span>
              {amount(released, vault.decimals)} {vault.symbol} released
            </span>
          </div>
        </div>
        <DayGrid vault={vault} />
        {/* lines clatter top to bottom, 70 ms apart */}
        <Flaps
          text={status.text}
          cells={7}
          tone={status.tone}
          scorched={status.scorched}
          delay={index * 70}
          className="text-2xl md:text-4xl"
        />
      </Link>
    </li>
  );
}

export function Board() {
  const { data, isPending, error } = useBoard();
  const sums = data ? totals(data.vaults) : [];

  return (
    <>
      {data && !data.live && <DemoBanner />}

      <section className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl leading-none font-extrabold md:text-4xl">Vesting by shipping.</h1>
          <p className="text-text-2 mt-2 max-w-xl text-lg">
            Each day an IMD oracle panel counts a repo's merged pull requests. Count up: a tranche goes to the builder.
            Count flat: it burns.
          </p>
        </div>
        <div>
          <div className="text-text-2 mb-1 text-base">Next verdict, 00:05 UTC</div>
          <Countdown className="text-2xl md:text-4xl" />
        </div>
      </section>

      <section aria-label="Ship Board" className="bg-board overflow-hidden rounded-lg">
        {isPending && <p className="px-4 py-8 text-base text-[#a4a9ad]">Reading vaults from the chain…</p>}
        {error && (
          <p className="text-signal-red px-4 py-8 text-base" role="alert">
            The vaults could not be read from the chain. Check your connection and reload.
          </p>
        )}
        {data && data.vaults.length === 0 && (
          <p className="px-4 py-8 text-base text-[#a4a9ad]">No vaults yet. The first one appears here once it is created.</p>
        )}
        {data && data.vaults.length > 0 && (
          <ul>
            {data.vaults.map((v, i) => (
              <BoardLine key={v.id.toString()} vault={v} index={i} />
            ))}
          </ul>
        )}
      </section>

      {sums.length > 0 && (
        <section className="mt-6 flex flex-wrap gap-x-10 gap-y-3" aria-label="Totals">
          {sums.map((t) => (
            <div key={t.symbol} className="flex gap-10">
              <div>
                <div className="font-display text-signal-green text-3xl leading-none font-extrabold">
                  {amount(t.released, t.decimals)}
                </div>
                <div className="text-text-2 text-base">{t.symbol} released</div>
              </div>
              <div>
                <div className="font-display text-signal-red text-3xl leading-none font-extrabold">
                  {amount(t.burned, t.decimals)}
                </div>
                <div className="text-text-2 text-base">{t.symbol} burned</div>
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
