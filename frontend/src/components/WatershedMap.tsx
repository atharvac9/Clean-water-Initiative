"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Site } from "../lib/types";
import {
  Search,
  X,
  Compass,
  MapPin,
  Eye,
  Layers,
  Sparkles,
  Loader2,
  Navigation,
  Crosshair,
} from "lucide-react";
import type L from "leaflet";

interface WatershedMapProps {
  sites: Site[];
  selectedSite: Site | null;
  onSelectSite: (site: Site) => void;
  onSelectCoords: (lat: number, lon: number) => void;
  targetCoords?: { lat: number; lon: number } | null;
}

type MapLayerType = "osm" | "light" | "dark";

interface SearchResult {
  place_id: number | string;
  display_name: string;
  lat: number;
  lon: number;
  type?: string;
}

export const WatershedMap: React.FC<WatershedMapProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  onSelectCoords,
  targetCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const siteMarkersRef = useRef<L.LayerGroup | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const leafletLibRef = useRef<typeof L | null>(null);

  const [activeLayer, setActiveLayer] = useState<MapLayerType>("osm");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show a temporary toast message
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Tile layer URLs - clean street, light, and dark cartography (no satellite imagery)
  const getTileLayer = useCallback((layer: MapLayerType, L_lib: typeof L) => {
    if (layer === "light") {
      return L_lib.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
          attribution: "&copy; CartoDB Positron",
        }
      );
    } else if (layer === "dark") {
      return L_lib.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
          attribution: "&copy; CartoDB Dark Matter",
        }
      );
    } else {
      return L_lib.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }
      );
    }
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const leafletModule = await import("leaflet");
      const L = (leafletModule.default || leafletModule) as unknown as typeof import("leaflet");
      if (!isMounted || !mapContainerRef.current) return;

      leafletLibRef.current = L;

      // Determine initial center
      const initialLat = sites.length > 0 ? sites[0].lat : 20.5937;
      const initialLon = sites.length > 0 ? sites[0].lon : 78.9629;
      const initialZoom = sites.length > 0 ? 12 : 5;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
      });

      // Add zoom control at bottom-right
      L.control
        .zoom({
          position: "bottomright",
        })
        .addTo(map);

      // Add default tile layer (OpenStreetMap / clean cartography)
      const baseTile = getTileLayer("osm", L);
      baseTile.addTo(map);
      tileLayerRef.current = baseTile;

      // Layer group for sites
      const sitesGroup = L.layerGroup().addTo(map);
      siteMarkersRef.current = sitesGroup;

      // Map click handler to select coordinates
      map.on("click", (e: L.LeafletMouseEvent) => {
        const lat = Number(e.latlng.lat.toFixed(4));
        const lon = Number(e.latlng.lng.toFixed(4));
        onSelectCoords(lat, lon);
        showToast(`Selected coordinates: ${lat}°N, ${lon}°E`);
      });

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [getTileLayer, onSelectCoords, showToast, sites]);

  // Handle Layer Switching
  const handleLayerChange = (newLayer: MapLayerType) => {
    setActiveLayer(newLayer);
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const newTile = getTileLayer(newLayer, L);
    newTile.addTo(map);
    tileLayerRef.current = newTile;
  };

  // Render Site Markers and Buffers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const sitesGroup = siteMarkersRef.current;
    const L = leafletLibRef.current;
    if (!map || !sitesGroup || !L) return;

    sitesGroup.clearLayers();

    sites.forEach((site) => {
      const isSelected = selectedSite?.id === site.id;
      const isAnomaly = site.latest_analysis?.overall_status === "anomaly";
      const isConfirmed = site.latest_analysis?.overall_status === "confirmed";

      const color = isAnomaly ? "#ef4444" : isConfirmed ? "#10b981" : "#f59e0b";

      // 500m Buffer circle
      const buffer = L.circle([site.lat, site.lon], {
        radius: site.buffer_radius_m || 500,
        color: color,
        weight: isSelected ? 2 : 1,
        dashArray: isSelected ? undefined : "4, 6",
        fillColor: color,
        fillOpacity: isSelected ? 0.2 : 0.08,
      });
      buffer.addTo(sitesGroup);

      // Custom marker icon
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute w-8 h-8 rounded-full animate-ping opacity-40" style="background-color: ${color}"></div>
          <div class="relative w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2" 
               style="background-color: #0f172a; border-color: ${color};">
            <span class="text-[10px] font-bold font-mono" style="color: ${color}">
              ${site.site_code || site.id.substring(0, 3)}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-site-pin",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([site.lat, site.lon], { icon: customIcon });

      marker.bindTooltip(
        `
        <div class="font-sans">
          <div class="font-bold text-white flex items-center gap-1.5">
            <span>${site.site_code || site.id}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded capitalize" style="background: ${color}22; color: ${color};">
              ${(site.activity_type || "watershed").replace(/_/g, " ")}
            </span>
          </div>
          <div class="text-[10px] text-slate-400 mt-1">
            ${site.description || `${site.lat.toFixed(4)}°N, ${site.lon.toFixed(4)}°E`}
          </div>
          ${
            site.latest_analysis
              ? `<div class="text-[10px] font-mono text-teal-300 mt-0.5">Health Score: ${site.latest_analysis.health_score} (Grade ${site.latest_analysis.health_grade})</div>`
              : ""
          }
        </div>
        `,
        { direction: "top", offset: [0, -10] }
      );

      marker.on("click", () => {
        onSelectSite(site);
      });

      marker.addTo(sitesGroup);
    });
  }, [sites, selectedSite, onSelectSite]);

  // Update Target Pin when targetCoords changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletLibRef.current;
    if (!map || !L) return;

    if (targetCoords) {
      if (targetMarkerRef.current) {
        targetMarkerRef.current.setLatLng([targetCoords.lat, targetCoords.lon]);
      } else {
        const targetHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-full border-2 border-teal-400 animate-ping opacity-60"></div>
            <div class="w-8 h-8 rounded-full bg-teal-500/20 border-2 border-teal-300 flex items-center justify-center shadow-xl backdrop-blur-md">
              <div class="w-2.5 h-2.5 rounded-full bg-teal-300 animate-pulse"></div>
            </div>
          </div>
        `;

        const targetIcon = L.divIcon({
          html: targetHtml,
          className: "target-crosshair-pin",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const newTarget = L.marker([targetCoords.lat, targetCoords.lon], {
          icon: targetIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        newTarget.bindPopup(`
          <div class="text-xs font-sans">
            <div class="font-bold text-teal-300 flex items-center gap-1">
              <span>🎯 Target Coordinate</span>
            </div>
            <div class="font-mono text-slate-300 mt-1">
              ${targetCoords.lat.toFixed(4)}°N, ${targetCoords.lon.toFixed(4)}°E
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              Ready for watershed telemetry analysis
            </div>
          </div>
        `);

        targetMarkerRef.current = newTarget;
      }
    } else if (targetMarkerRef.current) {
      map.removeLayer(targetMarkerRef.current);
      targetMarkerRef.current = null;
    }
  }, [targetCoords]);

  // Debounced Geocoding Search (Nominatim OpenStreetMap)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Check if input is directly coordinates: "19.05, 74.72" or "19.05 74.72"
    const coordMatch = trimmed.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        setSearchResults([
          {
            place_id: "direct-coords",
            display_name: `Coordinates: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
            lat,
            lon,
            type: "coordinate",
          },
        ]);
        setIsDropdownOpen(true);
        setIsSearching(false);
        return;
      }
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          trimmed
        )}&limit=6&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "en",
          },
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const formatted = data.map((item: any) => ({
          place_id: item.place_id,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type || item.class,
        }));
        setSearchResults(formatted);
        setIsDropdownOpen(true);
      } catch (err) {
        console.warn("Geocoding search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fly to location when a search result is clicked
  const handleSelectLocation = (result: SearchResult) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([result.lat, result.lon], 14, {
      duration: 1.5,
    });

    onSelectCoords(Number(result.lat.toFixed(4)), Number(result.lon.toFixed(4)));
    setSearchQuery(result.display_name.split(",")[0]);
    setIsDropdownOpen(false);
    showToast(`Jumped to: ${result.display_name.split(",")[0]} (${result.lat.toFixed(4)}, ${result.lon.toFixed(4)})`);
  };

  // Reset View to sites or overview
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (sites.length > 0) {
      map.flyTo([sites[0].lat, sites[0].lon], 12, { duration: 1 });
    } else {
      map.flyTo([20.5937, 78.9629], 5, { duration: 1 });
    }
  };

  // HTML5 Browser Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(4));
        const lon = Number(pos.coords.longitude.toFixed(4));
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([lat, lon], 14, { duration: 1.5 });
        }
        onSelectCoords(lat, lon);
        showToast(`Located your position: ${lat}°N, ${lon}°E`);
      },
      (err) => {
        setIsLocating(false);
        showToast(`Geolocation error: ${err.message}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[520px] bg-[#070d18] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* ── Top Floating Bar: Search Input & Layer Switcher ────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pointer-events-none">
        {/* Location Search Bar with Autocomplete */}
        <div className="relative flex-1 max-w-md pointer-events-auto">
          <div className="relative flex items-center">
            <div className="absolute left-3 text-teal-400">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>
            <input
              type="text"
              placeholder="Search location, village, river, or lat,lon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsDropdownOpen(true);
              }}
              className="w-full pl-9 pr-16 py-2 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xl transition-all"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setIsDropdownOpen(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded-md"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleLocateMe}
                disabled={isLocating}
                className="p-1.5 text-teal-400 hover:text-teal-300 hover:bg-slate-800/80 rounded-md transition-all cursor-pointer"
                title="Locate my position"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-950/95 backdrop-blur-md border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden z-[1010] max-h-64 overflow-y-auto">
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.place_id}-${idx}`}
                  onClick={() => handleSelectLocation(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 border-b border-slate-800/60 last:border-0 flex items-start gap-2.5 transition-colors cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-100 truncate">
                      {item.display_name.split(",")[0]}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {item.display_name}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0 mt-0.5">
                    {item.lat.toFixed(3)}, {item.lon.toFixed(3)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layer Switcher & Reset */}
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1 shadow-md pointer-events-auto self-start sm:self-auto">
          <button
            onClick={() => handleLayerChange("osm")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === "osm"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="OpenStreetMap Cartography"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Street Map</span>
          </button>

          <button
            onClick={() => handleLayerChange("light")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === "light"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Clean Light Cartography"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Light</span>
          </button>

          <button
            onClick={() => handleLayerChange("dark")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === "dark"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="Dark Cartography"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dark</span>
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <button
            onClick={handleResetView}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            title="Reset Map View"
          >
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="absolute bottom-5 left-5 z-[1000] bg-slate-900/95 backdrop-blur-md border border-teal-500/40 text-teal-300 px-3.5 py-2 rounded-xl text-xs font-mono shadow-2xl flex items-center gap-2 animate-fadeIn">
          <Crosshair className="w-3.5 h-3.5 text-teal-400 shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Leaflet Map DOM Container ─────────────────────────────────────── */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />
    </div>
  );
};
