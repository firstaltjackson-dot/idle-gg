import { useState, useEffect, useCallback, useRef } from "react";

const UPGRADES = [
  { id: "mouse",        name: "Gaming Mouse",       desc: "+1 XP / click",    icon: "🖱",  baseCost: 15,          costMult: 1.6,  clickBonus: 1,   passiveBonus: 0 },
  { id: "energy",       name: "Energy Drink",        desc: "+1 XP / sec",      icon: "⚡",  baseCost: 80,          costMult: 1.6,  clickBonus: 0,   passiveBonus: 1 },
  { id: "keyboard",     name: "Mech Keyboard",       desc: "+5 XP / click",    icon: "⌨️",  baseCost: 300,         costMult: 1.75, clickBonus: 5,   passiveBonus: 0 },
  { id: "headset",      name: "Pro Headset",         desc: "+8 XP / click",    icon: "🎧",  baseCost: 1200,        costMult: 1.8,  clickBonus: 8,   passiveBonus: 0 },
  { id: "monitor",      name: "4K Monitor",          desc: "+10 XP / sec",     icon: "🖥",  baseCost: 5000,        costMult: 1.9,  clickBonus: 0,   passiveBonus: 10 },
  { id: "chair",        name: "Gaming Chair",        desc: "+25 XP / sec",     icon: "🪑",  baseCost: 20000,       costMult: 2.0,  clickBonus: 0,   passiveBonus: 25 },
  { id: "pc",           name: "Beast PC",            desc: "+80 XP / sec",     icon: "💻",  baseCost: 100000,      costMult: 2.2,  clickBonus: 0,   passiveBonus: 80 },
  { id: "sponsorship",  name: "Sponsorship Deal",    desc: "+300 XP / sec",    icon: "🏆",  baseCost: 750000,      costMult: 2.4,  clickBonus: 0,   passiveBonus: 300 },
  { id: "esports",      name: "Esports Team",        desc: "+1K XP / sec",     icon: "🧑‍💻", baseCost: 5000000,     costMult: 2.6,  clickBonus: 0,   passiveBonus: 1000 },
  { id: "datacenter",   name: "Bot Farm",            desc: "+5K XP / sec",     icon: "🏭",  baseCost: 40000000,    costMult: 2.8,  clickBonus: 0,   passiveBonus: 5000 },
  { id: "ai",           name: "AI Coach",            desc: "+500 XP / click",  icon: "🤖",  baseCost: 300000000,   costMult: 3.0,  clickBonus: 500, passiveBonus: 0 },
  { id: "studio",       name: "Game Studio",         desc: "+25K XP / sec",    icon: "🎬",  baseCost: 2000000000,  costMult: 3.2,  clickBonus: 0,   passiveBonus: 25000 },
  { id: "publisher",    name: "Global Publisher",    desc: "+100K XP / sec",   icon: "🌐",  baseCost: 20000000000, costMult: 3.5,  clickBonus: 0,   passiveBonus: 100000 },
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

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return Math.floor(n).toString();
}

export default function GameIdleClicker() {
  const [xp, setXp] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [counts, setCounts] = useState(() => Object.fromEntries(UPGRADES.map(u => [u.id, 0])));
  const [floats, setFloats] = useState([]);
  const [pulse, setPulse] = useState(false);
  const passiveRef = useRef(0);
  const clickRef = useRef(1);
  const xpRef = useRef(0);

  // Recompute bonuses on counts change
  useEffect(() => {
    let passive = 0, clicks = 1;
    UPGRADES.forEach(u => {
      const c = counts[u.id];
      passive += u.passiveBonus * c;
      clicks += u.clickBonus * c;
    });
    passiveRef.current = passive;
    clickRef.current = clicks;
  }, [counts]);

  // Passive tick
  useEffect(() => {
    const interval = setInterval(() => {
      const gain = passiveRef.current / 20;
      if (gain > 0) {
        setXp(x => x + gain);
        setTotalXp(t => t + gain);
        xpRef.current += gain;
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
    xpRef.current += gain;
    setPulse(true);
    setTimeout(() => setPulse(false), 100);

    // Floating text
    const rect = e.currentTarget.getBoundingClientRect();
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

  const rank = RANKS.reduce((acc, r) => totalXp >= r.min ? r : acc, RANKS[0]);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const rankProgress = nextRank ? Math.min((totalXp - rank.min) / (nextRank.min - rank.min), 1) : 1;
  const passive = passiveRef.current;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#e8e8e8",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 16px",
      boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #2aff7a; }
        .click-btn {
          width: 180px; height: 180px;
          border-radius: 50%;
          border: 2px solid #2aff7a;
          background: transparent;
          color: #2aff7a;
          font-size: 52px;
          cursor: pointer;
          transition: box-shadow 0.15s, transform 0.1s, background 0.15s;
          display: flex; align-items: center; justify-content: center;
          position: relative;
        }
        .click-btn:hover {
          box-shadow: 0 0 30px #2aff7a44, 0 0 60px #2aff7a22;
          background: #2aff7a0a;
        }
        .click-btn:active { transform: scale(0.95); }
        .click-btn.pulse {
          box-shadow: 0 0 50px #2aff7a88;
          background: #2aff7a15;
        }
        .upgrade-btn {
          width: 100%;
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          color: #e8e8e8;
          padding: 12px 14px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          font-family: inherit;
          text-align: left;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .upgrade-btn:hover:not(:disabled) {
          border-color: #2aff7a;
          background: #2aff7a08;
        }
        .upgrade-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .float-text {
          position: absolute;
          font-size: 14px;
          font-weight: 700;
          color: #2aff7a;
          pointer-events: none;
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
      `}</style>

      <div className="scanline" />

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 700, marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: "#444", marginBottom: 4 }}>IDLE.GG</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>XP GRINDER</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#2aff7a", marginBottom: 4 }}>{rank.name}</div>
            <div style={{ fontSize: 11, color: "#444" }}>
              {nextRank ? `→ ${nextRank.name} at ${fmt(nextRank.min)} XP` : "MAX RANK"}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, height: 3, background: "#1a1a1a", borderRadius: 2 }}>
          <div className="rank-bar-fill" style={{ width: `${rankProgress * 100}%` }} />
        </div>
      </div>

      {/* Main layout */}
      <div style={{ width: "100%", maxWidth: 700, display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Left: click zone */}
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, minWidth: 200 }}>

          {/* XP display */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#444", marginBottom: 6 }}>TOTAL XP</div>
            <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -2, color: "#fff", lineHeight: 1 }}>
              {fmt(xp)}
            </div>
            <div style={{ fontSize: 11, color: "#333", marginTop: 6, letterSpacing: 2 }}>
              {passive > 0 ? `+${fmt(passive)}/sec` : "CLICK TO START"}
            </div>
          </div>

          {/* Click button */}
          <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
            <button className={`click-btn${pulse ? " pulse" : ""}`} onClick={handleClick}>
              🎮
            </button>
            {floats.map(f => (
              <div key={f.id} className="float-text" style={{ left: `calc(50% + ${f.ox}px)`, bottom: "100%" }}>
                {f.text}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 10, letterSpacing: 2, color: "#333" }}>
            {fmt(clickRef.current)} XP / CLICK
          </div>

          {/* Stats */}
          <div style={{ width: "100%", background: "#0e0e0e", border: "1px solid #1a1a1a", borderRadius: 8, padding: 16 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#333", marginBottom: 12 }}>SESSION STATS</div>
            {[
              ["ALL TIME XP", fmt(totalXp)],
              ["PASSIVE /SEC", fmt(passive)],
              ["PER CLICK", fmt(clickRef.current)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "#444", letterSpacing: 1 }}>{label}</span>
                <span style={{ fontSize: 11, color: "#2aff7a", fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: upgrades */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 9, letterSpacing: 4, color: "#333", marginBottom: 14 }}>UPGRADES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {UPGRADES.map(upgrade => {
              const cost = getCost(upgrade);
              const owned = counts[upgrade.id];
              const canAfford = xp >= cost;
              // Only reveal once totalXp has ever reached the baseCost threshold
              const isVisible = totalXp >= upgrade.baseCost;
              if (!isVisible) return null;
              return (
                <button
                  key={upgrade.id}
                  className="upgrade-btn"
                  onClick={() => buy(upgrade)}
                  disabled={!canAfford}
                >
                  <span style={{ fontSize: 24 }}>{upgrade.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{upgrade.name}</span>
                      {owned > 0 && (
                        <span style={{
                          fontSize: 10, color: "#2aff7a", background: "#2aff7a15",
                          border: "1px solid #2aff7a33", borderRadius: 3, padding: "1px 6px"
                        }}>x{owned}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                      <span style={{ fontSize: 9, color: "#444", letterSpacing: 1 }}>{upgrade.desc}</span>
                      <span style={{ fontSize: 10, color: canAfford ? "#2aff7a" : "#555", fontWeight: 700 }}>
                        {fmt(cost)} XP
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {/* Locked teaser */}
            {(() => {
              const lockedCount = UPGRADES.filter(u => totalXp < u.baseCost).length;
              if (lockedCount === 0) return null;
              const nextLocked = UPGRADES.find(u => totalXp < u.baseCost);
              return (
                <div style={{
                  border: "1px dashed #1e1e1e",
                  borderRadius: 8,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: 0.5,
                }}>
                  <span style={{ fontSize: 24, filter: "grayscale(1)" }}>🔒</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#333", fontWeight: 700 }}>
                      {lockedCount} upgrade{lockedCount > 1 ? "s" : ""} locked
                    </div>
                    <div style={{ fontSize: 9, color: "#2a2a2a", marginTop: 3, letterSpacing: 1 }}>
                      NEXT UNLOCKS AT {fmt(nextLocked.baseCost)} TOTAL XP
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, fontSize: 9, letterSpacing: 3, color: "#222" }}>
        IDLE.GG · GRIND NEVER STOPS
      </div>
    </div>
  );
}
