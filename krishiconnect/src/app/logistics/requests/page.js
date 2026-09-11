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
  const [updatingId, setUpdatingId] = useState(null);

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

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Back button */}
        <button
          onClick={() =>
            router.push("/logistics/dashboard")
          }
          className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to Dashboard
        </button>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Transport Requests
          </h1>

          <p className="mt-2 text-slate-600">
            Requests received for your vehicles.
          </p>
        </div>

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

        {/* No requests */}
        {!loading &&
          !message &&
          requests.length === 0 && (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm">
              <div className="text-5xl">📦</div>

              <h2 className="mt-4 text-xl font-bold text-slate-900">
                No transport requests
              </h2>

              <p className="mt-2 text-slate-600">
                Requests for your vehicles will appear here.
              </p>
            </div>
          )}

        {/* Requests */}
        {!loading &&
          !message &&
          requests.length > 0 && (
            <div className="space-y-5">

              {requests.map((request) => {

                /*
                 * Farmer information comes from:
                 * request.cropRequest.farmer
                 *
                 * Buyer information comes from:
                 * request.requester
                 */

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
                          {request.requester?.role ||
                            "Unknown"}
                        </p>

                        <p className="mt-1 text-slate-600">
                          Phone:{" "}
                          {request.requester?.phone ||
                            "Not available"}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-sm font-semibold ${statusClasses(
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

                    {/* Notes */}
                    {request.notes && (
                      <div className="mt-5 rounded-lg bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Notes
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {request.notes}
                        </p>
                      </div>
                    )}

                    {/* Pending */}
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
                          className="flex-1 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {updatingId === request._id
                            ? "Updating..."
                            : "Accept"}
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
                          className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          ✕ Reject Request
                        </button>

                      </div>
                    )}

                    {/* Accepted */}
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
                        className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        🚚 Start Transport
                      </button>
                    )}

                    {/* IN TRANSIT */}
                    {request.status === "in_transit" && (
                      <div className="mt-6">

                        {/* Location information */}
                        <div className="mb-4 grid gap-3 md:grid-cols-2">

                          {/* Pickup */}
                          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <p className="text-sm font-bold text-green-700">
                              🌾 PICKUP LOCATION
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                              Farmer: {farmerName}
                            </p>

                            {hasPickup ? (
                              <p className="mt-1 text-sm text-slate-600">
                                📍{" "}
                                {pickup.address ||
                                  "Farmer location"}
                              </p>
                            ) : (
                              <p className="mt-2 text-sm font-semibold text-red-600">
                                ⚠️ Pickup location not available
                              </p>
                            )}
                          </div>

                          {/* Delivery */}
                          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm font-bold text-red-700">
                              📦 DELIVERY LOCATION
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                              Buyer: {buyerName}
                            </p>

                            {hasDelivery ? (
                              <p className="mt-1 text-sm text-slate-600">
                                📍{" "}
                                {delivery.address ||
                                  "Buyer location"}
                              </p>
                            ) : (
                              <p className="mt-2 text-sm font-semibold text-red-600">
                                ⚠️ Delivery location not available
                              </p>
                            )}
                          </div>

                        </div>

                        {/* Map */}
                        {hasPickup && hasDelivery ? (
                          <TransportMap
                            requestId={request._id}
                            pickup={pickup}
                            delivery={delivery}
                            liveLocation={
                              request.liveLocation
                            }
                            routeCoordinates={
                              request.route
                                ?.coordinates || []
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

                      </div>
                    )}

                    {/* Delivered button */}
                    {request.status === "in_transit" && (
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
                        className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        ✓ Mark as Delivered
                      </button>
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