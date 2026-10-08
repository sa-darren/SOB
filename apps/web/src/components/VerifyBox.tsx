import { IMD_ORACLE_SIGNER, rebuildQuestionHash, recoverAttester } from "@ship-or-burn/shared";
import { useState } from "react";
import { fetchRequest } from "../data/hooks.ts";

interface Result {
  id: string;
  status: string;
  question: string;
  expected: string;
  rebuilt: string;
  hashOk: boolean;
  signer?: string;
  signerOk?: boolean;
  answer?: string;
  panel?: string;
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Paste any IMD oracle request id: the browser rebuilds its question hash and recovers who signed the answer. */
export function VerifyBox({ initial = "" }: { initial?: string }) {
  const [input, setInput] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<Result>();

  async function verify() {
    const id = UUID.exec(input)?.[0];
    setResult(undefined);
    if (!id) {
      setError("That is not a request id. Paste the id or the link of an IMD oracle request.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const r = await fetchRequest(id);
      const rebuilt = rebuildQuestionHash(r);
      const out: Result = {
        id,
        status: r.status,
        question: r.question,
        expected: r.questionHash,
        rebuilt,
        hashOk: rebuilt === r.questionHash,
      };
      if (r.attestation && r.signature && r.consumer && "panelSize" in r.attestation) {
        const signer = await recoverAttester(r.attestation, r.signature, r.consumer);
        out.signer = signer;
        out.signerOk = signer === IMD_ORACLE_SIGNER;
        out.answer = r.attestation.answerType === "uint256" ? BigInt(r.attestation.answer).toString() : r.attestation.answer;
        out.panel = `${r.attestation.agreed} of ${r.attestation.panelSize} agreed`;
      }
      setResult(out);
    } catch (e) {
      setError(`Could not read that request from IMD (${e instanceof Error ? e.message : e}). Check the id and try again.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-rule rounded border p-4">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void verify();
        }}
      >
        <label className="sr-only" htmlFor="request-id">
          IMD oracle request id
        </label>
        <input
          id="request-id"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="IMD oracle request id"
          spellCheck={false}
          className="border-rule bg-page text-text min-h-11 flex-1 rounded border px-3 font-mono text-base"
        />
        <button
          type="submit"
          disabled={busy}
          className="bg-signal-yellow text-ink min-h-11 rounded px-4 text-base font-bold disabled:opacity-60"
        >
          {busy ? "Verifying…" : "Verify this verdict"}
        </button>
      </form>

      {error && (
        <p className="text-signal-red mt-3 text-base" role="alert">
          {error}
        </p>
      )}

      {result && (
        <dl className="mt-4 grid gap-x-4 gap-y-2 text-base sm:grid-cols-[auto_1fr]" aria-live="polite">
          <dt className="text-text-2">Question</dt>
          <dd>{result.question}</dd>
          <dt className="text-text-2">IMD's hash</dt>
          <dd className="font-mono break-all">{result.expected}</dd>
          <dt className="text-text-2">Rebuilt here</dt>
          <dd className="font-mono break-all">
            {result.rebuilt}{" "}
            <strong className={result.hashOk ? "text-signal-green" : "text-signal-red"}>
              {result.hashOk ? "Match" : "No match"}
            </strong>
          </dd>
          {result.signer ? (
            <>
              <dt className="text-text-2">Signed by</dt>
              <dd className="font-mono break-all">
                {result.signer}{" "}
                <strong className={result.signerOk ? "text-signal-green" : "text-signal-red"}>
                  {result.signerOk ? "IMD's oracle signer" : "Not IMD's signer"}
                </strong>
              </dd>
              <dt className="text-text-2">Answer</dt>
              <dd>
                {result.answer} ({result.panel})
              </dd>
            </>
          ) : (
            <>
              <dt className="text-text-2">Signature</dt>
              <dd>
                {result.status === "attested"
                  ? "This attestation uses IMD's older version 1 format, which this page does not check."
                  : `Not signed: the request reads ${result.status}.`}
              </dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}
