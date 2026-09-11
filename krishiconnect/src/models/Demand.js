import mongoose from "mongoose";

const demandSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  date: {
    type: Date,
    required: true,
  },

  demand: {
    type: Number,
    required: true,
  },
});

export default mongoose.models.Demand ||
  mongoose.model("Demand", demandSchema);