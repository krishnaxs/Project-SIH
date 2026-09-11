"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BuyerLogisticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestId = searchParams.get("requestId");

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [userLocation, setUserLocation] = useState(null);
  const [requestingVehicle, setRequestingVehicle] = useState(null);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Your browser does not support location services.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };

        setUserLocation(location);

        fetchNearbyVehicles(
            location.latitude,
            location.longitude
        );
        },
      () => {
        setMessage(
          "Location access is required to find nearby logistics providers."
        );
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const fetchNearbyVehicles = async (lat, lng) => {
    try {
      const response = await fetch(
        `/api/vehicles/nearby?lat=${lat}&lng=${lng}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to load vehicles.");
        return;
      }

      setVehicles(data);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const requestVehicle = async (vehicleId) => {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
        router.push("/login");
        return;
        }

        if (!userLocation) {
        setMessage("Your location is required to request transport.");
        return;
        }

        setRequestingVehicle(vehicleId);

        const response = await fetch("/api/transport-requests", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            vehicleId,
            cropRequestId: requestId,

            pickupLocation: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            address: "",
            },

            deliveryLocation: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            address: "",
            },

            notes: "",
        }),
        });

        const contentType = response.headers.get("content-type");

            let data;

            if (contentType && contentType.includes("application/json")) {
            data = await response.json();
            } else {
            const text = await response.text();
            console.error("Non-JSON response:", text);

            setMessage("Server returned an unexpected response.");
            return;
        }

        if (!response.ok) {
        setMessage(data.message || "Failed to send transport request.");
        return;
        }

        alert("Transport request sent successfully.");

        router.push("/buyer/requests");
    } catch (error) {
        console.error(error);
        setMessage("Something went wrong while requesting the vehicle.");
    } finally {
        setRequestingVehicle(null);
    }
    };

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) {
      return "Distance unavailable";
    }

    if (distance < 1) {
      return `${Math.round(distance * 1000)} m away`;
    }

    return `${distance.toFixed(1)} km away`;
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        <button
          onClick={() => router.push("/buyer/requests")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Requests
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Nearby Logistics
          </h1>

          <p className="mt-2 text-slate-600">
            Available transport providers are shown from nearest to farthest.
          </p>
        </div>

        {requestId && (
          <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            Transport request linked to your accepted crop request.
          </div>
        )}

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              Finding nearby vehicles...
            </p>
          </div>
        )}

        {!loading && message && (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            <p>{message}</p>

            <button
              onClick={getLocation}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !message && vehicles.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🚚</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No nearby vehicles available
            </h2>

            <p className="mt-2 text-slate-600">
              Please try again later.
            </p>
          </div>
        )}

        {!loading && !message && vehicles.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle._id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    🚚 {vehicle.vehicleType}
                  </h2>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    {formatDistance(vehicle.distance)}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">
                      Provider:
                    </span>{" "}
                    {vehicle.owner?.name || "Unknown"}
                  </p>

                  <p>
                    <span className="font-semibold text-slate-800">
                      Capacity:
                    </span>{" "}
                    {vehicle.capacity} {vehicle.capacityUnit}
                  </p>

                  <p>
                    <span className="font-semibold text-slate-800">
                      Rate:
                    </span>{" "}
                    ₹{vehicle.ratePerKm}/km
                  </p>

                  <p>
                    <span className="font-semibold text-slate-800">
                      Vehicle:
                    </span>{" "}
                    {vehicle.vehicleNumber}
                  </p>
                </div>

                <button
                    onClick={() => requestVehicle(vehicle._id)}
                    disabled={requestingVehicle === vehicle._id}
                    className="mt-6 w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {requestingVehicle === vehicle._id
                        ? "Sending Request..."
                        : "Request This Vehicle"}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
export default function BuyerLogisticsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuyerLogisticsContent />
    </Suspense>
  );
}