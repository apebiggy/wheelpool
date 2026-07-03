// @ts-nocheck
'use client';

import {useState,useEffect,useCallback,useRef} from 'react';

const POOLS=[
  {id:"spin",  name:"SPIN",  icon:"🎡",entryUsd:2,  entryEth:"0.0008",intervalH:1,  label:"EVERY HOUR",    offsetMin:0,
   color:"#FF6633",darkBg:"#1a0800",accent:"#FF9966",glow:"rgba(255,102,51,.4)",entries:47,poolEth:"0.0376",jackpot:"0.0169"},
  {id:"surge", name:"SURGE", icon:"🌊",entryUsd:5,  entryEth:"0.002", intervalH:6,  label:"EVERY 6 HOURS", offsetMin:5,
   color:"#00DDAA",darkBg:"#0a2a08",accent:"#44FFCC",glow:"rgba(0,221,170,.4)",  entries:83,poolEth:"0.166", jackpot:"0.0747"},
  {id:"twelve",name:"TWELVE",icon:"🔥",entryUsd:10, entryEth:"0.004", intervalH:12, label:"EVERY 12 HOURS",offsetMin:15,
   color:"#AA44FF",darkBg:"#0e0020",accent:"#CC88FF",glow:"rgba(170,68,255,.4)", entries:38,poolEth:"0.380", jackpot:"0.1710"},
  {id:"mega",  name:"MEGA",  icon:"⚡",entryUsd:25, entryEth:"0.01",  intervalH:24, label:"DAILY",         offsetMin:20,
   color:"#FFDD00",darkBg:"#1a1600",accent:"#FFE944",glow:"rgba(255,221,0,.4)",  entries:29,poolEth:"0.290", jackpot:"0.1305"},
];
const PRIZE_SLOTS=[
  {label:"JACKPOT",icon:"🥇",color:"#FFD700",pct:50,  rank:1},
  {label:"2ND",    icon:"🥈",color:"#C0C0C0",pct:25,  rank:2},
  {label:"3RD",    icon:"🥉",color:"#CD7F32",pct:15,  rank:3},
];
const MIN_TICKETS=3;
const SKINS=["Classic","Golden","Arctic Blue","Obsidian","Rainbow","Lava"];
const HATS=["None","Crown","Pirate Hat","Beach Cap","Top Hat","Halo"];
const ACCS=["None","Sunglasses","Monocle","Gold Chain","Cape","Angel Wings"];
const RARITIES=[
  {name:"Common",   color:"#888888",weight:50},
  {name:"Uncommon", color:"#44BB44",weight:25},
  {name:"Rare",     color:"#4499FF",weight:15},
  {name:"Epic",     color:"#BB44FF",weight:8},
  {name:"Legendary",color:"#FFDD00",weight:2},
];
// Abstract Chain CT legends on the wheel — green palette
const WHEEL_SEGS=[
  {c:"#1BF26A", v:"Cygaar"},    // Abstract bright green
  {c:"#0cba48", v:"Murad"},     // mid green
  {c:"#FFDD00", v:"Cobie"},     // gold contrast
  {c:"#4ef08a", v:"Ansem"},     // light green
  {c:"#1BF26A", v:"Hsaka"},     // bright green
  {c:"#0cba48", v:"Ignas"},     // mid green
  {c:"#FFDD00", v:"0xMert"},    // gold
  {c:"#6af5a8", v:"Tetra"},     // pale mint
  {c:"#0cba48", v:"Luca"},      // mid green
  {c:"#1BF26A", v:"ZachXBT"},   // bright green
  {c:"#FFDD00", v:"Punk65"},    // gold
  {c:"#4ef08a", v:"Loomdart"},  // light green
  {c:"#1BF26A", v:"Nansen"},    // bright green
  {c:"#6af5a8", v:"Sassal"},    // pale mint
  {c:"#0cba48", v:"Blknoiz"},   // mid green
  {c:"#FFDD00", v:"Miles"},     // gold
];

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function getRarity(){let r=Math.random()*100,a=0;for(const rt of RARITIES){a+=rt.weight;if(r<a)return rt;}return RARITIES[0];}
let _tc=1;
function mintTicket(pid){return{id:`WP-${pid.toUpperCase()}-${String(_tc++).padStart(4,"0")}`,poolId:pid,rarity:getRarity(),skin:SKINS[Math.floor(Math.random()*SKINS.length)],hat:HATS[Math.floor(Math.random()*HATS.length)],acc:ACCS[Math.floor(Math.random()*ACCS.length)],status:"LIVE",ts:Date.now(),addr:"0x"+Math.random().toString(16).slice(2,10)};}
function stackR(results){const m={};results.forEach(r=>{const id=r.ticket.id;if(!m[id])m[id]={ticket:r.ticket,prizes:[],totalEth:0};m[id].prizes.push(r);m[id].totalEth+=parseFloat(r.ethWon);});return Object.values(m).sort((a,b)=>b.prizes.length-a.prizes.length||b.totalEth-a.totalEth);}
function genDemo(pid){return[...Array(13).fill("Common"),...Array(8).fill("Uncommon"),...Array(5).fill("Rare"),...Array(3).fill("Epic"),...Array(1).fill("Legendary")].map((rn,i)=>{const rarity=RARITIES.find(r=>r.name===rn)||RARITIES[0];return{id:`DEMO-${pid.toUpperCase()}-${String(i+1).padStart(3,"0")}`,poolId:pid,rarity,skin:SKINS[i%6],hat:HATS[i%6],acc:ACCS[i%6],status:"LIVE",addr:`0x${(0xA000+i).toString(16)}...${(0xB000+i).toString(16)}`};});}
function getNextSpin(ih,om){const n=Date.now(),im=ih*3600000,o2=om*60000,dm=86400000,b=Math.floor(n/dm)*dm;for(let i=0;i<=Math.ceil(24/ih)+2;i++){const t=b+i*im+o2;if(t>n+500)return t;}return b+dm+o2;}
function fmtMs(ms){if(ms<=0)return"00:00:00";const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);return`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}

/* ══════════════════════════════════════════════
   INTERACTIVE WHEEL — replaces the static image wheel
══════════════════════════════════════════════ */

function PenguinSVG({skin="Classic",hat="None",acc="None",size=80}){
  const SC={"Classic":{b:"#1a1a2e",belly:"#f0f0f0"},"Golden":{b:"#8B6914",belly:"#FFD700"},"Arctic Blue":{b:"#1a3a6e",belly:"#b8d4ff"},"Obsidian":{b:"#0a0a12",belly:"#2a2a3a"},"Rainbow":{b:"#7a1a8e",belly:"#ffccff"},"Lava":{b:"#8e2a1a",belly:"#ff9966"}};
  const{b,belly}=SC[skin]||SC["Classic"];
  return(<svg width={size} height={size} viewBox="0 0 80 80">
    {acc==="Cape"&&<path d="M18,42 L10,76 L70,76 L62,42 Z" fill="#9933cc" opacity="0.85"/>}
    <ellipse cx="16" cy="50" rx="9" ry="15" fill={b} transform="rotate(-12,16,50)"/>
    <ellipse cx="64" cy="50" rx="9" ry="15" fill={b} transform="rotate(12,64,50)"/>
    {acc==="Angel Wings"&&<><ellipse cx="6" cy="44" rx="13" ry="22" fill="white" opacity="0.88" transform="rotate(-18,6,44)"/><ellipse cx="74" cy="44" rx="13" ry="22" fill="white" opacity="0.88" transform="rotate(18,74,44)"/></>}
    <ellipse cx="40" cy="52" rx="22" ry="26" fill={b}/><ellipse cx="40" cy="56" rx="14" ry="18" fill={belly}/>
    <ellipse cx="40" cy="24" rx="18" ry="18" fill={b}/>
    <circle cx="33" cy="20" r="4.5" fill="white"/><circle cx="47" cy="20" r="4.5" fill="white"/>
    <circle cx="34" cy="21" r="2.8" fill="#222"/><circle cx="48" cy="21" r="2.8" fill="#222"/>
    <circle cx="34.5" cy="20.5" r="1" fill="white"/><circle cx="48.5" cy="20.5" r="1" fill="white"/>
    <ellipse cx="40" cy="29" rx="6" ry="4" fill="#FF9900"/>
    <ellipse cx="32" cy="77" rx="9" ry="5" fill="#FF9900"/><ellipse cx="48" cy="77" rx="9" ry="5" fill="#FF9900"/>
    {hat==="Crown"&&<g><rect x="27" y="10" width="26" height="6" fill="#FFD700"/><rect x="25" y="7" width="6" height="5" fill="#FFD700"/><rect x="37" y="4" width="6" height="8" fill="#FFD700"/><rect x="49" y="7" width="6" height="5" fill="#FFD700"/><rect x="29" y="9" width="4" height="4" fill="#FF2222"/><rect x="39" y="6" width="4" height="4" fill="#4444FF"/><rect x="49" y="9" width="4" height="4" fill="#22CC22"/></g>}
    {hat==="Pirate Hat"&&<g><rect x="18" y="10" width="44" height="5" fill="#1a1a1a"/><rect x="22" y="3" width="36" height="9" fill="#1a1a1a"/><rect x="32" y="4" width="4" height="2" fill="white"/><rect x="38" y="3" width="4" height="3" fill="white"/><rect x="42" y="4" width="4" height="2" fill="white"/></g>}
    {hat==="Beach Cap"&&<g><rect x="18" y="12" width="44" height="5" fill="#FF5522"/><rect x="24" y="5" width="32" height="9" fill="#FF5522"/><rect x="28" y="6" width="24" height="7" fill="#FF8855"/></g>}
    {hat==="Top Hat"&&<g><rect x="18" y="14" width="44" height="5" fill="#111"/><rect x="24" y="1" width="32" height="15" fill="#111"/><rect x="28" y="13" width="24" height="2" fill="#FFDD00"/></g>}
    {hat==="Halo"&&<ellipse cx="40" cy="5" rx="17" ry="6" fill="none" stroke="#FFD700" strokeWidth="3"/>}
    {acc==="Sunglasses"&&<g><rect x="26" y="17" width="11" height="8" fill="#111" rx="1"/><rect x="43" y="17" width="11" height="8" fill="#111" rx="1"/><rect x="37" y="19" width="6" height="4" fill="#111"/></g>}
    {acc==="Monocle"&&<g><circle cx="33" cy="20" r="7" fill="none" stroke="#FFD700" strokeWidth="2"/><line x1="38" y1="25" x2="40" y2="32" stroke="#FFD700" strokeWidth="1.5"/></g>}
    {acc==="Gold Chain"&&<g><ellipse cx="40" cy="46" rx="11" ry="4" fill="none" stroke="#FFD700" strokeWidth="2"/><circle cx="40" cy="50" r="3.5" fill="#FFD700"/></g>}
  </svg>);}

/* ══════════════════════════════════════════════
   DRAW THEATER
══════════════════════════════════════════════ */

export default function DrawTheater({pool,userTickets,drawTime,onClose}){
  // ── STATE MACHINE ─────────────────────────────────────────
  // upcoming  → draw hasn't happened yet, countdown running
  // onchain   → simulating: keeper calls executeDraw() on-chain
  // confirming→ simulating: waiting for VRF to fulfil randomness
  // revealing → results committed on-chain; wheel animates as cosmetic replay
  // complete  → animation done, results & reward flow shown
  const[phase,setPhase]=useState("upcoming");
  const[drawn,setDrawn]=useState([]);
  const[wAng,setWAng]=useState(0);
  const[spinning,setSpinning]=useState(false);
  const[showSweep,setShowSweep]=useState(false);
  
  const[txHash,setTxHash]=useState("");
  const[vrfHash,setVrfHash]=useState("");
  const[committedResults,setCommitted]=useState(null); // set during confirming, before animation


  // ── COUNTDOWN ──────────────────────────────────────────────
  const[msLeft,setMsLeft]=useState(0);
  const[autoFired,setAutoFired]=useState(false);
  const simulateRef=useRef(()=>{});
  // Init client-only values after mount to avoid hydration mismatch
  useEffect(()=>{
    setTxHash("0x"+Math.random().toString(16).slice(2,18)+"...");
    setVrfHash("0x"+Math.random().toString(16).slice(2,18)+"...");
    setMsLeft(drawTime-Date.now());
  },[]);

  useEffect(()=>{
    if(phase!=="upcoming"||autoFired)return;
    const tick=setInterval(()=>{
      const rem=drawTime-Date.now();
      setMsLeft(rem);
      if(rem<=0){
        clearInterval(tick);
        setAutoFired(true);
        setTimeout(()=>simulateRef.current(),400);
      }
    },500);
    return()=>clearInterval(tick);
  },[phase,drawTime,autoFired,simulate]);

  const pf=parseFloat(pool.poolEth);
  const[drawHistory,setDrawHistory]=useState([]);
  useEffect(()=>{
    const now=Date.now();
    const intervalMs=pool.intervalH*3600000;
    const RANK=[{icon:"🥇",label:"JACKPOT",color:"#FFD700",pct:0.50},
                {icon:"🥈",label:"2ND",color:"#C0C0C0",pct:0.25},
                {icon:"🥉",label:"3RD",color:"#CD7F32",pct:0.15}];
    const wallets=["0xa0b1","0xc2d3","0xf4e5","0xa1b2","0xb3c4","0xd5e6","0xe7f8","0xf9a0","0x1234","0x5678","0x9abc","0xdef0","0x2468","0x1357","0xaced"];
    setDrawHistory(Array.from({length:10},(_,i)=>({
      id:100-i,
      date:new Date(now-(i+1)*intervalMs).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),
      time:new Date(now-(i+1)*intervalMs).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),
      winners:RANK.map((r,ri)=>({...r,
        addr:wallets[(i*3+ri)%wallets.length]+"..."+wallets[(i+ri+5)%wallets.length].slice(2),
        eth:(pf*0.9*r.pct).toFixed(5),
      })),
    })));
  },[pool.id]);
  const all=[...userTickets.filter(t=>t.poolId===pool.id),...genDemo(pool.id)];
  const myCount=userTickets.filter(t=>t.poolId===pool.id).length;

  // Pre-generate results — represents what VRF committed on-chain
  const computeResults=()=>{
    const results=[];
    const cnt=all.length;
    if(cnt===1){
      results.push({slot:PRIZE_SLOTS[0],ticket:all[0],poolIndex:0,ethWon:(pf*PRIZE_SLOTS[0].pct/100).toFixed(5),isSolo:true});
    } else if(cnt===2){
      const ref=(pf*0.45).toFixed(5);
      const rs=[{label:"REFUND",icon:"↩",color:"#4499FF",pct:45,rank:1},{label:"REFUND",icon:"↩",color:"#4499FF",pct:45,rank:2}];
      for(let i=0;i<2;i++) results.push({slot:rs[i],ticket:all[i],poolIndex:i,ethWon:ref,isRefund:true});
    } else {
      // WITHOUT replacement — track original index for precise wheel landing
      let pool=[...all];
      let indices=all.map((_,i)=>i);
      for(let i=0;i<3;i++){
        const pick=Math.floor(Math.random()*pool.length);
        const winner=pool[pick];
        const poolIndex=indices[pick];
        pool.splice(pick,1);
        indices.splice(pick,1);
        results.push({slot:PRIZE_SLOTS[i],ticket:winner,poolIndex,ethWon:(pf*PRIZE_SLOTS[i].pct/100).toFixed(5)});
      }
    }
    return results;
  };

  const simulate=useCallback(async()=>{
    // Step 1 — keeper submits executeDraw() tx
    setPhase("onchain");
    await sleep(2200);

    // Step 2 — VRF fulfils; results committed on-chain (computed here for demo)
    setPhase("confirming");
    const results=computeResults();
    setCommitted(results);
    await sleep(2400);

    // Step 3 — replay: wheel spins to visually reveal each committed result
    setPhase("revealing");
    setSpinning(true);
    await sleep(60);
    const revealed=[];
    const N_wheel=all.length;
    let currentAngle=0;
    for(let i=0;i<results.length;i++){
      const res=results[i];
      // Segment centre of winner in wheel-space (degrees, clockwise from top)
      const segCenter=(res.poolIndex+0.5)/N_wheel*360;
      // How far we need to rotate from current resting position to land on that segment
      const normalized=((currentAngle%360)+360)%360;
      const diff=((segCenter-normalized)+360)%360;
      // Add 8 full rotations minimum for drama, then land precisely
      const finalAngle=currentAngle+diff+8*360;
      currentAngle=finalAngle;
      setWAng(finalAngle);
      await sleep(7400);
      revealed.push(res);setDrawn([...revealed]);
      if(i<results.length-1) await sleep(700);
    }
    setSpinning(false);
    const st=stackR(results);
    if(st.find(s=>s.prizes.length>=3)){setShowSweep(true);setTimeout(()=>setShowSweep(false),3200);}
    setPhase("complete");
  },[all,pf]);

  const reset=()=>{setPhase("upcoming");setDrawn([]);setCommitted(null);setShowSweep(false);};

  const stacked=stackR(drawn);
  const wonIndices=drawn.map(function(wr){return wr.poolIndex;});
  const RANK_COLS=["#FFD700","#C0C0C0","#CD7F32"];
  // Draw wheel uses actual pool tickets as segments
  const N=all.length,cx=120,cy=120,r=102;
  const SEG_PAL=["#1BF26A","#0cba48","#FFDD00","#4ef08a","#FFE944","#44FF44","#2ad460","#6af5a8"];
  const segColor=i=>SEG_PAL[i%SEG_PAL.length];
  const segLabel=i=>{
    const addr=all[i]?all[i].addr||all[i].id:"?";
    return N<=8?addr.slice(0,10):N<=16?addr.slice(0,6):("#"+(i+1));
  };
  const seg=i=>{const a1=(i/N)*2*Math.PI-Math.PI/2,a2=((i+1)/N)*2*Math.PI-Math.PI/2;return`M${cx},${cy} L${cx+r*Math.cos(a1)},${cy+r*Math.sin(a1)} A${r},${r} 0 0,1 ${cx+r*Math.cos(a2)},${cy+r*Math.sin(a2)}Z`;};
  const tp=i=>{const a=((i+.5)/N)*2*Math.PI-Math.PI/2;return{x:cx+r*.68*Math.cos(a),y:cy+r*.68*Math.sin(a)};};

  // ── REWARD DISTRIBUTION (shown after complete) ─────────────
  const rewardRows=()=>{
    if(!committedResults)return[];
    const map={};
    committedResults.forEach(r=>{
      const id=r.ticket.addr;
      if(!map[id])map[id]={addr:r.ticket.addr,id:r.ticket.id,eth:0,prizes:[]};
      map[id].eth+=parseFloat(r.ethWon);
      map[id].prizes.push(r.slot.label);
    });
    return Object.values(map);
  };

  return(<div style={{position:"fixed",inset:0,background:"#0d4a1e",display:"flex",flexDirection:"column",zIndex:1000,overflow:"auto",fontFamily:"'Press Start 2P',monospace"}}>
    {showSweep&&<div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,215,0,.12)",pointerEvents:"none",animation:"sweepPulse 1s ease-in-out infinite"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:56,marginBottom:20,animation:"bounceIn .5s ease-out"}}>👑</div><div style={{fontSize:18,color:"#FFD700",letterSpacing:3,textShadow:"0 0 30px #FFD700"}}>PERFECT SWEEP</div><div style={{fontSize:13,color:"#FFDD00",marginTop:10}}>ALL 3 SLOTS · SAME TICKET</div></div>
    </div>}

    {/* ── HEADER ── */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"2px solid #3a7a22",background:"#0a3c0a",flexShrink:0,flexWrap:"wrap",gap:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{color:pool.color,fontSize:15,letterSpacing:2}}>{pool.icon} {pool.name}</span>
        {/* Phase badge */}
        {phase==="upcoming"   &&<span style={{fontSize:11,color:"#FFDD00",background:"#FFDD0018",border:"1px solid #FFDD0044",padding:"3px 9px"}}>⏱ AWAITING DRAW</span>}
        {phase==="onchain"    &&<span style={{fontSize:11,color:"#1BF26A",background:"#1BF26A18",border:"1px solid #1BF26A44",padding:"3px 9px",animation:"blinkAnim .6s infinite"}}>⛓ EXECUTING ON-CHAIN</span>}
        {phase==="confirming" &&<span style={{fontSize:11,color:"#4499FF",background:"#4499FF18",border:"1px solid #4499FF44",padding:"3px 9px",animation:"blinkAnim .6s infinite"}}>🔮 VRF CONFIRMING</span>}
        {phase==="revealing"  &&<span style={{fontSize:11,color:"#FFDD00",background:"#FFDD0018",border:"1px solid #FFDD0044",padding:"3px 9px"}}>🎬 REPLAYING RESULT</span>}
        {phase==="complete"   &&<span style={{fontSize:11,color:"#44FF44",background:"#44FF4418",border:"1px solid #44FF4444",padding:"3px 9px"}}>✅ DRAW COMPLETE</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{color:"#FFDD00",fontSize:12}}>{pool.poolEth} ETH · {all.length} tickets</span>
        <button onClick={onClose} style={{
                display:"flex",alignItems:"center",gap:6,
                background:"#1a0808",color:"#FF4444",
                border:"2px solid #FF4444",
                padding:"8px 14px",cursor:"pointer",
                fontSize:10,fontFamily:"'Press Start 2P',monospace",
                outline:"none",letterSpacing:1,
              }}>← BACK</button>
      </div>
    </div>

    {/* ── BODY ── */}
    <div style={{display:"flex",flex:1,flexWrap:"wrap",overflow:"auto",background:"#0d4a1e"}}>

      {/* LEFT — wheel + slots */}
      <div style={{flex:"1 1 300px",padding:"24px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:18,background:"#0d4a1e"}}>

        {/* UPCOMING: pool status banner */}
        {phase==="upcoming"&&<>
          {all.length===1&&<div style={{background:"#1a0a00",border:"1px solid #FF6633",padding:"10px 16px",width:"100%",textAlign:"center",fontSize:11,color:"#FF9966"}}>⚠ SOLO POOL — 1 ticket wins jackpot only (50%) · 10% fee</div>}
          {all.length===2&&<div style={{background:"#0a0e18",border:"1px solid #4499FF",padding:"10px 16px",width:"100%",textAlign:"center",fontSize:11,color:"#4499FF"}}>↩ 2 TICKETS — pool splits 45/45 (refund)</div>}
          {all.length>=3&&<div style={{background:"#145414",border:"1px solid #1BF26A",padding:"10px 16px",width:"100%",textAlign:"center",fontSize:11,color:"#1BF26A"}}>✅ GAME ON — {all.length} tickets · 3 winners will be drawn</div>}
        </>}

        {/* ON-CHAIN / CONFIRMING: chain status */}
        {(phase==="onchain"||phase==="confirming")&&<div style={{background:"#0f5422",border:`1px solid ${phase==="onchain"?"#1BF26A":"#4499FF"}`,padding:"16px 20px",width:"100%",display:"flex",flexDirection:"column",gap:10}}>
          {phase==="onchain"&&<>
            <div style={{color:"#1BF26A",fontSize:12,letterSpacing:1,animation:"blinkAnim .6s infinite"}}>⛓ SUBMITTING DRAW TX</div>
            <div style={{fontSize:10,color:"#b0edca",lineHeight:2}}>Keeper calls <span style={{color:"#1BF26A"}}>executeDraw({pool.id})</span> on Abstract Chain</div>
            <div style={{fontSize:10,color:"#c0f0d0",fontFamily:"monospace",wordBreak:"break-all"}}>tx: {txHash}</div>
            <div style={{height:3,background:"#2a9444",overflow:"hidden"}}><div style={{height:"100%",background:"#1BF26A",animation:"loadBar 2.2s linear"}}/></div>
          </>}
          {phase==="confirming"&&<>
            <div style={{color:"#4499FF",fontSize:12,letterSpacing:1,animation:"blinkAnim .6s infinite"}}>🔮 AWAITING VRF RESPONSE</div>
            <div style={{fontSize:10,color:"#b0edca",lineHeight:2}}>Chainlink VRF generating verifiable random seed. Results will be committed on-chain before any animation plays.</div>
            <div style={{fontSize:10,color:"#c0f0d0",fontFamily:"monospace",wordBreak:"break-all"}}>vrf: {vrfHash}</div>
            <div style={{height:3,background:"#2a9444",overflow:"hidden"}}><div style={{height:"100%",background:"#4499FF",animation:"loadBar 2.4s linear"}}/></div>
          </>}
        </div>}

        {/* REVEALING / COMPLETE: "wheel is cosmetic replay" notice */}
        {(phase==="revealing"||phase==="complete")&&<div style={{background:"#0f5422",border:"1px solid #1BF26A33",padding:"8px 14px",width:"100%",textAlign:"center",fontSize:10,color:"#1BF26A",lineHeight:1.8}}>
          ⛓ Results committed on-chain before this animation.
          The wheel is a <span style={{color:"#FFDD00"}}>cosmetic replay</span> — not the draw itself.
        </div>}

        {/* Prize slots */}
        <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center",width:"100%"}}>
          {PRIZE_SLOTS.map((slot,i)=>{
            const d=drawn[i];
            const isActive=phase==="revealing"&&drawn.length===i;
            const sc=d?d.slot.color:slot.color;
            return(<div key={i} style={{flex:"1 1 90px",maxWidth:150,minWidth:85,background:d?`linear-gradient(160deg,${sc}18,#070e18)`:isActive?"#0e1a2e":"#0e2008",border:`2px solid ${d?sc+(d.isMulti?"":"88"):isActive?sc+"44":"#2a9444"}`,padding:"10px 5px",textAlign:"center",transition:"all .4s",position:"relative",overflow:"hidden",boxShadow:d?.isMulti?`0 0 20px ${sc}88`:d?.isRefund?"0 0 16px #4499FF44":"none"}}>
              {d?.isMulti&&<div style={{position:"absolute",top:2,right:2,background:"#FF4444",color:"#fff",fontSize:9,padding:"2px 4px"}}>🔥 MULTI</div>}
              {d?.isSolo&&<div style={{position:"absolute",top:2,left:2,background:"#FF6633",color:"#fff",fontSize:9,padding:"2px 3px"}}>SOLO</div>}
              {d?.isRefund&&<div style={{position:"absolute",top:2,right:2,background:"#4499FF",color:"#fff",fontSize:9,padding:"2px 4px"}}>↩</div>}
              <div style={{fontSize:16,marginBottom:10}}>{d?d.slot.icon:slot.icon}</div>
              <div style={{color:sc,fontSize:10,marginBottom:6}}>{d?d.slot.label:slot.label}</div>
              <div style={{color:"#9de8b4",fontSize:9,marginBottom:6}}>{d?d.slot.pct:slot.pct}%</div>
              {d?(<>
                <PenguinSVG skin={d.ticket.skin} hat={d.ticket.hat} acc={d.ticket.acc} size={44}/>
                <div style={{fontSize:9,color:d.ticket.rarity.color,margin:"3px 0"}}>{d.ticket.rarity.name.toUpperCase()}</div>
                <div style={{fontSize:9,color:"#888",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.ticket.addr}</div>
                <div style={{color:sc,fontSize:15,marginTop:3,fontFamily:"'VT323',monospace"}}>+{d.ethWon} ETH</div>
              </>):<div style={{height:68,display:"flex",alignItems:"center",justifyContent:"center",color:isActive?sc:"#2a9444",fontSize:isActive?20:16,animation:isActive?"blinkAnim .5s infinite":"none"}}>{isActive?"🎰":"?"}</div>}
            </div>);
          })}
        </div>

        {/* Wheel */}
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:18,color:"#FF4444",textShadow:"0 0 10px #FF4444",zIndex:5,lineHeight:1}}>▼</div>
          <svg width="240" height="240" style={{transform:`rotate(${wAng}deg)`,transition:spinning?"transform 7.2s cubic-bezier(0.22,1,0.36,1)":"none",filter:spinning?"drop-shadow(0 0 28px rgba(27,242,106,.9)) drop-shadow(0 0 8px #FFD700)":"drop-shadow(0 0 16px rgba(27,242,106,.4))",display:"block"}}>
            <circle cx={120} cy={120} r={112} fill="#0a2e10"/><circle cx={120} cy={120} r={108} fill="#0d3e16"/>
            {all.map((ticket,i)=>{
              const wonRank=wonIndices.indexOf(i);
              const isWon=wonRank>=0&&wonRank<3;
              const rankColor=isWon?["#FFD700","#C0C0C0","#CD7F32"][wonRank]:null;
              const fillColor=isWon?rankColor:segColor(i);
              const lbl=segLabel(i);
              const fs=N<=5?10:N<=10?7:N<=18?6:5;
              const tickA=(i/N)*2*Math.PI-Math.PI/2;
              const txt=isWon?(["🥇","🥈","🥉"][wonRank]||"")+" "+lbl:lbl;
              return(
                <g key={i}>
                  <path d={seg(i)} fill={fillColor} stroke={isWon?"#fff":"#0a2e10"} strokeWidth={isWon?2.5:1.5}/>
                  <line
                    x1={cx+(r+2)*Math.cos(tickA)} y1={cy+(r+2)*Math.sin(tickA)}
                    x2={cx+(r+9)*Math.cos(tickA)} y2={cy+(r+9)*Math.sin(tickA)}
                    stroke={isWon?"#fff":"#0a2e10"} strokeWidth="2"/>
                  <text x={tp(i).x} y={tp(i).y}
                    textAnchor="middle" dominantBaseline="middle"
                    fill={isWon?"#000":"#fff"}
                    fontSize={isWon?Math.min(fs+1,11):fs}
                    fontFamily="'Press Start 2P',monospace"
                    stroke={isWon?"rgba(255,255,255,.3)":"rgba(0,0,0,.6)"}
                    strokeWidth="1.5" paintOrder="stroke"
                    transform={`rotate(${((i+0.5)/N*360-90)+(tp(i).x<cx?180:0)},${tp(i).x},${tp(i).y})`}
                  >{txt}</text>
                </g>
              );
            })}
            <circle cx={120} cy={120} r={18} fill="#0a2e10" stroke="#1BF26A" strokeWidth="3"/><circle cx={120} cy={120} r={11} fill="#1BF26A"/><circle cx={120} cy={120} r={5} fill="#0a2e10"/>
          </svg>

        </div>

        {/* CTA area */}
        {phase==="upcoming"&&(()=>{
          const urgent=msLeft<30000;
          const critical=msLeft<10000;
          const totalMs=pool.intervalH*3600000;
          const pct=Math.max(0,Math.min(100,(1-msLeft/totalMs)*100));
          return(<>
            {myCount>0&&<div style={{background:`${pool.color}14`,border:`1px solid ${pool.color}33`,padding:"8px 16px",textAlign:"center",fontSize:11,color:pool.color}}>🎟 You hold {myCount} of {all.length} tickets — {(myCount/all.length*100).toFixed(1)}% per slot</div>}
            {/* Countdown */}
            <div style={{background:"#0a3c0a",border:`2px solid ${critical?"#FF4444":urgent?"#FFDD00":pool.color}`,padding:"18px 20px",textAlign:"center",width:"100%",boxShadow:critical?"0 0 24px rgba(255,68,68,.35)":urgent?"0 0 18px rgba(255,221,0,.3)":`0 0 16px ${pool.glow}`}}>
              <div style={{fontSize:10,color:critical?"#FF4444":urgent?"#FFDD00":"#b0edca",marginBottom:8,letterSpacing:2,animation:critical?"blinkAnim .5s infinite":"none"}}>
                {critical?"⚡ DRAW STARTING!":urgent?"⏱ DRAW SOON":"⏱ NEXT DRAW IN"}
              </div>
              <div style={{fontSize:"clamp(28px,6vw,40px)",letterSpacing:6,fontFamily:"'VT323',monospace",color:critical?"#FF4444":urgent?"#FFDD00":pool.color,animation:critical?"blinkAnim .4s infinite":"none",lineHeight:1.1,marginBottom:10}}>
                {fmtMs(Math.max(0,msLeft))}
              </div>
              <div style={{height:5,background:"#1a6830",overflow:"hidden",marginBottom:6}}>
                <div style={{width:`${pct}%`,height:"100%",background:critical?"#FF4444":urgent?"#FFDD00":pool.color,transition:"width .5s linear"}}/>
              </div>
              <div style={{fontSize:9,color:"#3a7a22"}}>{pool.label} · {all.length} TICKETS IN POOL</div>
            </div>
            <div style={{textAlign:"center",display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}>
              <div style={{fontSize:9,color:"#3a5a3c",lineHeight:1.8}}>{autoFired?"🚀 DRAW AUTO-FIRED":"Draw fires automatically at scheduled time"}</div>
              <button onClick={simulate} style={{padding:"10px 20px",background:"#0d4a1e",color:"#3a7a22",border:"1px solid #3a7a22",cursor:"pointer",fontSize:9,fontFamily:"'Press Start 2P',monospace",outline:"none"}}>▶ SIMULATE NOW</button>
            </div>
          </>);
        })()}
        {phase==="onchain"&&<div style={{color:"#1BF26A",fontSize:12,textAlign:"center",animation:"blinkAnim .6s infinite"}}>SUBMITTING TO CHAIN...</div>}
        {phase==="confirming"&&<div style={{color:"#4499FF",fontSize:12,textAlign:"center",animation:"blinkAnim .6s infinite"}}>VRF GENERATING SEED...</div>}
        {phase==="revealing"&&<div style={{color:"#FFDD00",fontSize:12,textAlign:"center",animation:"blinkAnim .8s infinite"}}>REPLAYING SLOT {drawn.length+1} OF {committedResults?.length||3}</div>}
        {phase==="complete"&&<div style={{display:"flex",gap:8}}>
          <button onClick={reset} style={{padding:"10px 16px",background:"#145414",color:"#1BF26A",border:"2px solid #1BF26A",cursor:"pointer",fontSize:11,fontFamily:"'Press Start 2P',monospace",outline:"none"}}>🔄 RESET</button>
          <button onClick={onClose} style={{padding:"10px 16px",background:"#0f5422",color:pool.color,border:`2px solid ${pool.color}`,cursor:"pointer",fontSize:11,fontFamily:"'Press Start 2P',monospace",outline:"none"}}>✓ DONE</button>
        </div>}
      </div>

      {/* RIGHT — info / results */}
      <div style={{flex:"0 0 270px",background:"#0f5422",borderLeft:"1px solid #3a7a22",padding:"20px",overflowY:"auto",display:"flex",flexDirection:"column",gap:14}}>

        {/* UPCOMING — pool info + mechanic */}
        {phase==="upcoming"&&<>
          <div style={{color:"#FFDD00",fontSize:12,letterSpacing:1}}>POOL INFO</div>
          <div style={{background:"#0d4a1e",border:"1px solid #2a5a2a",padding:"12px",display:"flex",flexDirection:"column",gap:7}}>
            {[["POOL",pool.name,pool.color],["TICKETS",`${all.length}`,all.length>=3?"#1BF26A":"#FF9933"],["DRAW",pool.label,"#aaa"],["POOL SIZE",`${pool.poolEth} ETH`,"#FFDD00"],["JACKPOT",`${(pf*0.50).toFixed(5)} ETH`,"#FFD700"],["2ND PLACE",`${(pf*0.25).toFixed(5)} ETH`,"#C0C0C0"],["3RD PLACE",`${(pf*0.15).toFixed(5)} ETH`,"#CD7F32"],["OPS + PROTOCOL",`${(pf*0.10).toFixed(5)} ETH`,"#FF6644"]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:10}}><span style={{color:"#9de8b4"}}>{l}</span><span style={{color:c}}>{v}</span></div>
            ))}
          </div>
          <div style={{color:"#FFDD00",fontSize:12,letterSpacing:1}}>HOW DRAW WORKS</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              ["⛓","AUTO EXECUTE","A keeper bot calls executeDraw() at the exact draw time. No human trigger needed."],
              ["🔮","ON-CHAIN RANDOM","Chainlink VRF provides verifiable randomness. Results are committed to the contract before any animation."],
              ["🎬","WHEEL = REPLAY","The spinning wheel is a cosmetic animation. Results were already final on-chain before you see them."],
              ["💸","AUTO PAYOUT","Winners receive ETH in the same tx. Abstract Chain paymaster sponsors gas — winners pay nothing."],
            ].map(([ic,t,d])=>(
              <div key={t} style={{background:"#0d4a1e",border:"1px solid #2a5a2a",padding:"10px 12px"}}>
                <div style={{fontSize:11,color:"#1BF26A",marginBottom:4}}>{ic} {t}</div>
                <div style={{fontSize:10,color:"#c0f0d0",lineHeight:1.8}}>{d}</div>
              </div>
            ))}
          </div>
        </>}

        {/* ON-CHAIN / CONFIRMING — chain status detail */}
        {(phase==="onchain"||phase==="confirming")&&<>
          <div style={{color:"#1BF26A",fontSize:12,letterSpacing:1}}>ON-CHAIN STATUS</div>
          <div style={{background:"#0f5422",border:"1px solid #1BF26A33",padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}><span style={{color:"#9de8b4"}}>NETWORK</span><span style={{color:"#1BF26A"}}>Abstract Chain</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}><span style={{color:"#9de8b4"}}>CONTRACT</span><span style={{color:"#aaa",fontFamily:"monospace"}}>WheelPool.sol</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}><span style={{color:"#9de8b4"}}>FUNCTION</span><span style={{color:"#1BF26A",fontFamily:"monospace"}}>executeDraw()</span></div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}><span style={{color:"#9de8b4"}}>TX HASH</span><span style={{color:"#b0edca",fontFamily:"monospace",fontSize:9}}>{txHash}</span></div>
          </div>
          <div style={{background:"#0f5422",border:"1px solid #4499FF33",padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
            <div style={{color:"#4499FF",fontSize:11,marginBottom:4}}>🔮 VRF REQUEST</div>
            <div style={{fontSize:10,color:"#c0f0d0",lineHeight:2}}>
              Contract requests randomness from Chainlink VRF.<br/>
              VRF returns a <span style={{color:"#4499FF"}}>verifiable random seed</span> that no one — not the keeper, not the team — can predict or manipulate.<br/>
              Winners determined from seed. Committed to chain.<br/>
              <span style={{color:"#FFDD00"}}>Animation only starts after this is final.</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}><span style={{color:"#9de8b4"}}>VRF TX</span><span style={{color:"#b0edca",fontFamily:"monospace",fontSize:9}}>{vrfHash}</span></div>
          </div>
        </>}

        {/* REVEALING / COMPLETE — results + reward distribution */}
        {(phase==="revealing"||phase==="complete")&&<>
          <div style={{color:"#FFDD00",fontSize:12,letterSpacing:1}}>{phase==="complete"?"FINAL RESULTS":"REPLAYING..."}</div>
          {stacked.length===0&&<div style={{color:"#9de8b4",fontSize:10,textAlign:"center",padding:12}}>Animating...</div>}
          {stacked.map(entry=>{
            const isM=entry.prizes.length>1,isS=entry.prizes.length>=3;
            return(<div key={entry.ticket.id} style={{background:isS?"#1a1400":isM?"#0c1a08":"#1a6a1a",border:`2px solid ${isS?"#FFD700":isM?"#44FF44":"#2a9444"}`,padding:"12px",marginBottom:8}}>
              {isS&&<div style={{color:"#FFD700",fontSize:10,marginBottom:7,textAlign:"center"}}>👑 SWEPT ALL SLOTS</div>}
              {isM&&!isS&&<div style={{color:"#44FF44",fontSize:10,marginBottom:7}}>🔥 MULTI-WIN ×{entry.prizes.length}</div>}
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                <PenguinSVG skin={entry.ticket.skin} hat={entry.ticket.hat} acc={entry.ticket.acc} size={38}/>
                <div><div style={{fontSize:9,color:entry.ticket.rarity.color,marginBottom:2}}>{entry.ticket.rarity.name.toUpperCase()}</div><div style={{fontSize:9,color:"#888",fontFamily:"monospace"}}>{entry.ticket.id}</div></div>
              </div>
              {entry.prizes.map((p,pi)=>(<div key={pi} style={{display:"flex",justifyContent:"space-between",background:"#0f5422",padding:"4px 7px",fontSize:10,marginBottom:3}}><span style={{color:p.slot.color}}>{p.slot.icon} {p.slot.label}</span><span style={{color:"#FFDD00"}}>+{p.ethWon} ETH</span></div>))}
              <div style={{display:"flex",justifyContent:"space-between",padding:"5px 7px",background:isM?"#0d2010":"#070b10",borderTop:`1px solid ${isM?"#44FF44":"#2a9444"}`,fontSize:11,marginTop:2}}>
                <span style={{color:isM?"#44FF44":"#445"}}>{isM?"STACKED":"TOTAL"}</span>
                <span style={{color:isM?"#44FF44":"#FFDD00",fontFamily:"'VT323',monospace",fontSize:16}}>{entry.totalEth.toFixed(5)} ETH</span>
              </div>
            </div>);
          })}

          {/* Reward distribution table — shown when complete */}
          {phase==="complete"&&committedResults&&<>
            <div style={{color:"#1BF26A",fontSize:12,letterSpacing:1,marginTop:4}}>💸 REWARD DISTRIBUTION</div>
            <div style={{background:"#0f5422",border:"1px solid #1BF26A33",padding:"12px",display:"flex",flexDirection:"column",gap:6}}>
              <div style={{fontSize:10,color:"#c0f0d0",marginBottom:6,lineHeight:1.8}}>
                All transfers in the same tx. Abstract Chain paymaster sponsors gas — winners receive ETH at zero cost to them.
              </div>
              {rewardRows().map((row,i)=>(
                <div key={i} style={{background:"#0f5422",border:"1px solid #3a7a22",padding:"7px 10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:9,color:"#1BF26A",fontFamily:"monospace"}}>{row.addr}</span>
                    <span style={{fontSize:14,color:"#FFDD00",fontFamily:"'VT323',monospace"}}>{row.eth.toFixed(5)} ETH</span>
                  </div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {row.prizes.map((p,j)=><span key={j} style={{fontSize:9,color:"#9de8b4",background:"#145414",padding:"1px 5px"}}>{p}</span>)}
                    <span style={{fontSize:9,color:"#1BF26A"}}>→ AUTO-SENT ✓</span>
                  </div>
                </div>
              ))}
              {/* Treasury row */}
              <div style={{background:"#120808",border:"1px solid #FF444433",padding:"7px 10px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:9,color:"#FF4444",fontFamily:"monospace"}}>WheelPool Treasury</span>
                  <span style={{fontSize:10,color:"#FF6644",fontFamily:"'VT323',monospace"}}>{(pf*0.10).toFixed(5)} ETH</span>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <span style={{fontSize:9,color:"#FF6644",background:"#0a0808",padding:"1px 5px"}}>KEEPER + VRF + PAYMASTER + REVENUE</span>
                  <span style={{fontSize:9,color:"#FF4444"}}>→ AUTO-SENT ✓</span>
                </div>
              </div>
              <div style={{borderTop:"1px solid #3a7a22",paddingTop:6,display:"flex",justifyContent:"space-between",fontSize:10}}>
                <span style={{color:"#9de8b4"}}>TOTAL DISTRIBUTED</span>
                <span style={{color:"#1BF26A"}}>{pf.toFixed(5)} ETH</span>
              </div>
            </div>
            {phase==="complete"&&<>
              <div style={{marginTop:14,background:"#0d4a1e",border:"2px solid #1BF26A",padding:"12px 14px"}}>
                <div style={{color:"#1BF26A",fontSize:10,marginBottom:8,letterSpacing:1}}>⛓ ON-CHAIN VERIFICATION</div>
                <div style={{fontSize:9,color:"#b0edca",marginBottom:4,fontFamily:"monospace",wordBreak:"break-all"}}>
                  TX: {txHash}
                </div>
                <div style={{fontSize:9,color:"#b0edca",marginBottom:10,fontFamily:"monospace",wordBreak:"break-all"}}>
                  VRF: {vrfHash}
                </div>
                <a
                  href={`https://abscan.org/tx/${txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display:"block",
                    background:"#1BF26A",color:"#000",
                    padding:"10px 14px",
                    fontSize:10,
                    fontFamily:"'Press Start 2P',monospace",
                    textDecoration:"none",
                    textAlign:"center",
                    letterSpacing:1,
                    fontWeight:"bold",
                    marginBottom:6,
                  }}>🔍 VERIFY DRAW TX →</a>
                <a
                  href={`https://abscan.org/tx/${vrfHash}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display:"block",
                    background:"transparent",color:"#4499FF",
                    border:"1px solid #4499FF",
                    padding:"8px 14px",
                    fontSize:9,
                    fontFamily:"'Press Start 2P',monospace",
                    textDecoration:"none",
                    textAlign:"center",
                    letterSpacing:1,
                  }}>🔮 VERIFY VRF RANDOMNESS →</a>
              </div>
            </>}
          </>}
        </>}
        {/* DRAW HISTORY */}
        {drawHistory.length>0&&<div style={{marginTop:16}}>
          <div style={{color:"#FFDD00",fontSize:11,letterSpacing:1,marginBottom:10}}>📜 LAST 10 DRAWS</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {drawHistory.map((draw)=>(
              <div key={draw.id} style={{background:"#0f4a0f",border:"1px solid #2a7a22",padding:"10px 12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{color:"#1BF26A",fontSize:9}}>DRAW #{draw.id}</span>
                  <span style={{color:"#9de8b4",fontSize:9,fontFamily:"monospace"}}>{draw.date} {draw.time}</span>
                </div>
                {draw.winners.map((w,wi)=>(
                  <div key={wi} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0",borderTop:wi>0?"1px solid rgba(42,122,34,.3)":"none"}}>
                    <span style={{fontSize:10}}>{w.icon}</span>
                    <span style={{color:"#9de8b4",fontSize:8,fontFamily:"monospace",flex:1,marginLeft:6}}>{w.addr}</span>
                    <span style={{color:w.color,fontSize:12,fontFamily:"'VT323',monospace"}}>+{w.eth} ETH</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>}
      </div>
    </div>
  </div>);}
