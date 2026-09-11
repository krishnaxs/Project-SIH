"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BuyerTransportRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setMessage("");
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "/api/transport-requests/buyer",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Failed to load transport requests."
        );
        return;
      }

      setRequests(data);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = (status) => {
    if (status === "accepted") {
      return "bg-green-100 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }

    if (status === "in_transit") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "delivered") {
      return "bg-emerald-100 text-emerald-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => router.push("/buyer/dashboard")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Dashboard
        </button>

        <div className="mb-8 flex items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">
                My Transport Requests
                </h1>

                <p className="mt-2 text-slate-600">
                Track the status of your vehicle requests.
                </p>
            </div>

            <button
                onClick={fetchRequests}
                className="rounded-lg bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
            >
                ↻ Refresh
            </button>
            </div>

        {loading && (
          <div className="rounded-xl p-8 text-center shadow-sm text-red-900 border-none">
            Loading transport requests...
          </div>
        )}

        {!loading && message && (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            {message}
          </div>
        )}

        {!loading &&
          !message &&
          requests.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm">
              <div className="text-5xl">🚚</div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No transport requests yet
              </h2>

              <p className="mt-2 text-slate-600">
                Your requested vehicles will appear here.
              </p>
            </div>
          )}

        {!loading &&
          !message &&
          requests.length > 0 && (
            <div className="space-y-5">

              {requests.map((request) => (
                <div
                  key={request._id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        🚚 {request.vehicle?.vehicleType}
                      </h2>

                      <p className="mt-2 text-slate-600">
                        Vehicle Number:{" "}
                        <span className="font-semibold text-slate-800">
                          {request.vehicle?.vehicleNumber}
                        </span>
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${statusStyle(
                        request.status
                      )}`}
                    >
                      {request.status.replace("_", " ")}
                    </span>

                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">

                    <div>
                      <p className="text-sm text-slate-500">
                        Capacity
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {request.vehicle?.capacity}{" "}
                        {request.vehicle?.capacityUnit}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Rate
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        ₹{request.vehicle?.ratePerKm}/km
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Requested On
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {new Date(
                          request.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

      </div>
    </main>
  );
}