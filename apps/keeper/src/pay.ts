// IMD's paid-request flow: check, quote, x402 Permit2 payment plus EIP-712 quote approval, then follow the order.
// https://imd.fun/docs/#paying
//
//   PAYER_PRIVATE_KEY  the wallet that pays (for the launch: the wallet that should receive the prize)
//   RPC_URL            Ethereum mainnet, to read the IMD balance and Permit2 allowance
//   IMD_PAID_TOKEN     optional; otherwise one is generated and saved in .imd-orders.json
import { randomBytes, randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { IMD_API } from "@ship-or-burn/shared";
import { x402Client } from "@x402/core/client";
import { encodePaymentSignatureHeader } from "@x402/core/http";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import {
  type Address,
  createPublicClient,
  createWalletClient,
  erc20Abi,
  formatUnits,
  type Hex,
  http,
  maxUint256,
  sha256,
  stringToBytes,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const PERMIT2: Address = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

// canonical JSON: sorted keys, no whitespace
const canon = (v: unknown): string =>
  v === null
    ? "null"
    : Array.isArray(v)
      ? `[${v.map(canon).join(",")}]`
      : typeof v === "object"
        ? `{${Object.keys(v)
            .sort()
            .map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`)
            .join(",")}}`
        : JSON.stringify(v);

/** Print what went wrong in one line and exit, instead of a stack trace. */
export function fail(e: unknown): never {
  const short = (e as { shortMessage?: string }).shortMessage;
  const details = (e as { details?: string }).details;
  console.error(`\nFailed: ${short ? `${short}${details ? ` (${details})` : ""}` : e instanceof Error ? e.message : e}`);
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Free: what a quote would say. Returns the parsed response; throws on a transport error. */
export async function check(action: string, input: unknown) {
  // the check takes a shorter oracle input than the quote does, and refuses the other keys
  if (action === "oracle.request") {
    const { question, panelSize, answerType, evidence, chainId, toleranceBps, head } = input as Record<string, unknown>;
    input = { question, panelSize, answerType, evidence, chainId, toleranceBps, head };
  }
  const res = await fetch(`${IMD_API}/requests/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, input }),
  });
  const body = (await res.json()) as {
    blockers?: unknown[];
    suggestions?: unknown[];
    amount?: string;
    problems?: unknown;
    [k: string]: unknown;
  };
  if (!res.ok) throw new Error(`check returned ${res.status}: ${JSON.stringify(body).slice(0, 500)}`);
  return body;
}

export interface PaidResult {
  orderId: string;
  status: string;
  result?: { kind: string; [k: string]: unknown };
}

/**
 * Check `action`, and with `pay` set, quote it, pay for it and wait for admission.
 * Without `pay` nothing is quoted and nothing is spent.
 */
export async function paidRequest(
  action: string,
  input: unknown,
  { pay = false, approve = false }: { pay?: boolean; approve?: boolean } = {},
): Promise<PaidResult | undefined> {
  const checked = await check(action, input);
  console.log(`check: ${checked.blockers?.length ?? 0} blocker(s), ${checked.suggestions?.length ?? 0} suggestion(s)`);
  for (const b of checked.blockers ?? []) console.log(`  blocker    ${JSON.stringify(b)}`);
  for (const s of checked.suggestions ?? []) console.log(`  suggestion ${JSON.stringify(s)}`);
  for (const step of (checked.plan as { title: string }[] | undefined) ?? []) console.log(`  plan       ${step.title}`);
  if (checked.blockers?.length) throw new Error("IMD would refuse this request; nothing was quoted or paid");
  if (!pay) {
    console.log("Nothing was quoted or paid. Run again with --pay to spend IMD.");
    return;
  }

  const env = process.env;
  if (!env.PAYER_PRIVATE_KEY) throw new Error("PAYER_PRIVATE_KEY is not set");
  if (!env.RPC_URL) throw new Error("RPC_URL (Ethereum mainnet) is not set");
  const account = privateKeyToAccount(env.PAYER_PRIVATE_KEY as Hex);
  const transport = http(env.RPC_URL);
  const publicClient = createPublicClient({ chain: mainnet, transport });

  const token = env.IMD_PAID_TOKEN ?? randomBytes(32).toString("hex");
  const auth = { Authorization: `Bearer ${token}` };

  // 1. the quote
  const quoteRes = await fetch(`${IMD_API}/requests/quote`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ requestKey: randomUUID(), action, input }),
  });
  const quoted = (await quoteRes.json()) as { order?: { id: string; quote: any }; [k: string]: unknown };
  if (!quoteRes.ok || !quoted.order) {
    throw new Error(`quote returned ${quoteRes.status}: ${JSON.stringify(quoted).slice(0, 800)}`);
  }
  const { id: orderId, quote } = quoted.order;
  // the token reads this order later, so keep it even if the rest fails
  appendFileSync(".imd-orders.json", `${JSON.stringify({ orderId, action, token, at: new Date().toISOString() })}\n`);

  const asset = quote.payment.asset as Address;
  const amount = BigInt(quote.payment.amount);
  console.log(`quote ${orderId}: ${formatUnits(amount, quote.payment.decimals)} IMD from ${account.address}`);

  const [balance, allowance] = await Promise.all([
    publicClient.readContract({ address: asset, abi: erc20Abi, functionName: "balanceOf", args: [account.address] }),
    publicClient.readContract({
      address: asset,
      abi: erc20Abi,
      functionName: "allowance",
      args: [account.address, PERMIT2],
    }),
  ]);
  if (balance < amount) {
    throw new Error(`The wallet holds ${formatUnits(balance, quote.payment.decimals)} IMD; this costs more. Nothing was paid.`);
  }
  if (allowance < amount) {
    if (!approve) {
      throw new Error("The wallet has not approved Permit2 for IMD. Run again with --approve-permit2 (one transaction, needs ETH for gas).");
    }
    const walletClient = createWalletClient({ account, chain: mainnet, transport });
    const hash = await walletClient.writeContract({
      address: asset,
      abi: erc20Abi,
      functionName: "approve",
      args: [PERMIT2, maxUint256],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Permit2 approved for IMD in ${hash}`);
  }

  // 2. the challenge: its JSON carries quote, requesterScopeHash and resourceUrl
  const url = `${IMD_API}/requests/${orderId}/submit`;
  const ch = (await (await fetch(url, { method: "POST", headers: auth })).json()) as any;
  const req = ch.accepts?.[0];
  if (!req) throw new Error(`no payment challenge: ${JSON.stringify(ch).slice(0, 500)}`);

  // 3. the Permit2 payment
  const signer = {
    address: account.address,
    signTypedData: (m: { domain: any; types: any; primaryType: string; message: any }) => account.signTypedData(m),
  };
  if (req.asset.toLowerCase() !== asset.toLowerCase() || BigInt(req.amount) !== amount || req.payTo !== quote.payment.payTo) {
    throw new Error(`the challenge asks for something other than the quote: ${JSON.stringify(req)}`);
  }
  const client = x402Client.fromConfig({
    schemes: [{ network: req.network, client: new ExactEvmScheme(signer) }],
    // IMD is not one of x402's default assets: allow it, capped at exactly the quoted amount
    spendControls: { allowedAssets: [{ network: req.network, asset: req.asset, maxAmountPerPayment: String(amount) }] },
  });
  const { extensions: _dropped, ...generated } = await client.createPaymentPayload({
    x402Version: 2,
    resource: ch.resource,
    accepts: [req],
  });
  const payment = JSON.parse(JSON.stringify({ ...generated, accepted: req }));

  // 4. the quote approval of that exact payment
  const q = ch.quote;
  const quoteSignature = await account.signTypedData({
    domain: { name: "IdentityMD Paid Action", version: "1", chainId: Number(q.payment.network.slice(7)) },
    primaryType: "QuoteApproval",
    types: {
      QuoteApproval: [
        { name: "resource", type: "string" },
        { name: "requesterScopeHash", type: "bytes32" },
        { name: "quoteId", type: "string" },
        { name: "quoteHash", type: "bytes32" },
        { name: "paymentHash", type: "bytes32" },
        { name: "action", type: "string" },
        { name: "asset", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "payTo", type: "address" },
        { name: "expiresAt", type: "uint256" },
      ],
    },
    message: {
      resource: ch.resourceUrl,
      requesterScopeHash: `0x${ch.requesterScopeHash}`,
      quoteId: q.id,
      quoteHash: `0x${q.quoteHash}`,
      paymentHash: sha256(stringToBytes(canon(payment))),
      action: q.action,
      asset: q.payment.asset,
      amount: BigInt(q.payment.amount),
      payTo: q.payment.payTo,
      expiresAt: BigInt(q.expiresAt),
    },
  });

  // 5. submit; a retry sends the same bytes and never charges twice
  const submit = await fetch(url, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json", "PAYMENT-SIGNATURE": encodePaymentSignatureHeader(payment) },
    body: JSON.stringify({ quoteSignature }),
  });
  if (submit.status !== 200 && submit.status !== 202) {
    throw new Error(`submit returned ${submit.status}: ${(await submit.text()).slice(0, 800)}`);
  }

  // 6. follow the order
  for (let i = 0; i < 120; i++) {
    const order = (await (await fetch(`${IMD_API}/requests/${orderId}`, { headers: auth })).json()) as any;
    if (order.status === "admitted") {
      console.log(`admitted: ${JSON.stringify(order.admission?.result)}`);
      return { orderId, status: order.status, result: order.admission?.result };
    }
    if (order.status === "payment_failed" || order.status === "expired") {
      throw new Error(`order ${orderId} ended ${order.status}: ${JSON.stringify(order.payment).slice(0, 500)}`);
    }
    await sleep(5_000);
  }
  throw new Error(`order ${orderId} is still pending after 10 minutes; its token is in .imd-orders.json`);
}
