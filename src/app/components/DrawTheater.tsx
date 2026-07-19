// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';

const POOLS = [
  { id:'spin',   name:'SPIN',   icon:'🎡', intervalH:1,  label:'EVERY HOUR',     entryEth:'0.0008', poolEth:'0.0376', color:'#FF6633', darkBg:'#1a0800' },
  { id:'surge',  name:'SURGE',  icon:'🌊', intervalH:6,  label:'EVERY 6 HOURS',  entryEth:'0.002',  poolEth:'0.166',  color:'#00DDAA', darkBg:'#001610' },
  { id:'twelve', name:'TWELVE', icon:'🔥', intervalH:12, label:'EVERY 12 HOURS', entryEth:'0.004',  poolEth:'0.380',  color:'#AA44FF', darkBg:'#0e0020' },
  { id:'mega',   name:'MEGA',   icon:'⚡', intervalH:24, label:'DAILY',          entryEth:'0.01',   poolEth:'0.290',  color:'#FFDD00', darkBg:'#1a1600' },
];

const PRIZE_SLOTS = [
  { label:'JACKPOT', icon:'🥇', color:'#FFD700', pct:50 },
  { label:'2ND',     icon:'🥈', color:'#C0C0C0', pct:25 },
  { label:'3RD',     icon:'🥉', color:'#CD7F32', pct:15 },
];

// Points per non-winning ticket based on pool entry fee
const POOL_POINTS = { 'spin':100,'surge':250,'twelve':500,'mega':1250 };
const getPoolPoints = (poolId) => {
  const base = poolId.includes('-') ? poolId.split('-')[0] : poolId;
  return POOL_POINTS[base] || 100;
};

const WALLETS = [
  '0xa0b1...c2d3','0xf4e5...a6b7','0xa1b2...c3d4',
  '0xb3c4...d5e6','0xd5e6...e7f8','0xe7f8...f9a0',
  '0x1234...5678','0x9abc...def0','0x2468...1357',
  '0xaced...bef0','0x5555...aaaa','0x7777...8888',
];

const CONFETTI_COLORS = ['#1BF26A','#FFDD00','#FF6633','#AA44FF','#00DDAA','#FF4444','#44FF44','#FFE944'];

function fmtMs(ms) {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getNextDraw(intervalH) {
  const now = Date.now();
  const ms  = intervalH * 3600000;
  return Math.ceil(now / ms) * ms;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Confetti component ───────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    size: 6 + Math.random() * 8,
    shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'star',
  }));

  return (
    <div style={{
      position:'fixed', inset:0, pointerEvents:'none', zIndex:2000, overflow:'hidden',
    }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute',
          left:`${p.left}%`,
          top:'-20px',
          width: p.size,
          height: p.shape === 'rect' ? p.size * 0.5 : p.size,
          background: p.color,
          borderRadius: p.shape === 'circle' ? '50%' : '2px',
          animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
          boxShadow: `0 0 ${p.size}px ${p.color}88`,
        }}/>
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg) scale(1);   opacity:1; }
          80%  { opacity:1; }
          100% { transform: translateY(110vh) rotate(720deg) scale(0.5); opacity:0; }
        }
      `}</style>
    </div>
  );
}

// ── Wheel SVG ────────────────────────────────────────────────
// 16 distinct green shades — dark to bright, cycling through the palette
const SEG_COLORS = [
  '#0d5e1e', // very dark forest
  '#1a7a2e', // dark green
  '#0f9e36', // medium dark
  '#1BF26A', // Abstract bright green
  '#13c455', // vivid mid
  '#0aad48', // rich green
  '#44FF44', // neon lime
  '#2ee870', // bright mint
  '#0d7a30', // deep forest
  '#26d95f', // fresh green
  '#0c6628', // hunter green
  '#3fff88', // electric mint
  '#0e8c35', // emerald
  '#15b84d', // medium bright
  '#06522a', // darkest
  '#52f098', // pale bright
];
const N_SEGS = 16;

function WheelSVG({ angle, spinning, winners }) {
  const cx = 120, cy = 120, r = 102;
  const winnerIndices = winners.map(w => w.segIndex);

  const seg = (i) => {
    const a1 = (i / N_SEGS) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((i+1) / N_SEGS) * 2 * Math.PI - Math.PI / 2;
    return `M${cx},${cy} L${cx+r*Math.cos(a1)},${cy+r*Math.sin(a1)} A${r},${r} 0 0,1 ${cx+r*Math.cos(a2)},${cy+r*Math.sin(a2)}Z`;
  };
  const tp = (i) => {
    const a = ((i+0.5) / N_SEGS) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * 0.68 * Math.cos(a), y: cy + r * 0.68 * Math.sin(a) };
  };

  return (
    <div style={{ position:'relative', display:'inline-block' }}>
      <div style={{
        position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)',
        fontSize:20, color:'#FF4444', textShadow:'0 0 10px #FF4444', zIndex:5, lineHeight:1,
      }}>▼</div>
      <svg width="240" height="240" style={{
        transform:`rotate(${angle}deg)`,
        transition: spinning ? 'transform 7.2s cubic-bezier(0.22,1,0.36,1)' : 'none',
        filter: spinning
          ? 'drop-shadow(0 0 28px rgba(27,242,106,.9))'
          : 'drop-shadow(0 0 14px rgba(27,242,106,.4))',
        display:'block',
      }}>
        <circle cx={cx} cy={cy} r={112} fill="#0a2e10"/>
        <circle cx={cx} cy={cy} r={108} fill="#0d3e16"/>
        {Array.from({length: N_SEGS}, (_,i) => {
          const wonRank = winnerIndices.indexOf(i);
          const isWon   = wonRank >= 0;
          const rankColors = ['#FFD700','#C0C0C0','#CD7F32'];
          const fill = isWon ? rankColors[wonRank] : SEG_COLORS[i % SEG_COLORS.length];
          const pt   = tp(i);
          const rot  = ((i+0.5)/N_SEGS*360-90) + (pt.x < cx ? 180 : 0);
          // For light greens use dark text, for dark greens use white text
          const brightness = fill === '#1BF26A' || fill === '#44FF44' || fill === '#2ee870' || fill === '#3fff88' || fill === '#52f098' || fill === '#26d95f' ? 'light' : 'dark';
          const isDark = brightness === 'light';
          return (
            <g key={i}>
              <path d={seg(i)} fill={fill} stroke={isWon?'#fff':'#0a2e10'} strokeWidth={isWon?2.5:1.5}/>
              <text x={pt.x} y={pt.y}
                textAnchor="middle" dominantBaseline="middle"
                fill={isDark?'#0a2e10':'#fff'} fontSize={6}
                fontFamily="'Press Start 2P',monospace"
                transform={`rotate(${rot},${pt.x},${pt.y})`}
              >{`#${i+1}`}</text>
            </g>
          );
        })}
        {Array.from({length: N_SEGS}, (_,i) => {
          const a = (i / N_SEGS) * 2 * Math.PI - Math.PI / 2;
          return <line key={i}
            x1={cx+(r+2)*Math.cos(a)} y1={cy+(r+2)*Math.sin(a)}
            x2={cx+(r+9)*Math.cos(a)} y2={cy+(r+9)*Math.sin(a)}
            stroke="#1BF26A" strokeWidth="2"/>;
        })}
        <circle cx={cx} cy={cy} r={18} fill="#0a2e10" stroke="#1BF26A" strokeWidth="3"/>
        <circle cx={cx} cy={cy} r={11} fill="#1BF26A"/>
        <circle cx={cx} cy={cy} r={5}  fill="#0a2e10"/>
      </svg>
    </div>
  );
}

// ── Main DrawTheater ─────────────────────────────────────────
export default function DrawTheater({ onClose, onPointsEarned, activePerks }) {
  const { address } = useAccount();
  const shortAddr = address ? `${address.slice(0,6)}...${address.slice(-4)}` : null;

  const [selectedPool, setSelectedPool] = useState(POOLS[0]);
  const [phase,    setPhase]    = useState('waiting');
  const [msLeft,   setMsLeft]   = useState(0);
  const [angle,    setAngle]    = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [results,  setResults]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [autoFired,setAutoFired]= useState(false);
  const runDrawRef = useRef(null);
  const [confetti, setConfetti] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const angleRef = useRef(0);

  // Countdown
  useEffect(() => {
    setPhase('waiting');
    setResults([]);
    setAutoFired(false);
    setSpinning(false);
    setConfetti(false);
    const tick = setInterval(() => {
      const rem = getNextDraw(selectedPool.intervalH) - Date.now();
      setMsLeft(rem);
      if (rem <= 0) {
        clearInterval(tick);
        setAutoFired(true);
        setTimeout(() => {
          if (runDrawRef.current) runDrawRef.current();
          else setTimeout(() => runDrawRef.current && runDrawRef.current(), 500);
        }, 600);
      }
    }, 500);
    setMsLeft(getNextDraw(selectedPool.intervalH) - Date.now());
    return () => clearInterval(tick);
  }, [selectedPool.id]);

  // auto-fire handled directly in countdown interval via runDrawRef

  // Always keep ref pointing to latest runDraw — assigned on every render (no effect delay)
  runDrawRef.current = runDraw;

  // History with pool name + fake TX hash
  useEffect(() => {
    const intervalMs = selectedPool.intervalH * 3600000;
    const pf = parseFloat(selectedPool.poolEth);
    const now = Date.now();
    setHistory(Array.from({length:10}, (_,i) => {
      const ts = now - (i+1) * intervalMs;
      const txHash = '0x' + Array.from({length:16},()=>Math.floor(Math.random()*16).toString(16)).join('') + '...';
      return {
        id: 100 - i,
        pool: selectedPool,
        date: new Date(ts).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),
        time: new Date(ts).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
        txHash,
        txUrl: `https://abscan.org/tx/${txHash}`,
        winners: PRIZE_SLOTS.map((slot, ri) => ({
          icon:  slot.icon,
          color: slot.color,
          label: slot.label,
          addr:  WALLETS[(i*3+ri) % WALLETS.length],
          eth:   (pf * 0.9 * slot.pct / 100).toFixed(5),
        })),
      };
    }));
  }, [selectedPool.id]);

  const runDraw = useCallback(async () => {
    if (phase === 'spinning') return;
    setPhase('spinning');
    setResults([]);
    setSpinning(true);
    setConfetti(false);

    const pf = parseFloat(selectedPool.poolEth);
    const drawn = [];
    let userWon = false;

    for (let i = 0; i < 3; i++) {
      const segIndex = Math.floor(Math.random() * N_SEGS);
      // Arrow is at 12 o'clock. Segment i center is at (i+0.5)/N*360 - 90 in wheel coords.
      // To land segment i at arrow, wheel must rotate by: (360 - segCenter) % 360
      const segCenter = (segIndex + 0.5) / N_SEGS * 360;
      const targetR   = (360 - segCenter + 360) % 360;
      const current   = ((angleRef.current % 360) + 360) % 360;
      const diff      = ((targetR - current) + 360) % 360;
      const target    = angleRef.current + diff + 8 * 360;
      angleRef.current = target;
      setAngle(target);

      await sleep(7600);

      // 25% chance connected wallet wins this slot (demo)
      const isUserWin = shortAddr && Math.random() < 0.25;
      if (isUserWin) userWon = true;

      const addr = isUserWin ? shortAddr : WALLETS[Math.floor(Math.random() * WALLETS.length)];
      drawn.push({
        slot: PRIZE_SLOTS[i],
        segIndex,
        addr,
        eth: (pf * 0.9 * PRIZE_SLOTS[i].pct / 100).toFixed(5),
        isUser: isUserWin,
      });
      setResults([...drawn]);
      if (i < 2) await sleep(800);
    }

    setSpinning(false);
    setPhase('complete');

    // Award WHEEL points to non-winners
    if (onPointsEarned) {
      const poolBase = selectedPool.id?.split('-')[0] || selectedPool.id || 'spin';
      const ptsPerTicket = POOL_POINTS[poolBase] || 100;
      // Check if boost perk is active
      const boost = activePerks && activePerks.includes('points-boost') ? 2 : 1;
      if (!userWon) {
        const ptsEarned = ptsPerTicket * boost;
        onPointsEarned(ptsEarned);
        setPointsEarned(ptsEarned);
        setTimeout(() => setPointsEarned(0), 3000);
      }
    }

    // Confetti if connected wallet won anything
    if (userWon) {
      setConfetti(true);
      setTimeout(() => setConfetti(false), 5000);
    }
  }, [selectedPool, phase, shortAddr]);

  const urgent   = msLeft < 30000;
  const critical = msLeft < 10000;
  const totalMs  = selectedPool.intervalH * 3600000;
  const pct      = Math.max(0, Math.min(100, (1 - msLeft / totalMs) * 100));

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'#0d4a1e', color:'#fff',
      fontFamily:"'Press Start 2P',monospace",
      display:'flex', flexDirection:'column', overflow:'auto',
    }}>
      <Confetti active={confetti}/>

      {/* Winner banner */}
      {confetti && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, bottom:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:2001, pointerEvents:'none',
        }}>
          <div style={{
            background:'rgba(10,30,10,.92)',
            border:'3px solid #FFD700',
            boxShadow:'0 0 60px rgba(255,215,0,.6), inset 0 0 40px rgba(255,215,0,.1)',
            padding:'32px 48px',
            textAlign:'center',
            borderRadius:0,
            backdropFilter:'blur(4px)',
          }}>
            <div style={{fontSize:56, marginBottom:12, lineHeight:1}}>🏆</div>
            <div style={{
              color:'#FFD700', fontSize:16, letterSpacing:4,
              textShadow:'0 0 20px #FFD700',
              marginBottom:8,
            }}>YOU WON!</div>
            <div style={{
              color:'#1BF26A', fontSize:10, letterSpacing:2, marginTop:12,
            }}>
              CHECK PRIZE SLOTS BELOW
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px', background:'rgba(10,50,10,.98)',
        borderBottom:'2px solid #1BF26A', flexShrink:0, flexWrap:'wrap', gap:8,
      }}>
        <span style={{color:'#FFDD00', fontSize:12, letterSpacing:2}}>🎲 DRAW ROOM</span>
        <select
          value={selectedPool.id}
          onChange={e => setSelectedPool(POOLS.find(p => p.id === e.target.value) || POOLS[0])}
          style={{
            background:'#145414', color:'#1BF26A',
            border:'2px solid #1BF26A', padding:'8px 12px',
            fontSize:10, fontFamily:"'Press Start 2P',monospace",
            cursor:'pointer', outline:'none',
          }}
        >
          {POOLS.map(p => (
            <option key={p.id} value={p.id}>{p.icon} {p.name} — {p.label}</option>
          ))}
        </select>
        <button onClick={onClose} style={{
          background:'#2a0808', border:'2px solid #FF4444',
          color:'#FF4444', padding:'8px 14px',
          cursor:'pointer', fontSize:10,
          fontFamily:"'Press Start 2P',monospace", outline:'none',
        }}>← BACK</button>
      </div>

      {/* Points earned toast */}
      {pointsEarned > 0 && (
        <div style={{
          position:'fixed', bottom:24, right:24,
          background:'#1a1600', border:'2px solid #FFDD00',
          color:'#FFDD00', padding:'12px 18px',
          fontSize:11, fontFamily:"'Press Start 2P',monospace",
          zIndex:3000, boxShadow:'0 0 24px rgba(255,221,0,.4)',
          animation:'blinkAnim .4s ease 0s 1',
        }}>
          🎡 +{pointsEarned.toLocaleString()} WHEEL PTS
        </div>
      )}
      <div style={{display:'none'}}>
      </div>

      {/* BODY */}
      <div style={{display:'flex', flex:1, flexWrap:'wrap', overflow:'auto'}}>

        {/* LEFT */}
        <div style={{
          flex:'1 1 300px', padding:'24px 16px',
          display:'flex', flexDirection:'column', alignItems:'center', gap:16,
        }}>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center'}}>
            <div style={{background:selectedPool.darkBg, border:`2px solid ${selectedPool.color}`, color:selectedPool.color, padding:'6px 14px', fontSize:10}}>
              {selectedPool.icon} {selectedPool.name}
            </div>
            <div style={{background:'#0a2010', border:'1px solid #2a7a22', color:'#9de8b4', padding:'6px 14px', fontSize:9}}>
              Pool: {selectedPool.poolEth} ETH
            </div>
          </div>

          {phase === 'waiting' && (
            <div style={{
              background:'#050d05', width:'100%',
              border:`2px solid ${critical?'#FF4444':urgent?'#FFDD00':selectedPool.color}`,
              padding:'18px', textAlign:'center',
            }}>
              <div style={{fontSize:10, marginBottom:8, letterSpacing:2, color:critical?'#FF4444':urgent?'#FFDD00':'#9de8b4'}}>
                {critical?'⚡ DRAW STARTING!':urgent?'⏱ DRAW SOON':'⏱ NEXT DRAW IN'}
              </div>
              <div style={{fontSize:'clamp(28px,6vw,42px)', letterSpacing:6, fontFamily:"'VT323',monospace", color:critical?'#FF4444':urgent?'#FFDD00':selectedPool.color, lineHeight:1.1, marginBottom:10}}>
                {fmtMs(Math.max(0, msLeft))}
              </div>
              <div style={{height:5, background:'#0a1a0a', overflow:'hidden', marginBottom:6}}>
                <div style={{width:`${pct}%`, height:'100%', background:critical?'#FF4444':urgent?'#FFDD00':selectedPool.color, transition:'width .5s linear'}}/>
              </div>
              <div style={{fontSize:9, color:'#3a7a22'}}>{selectedPool.label}</div>
            </div>
          )}

          <WheelSVG angle={angle} spinning={spinning} winners={results.map(r=>({segIndex:r.segIndex}))}/>

          <button
            onClick={runDraw}
            disabled={phase==='spinning'}
            style={{
              padding:'12px 20px',
              background:phase==='spinning'?'#0a2010':'#145414',
              color:phase==='spinning'?'#3a7a22':'#1BF26A',
              border:`2px solid ${phase==='spinning'?'#3a7a22':'#1BF26A'}`,
              cursor:phase==='spinning'?'default':'pointer',
              fontSize:10, fontFamily:"'Press Start 2P',monospace", outline:'none',
            }}
          >
            {phase==='spinning'?'⏳ SPINNING...':phase==='complete'?'🔄 SPIN AGAIN':'▶ SIMULATE DRAW'}
          </button>

          {/* Prize slot cards */}
          <div style={{display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center', width:'100%'}}>
            {PRIZE_SLOTS.map((slot, i) => {
              const res = results[i];
              return (
                <div key={i} style={{
                  flex:'1 1 90px', maxWidth:140, minWidth:85,
                  background:res?`linear-gradient(160deg,${slot.color}18,#050d05)`:'#050d05',
                  border:`2px solid ${res?slot.color:'#2a5a2a'}`,
                  padding:'10px 6px', textAlign:'center', transition:'all .4s',
                  boxShadow:res?.isUser?`0 0 20px ${slot.color}`:'none',
                }}>
                  <div style={{fontSize:16, marginBottom:8}}>{slot.icon}</div>
                  <div style={{color:slot.color, fontSize:9, marginBottom:4}}>{slot.label}</div>
                  <div style={{color:'#3a7a22', fontSize:8, marginBottom:8}}>{slot.pct}%</div>
                  {res ? (
                    <>
                      {res.isUser && <div style={{color:'#FFD700', fontSize:8, marginBottom:4}}>⭐ YOU!</div>}
                      <div style={{fontSize:8, color:res.isUser?'#FFD700':'#9de8b4', fontFamily:'monospace', marginBottom:4, wordBreak:'break-all'}}>{res.addr}</div>
                      <div style={{color:slot.color, fontSize:14, fontFamily:"'VT323',monospace"}}>+{res.eth} ETH</div>
                    </>
                  ) : (
                    <div style={{color:'#2a5a2a', fontSize:18}}>?</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — prize split + history */}
        <div style={{
          flex:'0 0 270px', background:'rgba(8,40,8,.8)',
          borderLeft:'1px solid #2a5a2a', padding:'20px',
          overflowY:'auto', display:'flex', flexDirection:'column', gap:14,
        }}>
          <div>
            <div style={{color:'#FFDD00', fontSize:10, marginBottom:10}}>PRIZE SPLIT</div>
            {PRIZE_SLOTS.map(slot => (
              <div key={slot.label} style={{display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:9}}>
                <span style={{color:slot.color}}>{slot.icon} {slot.label}</span>
                <span style={{color:'#9de8b4'}}>{(parseFloat(selectedPool.poolEth)*0.9*slot.pct/100).toFixed(5)} ETH</span>
              </div>
            ))}
            <div style={{display:'flex', justifyContent:'space-between', marginTop:6, paddingTop:6, borderTop:'1px solid #2a5a2a', fontSize:9}}>
              <span style={{color:'#FF6644'}}>⚙ OPS + PROTOCOL</span>
              <span style={{color:'#FF6644'}}>{(parseFloat(selectedPool.poolEth)*0.1).toFixed(5)} ETH</span>
            </div>
          </div>

          {/* History */}
          <div>
            <div style={{color:'#FFDD00', fontSize:10, marginBottom:10}}>📜 LAST 10 DRAWS</div>
            {history.map(draw => (
              <div key={draw.id} style={{
                background:'#0a2a0a', border:'1px solid #2a5a2a',
                padding:'8px 10px', marginBottom:8,
              }}>
                {/* Pool + draw ID + date */}
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <span style={{
                      background:draw.pool.darkBg,
                      border:`1px solid ${draw.pool.color}`,
                      color:draw.pool.color,
                      fontSize:7, padding:'2px 5px',
                    }}>
                      {draw.pool.icon} {draw.pool.name}
                    </span>
                    <span style={{color:'#1BF26A', fontSize:7}}>#{draw.id}</span>
                  </div>
                  <span style={{color:'#3a7a22', fontSize:7, fontFamily:'monospace'}}>{draw.date} {draw.time}</span>
                </div>

                {/* Winners */}
                {draw.winners.map((w, wi) => (
                  <div key={wi} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'2px 0',
                    borderTop:wi>0?'1px solid rgba(42,90,42,.4)':'none',
                  }}>
                    <span style={{fontSize:9}}>{w.icon}</span>
                    <span style={{color:'#9de8b4', fontSize:7, fontFamily:'monospace', flex:1, marginLeft:4}}>{w.addr}</span>
                    <span style={{color:w.color, fontSize:11, fontFamily:"'VT323',monospace"}}>+{w.eth}</span>
                  </div>
                ))}

                {/* TX verify link */}
                <a
                  href={draw.txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:'block', marginTop:6,
                    color:'#1BF26A', fontSize:7,
                    textDecoration:'none', letterSpacing:1,
                    borderTop:'1px solid rgba(27,242,106,.2)',
                    paddingTop:5,
                  }}
                >
                  🔍 VERIFY TX →
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
