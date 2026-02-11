import { useRef, useEffect, useState, useCallback } from 'react';
import { getWaveIntensityAtPoint } from '@/lib/waveData';

interface GlassTextProps {
  text: string;
  className?: string;
  fontSize?: number;
}

export function GlassText({ text, className = '', fontSize = 36 }: GlassTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [maskUrl, setMaskUrl] = useState('');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const rafRef = useRef<number>(0);

  const updateMask = useCallback(() => {
    if (!textRef.current) return;
    const el = textRef.current;
    const rect = el.getBoundingClientRect();
    const w = Math.ceil(rect.width);
    const h = Math.ceil(rect.height);
    setSize({ width: w, height: h });

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.font = `${fontSize}px Lalezar, cursive`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';
    ctx.fillText(text, 0, fontSize * 0.1);
    setMaskUrl(canvas.toDataURL('image/png'));
  }, [text, fontSize]);

  useEffect(() => {
    const fontsReady = document.fonts?.ready;
    if (fontsReady) {
      fontsReady.then(updateMask);
    } else {
      setTimeout(updateMask, 300);
    }
    window.addEventListener('resize', updateMask);
    return () => window.removeEventListener('resize', updateMask);
  }, [updateMask]);

  useEffect(() => {
    const tick = () => {
      if (containerRef.current && overlayRef.current && glowRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const intensity = getWaveIntensityAtPoint(cx, cy, 60);

        overlayRef.current.style.opacity = String(intensity * 0.9);
        glowRef.current.style.opacity = String(intensity * 0.6);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      data-testid="text-flowtrack-logo"
    >
      <span
        ref={textRef}
        style={{
          fontFamily: "'Lalezar', cursive",
          fontSize: `${fontSize}px`,
          letterSpacing: '2px',
          visibility: 'hidden',
          display: 'inline-block',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </span>
      {maskUrl && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${size.width}px`,
              height: `${size.height}px`,
              backdropFilter: 'blur(16px) brightness(0.2) saturate(0.2) contrast(1.5)',
              WebkitBackdropFilter: 'blur(16px) brightness(0.2) saturate(0.2) contrast(1.5)',
              maskImage: `url(${maskUrl})`,
              WebkitMaskImage: `url(${maskUrl})`,
              maskSize: '100% 100%',
              WebkitMaskSize: '100% 100%',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              pointerEvents: 'none',
            }}
          />
          <div
            ref={overlayRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${size.width}px`,
              height: `${size.height}px`,
              background: 'rgba(0, 255, 100, 0.35)',
              maskImage: `url(${maskUrl})`,
              WebkitMaskImage: `url(${maskUrl})`,
              maskSize: '100% 100%',
              WebkitMaskSize: '100% 100%',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              pointerEvents: 'none',
              opacity: 0,
              transition: 'opacity 0.05s linear',
            }}
          />
          <div
            ref={glowRef}
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              width: `${size.width + 8}px`,
              height: `${size.height + 8}px`,
              boxShadow: '0 0 30px rgba(0, 255, 100, 0.4), inset 0 0 20px rgba(0, 255, 100, 0.1)',
              maskImage: `url(${maskUrl})`,
              WebkitMaskImage: `url(${maskUrl})`,
              maskSize: `${size.width}px ${size.height}px`,
              WebkitMaskSize: `${size.width}px ${size.height}px`,
              maskPosition: '4px 4px',
              WebkitMaskPosition: '4px 4px',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              pointerEvents: 'none',
              opacity: 0,
              transition: 'opacity 0.05s linear',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${size.width}px`,
              height: `${size.height}px`,
              pointerEvents: 'none',
            }}
          >
            <svg width={size.width} height={size.height} style={{ display: 'block' }}>
              <text
                x="0"
                y={fontSize * 0.85}
                fontFamily="'Lalezar', cursive"
                fontSize={fontSize}
                letterSpacing="2px"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.8"
              >
                {text}
              </text>
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
