'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { formatUnits } from 'viem';
import { useAbstractClient } from '@abstract-foundation/agw-react';
import { abstractWalletConnector } from '@abstract-foundation/agw-react/connectors';

export function ConnectButton() {
  const { login, logout, authenticated } = usePrivy();
  const { address, isConnected, connector } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });
  const { data: agwClient } = useAbstractClient();

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : '0.0000';

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const isAGW = connector?.id === 'abstract' || !!agwClient;

  // ── Connected ────────────────────────────────────────────────
  if (isConnected && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Balance */}
        <div style={{
          background: '#0f5422',
          border: '2px solid #44FF44',
          color: '#44FF44',
          padding: '8px 12px',
          fontSize: '12px',
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: 'nowrap',
        }}>
          ⬡ {formattedBalance} ETH
        </div>

        {/* Address */}
        <div style={{
          background: '#0d4a1e',
          border: '2px solid #44FF44',
          color: '#44FF44',
          padding: '8px 12px',
          fontSize: '12px',
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          {isAGW ? '⚡' : '🟢'} {shortAddress(address)}
          {isAGW && (
            <span style={{
              fontSize: '8px',
              color: '#1BF26A',
              border: '1px solid #1BF26A',
              padding: '2px 4px',
            }}>
              AGW
            </span>
          )}
        </div>

        {/* Disconnect */}
        <button
          onClick={() => { disconnect(); if (authenticated) logout(); }}
          style={{
            width: '38px',
            height: '38px',
            background: '#2a0808',
            border: '2px solid #FF4444',
            color: '#FF4444',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  // ── Not connected ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

      {/* Primary: Abstract Global Wallet */}
      <button
        onClick={() => connect({ connector: abstractWalletConnector() })}
        style={{
          background: '#0d4a1e',
          border: '2px solid #1BF26A',
          color: '#1BF26A',
          padding: '8px 14px',
          cursor: 'pointer',
          fontSize: '10px',
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: 'nowrap',
          letterSpacing: 1,
        }}
      >
        ⚡ CONNECT
      </button>

      {/* Secondary: Injected (MetaMask / Rabby) */}
      <button
        onClick={() => connect({ connector: injected() })}
        style={{
          background: '#1a0800',
          border: '2px solid #FF6600',
          color: '#FF9933',
          padding: '8px 10px',
          cursor: 'pointer',
          fontSize: '10px',
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: 'nowrap',
        }}
        title="MetaMask / Rabby"
      >
        🦊
      </button>
    </div>
  );
}
