"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BrowseCropsPage() {
  const router = useRouter();

  const [crops, setCrops] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedCrop, setSelectedCrop] = useState(null);

  const fetchCrops = async () => {
    try {
      const response = await fetch("/api/crops/browse");
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to load crops.");
        return;
      }

      setCrops(data);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(fetchCrops, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const filteredCrops = crops.filter((crop) =>
    crop.cropName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-7xl">

        <button
          onClick={() => router.push("/farmer/dashboard")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Dashboard
        </button>

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Browse Crops
            </h1>

            <p className="mt-2 text-slate-600">
              Explore crops currently listed by farmers.
            </p>
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
            <p className="text-slate-600">Loading crops...</p>
          </div>
        )}

        {!loading && message && (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            {message}
          </div>
        )}

        {!loading && !message && filteredCrops.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🌾</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No crops found
            </h2>

            <p className="mt-2 text-slate-600">
              Try searching for a different crop.
            </p>
          </div>
        )}

        {!loading && !message && filteredCrops.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[minmax(0,1fr)_10rem_10rem_9rem] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid">
              <span>Crop</span>
              <span>Price</span>
              <span>Quantity</span>
              <span className="sr-only">Actions</span>
            </div>
            {filteredCrops.map((crop) => (
              <div
                key={crop._id}
                className="grid gap-4 border-b border-slate-200 px-6 py-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_10rem_10rem_9rem] sm:items-center"
              >
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 sm:hidden">
                    Crop
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    {crop.cropName}
                  </h2>
                </div>

                <p className="text-sm text-slate-700">
                  <span className="font-semibold sm:hidden">Price: </span>
                  ₹{crop.price}
                </p>

                <p className="text-sm text-slate-700">
                  <span className="font-semibold sm:hidden">Quantity: </span>
                  {crop.quantity} {crop.unit}
                </p>

                <button
                  type="button"
                  onClick={() => setSelectedCrop(crop)}
                  className="w-full rounded-lg border border-green-700 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-50"
                >
                  More details
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedCrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedCrop.cropName}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedCrop(null)}
                  aria-label="Close crop details"
                  className="text-2xl leading-none text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-900">Farmer:</span> {selectedCrop.farmer?.name || "Unknown"}</p>
                <p><span className="font-semibold text-slate-900">Price:</span> ₹{selectedCrop.price}</p>
                <p><span className="font-semibold text-slate-900">Quantity:</span> {selectedCrop.quantity} {selectedCrop.unit}</p>
                <p><span className="font-semibold text-slate-900">Location:</span> {selectedCrop.farmer?.location?.address || "Location not available"}</p>
                <p><span className="font-semibold text-slate-900">Description:</span> {selectedCrop.description || "No description provided."}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}