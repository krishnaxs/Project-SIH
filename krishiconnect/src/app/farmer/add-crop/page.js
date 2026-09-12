"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddCropPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    cropName: "",
    quantity: "",
    unit: "quintal",
    price: "",
    description: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

      const profileResponse = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileResponse.json();
      const farmerLocation = profileData.user?.location;

      if (
        !profileResponse.ok ||
        !farmerLocation ||
        !Number.isFinite(Number(farmerLocation.latitude)) ||
        !Number.isFinite(Number(farmerLocation.longitude)) ||
        !String(farmerLocation.address || "").trim()
      ) {
        setMessage("Please add your location in your profile before adding a crop.");
        return;
      }

      const response = await fetch("/api/crops", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to add crop.");
        return;
      }

      setMessage("Crop added successfully.");

      setFormData({
        cropName: "",
        quantity: "",
        unit: "kg",
        price: "",
        description: "",
      });

      setTimeout(() => {
        router.push("/farmer/my-crops");
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 flex justify-center items-center ">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

        <button
          onClick={() => router.push("/farmer/dashboard")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-bold text-slate-900">
          Add New Crop
        </h1>

        <p className="mt-2 mb-8 text-slate-600">
          List your crop so buyers can discover it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Crop Name
            </label>

            <input
              type="text"
              name="cropName"
              placeholder="Example: Wheat"
              value={formData.cropName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Quantity
              </label>

              <input
                type="number"
                name="quantity"
                min="0"
                placeholder="Example: 500"
                value={formData.quantity}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Unit
              </label>

              <select 
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
              >
                <option value="quintal">Quintal</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="ton">Ton</option>
              </select>
            </div>

          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Rate (₹/unit)
            </label>

            <input
              type="number"
              name="price"
              min="0"
              placeholder="Example: 2500/quintal"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              placeholder="Add useful information about your crop..."
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Adding Crop..." : "Add Crop"}
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