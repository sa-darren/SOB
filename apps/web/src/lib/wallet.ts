// The visitor's own browser wallet (any injected EIP-1193 provider). Nothing is signed without their approval.
import { useCallback, useEffect, useState } from "react";
import {
  type Address,
  BaseError,
  ContractFunctionRevertedError,
  createWalletClient,
  custom,
  type EIP1193Provider,
  UserRejectedRequestError,
  type WalletClient,
} from "viem";
import { mainnet } from "viem/chains";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

export function useWallet() {
  const [account, setAccount] = useState<Address>();
  const [error, setError] = useState<string>();
  const provider = typeof window === "undefined" ? undefined : window.ethereum;

  useEffect(() => {
    if (!provider) return;
    // reconnect silently if the site was already approved
    provider
      .request({ method: "eth_accounts" })
      .then((a) => setAccount((a as Address[])[0]))
      .catch(() => {});
    const onAccounts = (a: unknown) => setAccount((a as Address[])[0]);
    provider.on("accountsChanged", onAccounts);
    return () => provider.removeListener("accountsChanged", onAccounts);
  }, [provider]);

  const connect = useCallback(async () => {
    setError(undefined);
    if (!provider) {
      setError("No browser wallet found. Install one such as MetaMask or Rabby, then reload this page.");
      return;
    }
    try {
      const [a] = (await provider.request({ method: "eth_requestAccounts" })) as Address[];
      setAccount(a);
    } catch (e) {
      setError(explain(e));
    }
  }, [provider]);

  /** A wallet client on Ethereum mainnet, asking the wallet to switch chains first if needed. */
  const walletClient = useCallback(async (): Promise<WalletClient & { account: { address: Address } }> => {
    if (!provider || !account) throw new Error("Connect a wallet first.");
    const client = createWalletClient({ account, chain: mainnet, transport: custom(provider) });
    if ((await client.getChainId()) !== mainnet.id) await client.switchChain({ id: mainnet.id });
    return client as WalletClient & { account: { address: Address } };
  }, [provider, account]);

  return { account, connect, walletClient, error };
}

/** What a vault's revert means, and what to do next. */
const REVERTS: Record<string, string> = {
  WrongQuestion: "This attestation answers another question, not this vault's.",
  BadAnswer: "This attestation is not a whole-number answer about Ethereum mainnet.",
  WeakPanel: "The panel was too small or agreed too little: the contract needs at least 5 seats and 4 matching answers.",
  AttestationExpired:
    "This attestation is too old. It has to be settled within 600 blocks (about two hours) of the end of its window.",
  BadSignature: "This attestation was not signed by IMD's oracle signer for this contract.",
  TooEarly: "This window has not ended yet, or it ended before the vault was created.",
  TooSoon: "A verdict was counted less than 6,000 blocks (about 20 hours) before this one. Wait for the next run.",
  CountWentDown: "The attested count is lower than the last one counted, which the contract never accepts.",
  VaultClosed: "This vault is already closed.",
  PastDeadline: "This vault is past its deadline. Anyone can now expire it, which sends what is left to its miss address.",
  NotYet: "This vault has not reached its deadline yet.",
  NotFunder: "Only the wallet that funded this vault can link its schedule.",
  BadParams: "Check the token, builder, amount and number of days: none can be empty or zero.",
  DeadlineTooSoon: "The deadline is too soon: allow at least 20 hours per day plus one more for the baseline.",
  BadPrefix: "The question is not one this contract accepts.",
  UnsupportedToken: "This token takes a fee on transfer, so the vault would be underfunded. Use another token.",
};

export function explain(e: unknown): string {
  if (e instanceof BaseError) {
    if (e.walk((x) => x instanceof UserRejectedRequestError)) return "You cancelled the request in your wallet.";
    const revert = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      if (name && REVERTS[name]) return REVERTS[name];
      if (name) return `The contract refused with ${name}.`;
    }
    return e.shortMessage;
  }
  return e instanceof Error ? e.message : String(e);
}
