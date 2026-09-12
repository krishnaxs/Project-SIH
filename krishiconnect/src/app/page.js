"use client";

import { useRouter } from "next/navigation";
import LanguageSelector from "@/components/LanguageSelector";

export default function Home() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen bg-stone-50 pt-20 text-slate-900">
      {/* Transparent Farmland Background Image */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-55"
        style={{ backgroundImage: "url('/images/farmland-landscape.jpg')" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-stone-50/70"
      />

      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 bg-green-900 shadow-md">
        <div className="flex w-full items-center justify-between px-6 py-4 lg:px-8">
          <div className="text-2xl font-bold text-white drop-shadow-sm">
            🌱 KrishiConnect
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button
              onClick={() => router.push("/login")}
              className="rounded-lg bg-green-700 px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-green-600 hover:shadow-lg"
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28 pt-16 text-center lg:px-8">
        <p className="mb-4 text-sm font-bold tracking-[0.2em] text-green-700">
          DIRECT FARM TO MARKET CONNECTION
        </p>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
          Connecting Farmers, Buyers
          <span className="block text-green-700">
            and Logistics — Directly.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          A digital marketplace connecting farmers directly with consumers
          and bulk buyers while providing access to nearby logistics services.
        </p>

        {/* Role Cards / Registration Boxes */}
        <div className="mx-auto mt-14 grid max-w-6xl gap-6 md:grid-cols-3">

          {/* Farmer */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-left shadow-lg shadow-slate-200/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/80">
            <div className="mb-5 text-5xl">🌾</div>

            <h2 className="text-2xl font-bold text-slate-900">
              Farmer
            </h2>

            <p className="mt-3 min-h-[80px] leading-7 text-slate-600">
              List your crops, set your desired price, manage your quantity,
              and connect directly with buyers.
            </p>

            <button
              onClick={() => router.push("/register/farmer")}
              className="mt-6 w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white shadow-md shadow-green-700/20 transition hover:bg-green-800 hover:shadow-lg hover:shadow-green-700/30"
            >
              Join as Farmer
            </button>
          </div>

          {/* Buyer */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-left shadow-lg shadow-slate-200/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/80">
            <div className="mb-5 text-5xl">🛒</div>

            <h2 className="text-2xl font-bold text-slate-900">
              Buyer
            </h2>

            <p className="mt-3 min-h-[80px] leading-7 text-slate-600">
              Search for crops, compare nearby farmers, and connect directly
              for your requirements.
            </p>

            <button
              onClick={() => router.push("/register/buyer")}
              className="mt-6 w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white shadow-md shadow-blue-700/20 transition hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-700/30"
            >
              Join as Buyer
            </button>
          </div>

          {/* Logistics */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-left shadow-lg shadow-slate-200/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/80">
            <div className="mb-5 text-5xl">🚛</div>

            <h2 className="text-2xl font-bold text-slate-900">
              Logistics
            </h2>

            <p className="mt-3 min-h-[80px] leading-7 text-slate-600">
              List your vehicles, set your rate per kilometer, and provide
              transport services to nearby users.
            </p>

            <button
              onClick={() => router.push("/register/logistics")}
              className="mt-6 w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white shadow-md shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-600/30"
            >
              Join as Logistics
            </button>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full border-t border-slate-800 bg-slate-900/95 px-4 py-2.5 text-center text-xs text-slate-400">
        © 2026 KrishiConnect — Connecting Agriculture with Technology
      </footer>
    </main>
  );
}