"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";
import { injected } from "wagmi/connectors";
import { formatUnits } from "viem";

// Abstract AGW logo — stylised "A" in brand green
function AGWLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#000"/>
      <path d="M16 5 L26 27 H19.5 L16 19.5 L12.5 27 H6 Z" fill="#1BF26A"/>
      <path d="M10 22 H22" stroke="#000" strokeWidth="3.5"/>
    </svg>
  );
}

// MetaMask fox logo — simplified recognisable version
function MetaMaskLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="4" fill="#F6851B"/>
      {/* Simplified fox silhouette */}
      <path d="M7 6 L16 13 L25 6 L28 18 L22 20 L16 26 L10 20 L4 18 Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.5"/>
      <path d="M7 6 L16 13 L11 18 L7 17 Z" fill="#E2761B"/>
      <path d="M25 6 L16 13 L21 18 L25 17 Z" fill="#E2761B"/>
      <path d="M11 18 L10 22 L14 21 Z" fill="#D7C1B3"/>
      <path d="M21 18 L22 22 L18 21 Z" fill="#D7C1B3"/>
      <path d="M14 21 L16 26 L18 21 L16 19 Z" fill="#C0AD9E"/>
      {/* Eyes */}
      <circle cx="13" cy="15" r="1.5" fill="white"/>
      <circle cx="19" cy="15" r="1.5" fill="white"/>
      <circle cx="13" cy="15" r="0.8" fill="#161616"/>
      <circle cx="19" cy="15" r="0.8" fill="#161616"/>
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

  // Connected — no wallet label, just balance + address + disconnect
  if (isConnected && address) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>

        {/* Balance */}
        <div className="wallet-balance" style={{
          background: "#0f5422", border: "2px solid #44FF44",
          color: "#44FF44", padding: "6px 10px", fontSize: "11px",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
        }}>
          {formattedBalance} ETH
        </div>

        {/* Address — no label */}
        <div style={{
          background: "#0d4a1e", border: "2px solid #44FF44",
          color: "#44FF44", padding: "6px 10px",
          fontSize: "clamp(9px, 2vw, 11px)",
          fontFamily: "'Press Start 2P', monospace", whiteSpace: "nowrap",
        }}>
          {shortAddr(address)}
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

  // Not connected — show logos on buttons
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

      {/* Primary: Abstract Global Wallet */}
      <button
        onClick={() => connect({ connector: abstractWalletConnector() })}
        title="Connect with Abstract Global Wallet"
        style={{
          background: "#0d4a1e", border: "2px solid #1BF26A",
          color: "#1BF26A", padding: "6px 12px",
          cursor: "pointer", fontSize: "clamp(9px,2vw,10px)",
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: "nowrap", outline: "none",
          display: "flex", alignItems: "center", gap: "7px",
        }}
      >
        <AGWLogo size={16}/>
        CONNECT
      </button>

      {/* Injected: MetaMask / Rabby */}
      <button
        onClick={() => connect({ connector: injected() })}
        title="Connect with MetaMask or Rabby"
        style={{
          background: "#1a0800", border: "2px solid #F6851B",
          color: "#F6851B", padding: "6px 10px",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          outline: "none", flexShrink: 0,
        }}
      >
        <MetaMaskLogo size={18}/>
      </button>
    </div>
  );
}
