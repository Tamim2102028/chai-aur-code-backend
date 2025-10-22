import mongoose from "mongoose";
import { DB_name } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DB_URL}${DB_name}`
    );
    console.log(
      `\nmongoDB connected !! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(`mongoDB connection failed: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
