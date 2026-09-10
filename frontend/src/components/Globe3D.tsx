"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Site } from "../lib/types";
import { RotateCw, ZoomIn, ZoomOut, Compass } from "lucide-react";

interface Globe3DProps {
  sites: Site[];
  selectedSite: Site | null;
  onSelectSite: (site: Site) => void;
  onSelectCoords: (lat: number, lon: number) => void;
}

// Major continental landmass boundary approximations in [lon, lat] coordinates
const CONTINENTS: [number, number][][] = [
  // India & South Asia
  [
    [68, 24], [70, 20], [73, 16], [75, 12], [77, 8], [79, 9], [80, 13], [82, 16],
    [85, 20], [88, 22], [92, 21], [94, 25], [89, 27], [85, 28], [80, 31], [75, 34],
    [73, 33], [70, 30], [68, 24]
  ],
  // Africa
  [
    [-17, 15], [-12, 5], [0, 5], [9, 4], [10, -1], [12, -6], [14, -18], [18, -34],
    [26, -34], [33, -26], [41, -10], [51, 12], [43, 12], [32, 31], [10, 37], [-5, 36],
    [-17, 21], [-17, 15]
  ],
  // Eurasia / Europe & Middle East & East Asia
  [
    [-9, 36], [0, 44], [3, 51], [8, 55], [20, 60], [30, 70], [60, 70], [100, 75],
    [140, 72], [170, 65], [145, 45], [130, 35], [120, 30], [110, 20], [100, 10],
    [98, 4], [103, 1], [95, 18], [75, 35], [60, 25], [50, 30], [35, 32], [26, 40],
    [15, 40], [-5, 43], [-9, 36]
  ],
  // North America
  [
    [-168, 65], [-160, 55], [-140, 60], [-130, 50], [-124, 38], [-117, 30], [-105, 20],
    [-97, 18], [-80, 25], [-81, 30], [-75, 35], [-70, 42], [-64, 46], [-55, 50],
    [-65, 60], [-85, 65], [-95, 70], [-130, 70], [-168, 65]
  ],
  // South America
  [
    [-77, 8], [-81, -5], [-72, -18], [-70, -30], [-73, -45], [-68, -55], [-65, -55],
    [-60, -38], [-50, -30], [-35, -5], [-45, 0], [-60, 8], [-77, 8]
  ],
  // Australia
  [
    [114, -22], [115, -34], [125, -32], [138, -35], [148, -38], [153, -28], [145, -15],
    [135, -12], [125, -15], [114, -22]
  ],
];

export const Globe3D: React.FC<Globe3DProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  onSelectCoords,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Rotation angles: pitch (lat) and yaw (lon)
  const [rotation, setRotation] = useState({ yaw: 74.74, pitch: 19.08 }); // Centered on Ahmednagar
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [hoveredSite, setHoveredSite] = useState<Site | null>(null);

  // Responsive canvas sizing
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  // Main Render Loop
  const drawGlobe = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    if (width === 0 || height === 0) return;

    const cx = width / 2;
    const cy = height / 2;
    // Perfect sphere radius centered in box
    const R = Math.min(width, height) * 0.38 * zoom;

    ctx.clearRect(0, 0, width, height);

    // 1. Deep Space Atmosphere Glow
    const spaceGlow = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.35);
    spaceGlow.addColorStop(0, "rgba(15, 118, 110, 0.35)");
    spaceGlow.addColorStop(0.5, "rgba(14, 165, 233, 0.12)");
    spaceGlow.addColorStop(1, "rgba(8, 13, 26, 0)");
    ctx.fillStyle = spaceGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
    ctx.fill();

    // 2. Ocean Sphere
    const oceanGrad = ctx.createRadialGradient(
      cx - R * 0.35,
      cy - R * 0.35,
      R * 0.1,
      cx,
      cy,
      R
    );
    oceanGrad.addColorStop(0, "#0e2d42");
    oceanGrad.addColorStop(0.6, "#071c2c");
    oceanGrad.addColorStop(1, "#040d16");

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = oceanGrad;
    ctx.fill();

    // Clip to sphere surface for continent & grid drawing
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    const radYaw = (rotation.yaw * Math.PI) / 180;
    const radPitch = (rotation.pitch * Math.PI) / 180;

    // Helper: 3D sphere coordinate projection
    const projectSphere = (lat: number, lon: number) => {
      const phi = (lat * Math.PI) / 180;
      const lambda = (lon * Math.PI) / 180 - radYaw;

      const x = R * Math.cos(phi) * Math.sin(lambda);
      const y = -R * Math.sin(phi);
      const z = R * Math.cos(phi) * Math.cos(lambda);

      // Pitch rotation around X axis
      const yRot = y * Math.cos(radPitch) - z * Math.sin(radPitch);
      const zRot = y * Math.sin(radPitch) + z * Math.cos(radPitch);

      return { px: cx + x, py: cy + yRot, visible: zRot > 0, z: zRot };
    };

    // 3. Draw Continents
    CONTINENTS.forEach((polygon) => {
      ctx.beginPath();
      let hasStarted = false;

      for (let i = 0; i < polygon.length; i++) {
        const [lon, lat] = polygon[i];
        const pt = projectSphere(lat, lon);

        if (pt.visible) {
          if (!hasStarted) {
            ctx.moveTo(pt.px, pt.py);
            hasStarted = true;
          } else {
            ctx.lineTo(pt.px, pt.py);
          }
        }
      }

      if (hasStarted) {
        ctx.closePath();
        ctx.fillStyle = "rgba(20, 184, 166, 0.22)"; // Earth emerald/teal landmass
        ctx.fill();
        ctx.strokeStyle = "rgba(45, 212, 191, 0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // 4. Draw Latitude Parallels
    ctx.strokeStyle = "rgba(56, 189, 248, 0.1)";
    ctx.lineWidth = 0.8;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let first = true;
      for (let lon = 0; lon <= 360; lon += 8) {
        const pt = projectSphere(lat, lon);
        if (pt.visible) {
          if (first) {
            ctx.moveTo(pt.px, pt.py);
            first = false;
          } else {
            ctx.lineTo(pt.px, pt.py);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // 5. Draw Longitude Meridians
    for (let lon = 0; lon < 360; lon += 45) {
      ctx.beginPath();
      let first = true;
      for (let lat = -80; lat <= 80; lat += 8) {
        const pt = projectSphere(lat, lon);
        if (pt.visible) {
          if (first) {
            ctx.moveTo(pt.px, pt.py);
            first = false;
          } else {
            ctx.lineTo(pt.px, pt.py);
          }
        } else {
          first = true;
        }
      }
      ctx.stroke();
    }

    // 6. Atmospheric Rim Lighting
    const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
    rimGrad.addColorStop(0, "transparent");
    rimGrad.addColorStop(0.85, "rgba(15, 118, 110, 0.2)");
    rimGrad.addColorStop(1, "rgba(56, 189, 248, 0.5)");
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 7. Outer Globe Border Ring
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(45, 212, 191, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 8. Plot Sites on Globe
    sites.forEach((site) => {
      const pt = projectSphere(site.lat, site.lon);

      if (pt.visible) {
        const isSelected = selectedSite?.id === site.id;
        const isAnomaly = site.latest_analysis?.overall_status === "anomaly";
        const isConfirmed = site.latest_analysis?.overall_status === "confirmed";
        const label = site.site_code || site.id.substring(0, 4);

        const pointColor = isAnomaly ? "#ef4444" : isConfirmed ? "#10b981" : "#14b8a6";

        // Outer pulsing ring
        if (isSelected || isAnomaly) {
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, isSelected ? 12 : 9, 0, Math.PI * 2);
          ctx.strokeStyle = pointColor;
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }

        // Inner solid badge
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, isSelected ? 6 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = pointColor;
        ctx.fill();

        // Pin Label
        ctx.fillStyle = isSelected ? "#ffffff" : "rgba(226, 232, 240, 0.9)";
        ctx.font = isSelected ? "bold 11px monospace" : "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(label, pt.px, pt.py - 10);
      }
    });
  }, [sites, selectedSite, rotation, zoom]);

  // Animation Loop (auto-rotate gently when idle)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (!isDragging) {
        setRotation((prev) => ({
          ...prev,
          yaw: (prev.yaw + dt * 1.5) % 360,
        }));
      }

      drawGlobe();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isDragging, drawGlobe]);

  // Mouse drag handling
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) {
      // Check hover over site markers
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const R = Math.min(canvas.width, canvas.height) * 0.38 * zoom;

      const radYaw = (rotation.yaw * Math.PI) / 180;
      const radPitch = (rotation.pitch * Math.PI) / 180;

      let found: Site | null = null;
      for (const s of sites) {
        const phi = (s.lat * Math.PI) / 180;
        const lambda = (s.lon * Math.PI) / 180 - radYaw;
        const x = R * Math.cos(phi) * Math.sin(lambda);
        const y = -R * Math.sin(phi);
        const z = R * Math.cos(phi) * Math.cos(lambda);
        const yRot = y * Math.cos(radPitch) - z * Math.sin(radPitch);
        const zRot = y * Math.sin(radPitch) + z * Math.cos(radPitch);

        if (zRot > 0) {
          const px = cx + x;
          const py = cy + yRot;
          if (Math.hypot(mx - px, my - py) < 14) {
            found = s;
            break;
          }
        }
      }
      setHoveredSite(found);
      return;
    }

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation((prev) => ({
      yaw: (prev.yaw + dx * 0.45) % 360,
      pitch: Math.max(-80, Math.min(80, prev.pitch - dy * 0.45)),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(2.5, z + 0.15));
    } else {
      setZoom((z) => Math.max(0.6, z - 0.15));
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredSite) {
      onSelectSite(hoveredSite);
      return;
    }

    // Convert sphere pixel click back to (lat, lon)
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const R = Math.min(canvas.width, canvas.height) * 0.38 * zoom;

    const mx = e.clientX - rect.left - cx;
    const my = e.clientY - rect.top - cy;

    const distSq = mx * mx + my * my;
    if (distSq <= R * R) {
      const z = Math.sqrt(R * R - distSq);
      const radPitch = (rotation.pitch * Math.PI) / 180;

      // Invert pitch rotation around X axis
      const y = my * Math.cos(-radPitch) - z * Math.sin(-radPitch);
      const zUnpitch = my * Math.sin(-radPitch) + z * Math.cos(-radPitch);

      const lat = Math.asin(-y / R) * (180 / Math.PI);
      const lon = (Math.atan2(mx, zUnpitch) * (180 / Math.PI) + rotation.yaw + 360) % 360;
      const normalizedLon = lon > 180 ? lon - 360 : lon;

      onSelectCoords(Number(lat.toFixed(4)), Number(normalizedLon.toFixed(4)));
    }
  };

  const resetToAhmednagar = () => {
    setRotation({ yaw: 74.74, pitch: 19.08 });
    setZoom(1.0);
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full h-full min-h-[500px] flex items-center justify-center overflow-hidden bg-[#070d18] rounded-2xl border border-slate-800 shadow-2xl select-none"
    >
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="w-full h-full block cursor-grab active:cursor-grabbing"
      />

      {/* Control overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-30">
        <button
          onClick={resetToAhmednagar}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700/70 text-slate-200 text-xs hover:bg-slate-800 transition-all shadow-md"
          title="Center on Ahmednagar Watershed Basin"
        >
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          <span>Ahmednagar Basin</span>
        </button>

        <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-700/70 rounded-lg p-1 shadow-md">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setRotation((prev) => ({ ...prev, yaw: prev.yaw + 45 }))}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
            title="Rotate 45°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Coordinate HUD */}
      <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 z-30">
        <div>
          Focus: <span className="text-teal-300">{rotation.pitch.toFixed(1)}°N, {rotation.yaw.toFixed(1)}°E</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          Drag to spin • Scroll to zoom • Click any point to scan
        </div>
      </div>
    </div>
  );
};
