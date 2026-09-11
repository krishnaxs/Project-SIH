"use client";

import { useRouter } from "next/navigation";

const SideBar = ({ sidebarOpen, setSidebarOpen, logout }) => {
  const router = useRouter();

  return (
    <aside
      className={`pointer flex min-h-screen shrink-0 flex-col bg-green-900 text-white transition-all duration-300 ${
        sidebarOpen ? "w-64 p-5" : "w-[50px]"
      }`}
    >
      {/* Hamburger Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex h-[50px] w-[50px] shrink-0 items-center justify-center text-2xl text-white"
      >
        ☰
      </button>

      {/* Sidebar Content */}
      {sidebarOpen && (
        <>
          <div className="mb-10 mt-2 text-center text-xl font-bold">
            🌱 KrishiConnect
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => router.push("/farmer/dashboard")}
              className="w-full rounded-lg bg-green-700 px-4 py-3 text-left font-medium"
            >
              🏠 Dashboard
            </button>

            <button
              onClick={() => router.push("/farmer/add-crop")}
              className="w-full rounded-lg px-4 py-3 text-left font-medium text-green-100 transition hover:bg-green-800"
            >
              ➕ Add Crop
            </button>

            <button
              onClick={() => router.push("/farmer/my-crops")}
              className="w-full rounded-lg px-4 py-3 text-left font-medium text-green-100 transition hover:bg-green-800"
            >
              📋 My Listed Crops
            </button>

            <button
              onClick={() => router.push("/farmer/requests")}
              className="w-full rounded-lg px-4 py-3 text-left font-medium text-green-100 transition hover:bg-green-800"
            >
              📩 Buyer Requests
            </button>

            <button
              onClick={() => router.push("/farmer/browse-crops")}
              className="w-full rounded-lg px-4 py-3 text-left font-medium text-green-100 transition hover:bg-green-800"
            >
              🌾 Browse Crops
            </button>

            {/* NEW: Demand Forecast */}
            <button
              onClick={() => router.push("/farmer/demand-forecast")}
              className="w-full rounded-lg px-4 py-3 text-left font-medium text-green-100 transition hover:bg-green-800"
            >
              📊 Demand Forecast
            </button>

            <button
              onClick={() => router.push("/logistics")}
              className="w-full rounded-lg px-4 py-3 text-left font-medium text-green-100 transition hover:bg-green-800"
            >
              🚚 Logistics
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="w-full rounded-lg px-4 py-3 text-left font-medium text-green-100 transition hover:bg-green-800"
            >
              👤 Profile
            </button>
          </nav>

          {/* Logout */}
          <button
            onClick={logout}
            className="mt-auto rounded-lg bg-red-600 px-4 py-3 font-semibold transition hover:bg-red-700"
          >
            Logout
          </button>
        </>
      )}
    </aside>
  );
};

export default SideBar;