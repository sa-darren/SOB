// IMD's OracleAttestation as the API serves it, and as ShipOrBurn.settle takes it.
import { type Address, type Hex, recoverTypedDataAddress } from "viem";
import { ANSWER_TYPE_CODE } from "./constants.ts";
import type { AnswerType } from "./question.ts";

/** `attestation` in GET /oracle/requests/:id, and `message` in the attestation route. */
export interface ImdAttestation {
  requestId: Hex;
  chainId: number;
  questionHash: Hex;
  answerType: AnswerType;
  answer: Hex;
  figure: string;
  fromBlock: number;
  toBlock: number;
  blockHash: Hex;
  panelJobId: Hex;
  panelSize: number;
  quorum: number;
  agreed: number;
  issuedAt: number;
  expiresAt: number;
}

/** EIP-712 domain "IdentityMD Oracle" version "2"; field order matches ShipOrBurn.ATTESTATION_TYPEHASH. */
export const ATTESTATION_TYPES = {
  OracleAttestation: [
    { name: "requestId", type: "bytes32" },
    { name: "chainId", type: "uint256" },
    { name: "questionHash", type: "bytes32" },
    { name: "answerType", type: "uint8" },
    { name: "answer", type: "bytes" },
    { name: "figure", type: "uint256" },
    { name: "fromBlock", type: "uint64" },
    { name: "toBlock", type: "uint64" },
    { name: "blockHash", type: "bytes32" },
    { name: "panelJobId", type: "bytes32" },
    { name: "panelSize", type: "uint16" },
    { name: "quorum", type: "uint16" },
    { name: "agreed", type: "uint16" },
    { name: "issuedAt", type: "uint64" },
    { name: "expiresAt", type: "uint64" },
  ],
} as const;

/** The struct `settle` and `attestationDigest` take. */
export function toAttestationStruct(a: ImdAttestation) {
  return {
    requestId: a.requestId,
    chainId: BigInt(a.chainId),
    questionHash: a.questionHash,
    answerType: ANSWER_TYPE_CODE[a.answerType],
    answer: a.answer,
    figure: BigInt(a.figure),
    fromBlock: BigInt(a.fromBlock),
    toBlock: BigInt(a.toBlock),
    blockHash: a.blockHash,
    panelJobId: a.panelJobId,
    panelSize: a.panelSize,
    quorum: a.quorum,
    agreed: a.agreed,
    issuedAt: BigInt(a.issuedAt),
    expiresAt: BigInt(a.expiresAt),
  };
}

/** Who signed this attestation for `consumer`. A valid one recovers IMD_ORACLE_SIGNER. */
export function recoverAttester(
  a: ImdAttestation,
  signature: Hex,
  consumer: { chainId: number; verifyingContract: Address },
): Promise<Address> {
  return recoverTypedDataAddress({
    domain: { name: "IdentityMD Oracle", version: "2", ...consumer },
    types: ATTESTATION_TYPES,
    primaryType: "OracleAttestation",
    message: toAttestationStruct(a),
    signature,
  });
}
