import { mergedPrQuestion, prefixHash, questionPrefix, shipOrBurnAbi } from "@ship-or-burn/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { type Address, erc20Abi, type Hex, isAddress, parseEventLogs, parseUnits, stringToHex } from "viem";
import { client, deployed } from "../data/chain.ts";
import { amount } from "../lib/format.ts";
import { explain, useWallet } from "../lib/wallet.ts";

const IMD: Address = "0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7";
const REPO = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
const DAY = 86_400;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-base font-semibold">{label}</span>
      {children}
      {hint && <span className="text-text-2 mt-1 block text-base">{hint}</span>}
    </label>
  );
}

const inputCls = "border-rule bg-page text-text min-h-11 w-full rounded border px-3 text-base";

export function Create() {
  const wallet = useWallet();
  const [repo, setRepo] = useState("");
  const [builder, setBuilder] = useState("");
  const [token, setToken] = useState<string>(IMD);
  const [perDay, setPerDay] = useState("1");
  const [days, setDays] = useState("7");
  const [refund, setRefund] = useState(false);
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<{ id: bigint; hash: Hex }>();
  const [scheduleId, setScheduleId] = useState("");
  const [linked, setLinked] = useState<Hex>();

  const tranches = Number(days);
  const repoOk = REPO.test(repo.trim());
  const tokenOk = isAddress(token);
  const meta = useQuery({
    queryKey: ["token", token],
    enabled: tokenOk,
    queryFn: async () => {
      const [symbol, decimals] = await Promise.all([
        client.readContract({ address: token as Address, abi: erc20Abi, functionName: "symbol" }),
        client.readContract({ address: token as Address, abi: erc20Abi, functionName: "decimals" }),
      ]);
      return { symbol, decimals };
    },
  });

  const prefix = repoOk ? questionPrefix(mergedPrQuestion(repo.trim())) : undefined;
  let tranche: bigint | undefined;
  try {
    tranche = meta.data && Number(perDay) > 0 ? parseUnits(perDay, meta.data.decimals) : undefined;
  } catch {
    tranche = undefined;
  }
  const total = tranche !== undefined && tranches > 0 ? tranche * BigInt(tranches) : undefined;
  // the baseline plus one verdict per day, then two spare days so one failed run cannot cost a tranche
  const deadline = Math.floor(Date.now() / 1000) + (tranches + 3) * DAY;

  const problems = [
    !repoOk && "Enter the repository as OWNER/REPO.",
    !isAddress(builder) && "Enter the builder's address.",
    !tokenOk && "Enter the token's address.",
    tokenOk && meta.isError && "That address is not an ERC-20 token on Ethereum mainnet.",
    (!Number.isInteger(tranches) || tranches < 1 || tranches > 365) && "Choose between 1 and 365 days.",
    tranche === undefined && meta.data && "Enter an amount per day above zero.",
  ].filter(Boolean) as string[];

  async function lock() {
    if (!deployed || !prefix || tranche === undefined || total === undefined) return;
    setError(undefined);
    try {
      const wc = await wallet.walletClient();
      const me = wc.account.address;
      const allowance = await client.readContract({ address: token as Address, abi: erc20Abi, functionName: "allowance", args: [me, deployed.address] });
      if (allowance < total) {
        setBusy("Approve the exact amount in your wallet…");
        const hash = await wc.writeContract({ address: token as Address, abi: erc20Abi, functionName: "approve", args: [deployed.address, total], chain: wc.chain, account: wc.account });
        setBusy("Waiting for the approval…");
        await client.waitForTransactionReceipt({ hash });
      }
      setBusy("Checking the vault against the contract…");
      const { request } = await client.simulateContract({
        address: deployed.address,
        abi: shipOrBurnAbi,
        functionName: "createVault",
        args: [token as Address, builder as Address, refund, tranche, tranches, BigInt(deadline), stringToHex(prefix)],
        account: me,
      });
      setBusy("Confirm the vault in your wallet…");
      const hash = await wc.writeContract(request);
      setBusy("Waiting for the transaction…");
      const receipt = await client.waitForTransactionReceipt({ hash });
      const [log] = parseEventLogs({ abi: shipOrBurnAbi, eventName: "VaultCreated", logs: receipt.logs });
      if (receipt.status !== "success" || !log) return setError("The transaction did not create a vault. Check it on Etherscan.");
      setCreated({ id: log.args.id, hash });
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(undefined);
    }
  }

  async function link() {
    if (!deployed || !created) return;
    setError(undefined);
    try {
      const wc = await wallet.walletClient();
      setBusy("Confirm in your wallet…");
      const { request } = await client.simulateContract({
        address: deployed.address,
        abi: shipOrBurnAbi,
        functionName: "linkSchedule",
        args: [created.id, scheduleId.trim()],
        account: wc.account.address,
      });
      const hash = await wc.writeContract(request);
      await client.waitForTransactionReceipt({ hash });
      setLinked(hash);
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <>
      <h1 className="font-display mb-2 text-3xl leading-none font-extrabold md:text-4xl">Lock tokens for a builder</h1>
      <p className="text-text-2 mb-8 max-w-2xl text-lg">
        Each day the builder's repo merges a pull request, one day's share goes to them. A day without one, it burns.
      </p>

      {!deployed && (
        <p className="border-signal-yellow bg-signal-yellow/15 mb-6 rounded border px-3 py-2 text-base">
          The contract is not launched yet. You can preview a vault and its question here; locking opens at launch.
        </p>
      )}

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <form
          className="min-w-0 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void lock();
          }}
        >
          <Field label="GitHub repository" hint="Must be public. Every merged pull request counts.">
            <input className={inputCls} value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repo" spellCheck={false} />
          </Field>
          <Field label="Builder's address" hint="Receives each shipped day.">
            <input className={`${inputCls} font-mono`} value={builder} onChange={(e) => setBuilder(e.target.value)} placeholder="0x…" spellCheck={false} />
          </Field>
          <Field label="Token" hint={meta.data ? meta.data.symbol : "IMD by default; any plain ERC-20 works."}>
            <input className={`${inputCls} font-mono`} value={token} onChange={(e) => setToken(e.target.value)} spellCheck={false} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Per day">
              <input className={inputCls} value={perDay} onChange={(e) => setPerDay(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Days">
              <input className={inputCls} value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" />
            </Field>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-base">
            <input type="checkbox" checked={refund} onChange={(e) => setRefund(e.target.checked)} className="h-5 w-5" />
            Refund missed days to me instead of burning them
          </label>

          {!wallet.account ? (
            <button type="button" onClick={() => void wallet.connect()} className="bg-signal-yellow text-ink min-h-11 rounded px-4 text-base font-bold">
              Connect wallet
            </button>
          ) : (
            <button
              type="submit"
              disabled={!deployed || problems.length > 0 || !!busy || !!created}
              className="bg-signal-yellow text-ink min-h-11 rounded px-4 text-base font-bold disabled:opacity-50"
            >
              {busy ? "Locking…" : total !== undefined && meta.data ? `Lock ${amount(total, meta.data.decimals)} ${meta.data.symbol}` : "Lock tokens"}
            </button>
          )}
          {problems.length > 0 && (repo || builder) && <p className="text-text-2 text-base">{problems[0]}</p>}
          {busy && <p className="text-text-2 text-base">{busy}</p>}
          {(error || wallet.error) && (
            <p className="text-signal-red text-base" role="alert">
              {error ?? wallet.error}
            </p>
          )}
        </form>

        <aside className="min-w-0 space-y-5">
          <div>
            <h2 className="mb-1 text-lg font-bold">The question the panel answers every day</h2>
            <p className="border-rule rounded border p-3 text-base">
              {repoOk ? mergedPrQuestion(repo.trim()).question : "Enter a repository to see its question."}
            </p>
          </div>
          {prefix && (
            <div>
              <h2 className="mb-1 text-lg font-bold">What the vault stores</h2>
              <p className="text-text-2 mb-1 text-base">The hash of the question's canonical form. Only answers to it can settle.</p>
              <p className="font-mono text-base break-all">{prefixHash(prefix)}</p>
            </div>
          )}
          <dl className="grid grid-cols-2 gap-3 text-base">
            <dt className="text-text-2">Locked in total</dt>
            <dd>{total !== undefined && meta.data ? `${amount(total, meta.data.decimals)} ${meta.data.symbol}` : "—"}</dd>
            <dt className="text-text-2">Deadline</dt>
            <dd>{new Date(deadline * 1000).toUTCString().slice(5, 16)}</dd>
            <dt className="text-text-2">A missed day</dt>
            <dd>{refund ? "Returns to you" : "Burns to 0x…dEaD"}</dd>
          </dl>
        </aside>
      </div>

      {created && (
        <section className="border-signal-green mt-10 rounded border p-4">
          <h2 className="mb-2 text-xl font-bold">Vault {created.id.toString()} is locked</h2>
          <p className="mb-3 text-base">
            <Link className="underline" to={`/v/${created.id}`}>
              Open the vault
            </Link>{" "}
            ·{" "}
            <a className="underline" href={`https://etherscan.io/tx/${created.hash}`}>
              Transaction
            </a>
          </p>
          <p className="mb-2 text-base">
            Next, buy its daily oracle schedule ({tranches + 1} runs: a baseline and one per day, 0.5 IMD each). IMD's paid routes
            refuse browsers, so this runs from the command line:
          </p>
          <pre className="bg-board text-ivory mb-4 overflow-x-auto rounded p-3 text-base">
            {`pnpm --filter @ship-or-burn/keeper buy-schedule ${repo.trim()} --tranches ${tranches} --runs ${tranches + 1} --vault ${created.id} --pay`}
          </pre>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void link();
            }}
          >
            <label className="sr-only" htmlFor="schedule-id">
              Schedule id
            </label>
            <input
              id="schedule-id"
              className={`${inputCls} font-mono sm:flex-1`}
              value={scheduleId}
              onChange={(e) => setScheduleId(e.target.value)}
              placeholder="Schedule id it prints"
              spellCheck={false}
            />
            <button type="submit" disabled={!scheduleId.trim() || !!busy || !!linked} className="bg-signal-yellow text-ink min-h-11 rounded px-4 text-base font-bold disabled:opacity-50">
              Link schedule
            </button>
          </form>
          {linked && <p className="text-signal-green mt-3 text-base">Linked. Anyone can now trace each verdict to its schedule.</p>}
        </section>
      )}
    </>
  );
}
