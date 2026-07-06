"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";
import { formatUnits } from "viem";

function AGWLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#000"/>
      <path d="M16 5 L26 27 H19.5 L16 19.5 L12.5 27 H6 Z" fill="#1BF26A"/>
      <path d="M10 22 H22" stroke="#000" strokeWidth="3.5"/>
    </svg>
  );
}

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
        <div className="wallet-balance" style={{
          background: "#0f5422", border: "2px solid #44FF44",
          color: "#44FF44", padding: "6px 10px", fontSize: "11px",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
        }}>
          {formattedBalance} ETH
        </div>
        <div style={{
          background: "#0d4a1e", border: "2px solid #44FF44",
          color: "#44FF44", padding: "6px 10px",
          fontSize: "clamp(9px, 2vw, 11px)",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
        }}>
          {shortAddr(address)}
        </div>
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
    <button
      onClick={() => connect({ connector: abstractWalletConnector() })}
      title="Connect with Abstract Global Wallet"
      style={{
        background: "#0d4a1e", border: "2px solid #1BF26A",
        color: "#1BF26A", padding: "8px 14px",
        cursor: "pointer", fontSize: "clamp(9px,2vw,10px)",
        fontFamily: "'Press Start 2P', monospace",
        whiteSpace: "nowrap", outline: "none",
        display: "flex", alignItems: "center", gap: "7px",
      }}
    >
      <AGWLogo size={16}/>
      CONNECT
    </button>
  );
}
