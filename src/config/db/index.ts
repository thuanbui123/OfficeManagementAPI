import mongoose from "mongoose";

async function connect(): Promise<void> {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/OfficeManagement";

    await mongoose.connect(mongoUri);
    console.log("Connected!");
  } catch (error) {
    console.error("Connect failure", error);
  }
}

module.exports = { connect }; // tương đương module.exports = { connect }
