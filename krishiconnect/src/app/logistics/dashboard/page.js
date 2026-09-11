"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "../../../components/LogisticsSideBar.js";

export default function LogisticsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vehicleCount, setVehicleCount]= useState(0);

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

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              My Vehicles
            </p>
            <h2 className="mt-2 text-3xl font-bold text-green-700">
              {vehicleCount}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Pending Requests
            </p>
            <h2 className="mt-2 text-3xl font-bold text-orange-600">
              0
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Active Deliveries
            </p>
            <h2 className="mt-2 text-3xl font-bold text-blue-700">
              0
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
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
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
              onClick={() => router.push("/logistics/requests")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                View Requests
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
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                View Deliveries
              </button>
            </div>

            

          </div>
        </section>
      </section>
    </main>
  );
}