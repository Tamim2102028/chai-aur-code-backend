// require("dotenv").config({ path: "./.env" });
import app from "./app.js";
import connectDB from "./database/database.js";

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(`Your error before app.listen: ${error}`);
      throw error;
    });
    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `app listening on port http://localhost:${process.env.PORT || 5000}`
      );
    });
  })
  .catch((err) => {
    console.log(`mongoDB connection error: ${err}`);
  });

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
