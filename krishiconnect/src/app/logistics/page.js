"use client";

import { useRouter } from "next/navigation";

export default function LogisticsPage() {
  const router = useRouter();

  const logisticsProviders = [
    {
      id: 1,
      name: "Krishna Transport",
      vehicle: "Mini Truck",
      capacity: "2 Tons",
      location: "Hyderabad",
      phone: "9876543210",
    },
    {
      id: 2,
      name: "Sai Logistics",
      vehicle: "Truck",
      capacity: "5 Tons",
      location: "Hyderabad",
      phone: "9123456780",
    },
    {
      id: 3,
      name: "Green Farm Transport",
      vehicle: "Pickup Vehicle",
      capacity: "1 Ton",
      location: "Secunderabad",
      phone: "9988776655",
    },
  ];

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => router.back()}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            🚚 Logistics Services
          </h1>

          <p className="mt-2 text-slate-600">
            Find transport services for your agricultural products.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {logisticsProviders.map((provider) => (
            <div
              key={provider.id}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-4xl">🚚</div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                {provider.name}
              </h2>

              <div className="mt-4 space-y-2 text-slate-600">
                <p>
                  <span className="font-semibold">Vehicle:</span>{" "}
                  {provider.vehicle}
                </p>

                <p>
                  <span className="font-semibold">Capacity:</span>{" "}
                  {provider.capacity}
                </p>

                <p>
                  <span className="font-semibold">Location:</span>{" "}
                  {provider.location}
                </p>

                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  {provider.phone}
                </p>
              </div>

              <button
                onClick={() => alert("Transport request feature coming soon!")}
                className="w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800"
              >
                Request Transport
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}