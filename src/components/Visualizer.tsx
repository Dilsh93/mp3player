"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";

const MODE_COUNT = 8;

export default function Visualizer() {
  const engine = usePlayerStore((s) => s.engine);
  const [ready, setReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modeIndex, setModeIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!engine) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = engine.getOrCreateAnalyser(1024);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeArray = new Uint8Array(analyser.fftSize);
    setReady(true);

    const render = () => {
      if (!canvasRef.current || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const width = canvasRef.current.clientWidth * dpr;
      const height = canvasRef.current.clientHeight * dpr;
      if (canvasRef.current.width !== width || canvasRef.current.height !== height) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      const drawBars = () => {
        analyser.getByteFrequencyData(dataArray);
        const barCount = Math.min(64, bufferLength);
        const barWidth = (width / barCount) * 0.7;
        const gap = (width / barCount) * 0.3;
        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i] / 255; // 0..1
          const barHeight = value * height;
          const x = i * (barWidth + gap);
          const y = height - barHeight;
          const grd = ctx.createLinearGradient(0, y, 0, height);
          grd.addColorStop(0, "#89ffb6");
          grd.addColorStop(1, "#0df35c");
          ctx.fillStyle = grd;
          ctx.shadowColor = "#0df35c";
          ctx.shadowBlur = 12;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      };

      const drawMirror = () => {
        analyser.getByteFrequencyData(dataArray);
        const barCount = Math.min(48, bufferLength);
        const barWidth = (width / barCount) * 0.6;
        const gap = (width / barCount) * 0.4;
        const centerY = height / 2;
        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i] / 255;
          const barHeight = value * (height / 2);
          const x = i * (barWidth + gap);
          const yTop = centerY - barHeight;
          const yBottom = centerY;
          const grd = ctx.createLinearGradient(0, yTop, 0, yBottom + barHeight);
          grd.addColorStop(0, "#89ffb6");
          grd.addColorStop(1, "#0df35c");
          ctx.fillStyle = grd;
          ctx.shadowColor = "#0df35c";
          ctx.shadowBlur = 10;
          ctx.fillRect(x, yTop, barWidth, barHeight);
          ctx.fillRect(x, yBottom, barWidth, barHeight);
        }
      };

      const drawRadial = () => {
        analyser.getByteFrequencyData(dataArray);
        const count = 80;
        const radius = Math.min(width, height) * 0.25;
        const cx = width / 2;
        const cy = height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < count; i++) {
          const value = dataArray[Math.floor((i / count) * bufferLength)] / 255;
          const len = radius + value * radius;
          const angle = (i / count) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const x2 = Math.cos(angle) * len;
          const y2 = Math.sin(angle) * len;
          const grd = ctx.createLinearGradient(x, y, x2, y2);
          grd.addColorStop(0, "#0df35c");
          grd.addColorStop(1, "#89ffb6");
          ctx.strokeStyle = grd;
          ctx.lineWidth = Math.max(2, Math.min(6, value * 8));
          ctx.shadowColor = "#0df35c";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      };

      const drawWave = () => {
        analyser.getByteTimeDomainData(timeArray);
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#89ffb6";
        ctx.shadowColor = "#0df35c";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        const slice = width / timeArray.length;
        for (let i = 0; i < timeArray.length; i++) {
          const v = timeArray[i] / 128 - 1; // -1..1
          const x = i * slice;
          const y = height / 2 + v * (height / 2 - 6);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      const drawDotsRing = () => {
        analyser.getByteFrequencyData(dataArray);
        const cx = width / 2;
        const cy = height / 2;
        const baseR = Math.min(width, height) * 0.22;
        const dots = 72;
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < dots; i++) {
          const idx = Math.floor((i / dots) * bufferLength);
          const value = dataArray[idx] / 255;
          const angle = (i / dots) * Math.PI * 2;
          const r = baseR + value * baseR * 0.8;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          const size = 2 + value * 6;
          const grd = ctx.createRadialGradient(x, y, 0, x, y, size);
          grd.addColorStop(0, "#89ffb6");
          grd.addColorStop(1, "rgba(13,243,92,0)");
          ctx.fillStyle = grd;
          ctx.shadowColor = "#0df35c";
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };

      const drawAreaWave = () => {
        analyser.getByteTimeDomainData(timeArray);
        const baseline = height * 0.65;
        const slice = width / timeArray.length;
        const grd = ctx.createLinearGradient(0, baseline - height * 0.4, 0, height);
        grd.addColorStop(0, "rgba(137,255,182,0.9)");
        grd.addColorStop(1, "rgba(13,243,92,0.05)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(0, baseline);
        for (let i = 0; i < timeArray.length; i++) {
          const v = timeArray[i] / 128 - 1; // -1..1
          const x = i * slice;
          const y = baseline + v * (height * 0.35);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.shadowColor = "#0df35c";
        ctx.shadowBlur = 12;
        ctx.fill();
      };

      const drawSpectrogram = () => {
        analyser.getByteFrequencyData(dataArray);
        // Scroll left
        ctx.drawImage(canvasRef.current as HTMLCanvasElement, -2, 0);
        // Draw new column on the right
        for (let y = 0; y < height; y++) {
          const t = 1 - y / height;
          const idx = Math.min(bufferLength - 1, Math.floor(t * bufferLength));
          const v = dataArray[idx] / 255; // 0..1
          const hue = 125; // neon green hue
          const sat = 100;
          const light = 20 + v * 60;
          ctx.fillStyle = `hsl(${hue} ${sat}% ${light}%)`;
          ctx.fillRect(width - 2, y, 2, 1);
        }
      };

      const drawSpiral = () => {
        analyser.getByteFrequencyData(dataArray);
        const cx = width / 2;
        const cy = height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const a = (i / bufferLength) * Math.PI * 6; // three turns
          const r = (Math.min(width, height) * 0.1) + (dataArray[i] / 255) * (Math.min(width, height) * 0.35);
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const grd = ctx.createLinearGradient(-50, -50, 50, 50);
        grd.addColorStop(0, "#0df35c");
        grd.addColorStop(1, "#89ffb6");
        ctx.strokeStyle = grd;
        ctx.lineWidth = 3;
        ctx.shadowColor = "#0df35c";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      };

      switch (modeIndex % MODE_COUNT) {
        case 0:
          drawBars();
          break;
        case 1:
          drawMirror();
          break;
        case 2:
          drawRadial();
          break;
        case 3:
          drawWave();
          break;
        case 4:
          drawDotsRing();
          break;
        case 5:
          drawAreaWave();
          break;
        case 6:
          drawSpectrogram();
          break;
        case 7:
        default:
          drawSpiral();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [engine, modeIndex]);

  // Fullscreen handling
  useEffect(() => {
    const onFsChange = () => {
      const fsEl = document.fullscreenElement as Element | null;
      setIsFullscreen(fsEl === containerRef.current);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setModeIndex((i) => (i + 1) % MODE_COUNT);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setModeIndex((i) => (i - 1 + MODE_COUNT) % MODE_COUNT);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    const elWithWebkit = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    if (elWithWebkit.requestFullscreen) {
      await elWithWebkit.requestFullscreen();
    } else if (elWithWebkit.webkitRequestFullscreen) {
      await elWithWebkit.webkitRequestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      onDoubleClick={toggleFullscreen}
      className={`rounded-2xl border border-black/10 dark:border-white/10 neon-card overflow-hidden h-28 sm:h-36 ${
        isFullscreen ? "fixed inset-0 z-50 h-screen w-screen cursor-zoom-out" : "cursor-zoom-in"
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" aria-hidden={!ready} />
    </div>
  );
}


