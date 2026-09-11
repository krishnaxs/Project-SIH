"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BrowseCropsPage() {
  const router = useRouter();

  const [crops, setCrops] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCrops();
  }, []);

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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCrops.map((crop) => (
              <div
                key={crop._id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-bold text-slate-900">
                  🌾 {crop.cropName}
                </h2>

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
                  className="mt-6 w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800"
                >
                  Contact Farmer
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}