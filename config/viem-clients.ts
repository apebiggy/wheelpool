import { createPublicClient, createWalletClient, http } from "viem";
import { eip712WalletActions, publicActionsL2 } from "viem/zksync";
import { chain } from "./chain";

// Public client — for reading contract state
export const publicClient = createPublicClient({
  chain: chain,
  transport: http(),
}).extend(publicActionsL2());

// Wallet client — for sending transactions
export const walletClient = createWalletClient({
  chain: chain,
  transport: http(),
}).extend(eip712WalletActions());
