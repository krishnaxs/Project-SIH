"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SideBar from "../../../components/BuyerSideBar.js";

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cropCount, setCropCount] = useState(0);
  
const fetchCropCount = async () => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch("/api/crops/browse", {
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

  if (parsedUser.role !== "buyer") {
    router.push("/login");
    return;
  }

  setUser(parsedUser);
  fetchCropCount();
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

      {/* Sidebar */}
      <SideBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} logout={logout}/>

      {/* Main */}
      <section className="flex-1 p-8">

        <header className="mb-10 flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome, {user.name}
            </h1>

            <p className="mt-2 text-slate-600">
              Find crops directly from farmers near you.
            </p>
          </div>

          <div className="rounded-full bg-white px-5 py-3 font-medium text-slate-700 shadow-sm">
            👤 {user.name}
          </div>

        </header>

        {/* Stats */}
        <section className="mb-10 grid gap-5 md:grid-cols-3">

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Available Crops
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-700">
              {cropCount}
            </h2>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              {"Nearby Farmers(<10km)".toString()}
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
              <div className="text-4xl">🌾</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                Browse Crops
              </h3>

              <p className="mt-2 leading-6 text-slate-600">
                Search for crops listed by farmers.
              </p>

              <button
                onClick={() => router.push("/buyer/browse-crops")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                Browse Crops
              </button>
            </div>

            

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="text-4xl">📩</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                My Requests
              </h3>

              <p className="mt-2 leading-6 text-slate-600">
                Track requests sent to farmers and check their status.
              </p>

              <button
                onClick={() => router.push("/buyer/requests")}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                View Requests
              </button>
            </div>

          <div className="rounded-xl  p-6 bg-white shadow-sm">
            <div className="text-4xl">🚚</div>

            <h3 className="mt-4 text-xl font-bold text-slate-900">
              Transport Requests
            </h3>

            <p className="mt-2 leading-6 text-slate-600">
              Track your vehicle requests
            </p>

            <button
              onClick={() => router.push("/buyer/transport-requests")}
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