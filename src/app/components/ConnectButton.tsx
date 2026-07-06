"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";
import { injected } from "wagmi/connectors";
import { formatUnits } from "viem";

export function ConnectButton() {
  const { login, logout } = useLoginWithAbstract();
  const { address, status, connector } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const isConnected = status === "connected" && !!address;
  const isAGW = connector?.id === "abstract";

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : "0.0000";

  const shortAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Connected state
  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

        {/* Balance */}
        <div style={{
          background: "#0f5422", border: "2px solid #44FF44",
          color: "#44FF44", padding: "8px 12px", fontSize: "12px",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
        }}>
          ETH {formattedBalance}
        </div>

        {/* Address */}
        <div style={{
          background: "#0d4a1e", border: "2px solid #44FF44",
          color: "#44FF44", padding: "8px 12px", fontSize: "12px",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          {isAGW ? "AGW" : "wallet"} {shortAddr(address)}
        </div>

        {/* Disconnect */}
        <button
          onClick={() => { disconnect(); if (isAGW) logout(); }}
          style={{
            width: "38px", height: "38px",
            background: "#2a0808", border: "2px solid #FF4444",
            color: "#FF4444", cursor: "pointer", fontSize: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >X</button>
      </div>
    );
  }

  // Not connected
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

      {/* Primary: Abstract Global Wallet */}
      <button
        onClick={() => connect({ connector: abstractWalletConnector() })}
        style={{
          background: "#0d4a1e", border: "2px solid #1BF26A",
          color: "#1BF26A", padding: "8px 14px",
          cursor: "pointer", fontSize: "10px",
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: "nowrap", letterSpacing: "1px", outline: "none",
        }}
      >
        CONNECT
      </button>

      {/* Secondary: injected (MetaMask / Rabby) */}
      <button
        onClick={() => connect({ connector: injected() })}
        style={{
          background: "#1a0800", border: "2px solid #FF6600",
          color: "#FF9933", padding: "8px 10px",
          cursor: "pointer", fontSize: "10px",
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: "nowrap", outline: "none",
        }}
        title="MetaMask / Rabby"
      >
        MM
      </button>
    </div>
  );
}
