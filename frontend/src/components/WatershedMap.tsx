"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Site } from "../lib/types";
import { ZoomIn, ZoomOut, Layers, Compass, Crosshair, MapPin, Satellite, Eye } from "lucide-react";

interface WatershedMapProps {
  sites: Site[];
  selectedSite: Site | null;
  onSelectSite: (site: Site) => void;
  onSelectCoords: (lat: number, lon: number) => void;
  targetCoords?: { lat: number; lon: number } | null;
}

type MapLayerType = "satellite" | "dark" | "osm";

export const WatershedMap: React.FC<WatershedMapProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  onSelectCoords,
  targetCoords,
}) => {
  // Initial center: first site if present, otherwise country/regional overview
  const [center, setCenter] = useState(
    sites.length > 0 ? { lat: sites[0].lat, lon: sites[0].lon } : { lat: 20.5937, lon: 78.9629 }
  );
  const [zoom, setZoom] = useState(sites.length > 0 ? 11 : 5);
  const [layerType, setLayerType] = useState<MapLayerType>("satellite");
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredSite, setHoveredSite] = useState<Site | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tileCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Web Mercator projection formulas
  const project = useCallback((lat: number, lon: number, z: number) => {
    const siny = Math.sin((lat * Math.PI) / 180);
    const clampedSiny = Math.min(Math.max(siny, -0.9999), 0.9999);
    const scale = 256 * Math.pow(2, z);
    const x = scale * (0.5 + lon / 360);
    const y = scale * (0.5 - Math.log((1 + clampedSiny) / (1 - clampedSiny)) / (4 * Math.PI));
    return { x, y };
  }, []);

  const unproject = useCallback((px: number, py: number, z: number) => {
    const scale = 256 * Math.pow(2, z);
    const lon = (px / scale - 0.5) * 360;
    const y = 0.5 - py / scale;
    const lat = (90 - (360 * Math.atan(Math.exp(-y * 2 * Math.PI))) / Math.PI);
    return { lat, lon };
  }, []);

  // Get Tile URL based on active layer
  const getTileUrl = (x: number, y: number, z: number) => {
    const maxTile = Math.pow(2, z);
    const wrappedX = ((x % maxTile) + maxTile) % maxTile;

    if (layerType === "satellite") {
      // Esri World Imagery (high-resolution satellite)
      return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${wrappedX}`;
    } else if (layerType === "dark") {
      // CartoDB Dark Matter
      const subdomains = ["a", "b", "c", "d"];
      const sub = subdomains[(x + y) % subdomains.length];
      return `https://${sub}.basemaps.cartocdn.com/dark_all/${z}/${wrappedX}/${y}.png`;
    } else {
      // OpenStreetMap Standard
      return `https://tile.openstreetmap.org/${z}/${wrappedX}/${y}.png`;
    }
  };

  // Render Map Tiles and Canvas
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Fill background
    ctx.fillStyle = layerType === "satellite" ? "#060b13" : "#0a0f1d";
    ctx.fillRect(0, 0, width, height);

    const centerProj = project(center.lat, center.lon, zoom);
    const tileSize = 256;

    // Calculate tile bounds to render
    const minTileX = Math.floor((centerProj.x - width / 2) / tileSize);
    const maxTileX = Math.floor((centerProj.x + width / 2) / tileSize);
    const minTileY = Math.floor((centerProj.y - height / 2) / tileSize);
    const maxTileY = Math.floor((centerProj.y + height / 2) / tileSize);

    const maxCoord = Math.pow(2, zoom);

    // Draw visible tiles
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        if (ty < 0 || ty >= maxCoord) continue;

        const tileX = tx * tileSize - (centerProj.x - width / 2);
        const tileY = ty * tileSize - (centerProj.y - height / 2);

        const tileKey = `${layerType}-${zoom}-${tx}-${ty}`;
        let img = tileCache.current.get(tileKey);

        if (!img) {
          img = new Image();
          img.crossOrigin = "anonymous";
          img.src = getTileUrl(tx, ty, zoom);
          img.onload = () => {
            // Trigger redraw once tile loads
            drawMap();
          };
          tileCache.current.set(tileKey, img);
        } else if (img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, tileX, tileY, tileSize, tileSize);
        }
      }
    }

    // Subtle dark vignette overlay for satellite layer to match theme
    if (layerType === "satellite") {
      const vig = ctx.createRadialGradient(width / 2, height / 2, height * 0.4, width / 2, height / 2, width * 0.75);
      vig.addColorStop(0, "rgba(8, 13, 26, 0.15)");
      vig.addColorStop(1, "rgba(8, 13, 26, 0.7)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }
  }, [center, zoom, layerType, project]);

  useEffect(() => {
    drawMap();
  }, [drawMap]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => drawMap();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawMap]);

  // Coordinate conversion helpers for overlay pins
  const getScreenPos = (lat: number, lon: number) => {
    const container = containerRef.current;
    if (!container) return { x: -999, y: -999 };
    const width = container.clientWidth;
    const height = container.clientHeight;

    const centerProj = project(center.lat, center.lon, zoom);
    const siteProj = project(lat, lon, zoom);

    const x = width / 2 + (siteProj.x - centerProj.x);
    const y = height / 2 + (siteProj.y - centerProj.y);
    return { x, y };
  };

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;

    const centerProj = project(center.lat, center.lon, zoom);
    const newCenterProj = {
      x: centerProj.x - dx,
      y: centerProj.y - dy,
    };

    const newCenter = unproject(newCenterProj.x, newCenterProj.y, zoom);
    setCenter(newCenter);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Scroll wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(18, z + 1));
    } else {
      setZoom((z) => Math.max(3, z - 1));
    }
  };

  // Click on map to inspect or scan coordinates
  const handleMapClick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Check if clicked close to a site pin first
    for (const site of sites) {
      const pos = getScreenPos(site.lat, site.lon);
      const dist = Math.hypot(px - pos.x, py - pos.y);
      if (dist <= 20) {
        onSelectSite(site);
        return;
      }
    }

    // Convert pixel to lat/lon
    const centerProj = project(center.lat, center.lon, zoom);
    const clickProj = {
      x: centerProj.x + (px - container.clientWidth / 2),
      y: centerProj.y + (py - container.clientHeight / 2),
    };
    const coords = unproject(clickProj.x, clickProj.y, zoom);
    onSelectCoords(Number(coords.lat.toFixed(4)), Number(coords.lon.toFixed(4)));
  };

  const resetToBasin = () => {
    if (sites.length > 0) {
      setCenter({ lat: sites[0].lat, lon: sites[0].lon });
      setZoom(11);
    } else {
      setCenter({ lat: 20.5937, lon: 78.9629 });
      setZoom(5);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleMapClick}
      className="relative w-full h-full min-h-[500px] bg-[#070d18] rounded-2xl border border-slate-800 overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-2xl"
    >
      {/* Real Tile Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Layer Switcher & Basin Reset Controls */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-xl z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLayerType("satellite");
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            layerType === "satellite"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Satellite className="w-3.5 h-3.5" />
          <span>Satellite</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setLayerType("dark");
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            layerType === "dark"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Dark Map</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setLayerType("osm");
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            layerType === "osm"
              ? "bg-teal-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Terrain</span>
        </button>
      </div>

      {/* Zoom & Navigation HUD */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            resetToBasin();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700/70 text-slate-200 text-xs hover:bg-slate-800 transition-all shadow-md"
          title="Reset Map View"
        >
          <Compass className="w-3.5 h-3.5 text-teal-400" />
          <span>Reset View</span>
        </button>

        <div className="flex flex-col bg-slate-950/90 backdrop-blur-md border border-slate-700/70 rounded-lg p-1 shadow-md">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(18, z + 1));
            }}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(3, z - 1));
            }}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Site Markers Overlay */}
      {sites.map((site) => {
        const { x, y } = getScreenPos(site.lat, site.lon);
        // Hide if outside viewport
        if (
          !containerRef.current ||
          x < -40 ||
          x > containerRef.current.clientWidth + 40 ||
          y < -40 ||
          y > containerRef.current.clientHeight + 40
        ) {
          return null;
        }

        const isSelected = selectedSite?.id === site.id;
        const isAnomaly = site.latest_analysis?.overall_status === "anomaly";
        const isConfirmed = site.latest_analysis?.overall_status === "confirmed";
        const label = site.site_code || site.id.substring(0, 4);

        // Pixel radius of 500m buffer circle at current zoom
        const metersPerPixel = (156543.03392 * Math.cos((site.lat * Math.PI) / 180)) / Math.pow(2, zoom);
        const bufferRadiusPixels = Math.max(12, site.buffer_radius_m / metersPerPixel);

        return (
          <div
            key={site.id}
            style={{ left: `${x}px`, top: `${y}px` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSite(site);
            }}
            onMouseEnter={() => setHoveredSite(site)}
            onMouseLeave={() => setHoveredSite(null)}
          >
            {/* Anomaly Ping Ripple */}
            {isAnomaly && (
              <div className="absolute -inset-3 rounded-full border-2 border-red-500 animate-ping opacity-75 pointer-events-none" />
            )}

            {/* Buffer zone circle for selected site */}
            {isSelected && (
              <div
                className="absolute rounded-full border-2 border-teal-400 bg-teal-500/15 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: "50%",
                  top: "50%",
                  width: `${bufferRadiusPixels * 2}px`,
                  height: `${bufferRadiusPixels * 2}px`,
                }}
              />
            )}

            {/* Pin Badge */}
            <div
              className={`relative flex items-center justify-center rounded-full border-2 transition-transform duration-200 shadow-xl ${
                isSelected
                  ? "scale-125 z-30 ring-4 ring-teal-400/40"
                  : "group-hover:scale-115"
              } ${
                isAnomaly
                  ? "bg-red-600 border-red-200 text-white w-8 h-8 font-bold"
                  : isConfirmed
                  ? "bg-emerald-600 border-emerald-200 text-white w-7 h-7 font-semibold"
                  : "bg-teal-600 border-teal-200 text-white w-7 h-7 font-semibold"
              }`}
            >
              <span className="font-mono text-[10px]">{label}</span>
            </div>

            {/* Tooltip */}
            {hoveredSite?.id === site.id && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 p-3 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs pointer-events-none z-50">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-100">{label}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      isAnomaly
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {site.latest_analysis?.overall_status || "Pending"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1 capitalize font-medium">
                  {site.activity_type ? site.activity_type.replace(/_/g, " ") : "Watershed Site"}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {site.lat.toFixed(4)}°N, {site.lon.toFixed(4)}°E
                </div>
                {site.latest_analysis && (
                  <div className="mt-2 pt-1.5 border-t border-slate-800 flex justify-between font-mono text-[10px]">
                    <span className="text-slate-400">
                      Score: <strong className="text-slate-100">{site.latest_analysis.health_score ?? "N/A"}/100</strong>
                    </span>
                    <span className="text-teal-400 font-bold">
                      Grade {site.latest_analysis.health_grade}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Target Crosshairs for Scanned Coordinates */}
      {targetCoords && (
        (() => {
          const { x, y } = getScreenPos(targetCoords.lat, targetCoords.lon);
          return (
            <div
              style={{ left: `${x}px`, top: `${y}px` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-25 flex flex-col items-center"
            >
              <div className="relative flex items-center justify-center w-10 h-10">
                <Crosshair className="w-8 h-8 text-amber-400 animate-pulse" />
                <div className="absolute inset-0 rounded-full border border-amber-400/50 animate-ping" />
              </div>
              <div className="bg-amber-950/90 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-md">
                {targetCoords.lat.toFixed(4)}°N, {targetCoords.lon.toFixed(4)}°E
              </div>
            </div>
          );
        })()
      )}

      {/* Legend & Telemetry Bar */}
      <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs z-30 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-300">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/30" />
          <span>Anomaly</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-2 ring-teal-500/30" />
          <span>Monitored</span>
        </div>
        <div className="hidden sm:block border-l border-slate-800 pl-3 font-mono text-slate-400 text-[11px]">
          Center: {center.lat.toFixed(4)}°N, {center.lon.toFixed(4)}°E (Zoom {zoom})
        </div>
      </div>
    </div>
  );
};
