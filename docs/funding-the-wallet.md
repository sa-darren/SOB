# Funding the wallets

Ship or Burn needs two wallets on Ethereum mainnet: a main wallet that pays IMD and owns vault 0, and a small keeper wallet that only pays gas.

## The two wallets

| Wallet | Holds | Used for |
| --- | --- | --- |
| Main | IMD and a little ETH | Oracle tests, the swarm launch, vault 0's deposit and its schedule |
| Keeper | At most 0.02 ETH, no IMD | Sending `settle()` from GitHub Actions |

Rules for the main wallet:

- It must be an ordinary account that signs with its own key. IMD does not accept contract wallets such as a Safe.
- Hackathon prizes go to the deployer address, so pay for the launch from the wallet you want the prize in. Ask @imdradar to confirm which address they pay for swarm launches.
- Its private key goes in `apps/keeper/.env` on your machine, so use a fresh wallet that holds only this project's funds, not your main holdings.

The keeper wallet is a second fresh wallet. Its key goes in GitHub Actions secrets and nowhere else.

## How much to send

IMD is `0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7` on Ethereum mainnet (symbol IMD, 18 decimals). Every paid IMD action costs 0.5 IMD, and IMD's server pays the gas for those payments.

| Stage | IMD | ETH for gas |
| --- | --- | --- |
| Today: three oracle tests | 1.5 | One Permit2 approval |
| Oct 10: Sepolia rehearsal launch | 0.5 | None |
| Oct 11: mainnet launch | 0.5 | None |
| Oct 11: vault 0 deposit, 10 tranches of 1 IMD | 10 | One approval and one `createVault` (about 252k gas) |
| Oct 11: vault 0 schedule, 12 runs | 6 | One `linkSchedule` |
| Oct 20: site hosting job | 0.5 | None |
| **Total, main wallet** | **19** | **About 0.01 ETH is plenty** |
| Keeper wallet | 0 | 0.02 ETH |

To start today you only need 1.5 IMD and about 0.005 ETH in the main wallet. Buy the rest before Oct 11. Check the IMD price first: the blueprint's figure of about $9.73 is from Sept 25.

Payments to IMD are always made in mainnet IMD, including the Sepolia rehearsal.

## Steps

1. **Create the main wallet** in the wallet app you use, on Ethereum mainnet, and note its address.
2. **Send ETH to it**: 0.01 ETH covers every transaction in the table, plus the swap in the next step.
3. **Get IMD.** Swap ETH for IMD on Ethereum mainnet. Paste the token address above into the swap rather than searching by name, and confirm the address before you sign. The docs don't name a venue; IMD trades in Uniswap v4 pools on mainnet.
4. **Check the balances** (Foundry's `cast`, any mainnet RPC):

   ```sh
   export RPC_URL=https://ethereum-rpc.publicnode.com
   cast balance YOUR_ADDRESS --ether --rpc-url $RPC_URL
   cast call 0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7 "balanceOf(address)(uint256)" YOUR_ADDRESS --rpc-url $RPC_URL
   ```

   The IMD figure is in atomic units: `1500000000000000000` is 1.5 IMD.
5. **Give the scripts the key.** Copy `apps/keeper/.env.example` to `apps/keeper/.env` and fill in `RPC_URL` and `PAYER_PRIVATE_KEY`. `.env` is ignored by git; never commit it or paste the key anywhere else.
6. **Run the free check, then the paid test:**

   ```sh
   pnpm --filter @ship-or-burn/keeper ask
   pnpm --filter @ship-or-burn/keeper ask --pay --approve-permit2
   ```

   The first command spends nothing. The second sends one approval transaction (an unlimited IMD allowance to Permit2, the standard contract at `0x000000000022D473030F116dDEE9F6B43aC78BA3`), then pays 0.5 IMD. Leave out `--approve-permit2` on later runs.
7. **Verify the answer** once the request reads attested:

   ```sh
   pnpm --filter @ship-or-burn/keeper verify-question REQUEST_ID
   ```

## The keeper wallet, after the launch

1. Create a second fresh wallet and send it 0.02 ETH. One verdict costs about 100k–120k gas.
2. In the `sa-darren/SOB` repository settings, add the secrets `RPC_URL` and `KEEPER_PRIVATE_KEY` (and `WEBHOOK_URL` if you want verdicts posted to Discord).
3. Set the repository variable `KEEPER_ENABLED` to `true`. Until then the scheduled workflow does nothing.

## If something fails

| Message | What it means | What to do |
| --- | --- | --- |
| `The wallet holds … IMD; this costs more` | Not enough IMD | Nothing was paid. Top up and run again |
| `The wallet has not approved Permit2 for IMD` | No allowance yet | Run again with `--approve-permit2` |
| `payment_rejected` / `insufficient_funds` | IMD refused the payment | Nothing was charged. Check the balance and retry |
| `quote_expired` | The 10-minute quote ran out | Run again; a new quote is made |
| `order … is still pending` | The payment is confirming | The order's token is saved in `apps/keeper/.imd-orders.json`; orders are also listed at `https://api.imd.fun/requests/paid-by/YOUR_ADDRESS` |
