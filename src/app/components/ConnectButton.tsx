"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";
import { formatUnits } from "viem";

export function ConnectButton({ wheelPoints = 0 }: { wheelPoints?: number }) {
  const { login, logout } = useLoginWithAbstract();
  const { address, status, connector } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const isConnected = status === "connected" && !!address;
  const isAGW = connector?.id === "abstract";

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(3)
    : "0.000";

  const shortAddr = (addr: string) =>
    `${addr.slice(0, 5)}...${addr.slice(-3)}`;

  if (isConnected && address) {
    return (
      <div className="wallet-connected" style={{
        display: "flex", alignItems: "center",
        gap: "6px", flexWrap: "nowrap",
      }}>
        {/* Compact single info pill on mobile, split on desktop */}
        <div className="wallet-desktop" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{
            background: "#0f5422", border: "1px solid #44FF44",
            color: "#44FF44", padding: "5px 8px", fontSize: "11px",
            fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
          }}>
            {formattedBalance} ETH
          </div>
          <div style={{
            background: "#0d4a1e", border: "1px solid #44FF44",
            color: "#44FF44", padding: "5px 8px", fontSize: "11px",
            fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
          }}>
            {shortAddr(address)}
          </div>
        </div>

        {/* Mobile: compact single pill */}
        <div className="wallet-mobile" style={{
          background: "#0d4a1e", border: "1px solid #44FF44",
          color: "#44FF44", padding: "4px 7px", fontSize: "9px",
          fontFamily: "'Press Start 2P', monospace",
          display: "none", flexDirection: "column", gap: "2px",
          lineHeight: 1.4,
        }}>
          <span>{shortAddr(address)}</span>
          <span style={{ color: "#9de8b4", fontSize: "8px" }}>{formattedBalance} ETH</span>
        </div>

        <button
          onClick={() => { disconnect(); if (isAGW) logout(); }}
          style={{
            height: "30px", width: "30px",
            background: "#2a0808", border: "1px solid #FF4444",
            color: "#FF4444", cursor: "pointer", fontSize: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >✕</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: abstractWalletConnector() })}
      style={{
        background: "#0d4a1e", border: "2px solid #1BF26A",
        color: "#1BF26A", padding: "8px 14px",
        cursor: "pointer", fontSize: "11px",
        fontFamily: "'Press Start 2P', monospace",
        whiteSpace: "nowrap", outline: "none", letterSpacing: "1px",
      }}
    >
      CONNECT AGW
    </button>
  );
}
