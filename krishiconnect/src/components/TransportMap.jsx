"use client";

import { useEffect, useRef, useState } from "react";

let leafletLoadingPromise = null;

function loadLeafletOnce() {
  if (typeof window !== "undefined" && window.L) {
    return Promise.resolve();
  }

  if (!leafletLoadingPromise) {
    leafletLoadingPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-leaflet="true"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.dataset.leaflet = "true";
        document.head.appendChild(link);
      }

      const existingScript = document.querySelector('script[data-leaflet="true"]');

      if (existingScript) {
        existingScript.addEventListener("load", resolve);
        existingScript.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.dataset.leaflet = "true";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  return leafletLoadingPromise;
}

function hasCoordinates(location) {
  return (
    location &&
    Number.isFinite(Number(location.latitude)) &&
    Number.isFinite(Number(location.longitude))
  );
}

export default function TransportMap({
  requestId,
  pickup,
  delivery,
  liveLocation,
  routeCoordinates = [],
  tracking = false,
  pickupLabel = "Farmer / Pickup",
  deliveryLabel = "Buyer / Delivery",
  vehicleLabel = "Live Vehicle",
  vehicleNumber = "",
}) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layersRef = useRef(null);
  const [gpsMessage, setGpsMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMap = async () => {
      await loadLeafletOnce();

      if (cancelled || !mapRef.current || mapInstance.current) return;

      const L = window.L;
      const start = hasCoordinates(pickup)
        ? [Number(pickup.latitude), Number(pickup.longitude)]
        : [20.5937, 78.9629];

      mapInstance.current = L.map(mapRef.current).setView(start, 10);

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }
      ).addTo(mapInstance.current);

      layersRef.current = L.layerGroup().addTo(mapInstance.current);
      draw(L);
    };

    loadMap().catch(() => setGpsMessage("Map could not be loaded."));

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (window.L && mapInstance.current) draw(window.L);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup, delivery, liveLocation, routeCoordinates]);

  function draw(L) {
    if (!mapInstance.current || !layersRef.current) return;

    layersRef.current.clearLayers();
    const points = [];

    const createIcon = (emoji, background) =>
      L.divIcon({
        className: "transport-map-marker",
        html: `<div style="width:38px;height:38px;border-radius:50%;background:${background};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:21px;">${emoji}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

    const addMarker = (location, title, emoji, background, details) => {
      if (!hasCoordinates(location)) return;

      const p = [Number(location.latitude), Number(location.longitude)];
      points.push(p);

      L.marker(p, { icon: createIcon(emoji, background) })
        .bindPopup(
          `<div style="min-width:180px"><strong>${title}</strong>${details ? `<br/><span>${details}</span>` : ""}<br/><small>${p[0].toFixed(5)}, ${p[1].toFixed(5)}</small></div>`
        )
        .addTo(layersRef.current);
    };

    addMarker(
      pickup,
      pickupLabel,
      "🌾",
      "#16a34a",
      pickup?.address || "Farmer crop pickup point"
    );

    addMarker(
      delivery,
      deliveryLabel,
      "📦",
      "#dc2626",
      delivery?.address || "Buyer delivery point"
    );

    addMarker(
      liveLocation,
      vehicleLabel,
      "🚚",
      "#2563eb",
      vehicleNumber ? `Vehicle ${vehicleNumber}` : "Current logistics GPS location"
    );

    if (Array.isArray(routeCoordinates) && routeCoordinates.length) {
      const line = routeCoordinates
        .filter(
          (pair) =>
            Array.isArray(pair) &&
            pair.length >= 2 &&
            Number.isFinite(Number(pair[0])) &&
            Number.isFinite(Number(pair[1]))
        )
        .map(([lng, lat]) => [Number(lat), Number(lng)]);

      if (line.length >= 2) {
        L.polyline(line, { weight: 5 }).addTo(layersRef.current);
        points.push(...line);
      }
    }

    const validPoints = points.filter(
      (point) =>
        Array.isArray(point) &&
        point.length >= 2 &&
        Number.isFinite(point[0]) &&
        Number.isFinite(point[1])
    );

    if (validPoints.length === 1) {
      mapInstance.current.setView(validPoints[0], 14);
    } else if (validPoints.length > 1) {
      mapInstance.current.fitBounds(validPoints, {
        padding: [40, 40],
      });
    }
  }

  useEffect(() => {
    if (!tracking || !requestId || !navigator.geolocation) return;

    let lastSent = 0;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastSent < 5000) return;
        lastSent = now;

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          const response = await fetch(
            `/api/transport-requests/${requestId}/location`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }),
            }
          );

          if (!response.ok) {
            setGpsMessage("GPS update was rejected by the server");
            return;
          }

          setGpsMessage("Live GPS sharing active");
        } catch {
          setGpsMessage("GPS update failed");
        }
      },
      () =>
        setGpsMessage(
          "Allow location access to share live vehicle location"
        ),
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, requestId]);

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div ref={mapRef} className="h-96 w-full" />

      {/* Route & Transport Summary Info */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-3">

          {/* Pickup Point */}
          <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 shadow-xs transition hover:bg-emerald-50/70">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shadow-xs">
              <span className="h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-200/80"></span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                Pickup Point
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                {pickupLabel}
              </span>
            </div>
          </div>

          {/* Delivery Point */}
          <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3 shadow-xs transition hover:bg-rose-50/70">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 shadow-xs">
              <span className="h-3 w-3 rounded-full bg-rose-600 ring-4 ring-rose-200/80"></span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-rose-800">
                Delivery Point
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                {deliveryLabel}
              </span>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3 shadow-xs transition hover:bg-blue-50/70">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shadow-xs">
              <span className="h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-200/80"></span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-blue-800">
                Vehicle Info
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                {vehicleNumber ? `🚚 ${vehicleNumber}` : vehicleLabel}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Live GPS Tracking Status Bar */}
      {tracking && (
        <div className="flex items-center gap-2.5 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-800">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
          </span>
          <span className="text-slate-800">
            {gpsMessage || "Live GPS sharing active"}
          </span>
        </div>
      )}
    </div>
  );
}
