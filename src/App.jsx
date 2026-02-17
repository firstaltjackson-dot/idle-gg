import { useState, useEffect, useCallback, useRef } from "react";

const UPGRADES = [
  { id: "mouse",       name: "Gaming Mouse",     desc: "+1 XP / click",   icon: "🖱",  baseCost: 15,          costMult: 1.6,  clickBonus: 1,   passiveBonus: 0 },
  { id: "energy",      name: "Energy Drink",     desc: "+1 XP / sec",     icon: "⚡",  baseCost: 80,          costMult: 1.6,  clickBonus: 0,   passiveBonus: 1 },
  { id: "keyboard",    name: "Mech Keyboard",    desc: "+5 XP / click",   icon: "⌨️",  baseCost: 300,         costMult: 1.75, clickBonus: 5,   passiveBonus: 0 },
  { id: "headset",     name: "Pro Headset",      desc: "+8 XP / click",   icon: "🎧",  baseCost: 1200,        costMult: 1.8,  clickBonus: 8,   passiveBonus: 0 },
  { id: "monitor",     name: "4K Monitor",       desc: "+10 XP / sec",    icon: "🖥",  baseCost: 5000,        costMult: 1.9,  clickBonus: 0,   passiveBonus: 10 },
  { id: "chair",       name: "Gaming Chair",     desc: "+25 XP / sec",    icon: "🪑",  baseCost: 20000,       costMult: 2.0,  clickBonus: 0,   passiveBonus: 25 },
  { id: "pc",          name: "Beast PC",         desc: "+80 XP / sec",    icon: "💻",  baseCost: 100000,      costMult: 2.2,  clickBonus: 0,   passiveBonus: 80 },
  { id: "sponsorship", name: "Sponsorship Deal", desc: "+300 XP / sec",   icon: "🏆",  baseCost: 750000,      costMult: 2.4,  clickBonus: 0,   passiveBonus: 300 },
  { id: "esports",     name: "Esports Team",     desc: "+1K XP / sec",    icon: "🧑‍💻", baseCost: 5000000,     costMult: 2.6,  clickBonus: 0,   passiveBonus: 1000 },
  { id: "datacenter",  name: "Bot Farm",         desc: "+5K XP / sec",    icon: "🏭",  baseCost: 40000000,    costMult: 2.8,  clickBonus: 0,   passiveBonus: 5000 },
  { id: "ai",          name: "AI Coach",         desc: "+500 XP / click", icon: "🤖",  baseCost: 300000000,   costMult: 3.0,  clickBonus: 500, passiveBonus: 0 },
  { id: "studio",      name: "Game Studio",      desc: "+25K XP / sec",   icon: "🎬",  baseCost: 2000000000,  costMult: 3.2,  clickBonus: 0,   passiveBonus: 25000 },
  { id: "publisher",   name: "Global Publisher", desc: "+100K XP / sec",  icon: "🌐",  baseCost: 20000000000, costMult: 3.5,  clickBonus: 0,   passiveBonus: 100000 },
];

const RANKS = [
  { name: "NOOB",     min: 0 },
  { name: "BRONZE",   min: 1000 },
  { name: "SILVER",   min: 10000 },
  { name: "GOLD",     min: 100000 },
  { name: "PLATINUM", min: 1000000 },
  { name: "DIAMOND",  min: 10000000 },
  { name: "PRO",      min: 100000000 },
  { name: "LEGEND",   min: 1000000000 },
  { name: "G.O.A.T",  min: 20000000000 },
];

const ASCEND_THRESHOLD = 1000000000;

function fmt(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6)  return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3)  return (n / 1e3).toFixed(2) + "K";
  return Math.floor(n).toString();
}

export default function GameIdleClicker() {
  const [xp, setXp] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [counts, setCounts] = useState(() => Object.fromEntries(UPGRADES.map(u => [u.id, 0])));
  const [floats, setFloats] = useState([]);
  const [pulse, setPulse] = useState(false);
  const [ascensions, setAscensions] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tab, setTab] = useState("click"); // mobile tab: "click" | "upgrades"
  const passiveRef = useRef(0);
  const clickRef = useRef(1);

  useEffect(() => {
    const mult = Math.pow(5, ascensions);
    let passive = 0, clicks = 1;
    UPGRADES.forEach(u => {
      passive += u.passiveBonus * counts[u.id];
      clicks += u.clickBonus * counts[u.id];
    });
    passiveRef.current = passive * mult;
    clickRef.current = clicks * mult;
  }, [counts, ascensions]);

  useEffect(() => {
    const interval = setInterval(() => {
      const gain = passiveRef.current / 20;
      if (gain > 0) {
        setXp(x => x + gain);
        setTotalXp(t => t + gain);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getCost = useCallback((upgrade) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, counts[upgrade.id]));
  }, [counts]);

  const handleClick = useCallback((e) => {
    const gain = clickRef.current;
    setXp(x => x + gain);
    setTotalXp(t => t + gain);
    setPulse(true);
    setTimeout(() => setPulse(false), 100);
    const id = Date.now() + Math.random();
    const ox = (Math.random() - 0.5) * 60;
    setFloats(f => [...f, { id, text: `+${fmt(gain)}`, ox }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 900);
  }, []);

  const buy = useCallback((upgrade) => {
    const cost = getCost(upgrade);
    setXp(x => {
      if (x < cost) return x;
      setCounts(c => ({ ...c, [upgrade.id]: c[upgrade.id] + 1 }));
      return x - cost;
    });
  }, [getCost]);

  const doAscend = useCallback(() => {
    setAscensions(a => a + 1);
    setXp(0);
    setTotalXp(0);
    setCounts(Object.fromEntries(UPGRADES.map(u => [u.id, 0])));
    setFloats([]);
    setShowConfirm(false);
  }, []);

  const canAscend = totalXp >= ASCEND_THRESHOLD;
  const multiplier = Math.pow(5, ascensions);
  const rank = RANKS.reduce((acc, r) => totalXp >= r.min ? r : acc, RANKS[0]);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const rankProgress = nextRank ? Math.min((totalXp - rank.min) / (nextRank.min - rank.min), 1) : 1;
  const passive = passiveRef.current;

  const upgradeList = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {UPGRADES.map(upgrade => {
        const cost = getCost(upgrade);
        const owned = counts[upgrade.id];
        const canAfford = xp >= cost;
        if (totalXp < upgrade.baseCost) return null;
        return (
          <button key={upgrade.id} className="upgrade-btn" onClick={() => buy(upgrade)} disabled={!canAfford}>
            <span style={{ fontSize: 22 }}>{upgrade.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{upgrade.name}</span>
                {owned > 0 && <span style={{ fontSize: 10, color: "#2aff7a", background: "#2aff7a15", border: "1px solid #2aff7a33", borderRadius: 3, padding: "1px 6px", flexShrink: 0, marginLeft: 6 }}>x{owned}</span>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>{upgrade.desc}</span>
                <span style={{ fontSize: 10, color: canAfford ? "#2aff7a" : "#555", fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{fmt(cost)} XP</span>
              </div>
            </div>
          </button>
        );
      })}
      {(() => {
        const lockedCount = UPGRADES.filter(u => totalXp < u.baseCost).length;
        if (lockedCount === 0) return null;
        const nextLocked = UPGRADES.find(u => totalXp < u.baseCost);
        return (
          <div style={{ border: "1px dashed #1e1e1e", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, opacity: 0.5 }}>
            <span style={{ fontSize: 22, filter: "grayscale(1)" }}>🔒</span>
            <div>
              <div style={{ fontSize: 11, color: "#333", fontWeight: 700 }}>{lockedCount} upgrade{lockedCount > 1 ? "s" : ""} locked</div>
              <div style={{ fontSize: 9, color: "#2a2a2a", marginTop: 3, letterSpacing: 1 }}>NEXT UNLOCKS AT {fmt(nextLocked.baseCost)} TOTAL XP</div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "#080808",
      color: "#e8e8e8",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { width: 100%; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #2aff7a; }

        .click-btn {
          width: 160px; height: 160px;
          border-radius: 50%;
          border: 2px solid #2aff7a;
          background: transparent;
          color: #2aff7a;
          font-size: 48px;
          cursor: pointer;
          touch-action: manipulation;
          transition: box-shadow 0.15s, transform 0.1s, background 0.15s;
          display: flex; align-items: center; justify-content: center;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .click-btn:hover { box-shadow: 0 0 30px #2aff7a44; background: #2aff7a0a; }
        .click-btn:active { transform: scale(0.94); }
        .click-btn.pulse { box-shadow: 0 0 50px #2aff7a88; background: #2aff7a15; }

        .upgrade-btn {
          width: 100%;
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          color: #e8e8e8;
          padding: 12px 14px;
          cursor: pointer;
          touch-action: manipulation;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit;
          text-align: left;
          display: flex;
          gap: 10px;
          align-items: center;
          -webkit-tap-highlight-color: transparent;
        }
        .upgrade-btn:hover:not(:disabled) { border-color: #2aff7a; background: #2aff7a08; }
        .upgrade-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .float-text {
          position: absolute;
          font-size: 14px;
          font-weight: 700;
          color: #2aff7a;
          pointer-events: none;
          white-space: nowrap;
          animation: floatUp 0.9s ease-out forwards;
        }
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-60px); }
        }

        .rank-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #2aff7a, #00c453);
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .scanline {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
          pointer-events: none; z-index: 100;
        }

        .ascend-btn {
          width: 100%;
          padding: 13px;
          border-radius: 8px;
          border: 2px solid #ff6b2a;
          background: transparent;
          color: #ff6b2a;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
          cursor: pointer;
          touch-action: manipulation;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .ascend-btn:hover:not(:disabled) { background: #ff6b2a15; box-shadow: 0 0 30px #ff6b2a44; }
        .ascend-btn:disabled { opacity: 0.2; cursor: not-allowed; border-color: #333; color: #333; }

        .tab-btn {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          border-top: 2px solid transparent;
          color: #444;
          font-family: inherit;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 3px;
          cursor: pointer;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .tab-btn.active { color: #2aff7a; border-top-color: #2aff7a; }

        .confirm-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.9);
          display: flex; align-items: center; justify-content: center;
          z-index: 200;
          backdrop-filter: blur(4px);
          padding: 16px;
        }
        .confirm-box {
          background: #0e0e0e;
          border: 1px solid #ff6b2a44;
          border-radius: 12px;
          padding: 28px 24px;
          max-width: 320px;
          width: 100%;
          text-align: center;
        }
        .confirm-yes {
          padding: 12px 20px;
          background: transparent;
          border: 2px solid #ff6b2a;
          border-radius: 6px;
          color: #ff6b2a;
          font-family: inherit;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .confirm-yes:hover { background: #ff6b2a20; }
        .confirm-no {
          padding: 12px 20px;
          background: transparent;
          border: 1px solid #222;
          border-radius: 6px;
          color: #555;
          font-family: inherit;
          font-size: 11px;
          letter-spacing: 2px;
          cursor: pointer;
        }

        /* Desktop: side by side */
        .main-layout {
          display: flex;
          flex: 1;
          gap: 0;
        }
        .left-panel {
          width: 260px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 24px 20px;
          border-right: 1px solid #111;
        }
        .right-panel {
          flex: 1;
          padding: 24px 20px;
          overflow-y: auto;
          max-height: calc(100vh - 80px);
        }
        .mobile-tabs { display: none; }

        /* Mobile: stacked with tabs */
        @media (max-width: 600px) {
          .main-layout { flex-direction: column; }
          .left-panel {
            width: 100%;
            border-right: none;
            padding: 20px 16px 16px;
            gap: 16px;
          }
          .right-panel {
            flex: 1;
            padding: 16px;
            max-height: none;
            overflow-y: visible;
          }
          .mobile-tabs {
            display: flex;
            border-top: 1px solid #111;
            border-bottom: 1px solid #111;
            background: #080808;
            position: sticky;
            top: 0;
            z-index: 50;
          }
          .click-btn { width: 140px; height: 140px; font-size: 42px; }
          .tab-content-click { display: none; }
          .tab-content-upgrades { display: none; }
          .tab-content-click.visible { display: flex; flex-direction: column; align-items: center; gap: 16px; }
          .tab-content-upgrades.visible { display: block; }
        }
        @media (min-width: 601px) {
          .tab-content-click, .tab-content-upgrades { display: contents; }
        }
      `}</style>

      <div className="scanline" />

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div style={{ fontSize: 30, marginBottom: 14 }}>⚠️</div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "#ff6b2a", letterSpacing: 2 }}>ASCEND?</div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 12, lineHeight: 1.7 }}>All XP and upgrades will be reset.</div>
            <div style={{ fontSize: 12, color: "#e8e8e8", marginBottom: 20, padding: "10px 14px", background: "#ff6b2a10", border: "1px solid #ff6b2a22", borderRadius: 6, lineHeight: 1.6 }}>
              You'll receive a permanent <span style={{ color: "#ff6b2a", fontWeight: 800 }}>5x XP boost</span>
              {ascensions > 0 && <span style={{ color: "#777", fontSize: 10 }}><br/>(new total: {multiplier * 5}x)</span>}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="confirm-no" onClick={() => setShowConfirm(false)}>CANCEL</button>
              <button className="confirm-yes" onClick={doAscend}>ASCEND</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "20px 20px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "#333", marginBottom: 3 }}>IDLE.GG</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1 }}>XP GRINDER</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#2aff7a", marginBottom: 3 }}>{rank.name}</div>
            <div style={{ fontSize: 10, color: "#333" }}>
              {nextRank ? `→ ${nextRank.name} at ${fmt(nextRank.min)}` : "MAX RANK"}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, height: 3, background: "#1a1a1a", borderRadius: 2 }}>
          <div className="rank-bar-fill" style={{ width: `${rankProgress * 100}%` }} />
        </div>
        {ascensions > 0 && (
          <div style={{ marginTop: 6, fontSize: 9, color: "#ff6b2a", letterSpacing: 2, textAlign: "right" }}>
            ✦ ASCENSION {ascensions} · {multiplier}x BOOST ACTIVE
          </div>
        )}
      </div>

      {/* Mobile tabs */}
      <div className="mobile-tabs">
        <button className={`tab-btn${tab === "click" ? " active" : ""}`} onClick={() => setTab("click")}>🎮 PLAY</button>
        <button className={`tab-btn${tab === "upgrades" ? " active" : ""}`} onClick={() => setTab("upgrades")}>⚡ UPGRADES</button>
      </div>

      {/* Main layout */}
      <div className="main-layout">

        {/* Left / Click tab */}
        <div className="left-panel">
          <div className={`tab-content-click${tab === "click" ? " visible" : ""}`} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

            {/* XP display */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, letterSpacing: 3, color: "#444", marginBottom: 4 }}>TOTAL XP</div>
              <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -2, color: "#fff", lineHeight: 1 }}>{fmt(xp)}</div>
              <div style={{ fontSize: 10, color: "#333", marginTop: 5, letterSpacing: 2 }}>
                {passive > 0 ? `+${fmt(passive)}/sec` : "CLICK TO START"}
              </div>
            </div>

            {/* Click button */}
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <button className={`click-btn${pulse ? " pulse" : ""}`} onClick={handleClick}>🎮</button>
              {floats.map(f => (
                <div key={f.id} className="float-text" style={{ left: `calc(50% + ${f.ox}px)`, bottom: "100%" }}>{f.text}</div>
              ))}
            </div>

            <div style={{ fontSize: 10, letterSpacing: 2, color: "#333" }}>{fmt(clickRef.current)} XP / CLICK</div>

            {/* Stats */}
            <div style={{ width: "100%", background: "#0e0e0e", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#333", marginBottom: 10 }}>STATS</div>
              {[
                ["ALL TIME XP", fmt(totalXp)],
                ["PASSIVE /SEC", fmt(passive)],
                ["PER CLICK", fmt(clickRef.current)],
                ["MULTIPLIER", `${multiplier}x`],
                ["ASCENSIONS", ascensions.toString()],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>{label}</span>
                  <span style={{ fontSize: 10, color: label === "MULTIPLIER" && ascensions > 0 ? "#ff6b2a" : "#2aff7a", fontWeight: 700 }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Ascend */}
            <div style={{ width: "100%" }}>
              {!canAscend && (
                <div style={{ fontSize: 9, color: "#252525", letterSpacing: 1, textAlign: "center", marginBottom: 6 }}>
                  NEED {fmt(ASCEND_THRESHOLD)} TOTAL XP
                </div>
              )}
              <button className="ascend-btn" disabled={!canAscend} onClick={() => setShowConfirm(true)}>
                ✦ ASCEND ✦
              </button>
            </div>
          </div>
        </div>

        {/* Right / Upgrades tab */}
        <div className="right-panel">
          <div className={`tab-content-upgrades${tab === "upgrades" ? " visible" : ""}`}>
            <div style={{ fontSize: 9, letterSpacing: 4, color: "#333", marginBottom: 12 }}>UPGRADES</div>
            {upgradeList}
          </div>
        </div>

      </div>

      <div style={{ padding: "24px 0 16px", textAlign: "center", fontSize: 9, letterSpacing: 3, color: "#1a1a1a" }}>
        IDLE.GG · GRIND NEVER STOPS
      </div>
    </div>
  );
}
