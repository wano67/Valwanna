/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";

type TileKind = "favicon" | "heart" | "star";

type Tile = {
  id: number;
  top: number;
  left: number;
  size: number;
  rotate: number;
  kind: TileKind;
  delay: number;
};

function createPRNG(seed: number) {
  return function next() {
    // Mulberry32
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateTiles(count: number, seed: number): Tile[] {
  const rand = createPRNG(seed);
  const kinds: TileKind[] = ["favicon", "heart", "star"];
  return Array.from({ length: count }).map((_, index) => {
    const kind = kinds[Math.floor(rand() * kinds.length)];
    return {
      id: index,
      top: rand() * 100,
      left: rand() * 100,
      size: 24 + rand() * 22,
      rotate: rand() * 25 - 12,
      kind,
      delay: rand() * 0.6,
    };
  });
}

function TileIcon({ tile }: { tile: Tile }) {
  const commonStyle = {
    width: `${tile.size}px`,
    height: `${tile.size}px`,
    transform: `rotate(${tile.rotate}deg)`,
    animationDelay: `${tile.delay}s`,
  } as const;

  if (tile.kind === "favicon") {
    return (
      <img
        src="/favicon.png"
        alt=""
        className="mosaic-tile animate-mosaic-pop rounded-full bg-white/60 p-[3px] opacity-75 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        style={{ ...commonStyle, objectFit: "contain", aspectRatio: "1 / 1" }}
        loading="lazy"
      />
    );
  }

  const symbol = tile.kind === "heart" ? "❤" : "★";
  const color =
    tile.kind === "heart"
      ? ["#ec4899", "#f472b6", "#fb7185"][tile.id % 3]
      : ["#fbbf24", "#facc15", "#eab308"][tile.id % 3];

  return (
    <span
      className="mosaic-tile inline-flex items-center justify-center animate-mosaic-pop font-semibold leading-none opacity-70"
      style={{ ...commonStyle, color }}
      aria-hidden
    >
      {symbol}
    </span>
  );
}

export default function MosaicBackground() {
  const [showLoader, setShowLoader] = useState(true);
  const [progress, setProgress] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const backgroundTiles = useMemo(() => generateTiles(340, 42), []);
  const loaderTiles = useMemo(() => generateTiles(180, 1337), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
      setShowLoader(false);
    }, 1300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(id);
          return 100;
        }
        return prev + 7;
      });
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (event.clientX / innerWidth - 0.5) * 4;
      const y = (event.clientY / innerHeight - 0.5) * 4;
      setTilt({ x, y });
    };
    const handleLeave = () => setTilt({ x: 0, y: 0 });
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(236,72,153,0.08),transparent_35%),radial-gradient(circle_at_80%_25%,rgba(244,114,182,0.06),transparent_32%),radial-gradient(circle_at_40%_80%,rgba(251,191,36,0.08),transparent_38%),linear-gradient(140deg,rgba(244,114,182,0.08) 0%,rgba(236,72,153,0.08) 22%,transparent 55%),linear-gradient(40deg,rgba(192,132,252,0.08) 0%,transparent_45%)] animate-mosaic-pan"
        style={{
          transform: `translate3d(${tilt.x}px, ${tilt.y}px, 0)`,
          transition: "transform 320ms ease",
        }}
      >
        {backgroundTiles.map((tile) => (
          <div
            key={tile.id}
            className="absolute animate-mosaic-float duration-[9s] animate-mosaic-bubbles"
            style={{
              top: `${tile.top}%`,
              left: `${tile.left}%`,
              animationDelay: `${tile.delay}s`,
            }}
          >
            <TileIcon tile={tile} />
          </div>
        ))}
      </div>

      {showLoader ? (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/92 backdrop-blur-sm animate-mosaic-loader-fade">
          <div className="absolute inset-0 overflow-hidden opacity-90">
            {loaderTiles.map((tile) => (
              <div
                key={`loader-${tile.id}`}
                className="absolute animate-mosaic-float-short duration-[4s]"
                style={{
                  top: `${tile.top}%`,
                  left: `${tile.left}%`,
                  animationDelay: `${tile.delay / 2}s`,
                }}
              >
                <TileIcon tile={tile} />
              </div>
            ))}
          </div>
          <div className="relative flex flex-col items-center gap-3 rounded-2xl bg-white/90 px-5 py-4 text-sm font-semibold text-ink shadow-soft ring-1 ring-border">
            <div
              className="h-16 w-16 overflow-hidden rounded-2xl border border-border bg-white/80 shadow-soft"
              style={{
                clipPath: `inset(0 ${100 - progress}% 0 0)`,
              }}
            >
              <img
                src="/favicon.png"
                alt=""
                className="h-full w-full object-cover"
                style={{ transform: "scale(1.02)" }}
              />
            </div>
            <div className="text-xs font-medium text-slate-600">
              Chargement... {Math.min(100, Math.round(progress))}%
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
