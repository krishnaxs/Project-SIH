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

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default function TransportMap({
  requestId,
  pickup,
  delivery,
  liveLocation,
  routeCoordinates = [],
  routeDistance = null,
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
  const [driverLoc, setDriverLoc] = useState(() =>
    hasCoordinates(liveLocation) ? liveLocation : null
  );
  const [driverToSellerRoute, setDriverToSellerRoute] = useState(null);
  const [fetchingRoute, setFetchingRoute] = useState(false);

  // Sync liveLocation prop changes
  useEffect(() => {
    if (hasCoordinates(liveLocation)) {
      setDriverLoc(liveLocation);
    }
  }, [liveLocation]);

  // One-time browser geolocation if no driver location provided
  useEffect(() => {
    if (!driverLoc && typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverLoc({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [driverLoc]);

  // Fetch shortest driving route between Driver and Seller (Farmer / Pickup)
  useEffect(() => {
    const activeDriver = driverLoc || (hasCoordinates(liveLocation) ? liveLocation : null);
    if (!hasCoordinates(activeDriver) || !hasCoordinates(pickup)) return;

    let cancelled = false;

    const fetchShortestPath = async () => {
      try {
        setFetchingRoute(true);
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${activeDriver.longitude},${activeDriver.latitude};${pickup.longitude},${pickup.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl, {
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error("OSRM routing service failed");
        const data = await res.json();
        const route = data.routes?.[0];

        if (!cancelled && route) {
          const dist = Number((route.distance / 1000).toFixed(1));
          const dur = Math.ceil(route.duration / 60);
          setDriverToSellerRoute({
            coordinates: route.geometry.coordinates,
            distance: dist,
            duration: dur,
          });
        }
      } catch (err) {
        if (!cancelled) {
          const directDist = calculateDistance(
            activeDriver.latitude,
            activeDriver.longitude,
            pickup.latitude,
            pickup.longitude
          );
          setDriverToSellerRoute({
            coordinates: [
              [activeDriver.longitude, activeDriver.latitude],
              [pickup.longitude, pickup.latitude],
            ],
            distance: directDist,
            duration: Math.max(1, Math.ceil((directDist / 40) * 60)),
          });
        }
      } finally {
        if (!cancelled) setFetchingRoute(false);
      }
    };

    fetchShortestPath();

    return () => {
      cancelled = true;
    };
  }, [
    driverLoc?.latitude,
    driverLoc?.longitude,
    pickup?.latitude,
    pickup?.longitude,
    liveLocation,
  ]);

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
  }, [
    pickup,
    delivery,
    liveLocation,
    driverLoc,
    routeCoordinates,
    driverToSellerRoute,
  ]);

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
          `<div style="min-width:180px"><strong style="color:#0f172a">${title}</strong>${
            details ? `<br/><span style="color:#475569">${details}</span>` : ""
          }<br/><small style="color:#64748b">${p[0].toFixed(5)}, ${p[1].toFixed(5)}</small></div>`
        )
        .addTo(layersRef.current);
    };

    // Seller (Pickup Point)
    addMarker(
      pickup,
      pickupLabel,
      "🌾",
      "#16a34a",
      pickup?.address || "Farmer / Seller crop pickup point"
    );

    // Buyer (Delivery Point)
    addMarker(
      delivery,
      deliveryLabel,
      "📦",
      "#dc2626",
      delivery?.address || "Buyer delivery destination"
    );

    // Driver (Vehicle Live Location)
    const activeDriver = driverLoc || liveLocation;
    addMarker(
      activeDriver,
      vehicleLabel || "Driver (Live Location)",
      "🚚",
      "#2563eb",
      vehicleNumber
        ? `Driver / Vehicle ${vehicleNumber}`
        : "Current Driver GPS Position"
    );

    // 1. Draw Shortest Path: Driver -> Seller (Navigational Blue Road Route)
    if (driverToSellerRoute?.coordinates?.length) {
      const driverPoints = driverToSellerRoute.coordinates.map(([lng, lat]) => [
        Number(lat),
        Number(lng),
      ]);

      if (driverPoints.length >= 2) {
        // Dark blue casing
        L.polyline(driverPoints, {
          color: "#1e40af",
          weight: 7,
          opacity: 0.95,
        }).addTo(layersRef.current);

        // Core bright blue road line
        L.polyline(driverPoints, {
          color: "#3b82f6",
          weight: 5,
          opacity: 1,
        })
          .bindPopup(
            `<div style="min-width:190px"><strong style="color:#1e40af">Shortest Path: Driver ➔ Seller</strong><br/>Distance: <b>${driverToSellerRoute.distance} km</b><br/>Est. Driving Time: <b>~${driverToSellerRoute.duration} mins</b></div>`
          )
          .addTo(layersRef.current);

        // Directional dash
        L.polyline(driverPoints, {
          color: "#dbeafe",
          weight: 2,
          opacity: 1,
          dashArray: "6, 10",
        }).addTo(layersRef.current);

        points.push(...driverPoints);
      }
    } else if (hasCoordinates(activeDriver) && hasCoordinates(pickup)) {
      const directLine = [
        [Number(activeDriver.latitude), Number(activeDriver.longitude)],
        [Number(pickup.latitude), Number(pickup.longitude)],
      ];
      L.polyline(directLine, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.85,
        dashArray: "8, 8",
      })
        .bindPopup("Shortest Direct Path: Driver ➔ Seller")
        .addTo(layersRef.current);
      points.push(...directLine);
    }

    // 2. Draw Delivery Route: Seller -> Buyer (Emerald Green Road Route)
    if (Array.isArray(routeCoordinates) && routeCoordinates.length) {
      const deliveryLine = routeCoordinates
        .filter(
          (pair) =>
            Array.isArray(pair) &&
            pair.length >= 2 &&
            Number.isFinite(Number(pair[0])) &&
            Number.isFinite(Number(pair[1]))
        )
        .map(([lng, lat]) => [Number(lat), Number(lng)]);

      if (deliveryLine.length >= 2) {
        L.polyline(deliveryLine, {
          color: "#15803d",
          weight: 5,
          opacity: 0.85,
        })
          .bindPopup("Delivery Route: Seller ➔ Buyer")
          .addTo(layersRef.current);
        points.push(...deliveryLine);
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
        padding: [45, 45],
      });
    }
  }

  // Live GPS tracking watcher
  useEffect(() => {
    if (!tracking || !requestId || !navigator.geolocation) return;

    let lastSent = 0;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setDriverLoc(coords);

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
              body: JSON.stringify(coords),
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
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      <div ref={mapRef} className="h-96 w-full" />

      {/* Navigation Routes Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 ring-4 ring-blue-500/30"></span>
          <span className="text-xs font-semibold text-blue-200">
            Shortest Path (Driver ➔ Seller):
          </span>
          <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300">
            {driverToSellerRoute?.distance
              ? `${driverToSellerRoute.distance} km • ~${driverToSellerRoute.duration} mins`
              : fetchingRoute
              ? "Calculating road route..."
              : "Locating driver..."}
          </span>
        </div>

        {routeDistance && (
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-emerald-500/30"></span>
            <span className="text-xs font-semibold text-emerald-200">
              Delivery Route (Seller ➔ Buyer):
            </span>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
              {routeDistance} km
            </span>
          </div>
        )}
      </div>

      {/* Route & Transport Party Cards */}
      <div className="border-t border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-3">

          {/* Pickup Point (Seller / Farmer) */}
          <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 shadow-xs transition hover:bg-emerald-50/70">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shadow-xs">
              <span className="h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-200/80"></span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                Seller (Pickup Point)
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                {pickupLabel}
              </span>
            </div>
          </div>

          {/* Delivery Point (Buyer) */}
          <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3 shadow-xs transition hover:bg-rose-50/70">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 shadow-xs">
              <span className="h-3 w-3 rounded-full bg-rose-600 ring-4 ring-rose-200/80"></span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-rose-800">
                Buyer (Delivery Point)
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                {deliveryLabel}
              </span>
            </div>
          </div>

          {/* Vehicle & Driver Info */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3 shadow-xs transition hover:bg-blue-50/70">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shadow-xs">
              <span className="h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-200/80"></span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-blue-800">
                Driver & Vehicle
              </span>
              <span className="mt-0.5 block truncate text-sm font-bold text-slate-900">
                {vehicleNumber ? `🚚 ${vehicleNumber}` : vehicleLabel}
              </span>
              {driverToSellerRoute?.distance && (
                <span className="mt-0.5 block text-xs font-semibold text-blue-700">
                  📍 {driverToSellerRoute.distance} km from seller
                </span>
              )}
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
