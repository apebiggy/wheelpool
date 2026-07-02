'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function ConnectButton() {
  const { login, logout, authenticated, user } = usePrivy();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const formattedBalance = balance
    ? parseFloat(balance.formatted).toFixed(4)
    : '0.0000';

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const balanceBox = (
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
  );

  const disconnectBtn = (onClick: () => void) => (
    <button
      onClick={onClick}
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
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      ✕
    </button>
  );

  // Connected via injected wallet (MetaMask / Rabby)
  if (isConnected && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {balanceBox}
        <div style={{
          background: '#0d4a1e',
          border: '2px solid #44FF44',
          color: '#44FF44',
          padding: '8px 12px',
          fontSize: '12px',
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: 'nowrap',
        }}>
          🟢 {shortAddress(address)}
        </div>
        {disconnectBtn(() => disconnect())}
      </div>
    );
  }

  // Connected via Privy (Abstract Global Wallet / social login)
  if (authenticated && user) {
    const privyAddr = user.wallet?.address ?? '';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {balanceBox}
        <div style={{
          background: '#0d4a1e',
          border: '2px solid #44FF44',
          color: '#44FF44',
          padding: '8px 12px',
          fontSize: '12px',
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: 'nowrap',
        }}>
          🟢 {privyAddr ? shortAddress(privyAddr) : 'Connected'}
        </div>
        {disconnectBtn(() => logout())}
      </div>
    );
  }

  // Not connected — show both options
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={() => login()}
        style={{
          background: '#0d4a1e',
          border: '2px solid #1BF26A',
          color: '#1BF26A',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '10px',
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: 'nowrap',
        }}
      >
        ⚡ CONNECT
      </button>
      <button
        onClick={() => connect({ connector: injected() })}
        style={{
          background: '#1a0800',
          border: '2px solid #FF6600',
          color: '#FF9933',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '10px',
          fontFamily: "'Press Start 2P', monospace",
          whiteSpace: 'nowrap',
        }}
      >
        🦊 WALLET
      </button>
    </div>
  );
}
