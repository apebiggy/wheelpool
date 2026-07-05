import { abstractTestnet } from "viem/chains";

// Switch to abstract mainnet when ready for production
export const chain =
  process.env.NODE_ENV === "development"
    ? abstractTestnet  // local dev: testnet
    : abstractTestnet; // production: testnet (change to abstract when going mainnet)
