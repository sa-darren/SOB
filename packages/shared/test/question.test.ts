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
  it("asks the vault's question with the contract's panel minimums", () => {
    const consumer = "0x000000000000000000000000000000000000dEaD";
    const body = scheduleBody({ repo: "owner/repo", consumer, runs: 12 });
    const q = mergedPrQuestion("owner/repo");
    expect(body.input.question).toBe(q.question);
    expect(body.input.definitions).toEqual(q.definitions);
    expect(body.input).toMatchObject({ panelSize: 5, quorum: 4, toleranceBps: 0, answerType: "uint256" });
    expect(body.input.consumer).toEqual({ chainId: 1, verifyingContract: consumer.toLowerCase() });
  });
});
