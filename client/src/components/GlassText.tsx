import { useRef, useEffect, useState } from 'react';

interface GlassTextProps {
  text: string;
  className?: string;
  fontSize?: number;
}

export function GlassText({ text, className = '', fontSize = 36 }: GlassTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [maskUrl, setMaskUrl] = useState('');
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateMask = () => {
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
      const offsetY = fontSize * 0.1;
      ctx.fillText(text, 0, offsetY);

      const dataUrl = canvas.toDataURL('image/png');
      setMaskUrl(dataUrl);
    };

    const fontsReady = document.fonts?.ready;
    if (fontsReady) {
      fontsReady.then(updateMask);
    } else {
      setTimeout(updateMask, 200);
    }

    window.addEventListener('resize', updateMask);
    return () => window.removeEventListener('resize', updateMask);
  }, [text, fontSize]);

  return (
    <div className={`relative inline-block ${className}`} data-testid="text-flowtrack-logo">
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
      )}
      {maskUrl && (
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
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            >
              {text}
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}
