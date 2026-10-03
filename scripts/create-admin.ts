import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User";

const MONGODB_URI = process.env.MONGODB_URI;

async function createAdmin() {
  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(MONGODB_URI);

    const username = "admin";
    const password = "ChangeMe123!";

    const existingAdmin = await User.findOne({
      username,
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name: "System Administrator",
      username,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    });

    console.log("=================================");
    console.log("Admin account created successfully");
    console.log("Username:", username);
    console.log("Password:", password);
    console.log("=================================");
  } catch (error) {
    console.error("Failed to create admin:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();