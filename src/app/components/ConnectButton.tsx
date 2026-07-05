"use client";

import { useAbstractClient, useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { formatUnits } from "viem";

export function ConnectButton() {
  const { login, logout }   = useLoginWithAbstract();
  const { address, status } = useAccount();
  const { disconnect }      = useDisconnect();
  const { data: balance }   = useBalance({ address });
  const { data: agwClient } = useAbstractClient();

  const isConnected = status === "connected" && !!address;

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : "0.0000";

  const shortAddr = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // ── Connected ─────────────────────────────────────────────
  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

        {/* Balance */}
        <div style={{
          background: "#0f5422", border: "2px solid #44FF44",
          color: "#44FF44", padding: "8px 12px", fontSize: "12px",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
        }}>
          ⬡ {formattedBalance} ETH
        </div>

        {/* Address + AGW badge */}
        <div style={{
          background: "#0d4a1e", border: "2px solid #44FF44",
          color: "#44FF44", padding: "8px 12px", fontSize: "12px",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          ⚡ {shortAddr(address)}
          {agwClient && (
            <span style={{
              fontSize: "8px", color: "#1BF26A",
              border: "1px solid #1BF26A", padding: "2px 4px",
            }}>AGW</span>
          )}
        </div>

        {/* Disconnect */}
        <button
          onClick={() => { disconnect(); logout(); }}
          style={{
            width: "38px", height: "38px",
            background: "#2a0808", border: "2px solid #FF4444",
            color: "#FF4444", cursor: "pointer", fontSize: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >✕</button>
      </div>
    );
  }

  // ── Not connected ────────────────────────────────────────
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>

      {/* Primary: Abstract Global Wallet */}
      <button
        onClick={() => login()}
        style={{
          background: "#0d4a1e", border: "2px solid #1BF26A",
          color: "#1BF26A", padding: "8px 14px",
          cursor: "pointer", fontSize: "10px",
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: "nowrap", letterSpacing: "1px",
          outline: "none",
        }}
      >
        ⚡ CONNECT
      </button>
    </div>
  );
}
