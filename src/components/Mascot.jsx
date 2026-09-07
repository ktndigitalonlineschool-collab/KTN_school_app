import { useId } from "react";

// Nanban — KTN's friendly graduate-owl mascot. Lightweight, recolourable SVG.
// Use small in corners (peek), or larger for welcome / empty / success moments.
export default function Mascot({ size = 90, className = "", style }) {
  const id = useId();
  const h = Math.round((size * 158) / 140);
  const body = `url(#${id})`;
  return (
    <svg width={size} height={h} viewBox="30 62 140 158" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4AA0F0" /><stop offset="1" stopColor="#2F6BFF" />
        </linearGradient>
      </defs>
      {/* body */}
      <ellipse cx="100" cy="150" rx="60" ry="58" fill={body} />
      <ellipse cx="100" cy="162" rx="40" ry="42" fill="#EAF2FF" />
      {/* ear tufts */}
      <path d="M58 108 Q52 84 70 92 Z" fill="#2F6BFF" />
      <path d="M142 108 Q148 84 130 92 Z" fill="#2F6BFF" />
      {/* wings */}
      <ellipse cx="46" cy="150" rx="14" ry="26" fill="#2F6BFF" />
      <ellipse cx="154" cy="150" rx="14" ry="26" fill="#2F6BFF" />
      {/* eyes */}
      <circle cx="80" cy="140" r="24" fill="#fff" /><circle cx="120" cy="140" r="24" fill="#fff" />
      <circle cx="80" cy="140" r="20" fill="none" stroke="#F5921E" strokeWidth="3" />
      <circle cx="120" cy="140" r="20" fill="none" stroke="#F5921E" strokeWidth="3" />
      <circle cx="84" cy="143" r="10" fill="#22314F" /><circle cx="116" cy="143" r="10" fill="#22314F" />
      <circle cx="88" cy="139" r="3.5" fill="#fff" /><circle cx="120" cy="139" r="3.5" fill="#fff" />
      {/* beak */}
      <path d="M100 150 l-8 10 h16 Z" fill="#F5921E" />
      {/* feet */}
      <path d="M84 202 l-6 10 M84 202 l0 11 M84 202 l6 10" stroke="#F5921E" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M116 202 l-6 10 M116 202 l0 11 M116 202 l6 10" stroke="#F5921E" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* graduation cap */}
      <rect x="70" y="78" width="60" height="16" rx="4" fill="#1B327E" />
      <path d="M60 82 L100 68 L140 82 L100 96 Z" fill="#22314F" />
      <circle cx="140" cy="82" r="3" fill="#F5921E" /><path d="M140 82 v18" stroke="#F5921E" strokeWidth="2.5" /><circle cx="140" cy="102" r="4" fill="#F5921E" />
    </svg>
  );
}
