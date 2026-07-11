"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";
import { formatUnits } from "viem";

export function ConnectButton() {
  const { login, logout } = useLoginWithAbstract();
  const { address, status, connector } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const isConnected = status === "connected" && !!address;
  const isAGW = connector?.id === "abstract";

  const eth = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(3)
    : "0.000";

  const short = (a: string) => `${a.slice(0,5)}...${a.slice(-3)}`;

  if (isConnected && address) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        {/* Desktop: two separate badges */}
        <div className="wallet-desktop" style={{
          display:"flex", alignItems:"center", gap:5,
        }}>
          <div style={{
            background:"#0f5422", border:"1px solid #44FF44",
            color:"#44FF44", padding:"4px 7px", fontSize:10,
            fontFamily:"'Press Start 2P',monospace", whiteSpace:"nowrap",
          }}>{eth} ETH</div>
          <div style={{
            background:"#0d4a1e", border:"1px solid #44FF44",
            color:"#44FF44", padding:"4px 7px", fontSize:10,
            fontFamily:"'Press Start 2P',monospace", whiteSpace:"nowrap",
          }}>{short(address)}</div>
        </div>

        {/* Mobile: one tiny pill */}
        <div className="wallet-mobile" style={{
          background:"#0d4a1e", border:"1px solid #44FF44",
          color:"#44FF44", padding:"3px 6px", fontSize:8,
          fontFamily:"'Press Start 2P',monospace", whiteSpace:"nowrap",
          display:"none",
        }}>{short(address)}</div>

        {/* Disconnect */}
        <button
          onClick={() => { disconnect(); if (isAGW) logout(); }}
          style={{
            height:28, width:28, flexShrink:0,
            background:"#2a0808", border:"1px solid #FF4444",
            color:"#FF4444", cursor:"pointer", fontSize:12,
            display:"flex", alignItems:"center", justifyContent:"center",
            outline:"none",
          }}
        >✕</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: abstractWalletConnector() })}
      style={{
        background:"#0d4a1e", border:"2px solid #1BF26A",
        color:"#1BF26A", padding:"7px 12px",
        cursor:"pointer", fontSize:"clamp(8px,2vw,10px)",
        fontFamily:"'Press Start 2P',monospace",
        whiteSpace:"nowrap", outline:"none",
      }}
    >
      CONNECT AGW
    </button>
  );
}
