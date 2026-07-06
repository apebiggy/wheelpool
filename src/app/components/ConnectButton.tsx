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

  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>

        {/* Balance — hidden on mobile via CSS */}
        <div className="wallet-balance" style={{
          background: "#0f5422", border: "2px solid #44FF44",
          color: "#44FF44", padding: "6px 10px", fontSize: "11px",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
        }}>
          {formattedBalance} ETH
        </div>

        {/* Address */}
        <div style={{
          background: "#0d4a1e", border: "2px solid #44FF44",
          color: "#44FF44", padding: "6px 10px",
          fontSize: "clamp(9px, 2vw, 11px)",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: "5px",
        }}>
          {isAGW ? "AGW" : "MM"} {shortAddr(address)}
        </div>

        {/* Disconnect */}
        <button
          onClick={() => { disconnect(); if (isAGW) logout(); }}
          style={{
            height: "34px", width: "34px",
            background: "#2a0808", border: "2px solid #FF4444",
            color: "#FF4444", cursor: "pointer", fontSize: "13px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >X</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

      {/* Primary: Abstract Global Wallet */}
      <button
        onClick={() => connect({ connector: abstractWalletConnector() })}
        style={{
          background: "#0d4a1e", border: "2px solid #1BF26A",
          color: "#1BF26A", padding: "8px 12px",
          cursor: "pointer", fontSize: "clamp(9px,2vw,10px)",
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: "nowrap", outline: "none",
        }}
      >
        CONNECT
      </button>

      {/* Injected fallback */}
      <button
        onClick={() => connect({ connector: injected() })}
        style={{
          background: "#1a0800", border: "2px solid #FF6600",
          color: "#FF9933", padding: "8px 10px",
          cursor: "pointer", fontSize: "clamp(9px,2vw,10px)",
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
