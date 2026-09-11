"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "../../../components/FarmerSideBar.js";

export default function FarmerDashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cropCount, setCropCount] = useState(0);
  const [nearbyFarmersCount, setNearbyFarmersCount] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchCropCount = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch("/api/crops/my-crops", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCropCount(data.length);
      }
    } catch (error) {
      console.error("Failed to fetch crop count:", error);
    }
  };

  const fetchNearbyFarmers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              const res = await fetch(
                `/api/farmers/nearby?lat=${latitude}&lng=${longitude}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const data = await res.json();
              if (res.ok) {
                setNearbyFarmersCount(data.count ?? 0);
                return;
              }
            } catch (err) {
              console.error(err);
            }
          },
          async () => {
            try {
              const res = await fetch("/api/farmers/nearby", {
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (res.ok) {
                setNearbyFarmersCount(data.count ?? 0);
              }
            } catch (err) {
              console.error(err);
              setNearbyFarmersCount(0);
            }
          },
          { timeout: 5000 }
        );
      } else {
        const res = await fetch("/api/farmers/nearby", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setNearbyFarmersCount(data.count ?? 0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch nearby farmers count:", error);
      setNearbyFarmersCount(0);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    let parsedUser;

    try {
      parsedUser = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      router.push("/login");
      return;
    }

    if (parsedUser.role !== "farmer") {
      router.push("/login");
      return;
    }

    setUser(parsedUser);
    fetchCropCount();
    fetchNearbyFarmers();
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen bg-stone-50">
      <SideBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} logout={logout}/>

      {/* Main Content */}
      <section className="flex-1 p-8 transition-all duration-300">

        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, {user.name}
          </h1>

          <p className="mt-2 text-slate-600">
            Manage your crops and discover opportunities nearby.
          </p>
        </header>

        {/* Stats */}
        <section className="mb-10 grid gap-5 md:grid-cols-3">

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              My Listed Crops
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-700">
              {cropCount}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Nearby Farmers (&lt; 10 km)
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-700">
              {nearbyFarmersCount !== null ? nearbyFarmersCount : "..."}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Available Vehicles
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-700">
              -
            </h2>
          </div>

        </section>

        {/* Quick Actions */}
        <section>

          <h2 className="mb-5 text-2xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-4xl">➕</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Add New Crop
              </h3>

              <p className="mt-2 leading-6 text-slate-600">
                List a crop with its quantity, price and other details.
              </p>

              <button
                onClick={() => router.push("/farmer/add-crop")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                Add Crop
              </button>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-4xl">📋</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                My Listed Crops
              </h3>

              <p className="mt-2 leading-6 text-slate-600">
                View and manage the crops you have listed.
              </p>

              <button
                onClick={() => router.push("/farmer/my-crops")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                View Crops
              </button>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-4xl">🌾</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Browse Crops
              </h3>

              <p className="mt-2 leading-6 text-slate-600">
                Explore crops listed by other farmers.
              </p>

              <button
                onClick={() => router.push("/farmer/browse-crops")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                Browse
              </button>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-4xl">📩</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Buyer Requests
              </h3>

              <p className="mt-2 leading-6 text-slate-600">
                View buyers interested in your listed crops.
              </p>

              <button
                onClick={() => router.push("/farmer/requests")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                View Requests
              </button>
            </div>

          </div>

        </section>

      </section>

    </main>
  );
}