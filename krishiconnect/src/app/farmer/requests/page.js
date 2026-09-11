"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FarmerRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/requests/farmer", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to load requests.");
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

  const getStatusClasses = (status) => {
    if (status === "accepted") {
      return "bg-green-100 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  const updateRequestStatus = async (requestId, status) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Failed to update request.");
      return;
    }

    // Update the request on screen immediately
    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request._id === requestId
          ? { ...request, status }
          : request
      )
    );
  } catch (error) {
    console.error(error);
    setMessage("Something went wrong.");
  }
};

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => router.push("/farmer/dashboard")}
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Buyer Requests
          </h1>

          <p className="mt-2 text-slate-600">
            View buyers who have requested your crops.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              Loading requests...
            </p>
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
              <div className="text-5xl">📩</div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No requests yet
              </h2>

              <p className="mt-2 text-slate-600">
                Buyer requests for your crops will appear here.
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
                        🌾 {request.crop?.cropName || "Crop"}
                      </h2>

                      <p className="mt-2 text-slate-600">
                        Buyer:{" "}
                        <span className="font-semibold text-slate-800">
                          {request.buyer?.name || "Unknown"}
                        </span>
                      </p>

                      <p className="mt-1 text-slate-600">
                        Phone:{" "}
                        {request.buyer?.phone || "Not available"}
                      </p>

                      <p className="mt-1 text-slate-600">
                        Email:{" "}
                        {request.buyer?.email || "Not available"}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${getStatusClasses(
                        request.status
                      )}`}
                    >
                      {request.status.charAt(0).toUpperCase() +
                        request.status.slice(1)}
                    </span>

                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            updateRequestStatus(request._id, "accepted")
                          }
                          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
                        >
                          Accept
                        </button>

                        <button
                          onClick={() =>
                            updateRequestStatus(request._id, "rejected")
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">
                        Requested Quantity
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {request.quantityRequested}{" "}
                        {request.crop?.unit || ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        Crop Price
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        ₹{request.crop?.price ?? "-"}
                      </p>
                    </div>
                  </div>

                  {request.message && (
                    <div className="mt-5 rounded-lg bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-700">
                        Buyer Message
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {request.message}
                      </p>
                    </div>
                  )}

                  <p className="mt-5 text-xs text-slate-400">
                    Requested on{" "}
                    {new Date(
                      request.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}

      </div>
    </main>
  );
}