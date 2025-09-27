// require("dotenv").config({ path: "./.env" });
import connectDB from "./database/database.js";

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

connectDB();

/*
import express from "express";
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.DATABASE_URL}/${DB_name}`);
    app.on("error bro", (error) => {
      console.log(`your error: ${error}`);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`app listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(`error: ${error}`);
    throw error;
  }
})();
*/
