// The only place a Ship or Burn question is built. The app and the keeper both import it.
//
// IMD's questionHash is keccak256 of the request's canonical JSON (sorted keys, no whitespace)
// over answerType, chainId, definitions, evidence, question, v and window {fromBlock, toBlock}.
// "window" sorts last, so a vault stores everything before it and the contract appends the window.
import { type Address, type Hex, keccak256, toBytes } from "viem";

export type AnswerType = "bool" | "address" | "bytes32" | "uint256" | "address[]" | "bytes32[]";

export interface Question {
  question: string;
  definitions: Record<string, string>;
  chainId?: number;
  answerType?: AnswerType;
  evidence?: string;
}

/** The fields of GET /oracle/requests/:id that the hash is rebuilt from. */
export interface OracleRequest {
  id: string;
  status: string;
  question: string;
  questionHash: Hex;
  chainId: number;
  window: { fromBlock: number; toBlock: number };
  answerType: AnswerType;
  evidence: string;
  definitions: Record<string, string>;
}

/** Canonical JSON as IMD hashes it: sorted keys, no whitespace. */
export const canon = (v: unknown): string =>
  Array.isArray(v)
    ? `[${v.map(canon).join(",")}]`
    : v !== null && typeof v === "object"
      ? `{${Object.entries(v)
          .filter(([, value]) => value !== undefined)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([k, value]) => `${JSON.stringify(k)}:${canon(value)}`)
          .join(",")}}`
      : JSON.stringify(v);

/** Everything before the window: what createVault records and settle receives. */
export function questionPrefix({
  question,
  definitions,
  chainId = 1,
  answerType = "uint256",
  evidence = "panel",
}: Question): string {
  const body = canon({ answerType, chainId, definitions, evidence, question, v: 1 });
  return `${body.slice(0, -1)},"window":`;
}

export const prefixHash = (prefix: string): Hex => keccak256(toBytes(prefix));

export const questionHash = (prefix: string, fromBlock: bigint | number, toBlock: bigint | number): Hex =>
  keccak256(toBytes(`${prefix}{"fromBlock":${fromBlock},"toBlock":${toBlock}}}`));

/** Rebuild the questionHash of a request as returned by GET /oracle/requests/:id. */
export function rebuildQuestionHash(r: OracleRequest): Hex {
  const prefix = questionPrefix({
    question: r.question,
    definitions: r.definitions,
    chainId: r.chainId,
    answerType: r.answerType,
    evidence: r.evidence,
  });
  return questionHash(prefix, r.window.fromBlock, r.window.toBlock);
}

/** The production question: total merged pull requests, counted at retrieval. Plain ASCII, no line breaks. */
export function mergedPrQuestion(repo: string): Required<Pick<Question, "question" | "definitions">> {
  return {
    question: `How many pull requests in the GitHub repository ${repo} have been merged, counted when you retrieve the evidence?`,
    definitions: {
      count: `The total_count field returned by https://api.github.com/search/issues?q=repo:${repo}+is:pr+is:merged at retrieval. Every merged pull request in the repository counts, whatever its base branch.`,
      missing:
        "If the repository is missing or private, or the API errors or rate-limits, report unavailable. Never guess, and never answer 0 for a failure.",
      window: "The block window is context only. The answer is the count at the moment you retrieve it.",
    },
  };
}

/** The schedule.create body for one vault. `runs` should be tranches + 2: a baseline, one per tranche, one spare. */
export function scheduleBody({
  repo,
  chainId = 1,
  consumer,
  runs,
  label,
  startAt,
}: {
  repo: string;
  chainId?: number;
  consumer: Address;
  runs: number;
  label?: string;
  /** ISO 8601 with offset: the first run is the first 00:05 UTC slot at or after it. */
  startAt?: string;
}) {
  const q = mergedPrQuestion(repo);
  return {
    label: label ?? `Ship or Burn: ${repo}`,
    action: "oracle.request",
    cadence: { cron: "5 0 * * *", tz: "UTC" },
    runs,
    ...(startAt ? { startAt } : {}),
    input: {
      v: 1,
      question: q.question,
      chainId,
      window: { hours: 1 },
      answerType: "uint256",
      evidence: "panel",
      definitions: q.definitions,
      // IMD signs once `quorum` answers match, and a panel costs the same at any size:
      // seven seats let three members fail or dissent, where five let only one
      panelSize: 7,
      quorum: 4,
      toleranceBps: 0,
      validForSeconds: 604800,
      guards: { sources: ["https://api.github.com/search/issues"], minSources: 1 },
      // IMD refuses a checksummed address here
      consumer: { chainId, verifyingContract: consumer.toLowerCase() as Address },
    },
  };
}
