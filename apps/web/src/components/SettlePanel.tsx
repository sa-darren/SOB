import { shipOrBurnAbi, toAttestationStruct } from "@ship-or-burn/shared";
import { useState } from "react";
import type { Hex } from "viem";
import { client, deployed } from "../data/chain.ts";
import { fetchRequest } from "../data/hooks.ts";
import type { VaultView } from "../data/types.ts";
import { explain, useWallet } from "../lib/wallet.ts";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Anyone can settle. The keeper normally does it within minutes; this is the same transaction from the
 * visitor's own wallet, built from the attestation IMD publishes with the request.
 */
export function SettlePanel({ vault, suggested, onSettled }: { vault: VaultView; suggested?: string; onSettled: () => void }) {
  const wallet = useWallet();
  const [input, setInput] = useState(suggested ?? "");
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<Hex>();

  if (!deployed) {
    return <p className="text-text-2 text-base">Settling opens once the contract is launched.</p>;
  }
  if (vault.closed) return <p className="text-text-2 text-base">This vault is closed: every verdict is counted.</p>;

  async function settle() {
    const id = UUID.exec(input || suggested || "")?.[0];
    setError(undefined);
    setDone(undefined);
    if (!id) return setError("Paste the id of the IMD oracle request to settle.");
    try {
      setBusy("Reading the attestation from IMD…");
      const r = await fetchRequest(id);
      if (r.status !== "attested" || !r.attestation || !r.signature) {
        return setError(`IMD has not signed this request: it reads ${r.status}. Try again once it is attested.`);
      }
      const args = [vault.id, toAttestationStruct(r.attestation), r.signature, vault.prefix] as const;
      setBusy("Checking it against the contract…");
      const wc = await wallet.walletClient();
      const { request } = await client.simulateContract({
        address: deployed!.address,
        abi: shipOrBurnAbi,
        functionName: "settle",
        args,
        account: wc.account.address,
      });
      setBusy("Confirm in your wallet…");
      const hash = await wc.writeContract(request);
      setBusy("Waiting for the transaction…");
      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") return setError("The transaction reverted on-chain. Reload to see the vault's current state.");
      setDone(hash);
      onSettled();
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="border-rule rounded border p-4">
      {!wallet.account ? (
        <button onClick={() => void wallet.connect()} className="bg-signal-yellow text-ink min-h-11 rounded px-4 text-base font-bold">
          Connect wallet
        </button>
      ) : (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void settle();
          }}
        >
          <label className="sr-only" htmlFor="settle-id">
            IMD oracle request id to settle
          </label>
          <input
            id="settle-id"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={suggested ?? "IMD oracle request id"}
            spellCheck={false}
            className="border-rule bg-page text-text min-h-11 flex-1 rounded border px-3 font-mono text-base"
          />
          <button type="submit" disabled={!!busy} className="bg-signal-yellow text-ink min-h-11 rounded px-4 text-base font-bold disabled:opacity-60">
            {busy ? "Settling…" : "Settle verdict"}
          </button>
        </form>
      )}
      {busy && <p className="text-text-2 mt-3 text-base">{busy}</p>}
      {(error || wallet.error) && (
        <p className="text-signal-red mt-3 text-base" role="alert">
          {error ?? wallet.error}
        </p>
      )}
      {done && (
        <p className="text-signal-green mt-3 text-base">
          Settled.{" "}
          <a className="underline" href={`https://etherscan.io/tx/${done}`}>
            View the transaction
          </a>
        </p>
      )}
    </div>
  );
}
