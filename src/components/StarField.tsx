"use client";

import { useRef, useEffect, useCallback } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  a: number;
  speed: number;
  phase: number;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  a: number;
  vx: number;
  vy: number;
}

interface ShootingStar {
  x: number;
  y: number;
  len: number;
  speed: number;
  angle: number;
  life: number;
  decay: number;
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shootingRef = useRef<ShootingStar[]>([]);
  const rafRef = useRef<number>(0);

  const initField = useCallback((width: number, height: number) => {
    const count = Math.floor((width * height) / 1800);
    const stars: Star[] = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.2 + 0.15,
        a: Math.random() * 0.7 + 0.15,
        speed: Math.random() * 0.006 + 0.001,
        phase: Math.random() * Math.PI * 2,
      });
    }
    starsRef.current = stars;

    const particles: Particle[] = [];
    for (let j = 0; j < 35; j++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 0.8 + 0.3,
        a: Math.random() * 0.18 + 0.04,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.08,
      });
    }
    particlesRef.current = particles;
    shootingRef.current = [];
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      initField(canvas!.width, canvas!.height);
    }

    function maybeShoot(w: number, h: number) {
      if (Math.random() < 0.003 && shootingRef.current.length < 2) {
        const fromLeft = Math.random() > 0.5;
        shootingRef.current.push({
          x: fromLeft
            ? Math.random() * w * 0.6
            : w * 0.4 + Math.random() * w * 0.6,
          y: Math.random() * h * 0.3,
          len: Math.random() * 90 + 50,
          speed: Math.random() * 5 + 3,
          angle: fromLeft
            ? Math.PI / 5 + Math.random() * 0.3
            : Math.PI - Math.PI / 5 - Math.random() * 0.3,
          life: 1,
          decay: Math.random() * 0.01 + 0.012,
        });
      }
    }

    function draw(t: number) {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      const g1 = ctx!.createRadialGradient(
        w * 0.2, h * 0.3, 0,
        w * 0.2, h * 0.3, w * 0.5,
      );
      g1.addColorStop(0, "rgba(30,15,50,0.08)");
      g1.addColorStop(1, "transparent");
      ctx!.fillStyle = g1;
      ctx!.fillRect(0, 0, w, h);

      for (const s of starsRef.current) {
        const tw = Math.sin(t * s.speed + s.phase) * 0.35 + 0.65;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${s.a * tw})`;
        ctx!.fill();
      }

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${p.a})`;
        ctx!.fill();
      }

      maybeShoot(w, h);
      shootingRef.current = shootingRef.current.filter((ss) => {
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.life -= ss.decay;
        if (ss.life <= 0) return false;

        const tx = ss.x - Math.cos(ss.angle) * ss.len * ss.life;
        const ty = ss.y - Math.sin(ss.angle) * ss.len * ss.life;
        const g = ctx!.createLinearGradient(tx, ty, ss.x, ss.y);
        g.addColorStop(0, "transparent");
        g.addColorStop(1, `rgba(255,255,255,${ss.life * 0.7})`);
        ctx!.strokeStyle = g;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(tx, ty);
        ctx!.lineTo(ss.x, ss.y);
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${ss.life * 0.6})`;
        ctx!.fill();
        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [initField]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0"
      aria-hidden="true"
    />
  );
}
