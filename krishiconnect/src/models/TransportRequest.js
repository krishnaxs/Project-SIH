import mongoose from "mongoose";
import "@/models/User";
import "@/models/Vehicle";
import "@/models/CropRequest";

const transportRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requesterRole: {
      type: String,
      enum: ["farmer", "buyer"],
      required: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    cropRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CropRequest",
      default: null,
    },

    pickupLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },

    deliveryLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "in_transit",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    liveLocation: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date,
    },

    route: {
      coordinates: {
        type: [[Number]],
        default: [],
      },
      distance: {
        type: Number,
        default: 0,
      },
      duration: {
        type: Number,
        default: 0,
      },
      optimizationReason: {
        type: String,
        default: "",
      },
      generatedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

const TransportRequest =
  mongoose.models.TransportRequest ||
  mongoose.model("TransportRequest", transportRequestSchema);

export default TransportRequest;