"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddVehiclePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    vehicleType: "",
    vehicleNumber: "",
    capacity: "",
    capacityUnit: "kg",
    ratePerKm: "",
  });

  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const captureLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "Location captured",
        });

        setMessage("Location captured successfully.");
      },
      () => {
        setMessage("Please allow location access.");
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          capacity: Number(formData.capacity),
          ratePerKm: Number(formData.ratePerKm),
          location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to list vehicle.");
        return;
      }

      setMessage("Vehicle listed successfully.");

      setFormData({
        vehicleType: "",
        vehicleNumber: "",
        capacity: "",
        capacityUnit: "kg",
        ratePerKm: "",
      });

      setLocation(null);

      setTimeout(() => {
        router.push("/logistics/dashboard");
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-1 text-slate-900 flex justify-center items-center">
      <div className=" mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

        <button
          onClick={() => router.push("/logistics/dashboard")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-slate-900 placeholder:text-slate-400">
          Add Vehicle
        </h1>

        <p className="mb-8 mt-2 text-slate-600">
          List your vehicle for nearby transport requests.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Vehicle Type
            </label>

            <input
              type="text"
              name="vehicleType"
              placeholder="Example: Mini Truck"
              value={formData.vehicleType}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Vehicle Number
            </label>

            <input
              type="text"
              name="vehicleNumber"
              placeholder="Example: UP32AB1234"
              value={formData.vehicleNumber}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 uppercase text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Capacity
              </label>

              <input
                type="number"
                name="capacity"
                min="1"
                placeholder="Example: 2000"
                value={formData.capacity}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Capacity Unit
              </label>

              <select
                name="capacityUnit"
                value={formData.capacityUnit}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="quintal">Quintal</option>
                <option value="ton">Ton</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Rate per Kilometer (₹)
            </label>

            <input
              type="number"
              name="ratePerKm"
              min="0"
              placeholder="Example: 18"
              value={formData.ratePerKm}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <button
            type="button"
            onClick={captureLocation}
            className="w-full rounded-lg border border-green-700 px-4 py-3 font-semibold text-green-700 hover:bg-green-50"
          >
            📍 Capture Current Location
          </button>

          {location && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              Location captured successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Listing Vehicle..." : "List Vehicle"}
          </button>

        </form>

        {message && (
          <p className="mt-5 text-center text-sm font-medium text-slate-700">
            {message}
          </p>
        )}

      </div>
    </main>
  );
}