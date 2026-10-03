"use client";

import { useId } from "react";

type Props = { category: string; seed?: number; variant?: 0 | 1; className?: string; label: string };

// Procedural jewellery artwork used until real photos are uploaded.
// Variant 1 is the alternate "hover" view.
export default function ProductArt({ category, seed = 0, variant = 0, className, label }: Props) {
  const uid = useId().replace(/:/g, "");
  const bgA = variant === 0 ? "#efe8dd" : "#e4d9c9";
  const bgB = variant === 0 ? "#faf6f0" : "#f1e9dc";
  const rot = variant === 0 ? 0 : -8;
  const zoom = variant === 0 ? 1 : 1.32;
  const gold = `url(#g${uid})`;

  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`b${uid}`} cx="50%" cy="40%" r="80%">
          <stop offset="0" stopColor={bgB} />
          <stop offset="1" stopColor={bgA} />
        </radialGradient>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9a25e" />
          <stop offset="0.3" stopColor="#f6e4b4" />
          <stop offset="0.55" stopColor="#d9b46a" />
          <stop offset="1" stopColor="#a5803f" />
        </linearGradient>
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#dfe9f2" />
          <stop offset="1" stopColor="#aebfd0" />
        </linearGradient>
        <filter id={`sh${uid}`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#6b5a45" floodOpacity="0.22" />
        </filter>
      </defs>
      <rect width="400" height="400" fill={`url(#b${uid})`} />
      <g filter={`url(#sh${uid})`} transform={`translate(200 200) scale(${zoom}) rotate(${rot}) translate(-200 -200)`}>
        {category === "rings" && <Ring gold={gold} stone={`url(#s${uid})`} />}
        {category === "necklaces" && <Necklace gold={gold} stone={`url(#s${uid})`} />}
        {category === "earrings" && <Earrings gold={gold} stone={`url(#s${uid})`} />}
        {category !== "rings" && category !== "necklaces" && category !== "earrings" && (
          <Bridal gold={gold} stone={`url(#s${uid})`} />
        )}
      </g>
    </svg>
  );
}

function Gem({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <polygon points="0,-30 26,-8 0,36 -26,-8" fill={fill} stroke="#c4d2df" strokeWidth="1" />
      <polygon points="0,-30 10,-8 0,36 -10,-8" fill="#fff" opacity="0.7" />
      <polyline points="-26,-8 26,-8" stroke="#fff" strokeOpacity="0.9" />
    </g>
  );
}

function Ring({ gold, stone }: { gold: string; stone: string }) {
  return (
    <g>
      <ellipse cx="200" cy="236" rx="92" ry="98" fill="none" stroke={gold} strokeWidth="9" />
      <ellipse cx="200" cy="236" rx="92" ry="98" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.5" />
      <rect x="178" y="126" width="44" height="22" rx="4" fill={gold} />
      <Gem x={200} y={112} s={1.25} fill={stone} />
    </g>
  );
}

function Necklace({ gold, stone }: { gold: string; stone: string }) {
  const beads = Array.from({ length: 19 }, (_, i) => {
    const t = i / 18;
    const x = 70 + t * 260;
    const y = 90 + Math.sin(t * Math.PI) * 170;
    return { x, y };
  });
  return (
    <g>
      <path d="M70 90 Q200 350 330 90" fill="none" stroke={gold} strokeWidth="3" />
      {beads.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={i % 3 === 0 ? 7 : 4} fill={gold} />
      ))}
      <line x1="200" y1="260" x2="200" y2="284" stroke={gold} strokeWidth="3" />
      <Gem x={200} y={306} s={1.5} fill={stone} />
    </g>
  );
}

function Earrings({ gold, stone }: { gold: string; stone: string }) {
  const one = (cx: number) => (
    <g>
      <circle cx={cx} cy="98" r="9" fill={gold} />
      <path d={`M${cx - 38} 188 Q${cx} 100 ${cx + 38} 188 Z`} fill={gold} />
      <path d={`M${cx - 38} 188 L${cx + 38} 188`} stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
      {[-30, -15, 0, 15, 30].map((d) => (
        <line key={d} x1={cx + d} y1="190" x2={cx + d} y2="214" stroke={gold} strokeWidth="2" />
      ))}
      {[-30, -15, 0, 15, 30].map((d) => (
        <circle key={d} cx={cx + d} cy="220" r="7" fill="#fffaf0" />
      ))}
      <Gem x={cx} y={290} s={1.05} fill={stone} />
    </g>
  );
  return (
    <g>
      {one(120)}
      {one(280)}
    </g>
  );
}

function Bridal({ gold, stone }: { gold: string; stone: string }) {
  return (
    <g>
      <path d="M60 70 Q200 300 340 70" fill="none" stroke={gold} strokeWidth="8" strokeLinecap="round" />
      <path d="M100 70 Q200 250 300 70" fill="none" stroke={gold} strokeWidth="3" strokeDasharray="1 11" strokeLinecap="round" />
      {[0.15, 0.3, 0.5, 0.7, 0.85].map((t, i) => {
        const x = 60 + t * 280;
        const y = 70 + Math.sin(t * Math.PI) * 146;
        return <Gem key={i} x={x} y={y + 6} s={i === 2 ? 1.05 : 0.6} fill={stone} />;
      })}
      <g transform="translate(0 40)">
        <circle cx="105" cy="290" r="9" fill={gold} />
        <path d="M70 352 Q105 286 140 352 Z" fill={gold} />
        <circle cx="295" cy="290" r="9" fill={gold} />
        <path d="M260 352 Q295 286 330 352 Z" fill={gold} />
      </g>
    </g>
  );
}
