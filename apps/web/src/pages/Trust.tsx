import { IMD_ORACLE_SIGNER } from "@ship-or-burn/shared";
import { VerifyBox } from "../components/VerifyBox.tsx";

const CHECKS: [string, string][] = [
  [
    "Right question",
    "The attestation's question hash must equal the hash the contract rebuilds from the vault's own question and the block window. An answer to any other question is rejected.",
  ],
  ["Right shape", "The answer must be a single whole number about this chain."],
  ["A real panel", "At least 5 seats, at least 4 matching answers, and no fewer than the quorum the request asked for."],
  ["Fresh", "The attestation must not have expired."],
  [`Signed by IMD`, `The signature must recover IMD's oracle signer, ${IMD_ORACLE_SIGNER}, for this contract.`],
  [
    "Recent and in order",
    "The window must have ended, no more than 600 blocks (about two hours) ago. Each verdict comes at least 6,000 blocks after the last, and the count can never go down.",
  ],
];

const LIMITS = [
  "Any merged pull request counts as a ship. The contract does not judge how substantial it is.",
  "A verdict can be taken any time at least 6,000 blocks (about 20 hours) after the last one, by anyone who pays for an oracle request. A builder has to ship inside every such window.",
  "IMD's signer and hash format are fixed in the contract. If IMD changes either, vaults stop settling and what is left goes to the miss address at the deadline.",
  "There is no owner, no admin and no upgrade. Nobody can pause a vault or move its tokens another way.",
];

export function Trust() {
  return (
    <>
      <h1 className="font-display mb-2 text-3xl leading-none font-extrabold md:text-4xl">Why a verdict can't be faked</h1>
      <p className="text-text-2 mb-8 max-w-2xl text-lg">
        The contract alone decides where tokens go. Before it counts an attestation it runs six checks, and anyone can
        repeat them.
      </p>

      <ol className="mb-10 grid gap-4 md:grid-cols-2">
        {CHECKS.map(([title, body], i) => (
          <li key={title} className="border-rule rounded border p-4">
            <h2 className="mb-1 text-lg font-bold">
              {i + 1}. {title}
            </h2>
            <p className="text-base break-words">{body}</p>
          </li>
        ))}
      </ol>

      <section className="mb-10">
        <h2 className="mb-1 text-xl font-bold">Verify a verdict yourself</h2>
        <p className="text-text-2 mb-3 max-w-2xl text-base">
          Paste the id of any IMD oracle request. Your browser rebuilds its question hash and recovers who signed the
          answer, with no server of ours in between.
        </p>
        <VerifyBox />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Known limits</h2>
        <ul className="max-w-2xl list-disc space-y-2 pl-5 text-base">
          {LIMITS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
