import mongoose from "mongoose";

async function connect(): Promise<void> {
  try {
    await mongoose.connect("mongodb://localhost:27017/OfficeManagement");
    console.log("Connected!");
  } catch (error) {
    console.error("Connect failure", error);
  }
}

module.exports = { connect }; // tương đương module.exports = { connect }
