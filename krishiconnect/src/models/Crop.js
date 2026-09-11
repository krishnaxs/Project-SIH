import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cropName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      enum: ["kg", "quintal", "ton"],
      default: "kg",
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
  },
  {
    timestamps: true,
  },
);

const Crop =
  mongoose.models.Crop || mongoose.model("Crop", cropSchema);

export default Crop;