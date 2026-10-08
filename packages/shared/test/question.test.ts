import { describe, expect, it } from "vitest";
import {
  mergedPrQuestion,
  type OracleRequest,
  prefixHash,
  questionPrefix,
  rebuildQuestionHash,
  scheduleBody,
} from "../src/index.ts";
import golden from "./golden-request.json" with { type: "json" };

describe("question hash", () => {
  // IMD oracle request 5d9dbfd5-493b-47d3-bb4d-5d6652aa1ce9, as served by api.imd.fun
  it("rebuilds the hash of a live IMD request", () => {
    expect(rebuildQuestionHash(golden as OracleRequest)).toBe(
      "0x53bbaac72127e4ca33546939a00eb61980d7c8a27685141aea15ba545c6eaf77",
    );
  });

  // The same value ship-or-burn-contracts asserts in test_prefixMatchesQuestionTool
  it("builds the prefix the contract tests pin", () => {
    const prefix = questionPrefix(mergedPrQuestion("shiporburn/ship-or-burn"));
    expect(prefixHash(prefix)).toBe("0xdb02167fa266e567cdf99c4bf4d81550cfad978830934bd98e3c028ee9a38bfd");
  });

  it("opens and closes the prefix the way createVault requires", () => {
    const prefix = questionPrefix({ ...mergedPrQuestion("owner/repo"), chainId: 11155111 });
    expect(prefix.startsWith('{"answerType":"uint256","chainId":11155111,')).toBe(true);
    expect(prefix.endsWith(',"v":1,"window":')).toBe(true);
  });

  it("keeps the question plain ASCII with no line breaks", () => {
    expect(questionPrefix(mergedPrQuestion("owner/repo"))).toMatch(/^[\x20-\x7e]+$/);
  });
});

describe("schedule body", () => {
  it("asks the vault's question with a panel the contract accepts", () => {
    const consumer = "0x000000000000000000000000000000000000dEaD";
    const body = scheduleBody({ repo: "owner/repo", consumer, runs: 12 });
    const q = mergedPrQuestion("owner/repo");
    expect(body.input.question).toBe(q.question);
    expect(body.input.definitions).toEqual(q.definitions);
    expect(body.input).toMatchObject({ quorum: 4, toleranceBps: 0, answerType: "uint256" });
    // ShipOrBurn.MIN_PANEL and MIN_AGREED
    expect(body.input.panelSize).toBeGreaterThanOrEqual(5);
    expect(body.input.quorum).toBeGreaterThanOrEqual(4);
    expect(body).not.toHaveProperty("startAt");
    expect(scheduleBody({ repo: "owner/repo", consumer, runs: 4, startAt: "2026-10-18T00:00:00Z" }).startAt).toBe(
      "2026-10-18T00:00:00Z",
    );
    expect(body.input.consumer).toEqual({ chainId: 1, verifyingContract: consumer.toLowerCase() });
  });
});
