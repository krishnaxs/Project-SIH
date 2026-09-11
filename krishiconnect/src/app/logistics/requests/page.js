"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const TransportMap = dynamic(
  () => import("@/components/TransportMap"),
  { ssr: false }
);

export default function LogisticsRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [successFeedback, setSuccessFeedback] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchRequests();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam === "active" || tabParam === "completed" || tabParam === "pending") {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const switchTab = (tab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/logistics/requests?tab=${tab}`);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        "/api/transport-requests/logistics",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Failed to load requests."
        );
        return;
      }

      setRequests(data);
    } catch (error) {
      console.error("Fetch requests error:", error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    setUpdatingId(requestId);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `/api/transport-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update request.");
        return;
      }

      /*
       * When transport starts:
       * 1. Change status to in_transit
       * 2. Generate OSRM route
       * 3. Generate Gemini recommendation
       */
      if (status === "in_transit") {
        const routeResponse = await fetch(
          `/api/transport-requests/${requestId}/route`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const routeData = await routeResponse.json();

        if (!routeResponse.ok) {
          alert(
            routeData.message ||
              "Transport started, but route optimization failed."
          );
        }
      }

      if (status === "accepted") {
        setSuccessFeedback("✓ Request accepted! Moved to Active Deliveries.");
        setTimeout(() => setSuccessFeedback(""), 6000);
      } else if (status === "delivered") {
        setSuccessFeedback("✓ Delivery marked as completed!");
        setTimeout(() => setSuccessFeedback(""), 6000);
      } else if (status === "rejected") {
        setSuccessFeedback("Request rejected.");
        setTimeout(() => setSuccessFeedback(""), 4000);
      }

      await fetchRequests();
    } catch (error) {
      console.error("Update request error:", error);
      alert("Something went wrong.");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusClasses = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "in_transit":
        return "bg-blue-100 text-blue-700";

      case "delivered":
        return "bg-emerald-100 text-emerald-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  // Group requests
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const activeDeliveries = requests.filter(
    (r) => r.status === "accepted" || r.status === "in_transit"
  );
  const completedRequests = requests.filter(
    (r) => r.status === "delivered" || r.status === "rejected"
  );

  const pendingCount = pendingRequests.length;
  const activeCount = activeDeliveries.length;
  const completedCount = completedRequests.length;

  const currentDisplayList =
    activeTab === "pending"
      ? pendingRequests
      : activeTab === "active"
      ? activeDeliveries
      : completedRequests;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Back button */}
        <button
          onClick={() =>
            router.push("/logistics/dashboard")
          }
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Dashboard
        </button>

        {/* Page heading */}
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {activeTab === "pending"
                ? "Transport Requests"
                : activeTab === "active"
                ? "Active Deliveries"
                : "Completed Deliveries"}
            </h1>

            <p className="mt-1 text-slate-600">
              {activeTab === "pending"
                ? "Pending transport requests received for your vehicles."
                : activeTab === "active"
                ? "Manage ongoing and accepted deliveries."
                : "Record of completed and rejected deliveries."}
            </p>
          </div>
        </div>

        {/* Tab switcher buttons */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            onClick={() => switchTab("pending")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
              activeTab === "pending"
                ? "bg-green-700 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>📦 Transport Requests</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeTab === "pending"
                  ? "bg-green-800 text-green-100"
                  : pendingCount > 0
                  ? "bg-orange-100 text-orange-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => switchTab("active")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
              activeTab === "active"
                ? "bg-green-700 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>📍 Active Deliveries</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeTab === "active"
                  ? "bg-green-800 text-green-100"
                  : activeCount > 0
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => switchTab("completed")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${
              activeTab === "completed"
                ? "bg-green-700 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>✓ Completed History</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                activeTab === "completed"
                  ? "bg-green-800 text-green-100"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {completedCount}
            </span>
          </button>
        </div>

        {/* Success Feedback Alert */}
        {successFeedback && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <div className="flex items-center gap-2 font-medium">
              <span>{successFeedback}</span>
            </div>
            {activeTab !== "active" && activeCount > 0 && (
              <button
                onClick={() => switchTab("active")}
                className="rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 transition"
              >
                Go to Active Deliveries ({activeCount}) →
              </button>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">
              Loading requests...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && message && (
          <div className="rounded-xl bg-red-50 p-6 text-center text-red-700">
            {message}
          </div>
        )}

        {/* Tab 1: No pending requests */}
        {!loading && !message && activeTab === "pending" && pendingCount === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">📦</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No pending requests
            </h2>

            <p className="mt-2 text-slate-600">
              You have responded to all transport requests. New incoming requests will appear here.
            </p>

            {activeCount > 0 && (
              <button
                onClick={() => switchTab("active")}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white hover:bg-green-800 transition"
              >
                📍 View Active Deliveries ({activeCount})
              </button>
            )}
          </div>
        )}

        {/* Tab 2: No active deliveries */}
        {!loading && !message && activeTab === "active" && activeCount === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">🚚</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No active deliveries
            </h2>

            <p className="mt-2 text-slate-600">
              Accepted transport requests will appear here for pickup, live route navigation, and delivery tracking.
            </p>

            {pendingCount > 0 && (
              <button
                onClick={() => switchTab("pending")}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white hover:bg-green-800 transition"
              >
                📦 View Pending Requests ({pendingCount})
              </button>
            )}
          </div>
        )}

        {/* Tab 3: No completed deliveries */}
        {!loading && !message && activeTab === "completed" && completedCount === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="text-5xl">📋</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No completed deliveries
            </h2>

            <p className="mt-2 text-slate-600">
              Delivered or finalized transport requests will appear here for your history.
            </p>
          </div>
        )}

        {/* Requests / Deliveries List */}
        {!loading &&
          !message &&
          currentDisplayList.length > 0 && (
            <div className="space-y-5">

              {currentDisplayList.map((request) => {
                const farmerName =
                  request.cropRequest?.farmer?.name ||
                  "Farmer";

                const buyerName =
                  request.requester?.name ||
                  "Buyer";

                const pickup = request.pickupLocation;
                const delivery = request.deliveryLocation;

                const hasPickup =
                  pickup?.latitude != null &&
                  pickup?.longitude != null;

                const hasDelivery =
                  delivery?.latitude != null &&
                  delivery?.longitude != null;

                return (
                  <div
                    key={request._id}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >

                    {/* Request header */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          🚚{" "}
                          {request.vehicle?.vehicleType ||
                            "Vehicle"}
                        </h2>

                        <p className="mt-2 text-slate-600">
                          Requested by:{" "}
                          <span className="font-semibold text-slate-800">
                            {request.requester?.name ||
                              "Unknown"}
                          </span>
                        </p>

                        <p className="mt-1 text-slate-600">
                          Role:{" "}
                          <span className="capitalize text-slate-800">
                            {request.requester?.role ||
                              "Unknown"}
                          </span>
                        </p>

                        <p className="mt-1 text-slate-600">
                          Phone:{" "}
                          <span className="text-slate-800">
                            {request.requester?.phone ||
                              "Not available"}
                          </span>
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-sm font-semibold capitalize ${statusClasses(
                          request.status
                        )}`}
                      >
                        {request.status.replace(
                          "_",
                          " "
                        )}
                      </span>
                    </div>

                    {/* Vehicle information */}
                    <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">

                      <div>
                        <p className="text-sm text-slate-500">
                          Vehicle Number
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {request.vehicle
                            ?.vehicleNumber || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Capacity
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          {request.vehicle?.capacity ||
                            "-"}{" "}
                          {request.vehicle
                            ?.capacityUnit || ""}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Rate
                        </p>

                        <p className="mt-1 font-semibold text-slate-800">
                          ₹
                          {request.vehicle
                            ?.ratePerKm || "-"}
                          /km
                        </p>
                      </div>

                    </div>

                    {/* Pickup & Delivery Location preview (always shown) */}
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="text-sm font-bold text-green-700">
                          🌾 PICKUP LOCATION
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          Farmer: {farmerName}
                        </p>
                        {hasPickup ? (
                          <p className="mt-1 text-sm text-slate-600">
                            📍 {pickup.address || "Farmer location"}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-slate-500">
                            Location details pending
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-bold text-red-700">
                          📦 DELIVERY LOCATION
                        </p>
                        <p className="mt-1 font-semibold text-slate-800">
                          Buyer: {buyerName}
                        </p>
                        {hasDelivery ? (
                          <p className="mt-1 text-sm text-slate-600">
                            📍 {delivery.address || "Buyer location"}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-slate-500">
                            Location details pending
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {request.notes && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Notes
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {request.notes}
                        </p>
                      </div>
                    )}

                    {/* Action buttons for PENDING requests */}
                    {request.status === "pending" && (
                      <div className="mt-6 flex gap-3">

                        <button
                          onClick={() =>
                            updateRequestStatus(
                              request._id,
                              "accepted"
                            )
                          }
                          disabled={
                            updatingId === request._id
                          }
                          className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {updatingId === request._id
                            ? "Accepting..."
                            : "✓ Accept Request"}
                        </button>

                        <button
                          onClick={() =>
                            updateRequestStatus(
                              request._id,
                              "rejected"
                            )
                          }
                          disabled={
                            updatingId === request._id
                          }
                          className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                        >
                          ✕ Reject Request
                        </button>

                      </div>
                    )}

                    {/* Action button for ACCEPTED requests (Ready to start transport) */}
                    {request.status === "accepted" && (
                      <button
                        onClick={() =>
                          updateRequestStatus(
                            request._id,
                            "in_transit"
                          )
                        }
                        disabled={
                          updatingId === request._id
                        }
                        className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {updatingId === request._id
                          ? "Starting transport..."
                          : "🚚 Start Transport"}
                      </button>
                    )}

                    {/* Map & Live Route for IN TRANSIT requests */}
                    {request.status === "in_transit" && (
                      <div className="mt-5">

                        {hasPickup && hasDelivery ? (
                          <TransportMap
                            requestId={request._id}
                            pickup={pickup}
                            delivery={delivery}
                            liveLocation={
                              request.liveLocation ||
                              request.vehicle?.location
                            }
                            routeCoordinates={
                              request.route
                                ?.coordinates || []
                            }
                            routeDistance={
                              request.route?.distance
                            }
                            pickupLabel={`🌾 Farmer: ${farmerName}`}
                            deliveryLabel={`📦 Buyer: ${buyerName}`}
                            vehicleLabel={`🚚 ${
                              request.vehicle
                                ?.vehicleType ||
                              "Live Vehicle"
                            }`}
                            vehicleNumber={
                              request.vehicle
                                ?.vehicleNumber || ""
                            }
                            tracking
                          />
                        ) : (
                          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-5 text-center">
                            <p className="font-semibold text-yellow-800">
                              ⚠️ Map cannot be displayed
                            </p>

                            <p className="mt-1 text-sm text-yellow-700">
                              Farmer pickup and buyer
                              delivery coordinates are
                              required.
                            </p>
                          </div>
                        )}

                        {/* Route information */}
                        {request.route?.distance > 0 && (
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">

                            <div className="rounded-lg bg-blue-50 p-3">
                              <p className="text-xs font-semibold uppercase text-blue-600">
                                Distance
                              </p>

                              <p className="mt-1 font-bold text-slate-800">
                                {request.route.distance}{" "}
                                km
                              </p>
                            </div>

                            <div className="rounded-lg bg-blue-50 p-3">
                              <p className="text-xs font-semibold uppercase text-blue-600">
                                Estimated Time
                              </p>

                              <p className="mt-1 font-bold text-slate-800">
                                {request.route.duration}{" "}
                                min
                              </p>
                            </div>

                            <div className="rounded-lg bg-green-50 p-3">
                              <p className="text-xs font-semibold uppercase text-green-600">
                                Route Recommendation
                              </p>

                              <p className="mt-1 text-sm font-medium text-slate-700">
                                {request.route
                                  .optimizationReason ||
                                  "Route optimized using road distance."}
                              </p>
                            </div>

                          </div>
                        )}

                        {/* Mark Delivered button */}
                        <button
                          onClick={() =>
                            updateRequestStatus(
                              request._id,
                              "delivered"
                            )
                          }
                          disabled={
                            updatingId === request._id
                          }
                          className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {updatingId === request._id
                            ? "Updating..."
                            : "✓ Mark as Delivered"}
                        </button>

                      </div>
                    )}

                  </div>
                );
              })}

            </div>
          )}

      </div>
    </main>
  );
}