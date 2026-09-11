"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();

  const role = params.role;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const roleName =
    role?.charAt(0).toUpperCase() + role?.slice(1);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }

    setMessage("Getting your location...");

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
        setMessage(
          "Location permission was denied. Please allow location access."
        );
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location) {
      setMessage("Please capture your location before registering.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          role,
          location,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage("Registration successful!");

      setTimeout(() => {
        router.push(`/${data.user.role}/dashboard`);
      }, 800);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Home
        </button>

        <div className="mb-8">
          <div className="mb-3 text-4xl">
            {role === "farmer"
              ? "🌾"
              : role === "buyer"
              ? "🛒"
              : role === "logistics"
              ? "🚛"
              : "👤"}
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Register as {roleName}
          </h1>

          <p className="mt-2 text-slate-600">
            Create your KrishiConnect account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={captureLocation}
            className="w-full rounded-lg border border-green-700 px-4 py-3 font-semibold text-green-700 transition hover:bg-green-50"
          >
            📍 Capture My Location
          </button>

          {location && (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
              <p className="font-semibold">
                Location captured
              </p>

              <p className="mt-1">
                Latitude: {location.latitude}
              </p>

              <p>
                Longitude: {location.longitude}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        {message && (
          <p className="mt-5 text-center text-sm font-medium text-slate-700">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="font-semibold text-green-700 hover:text-green-800"
          >
            Login
          </button>
        </p>

      </div>
    </main>
  );
}