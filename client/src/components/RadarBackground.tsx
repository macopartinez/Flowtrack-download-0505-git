import { useEffect, useRef } from 'react';

export function RadarBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let performanceMode = 'high';
    let fps = 60;
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (performanceMode === 'low') {
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        canvas.width = window.innerWidth * 0.5;
        canvas.height = window.innerHeight * 0.5;
        ctx.scale(0.5, 0.5);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const checkPerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;
      if (elapsed >= 1000) {
        fps = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastTime = currentTime;
        if (fps < 30 && performanceMode !== 'low') {
          performanceMode = 'low';
          resizeCanvas();
        } else if (fps < 50 && fps >= 30 && performanceMode === 'high') {
          performanceMode = 'medium';
        }
      }
    };

    const centerX = 10;
    const centerY = 10;
    const waves: Wave[] = [];

    const getWaveConfig = () => {
      const screenWidth = window.innerWidth;
      const isMobile = screenWidth < 768;
      return {
        maxRadius: Math.max(window.innerWidth, window.innerHeight),
        waveSpeed: isMobile ? 60 : 80,
        waveSpacing: isMobile ? 120 : 180,
        maxWaveWidth: isMobile ? 15 : 22.5,
        shadowBlur: performanceMode === 'low' ? 10 : (performanceMode === 'medium' ? 15 : 20)
      };
    };

    let config = getWaveConfig();
    let lastFrameTime = performance.now();

    window.addEventListener('resize', () => {
      config = getWaveConfig();
    });

    class Wave {
      radius: number;
      opacity: number;
      constructor() {
        this.radius = 0;
        this.opacity = 1;
      }

      update(deltaTime: number) {
        this.radius += (config.waveSpeed * deltaTime) / 1000;
        this.opacity = Math.max(0, 1 - (this.radius / config.maxRadius));
      }

      draw() {
        if (this.opacity <= 0 || this.radius <= 0) return;
        ctx.save();
        if (performanceMode !== 'low') {
          ctx.shadowBlur = config.shadowBlur;
          ctx.shadowColor = `rgba(0, 255, 100, ${this.opacity * 0.5})`;
        }
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 100, ${this.opacity})`;
        ctx.lineWidth = config.maxWaveWidth;
        ctx.stroke();
        if (performanceMode !== 'low') {
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(150, 255, 200, ${this.opacity * 0.6})`;
          ctx.lineWidth = config.maxWaveWidth * 0.4;
          ctx.stroke();
        }
        ctx.restore();
      }

      isFinished() {
        return this.radius > config.maxRadius;
      }
    }

    const createWave = () => {
      if (waves.length === 0 || waves[waves.length - 1].radius >= config.waveSpacing) {
        waves.push(new Wave());
      }
    };

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      const safeDeltaTime = Math.min(deltaTime, 100);
      checkPerformance();
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      createWave();
      for (let i = waves.length - 1; i >= 0; i--) {
        waves[i].update(safeDeltaTime);
        waves[i].draw();
        if (waves[i].isFinished()) {
          waves.splice(i, 1);
        }
      }
      if (performanceMode !== 'low') {
        ctx.save();
        ctx.shadowBlur = config.shadowBlur;
        ctx.shadowColor = 'rgba(0, 255, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 255, 200, 1)';
        ctx.fill();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 100, 1)';
        ctx.fill();
      }
      animationId = requestAnimationFrame(animate);
    };

    startAnimation();

    function startAnimation() {
      lastFrameTime = performance.now();
      animationId = requestAnimationFrame(animate);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        startAnimation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
    />
  );
}
