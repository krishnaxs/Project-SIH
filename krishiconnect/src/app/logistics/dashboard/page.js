"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "../../../components/LogisticsSideBar.js";

export default function LogisticsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeDeliveryCount, setActiveDeliveryCount] = useState(0);

  const fetchVehicleCount = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch("/api/vehicles/my-vehicles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setVehicleCount(data.length);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle count:", error);
    }
  };

  const fetchTransportStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/transport-requests/logistics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        const pending = data.filter((r) => r.status === "pending").length;
        const active = data.filter(
          (r) => r.status === "accepted" || r.status === "in_transit"
        ).length;
        setPendingCount(pending);
        setActiveDeliveryCount(active);
      }
    } catch (error) {
      console.error("Failed to fetch transport stats:", error);
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

  if (parsedUser.role !== "logistics") {
    router.push("/login");
    return;
  }

  setUser(parsedUser);
  fetchVehicleCount();
  fetchTransportStats();
}, [router]); 

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <p className="text-slate-600">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-stone-50">

      <SideBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} logout={logout}/>

      <section className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome, {user.name}
          </h1>

          <p className="mt-2 text-slate-600">
            Manage your vehicles and transportation services.
          </p>
        </header>

        <section className="mb-10 grid gap-5 md:grid-cols-3">

          <div
            onClick={() => router.push("/logistics/vehicles")}
            className="cursor-pointer rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm text-slate-500">
              My Vehicles
            </p>
            <h2 className="mt-2 text-3xl font-bold text-green-700">
              {vehicleCount}
            </h2>
          </div>

          <div
            onClick={() => router.push("/logistics/requests?tab=pending")}
            className="cursor-pointer rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm text-slate-500">
              Pending Requests
            </p>
            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              {pendingCount}
            </h2>
          </div>

          <div
            onClick={() => router.push("/logistics/requests?tab=active")}
            className="cursor-pointer rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <p className="text-sm text-slate-500">
              Active Deliveries
            </p>
            <h2 className="mt-2 text-3xl font-bold text-blue-700">
              {activeDeliveryCount}
            </h2>
          </div>

        </section>

        <section>
          <h2 className="mb-5 text-2xl font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-4xl">🚚</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Add Vehicle
              </h3>

              <p className="mt-2 text-slate-600">
                List your vehicle, capacity and rate per kilometer.
              </p>

              <button
                onClick={() => router.push("/logistics/add-vehicle")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 transition"
              >
                Add Vehicle
              </button>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-4xl">📦</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Transport Requests
              </h3>

              <p className="mt-2 text-slate-600">
                View and manage transport requests from users.
              </p>

              <button
                onClick={() => router.push("/logistics/requests?tab=pending")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 transition"
              >
                View Requests {pendingCount > 0 ? `(${pendingCount})` : ""}
              </button>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-4xl">📍</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Active Deliveries
              </h3>

              <p className="mt-2 text-slate-600">
                Manage ongoing deliveries and location updates.
              </p>

              <button
                onClick={() => router.push("/logistics/requests?tab=active")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 transition"
              >
                View Deliveries {activeDeliveryCount > 0 ? `(${activeDeliveryCount})` : ""}
              </button>
            </div>

            

          </div>
        </section>
      </section>
    </main>
  );
}