"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MyVehiclesPage() {
  const router = useRouter();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/vehicles/my-vehicles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <button
            onClick={() => router.push("/logistics/dashboard")}
            className="mb-4 text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to Dashboard
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                My Vehicles
              </h1>

              <p className="mt-2 text-slate-600">
                Manage the vehicles you have listed.
              </p>
            </div>

            <button
              onClick={() => router.push("/logistics/add-vehicle")}
              className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              + Add Vehicle
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              Loading vehicles...
            </p>
          </div>
        )}

        {!loading && message && (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            {message}
          </div>
        )}

        {!loading && !message && vehicles.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🚚</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No vehicles listed yet
            </h2>

            <p className="mt-2 text-slate-600">
              Add your first vehicle to receive transport requests.
            </p>

            <button
              onClick={() => router.push("/logistics/add-vehicle")}
              className="mt-6 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Add Vehicle
            </button>
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

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {vehicle.availability}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">
                      Vehicle Number:
                    </span>{" "}
                    {vehicle.vehicleNumber}
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
                      Location:
                    </span>{" "}
                    {vehicle.location?.address || "Location available"}
                  </p>
                </div>

                <p className="mt-5 text-xs text-slate-400">
                  Listed on{" "}
                  {new Date(vehicle.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}