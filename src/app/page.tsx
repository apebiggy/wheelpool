import { ConnectButton } from './components/ConnectButton';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0d4a1e',
      fontFamily: "'Press Start 2P', monospace",
      color: '#fff',
    }}>

      {/* HEADER */}
      <header style={{
        background: 'rgba(12,60,24,.98)',
        borderBottom: '3px solid #1BF26A',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Row 1: Logo + Connect */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          gap: '8px',
        }}>
          {/* Left spacer */}
          <div style={{ flex: 1 }} />

          {/* Center: Logo */}
          <div style={{
            flexShrink: 0,
            fontSize: 'clamp(18px, 3.8vw, 36px)',
            letterSpacing: 2,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            <span style={{ color: '#FFDD00' }}>Wheel</span>
            <span style={{ color: '#44FF44' }}>Pool</span>
          </div>

          {/* Right: Connect Button */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <ConnectButton />
          </div>
        </div>

        {/* Row 2: Nav */}
        <nav style={{
          display: 'flex',
          borderTop: '1px solid rgba(27,242,106,.22)',
          background: 'rgba(8,50,8,.6)',
        }}>
          {[
            ['pools', '🎡 POOLS'],
            ['tickets', '🎟 TICKETS'],
            ['how', '📖 HOW'],
          ].map(([key, label]) => (
            <button
              key={key}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9de8b4',
                padding: '10px 4px',
                fontFamily: "'Press Start 2P', monospace",
                fontSize: 'clamp(8px, 2.8vw, 14px)',
                letterSpacing: 1,
                borderBottom: '3px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* HERO */}
      <section style={{
        textAlign: 'center',
        padding: '80px 20px',
      }}>
        <h1 style={{
          fontSize: 'clamp(24px, 5vw, 48px)',
          color: '#FFDD00',
          marginBottom: '20px',
          letterSpacing: 3,
        }}>
          WIN ETH ON{' '}
          <span style={{ color: '#1BF26A' }}>ABSTRACT CHAIN</span>
        </h1>
        <p style={{
          fontSize: 'clamp(10px, 2vw, 14px)',
          color: '#9de8b4',
          marginBottom: '40px',
          lineHeight: 2,
        }}>
          Mint NFT tickets · Auto draw · Instant payouts · Zero gas for winners
        </p>

        {/* Pool cards placeholder */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: '40px',
        }}>
          {[
            { name: 'SPIN',   price: '$2',  schedule: 'EVERY HOUR',     color: '#FF6633' },
            { name: 'SURGE',  price: '$5',  schedule: 'EVERY 6 HOURS',  color: '#00DDAA' },
            { name: 'TWELVE', price: '$10', schedule: 'EVERY 12 HOURS', color: '#AA44FF' },
            { name: 'MEGA',   price: '$25', schedule: 'DAILY',          color: '#FFDD00' },
          ].map((pool) => (
            <div
              key={pool.name}
              style={{
                background: '#145414',
                border: `2px solid ${pool.color}`,
                padding: '24px',
                minWidth: '200px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{
                fontSize: '36px',
                color: pool.color,
                fontFamily: "'VT323', monospace",
                marginBottom: '8px',
              }}>
                {pool.price}
              </div>
              <div style={{
                fontSize: '14px',
                color: pool.color,
                marginBottom: '8px',
                letterSpacing: 2,
              }}>
                {pool.name}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#9de8b4',
              }}>
                {pool.schedule}
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}
