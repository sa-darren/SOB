// Rebuild the questionHash of any IMD oracle request and compare it with the one IMD reports.
//
//   pnpm --filter @ship-or-burn/keeper verify-question REQUEST_ID
//   pnpm --filter @ship-or-burn/keeper verify-question path/to/request.json
import { existsSync, readFileSync } from "node:fs";
import { IMD_API, type OracleRequest, rebuildQuestionHash } from "@ship-or-burn/shared";

async function load(arg: string): Promise<OracleRequest> {
  if (existsSync(arg)) return JSON.parse(readFileSync(arg, "utf8")) as OracleRequest;
  const res = await fetch(`${IMD_API}/oracle/requests/${arg}`);
  if (!res.ok) throw new Error(`IMD returned ${res.status} for oracle request ${arg}`);
  return (await res.json()) as OracleRequest;
}

const arg = process.argv[2];
if (!arg) {
  console.error("usage: verify-question REQUEST_ID | request.json");
  process.exit(1);
}

const r = await load(arg);
const rebuilt = rebuildQuestionHash(r);
const ok = rebuilt === r.questionHash;
console.log(
  `request   ${r.id}\nstatus    ${r.status}\nexpected  ${r.questionHash}\nrebuilt   ${rebuilt}\n${ok ? "MATCH" : "NO MATCH"}`,
);
process.exitCode = ok ? 0 : 1;
