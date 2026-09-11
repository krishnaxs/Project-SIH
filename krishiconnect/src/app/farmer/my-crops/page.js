"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyCropsPage() {
  const router = useRouter();

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMyCrops();
  }, []);

  const fetchMyCrops = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/crops/my-crops", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to load crops.");
        return;
      }

      setCrops(data);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while loading crops.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              onClick={() => router.push("/farmer/dashboard")}
              className="mb-4 text-sm font-semibold text-green-700 hover:text-green-800"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-slate-900">
              My Listed Crops
            </h1>

            <p className="mt-2 text-slate-600">
              View all the crops you have listed.
            </p>
          </div>

          <button
            onClick={() => router.push("/farmer/add-crop")}
            className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            + Add New Crop
          </button>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              Loading your crops...
            </p>
          </div>
        )}

        {!loading && message && (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            {message}
          </div>
        )}

        {!loading && !message && crops.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🌾</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No crops listed yet
            </h2>

            <p className="mt-2 text-slate-600">
              Add your first crop to make it visible to buyers.
            </p>

            <button
              onClick={() => router.push("/farmer/add-crop")}
              className="mt-6 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Add Crop
            </button>
          </div>
        )}

        {!loading && !message && crops.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {crops.map((crop) => (
              <div
                key={crop._id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    🌾 {crop.cropName}
                  </h2>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
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

                  {crop.description && (
                    <p>
                      <span className="font-semibold text-slate-800">
                        Description:
                      </span>{" "}
                      {crop.description}
                    </p>
                  )}

                  <p className="pt-2 text-xs text-slate-400">
                    Listed on{" "}
                    {new Date(crop.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}