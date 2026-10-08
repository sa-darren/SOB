import { describe, expect, it } from "vitest";
import {
  IMD_ORACLE_SIGNER,
  type ImdAttestation,
  type OracleRequest,
  rebuildQuestionHash,
  recoverAttester,
  toAttestationStruct,
} from "../src/index.ts";
import golden from "./golden-v2-request.json" with { type: "json" };

// IMD oracle request 16051ac5-3319-479c-ac22-9ca9a11cd727: a version 2 attestation of a uint256 panel answer
const request = golden as unknown as OracleRequest;
const attestation = golden.attestation as ImdAttestation;

describe("version 2 attestation", () => {
  it("rebuilds the question hash IMD signed", () => {
    expect(rebuildQuestionHash(request)).toBe(golden.questionHash);
    expect(attestation.questionHash).toBe(golden.questionHash);
  });

  it("recovers IMD's signer from a real signature with our types", async () => {
    const signer = await recoverAttester(attestation, golden.signature as `0x${string}`, {
      chainId: golden.consumer.chainId,
      verifyingContract: golden.consumer.verifyingContract as `0x${string}`,
    });
    expect(signer).toBe(IMD_ORACLE_SIGNER);
  });

  it("maps the answer type name to the code settle expects", () => {
    const s = toAttestationStruct(attestation);
    expect(s.answerType).toBe(3);
    expect(s.figure).toBe(3582834000n);
    expect(BigInt(s.answer)).toBe(s.figure);
  });
});
