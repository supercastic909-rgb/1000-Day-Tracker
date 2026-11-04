import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { TASK_THEMES } from '../utils/habitLogic';

export interface ConfettiController {
  launchTaskPopper: (taskIdx: number, originRect?: DOMRect) => void;
  launchDayCompleteShower: (isMilestone?: boolean, originRect?: DOMRect) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  sizeW: number;
  sizeH: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  shape: 'circle' | 'paper' | 'star' | 'ring';
  alpha: number;
  decay: number;
}

export const ConfettiCanvas = forwardRef<ConfettiController>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animIdRef = useRef<number | null>(null);

  const startLoop = () => {
    if (animIdRef.current !== null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frame = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const list = particlesRef.current;

      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 1.1;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y > canvas.height + 80) {
          list.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.sizeW * 0.48, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'ring') {
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, p.sizeW * 0.65, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.shape === 'star') {
          ctx.beginPath();
          const spikes = 4;
          const outer = p.sizeW * 0.65;
          const inner = p.sizeW * 0.25;
          for (let s = 0; s < spikes * 2; s++) {
            const r = s % 2 === 0 ? outer : inner;
            const a = (s * Math.PI) / spikes;
            if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // 3D tumbling paper piece via scaleY
          const flip = Math.cos(p.wobble);
          ctx.scale(1, flip);
          ctx.fillRect(-p.sizeW / 2, -p.sizeH / 2, p.sizeW, p.sizeH);
        }
        ctx.restore();
      }

      if (list.length > 0) {
        animIdRef.current = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animIdRef.current = null;
      }
    };

    animIdRef.current = requestAnimationFrame(frame);
  };

  useImperativeHandle(ref, () => ({
    launchTaskPopper(taskIdx: number, originRect?: DOMRect) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const palette = TASK_THEMES[taskIdx]
        ? TASK_THEMES[taskIdx].confettiColors
        : ['#10b981', '#38bdf8', '#fbbf24'];
      const w = canvas.width;
      const h = canvas.height;

      // 1. Localized radial spark burst right from the tapped day card
      if (originRect) {
        const cx = originRect.left + originRect.width / 2;
        const cy = originRect.top + originRect.height / 2;
        for (let i = 0; i < 28; i++) {
          const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.25;
          const speed = 4 + Math.random() * 9;
          particlesRef.current.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2.5,
            gravity: 0.25,
            drag: 0.96,
            sizeW: 6 + Math.random() * 6,
            sizeH: 4 + Math.random() * 5,
            color: palette[i % palette.length],
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.3,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.1 + Math.random() * 0.08,
            shape: i % 4 === 0 ? 'star' : i % 3 === 0 ? 'circle' : 'paper',
            alpha: 1,
            decay: 0.015 + Math.random() * 0.008
          });
        }
      }

      // 2. Classic bottom party-popper fountain
      const count = 42;
      for (let i = 0; i < count; i++) {
        const spreadX = w * (0.25 + Math.random() * 0.5);
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.85;
        const speed = 13 + Math.random() * 12;
        particlesRef.current.push({
          x: spreadX,
          y: h + 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 0.36 + Math.random() * 0.12,
          drag: 0.985,
          sizeW: 6 + Math.random() * 7,
          sizeH: 4 + Math.random() * 6,
          color: palette[i % palette.length],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.25,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.08 + Math.random() * 0.08,
          shape: i % 3 === 0 ? 'circle' : 'paper',
          alpha: 1,
          decay: 0.008 + Math.random() * 0.007
        });
      }
      startLoop();
    },

    launchDayCompleteShower(isMilestone = false, originRect?: DOMRect) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const palette = [
        '#fbbf24',
        '#f59e0b',
        '#fef08a',
        '#10b981',
        '#38bdf8',
        '#a78bfa',
        '#fb7185'
      ];
      const w = canvas.width;
      const h = canvas.height;
      const total = isMilestone ? 180 : 115;

      if (originRect) {
        const cx = originRect.left + originRect.width / 2;
        const cy = originRect.top + originRect.height / 2;
        for (let i = 0; i < 36; i++) {
          const angle = (Math.PI * 2 * i) / 36;
          const speed = 6 + Math.random() * 11;
          particlesRef.current.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            gravity: 0.22,
            drag: 0.97,
            sizeW: 8 + Math.random() * 6,
            sizeH: 5 + Math.random() * 6,
            color: palette[i % palette.length],
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.28,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.09,
            shape: i % 2 === 0 ? 'star' : 'ring',
            alpha: 1,
            decay: 0.012
          });
        }
      }

      for (let i = 0; i < total; i++) {
        const fromTop = i < total * 0.65;
        particlesRef.current.push({
          x: Math.random() * w,
          y: fromTop ? -15 - Math.random() * 120 : h + 10,
          vx: (Math.random() - 0.5) * (fromTop ? 6 : 14),
          vy: fromTop ? 3 + Math.random() * 6 : -(15 + Math.random() * 14),
          gravity: fromTop ? 0.14 : 0.34,
          drag: 0.99,
          sizeW: 7 + Math.random() * 8,
          sizeH: 5 + Math.random() * 6,
          color: palette[i % palette.length],
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.22,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.07 + Math.random() * 0.08,
          shape: i % 5 === 0 ? 'star' : i % 4 === 0 ? 'circle' : 'paper',
          alpha: 1,
          decay: isMilestone ? 0.0045 : 0.0065
        });
      }
      startLoop();
    }
  }));

  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="confetti-canvas"
      data-testid="confetti-canvas"
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
});
