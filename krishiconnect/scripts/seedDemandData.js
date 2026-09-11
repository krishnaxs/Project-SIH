import mongoose from "mongoose";
import dotenv from "dotenv";
import Demand from "../src/models/Demand.js";

dotenv.config({ path: ".env.local" });

const crops = [
  "Tomato",
  "Potato",
  "Onion",
  "Rice",
  "Wheat",
  "Carrot",
  "Cabbage",
  "Cauliflower",
  "Maize",
  "Chilli",
];

const locations = [
  "Delhi",
  "Mumbai",
  "Pune",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Lucknow",
  "Patna",
  "Jaipur",
  "Nagpur",
];

const generateDemand = (crop, month, year) => {
  // Different base demand for different crops
  const cropBaseDemand = {
    Tomato: 300,
    Potato: 500,
    Onion: 450,
    Rice: 600,
    Wheat: 550,
    Carrot: 250,
    Cabbage: 220,
    Cauliflower: 200,
    Maize: 400,
    Chilli: 180,
  };

  const base = cropBaseDemand[crop] || 300;

  // Seasonal pattern
  const seasonalEffect =
    Math.sin((month / 12) * Math.PI * 2) * 100;

  // Yearly growth trend
  const trend = (year - 2020) * 15;

  // Random variation
  const randomNoise =
    Math.floor(Math.random() * 100) - 50;

  return Math.max(
    20,
    Math.floor(
      base + seasonalEffect + trend + randomNoise
    )
  );
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB");

    // Optional: remove old data
    await Demand.deleteMany({});

    const batch = [];

    const startDate = new Date("2025-03-01");
    const endDate = new Date("2026-09-01");

    let totalRecords = 0;

    for (
      let date = new Date(startDate);
      date < endDate;
      date.setDate(date.getDate() + 1)
    ) {
      for (const crop of crops) {
        for (const location of locations) {

          const demand = generateDemand(
            crop,
            date.getMonth(),
            date.getFullYear()
          );

          batch.push({
            cropName: crop,
            location,
            date: new Date(date),
            demand,
          });

          totalRecords++;

          // Insert every 5000 records
          if (batch.length >= 5000) {
            await Demand.insertMany(batch);

            console.log(
              `${totalRecords} records inserted`
            );

            batch.length = 0;
          }
        }
      }
    }

    // Insert remaining records
    if (batch.length > 0) {
      await Demand.insertMany(batch);
    }

    console.log(
      `Successfully inserted ${totalRecords} records`
    );

    await mongoose.disconnect();

    process.exit(0);

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

seedDatabase();