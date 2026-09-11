"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyerBrowseCropsPage() {
  const router = useRouter();

  const [crops, setCrops] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [buyerLocation, setBuyerLocation] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    getBuyerLocation();
  }, []);

  const getBuyerLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Your browser does not support location services.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setBuyerLocation({
          latitude,
          longitude,
        });

        fetchNearbyCrops(latitude, longitude);
      },
      () => {
        setLocationError(
          "Location access was denied. Please allow location access to see nearby farmers."
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

  const fetchNearbyCrops = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `/api/buyer/crops?lat=${latitude}&lng=${longitude}`
      );

      const data = await response.json();

      if (!response.ok) {
        setLocationError(data.message || "Failed to load crops.");
        return;
      }

      setCrops(data);
    } catch (error) {
      console.error(error);
      setLocationError("Something went wrong while loading crops.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCrops = crops.filter((crop) =>
    crop.cropName.toLowerCase().includes(search.toLowerCase())
  );

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) {
      return "Distance unavailable";
    }

    if (distance < 1) {
      return `${Math.round(distance * 1000)} m away`;
    }

    return `${distance.toFixed(1)} km away`;
  };

  const sendCropRequest = async () => {
  try {
    setSendingRequest(true);
    setRequestStatus("");

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!selectedCrop) {
      return;
    }

    if (
      !requestQuantity ||
      Number(requestQuantity) <= 0
    ) {
      setRequestStatus("Enter a valid quantity.");
      return;
    }

    if (Number(requestQuantity) > selectedCrop.quantity) {
      setRequestStatus(
        `Only ${selectedCrop.quantity} ${selectedCrop.unit} available.`
      );
      return;
    }

    const response = await fetch("/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        cropId: selectedCrop._id,
        quantityRequested: Number(requestQuantity),
        message: requestMessage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setRequestStatus(
        data.message || "Failed to send request."
      );
      return;
    }

    setRequestStatus("Request sent successfully.");

    setTimeout(() => {
      setSelectedCrop(null);
      setRequestQuantity("");
      setRequestMessage("");
      setRequestStatus("");
    }, 1200);
  } catch (error) {
    console.error(error);
    setRequestStatus("Something went wrong.");
  } finally {
    setSendingRequest(false);
  }
};

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        <button
          onClick={() => router.push("/buyer/dashboard")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Dashboard
        </button>

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Nearby Crops
            </h1>

            <p className="mt-2 text-slate-600">
              Farmers are shown from nearest to farthest.
            </p>

            {buyerLocation && (
              <p className="mt-2 text-xs text-green-700">
                📍 Showing farmers nearest to your location
              </p>
            )}
          </div>

          <input
            type="text"
            placeholder="Search crops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 sm:w-72"
          />
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              Finding farmers near you...
            </p>
          </div>
        )}

        {!loading && locationError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            <p>{locationError}</p>

            <button
              onClick={getBuyerLocation}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading &&
          !locationError &&
          filteredCrops.length === 0 && (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">🌾</div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No crops found
              </h2>

              <p className="mt-2 text-slate-600">
                Try searching for another crop.
              </p>
            </div>
          )}

        {!loading &&
          !locationError &&
          filteredCrops.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCrops.map((crop) => (
                <div
                  key={crop._id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-900">
                      🌾 {crop.cropName}
                    </h2>

                    <span className="whitespace-nowrap rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      {formatDistance(crop.distance)}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-800">
                        Farmer:
                      </span>{" "}
                      {crop.farmer?.name || "Unknown"}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Quantity:
                      </span>{" "}
                      {crop.quantity} {crop.unit}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Price:
                      </span>{" "}
                      ₹{crop.price}
                    </p>

                    <p>
                      <span className="font-semibold text-slate-800">
                        Location:
                      </span>{" "}
                      {crop.farmer?.location?.address ||
                        "Location not available"}
                    </p>

                    {crop.description && (
                      <p>
                        <span className="font-semibold text-slate-800">
                          Details:
                        </span>{" "}
                        {crop.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCrop(crop);
                      setRequestQuantity("");
                      setRequestMessage("");
                      setRequestStatus("");
                    }}
                    className="mt-6 w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Contact Farmer
                  </button>
                </div>
              ))}
            </div>
          )}

      </div>

      {selectedCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <h2 className="text-2xl font-bold text-slate-900">
              Contact Farmer
            </h2>

            <p className="mt-2 text-slate-600">
              {selectedCrop.cropName} —{" "}
              {selectedCrop.farmer?.name}
            </p>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Quantity Required ({selectedCrop.unit})
              </label>

              <input
                type="number"
                min="1"
                max={selectedCrop.quantity}
                value={requestQuantity}
                onChange={(e) =>
                  setRequestQuantity(e.target.value)
                }
                placeholder={`Maximum ${selectedCrop.quantity}`}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Message
              </label>

              <textarea
                rows="4"
                value={requestMessage}
                onChange={(e) =>
                  setRequestMessage(e.target.value)
                }
                placeholder="Write a message to the farmer..."
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {requestStatus && (
              <p className="mt-4 text-center text-sm font-medium text-slate-700">
                {requestStatus}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedCrop(null)}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={sendCropRequest}
                disabled={sendingRequest}
                className="flex-1 rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                {sendingRequest ? "Sending..." : "Send Request"}
              </button>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}