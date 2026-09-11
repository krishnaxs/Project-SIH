import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vehicleType: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    capacityUnit: {
      type: String,
      enum: ["kg", "quintal", "ton"],
      default: "kg",
    },

    ratePerKm: {
      type: Number,
      required: true,
      min: 0,
    },

    availability: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "available",
    },

    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle =
  mongoose.models.Vehicle ||
  mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;