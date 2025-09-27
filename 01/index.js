require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const dummyData = {
  name: "John Doe",
  age: 30,
  occupation: "Software Developer",
};

app.get("/data", (req, res) => {
  res.json(dummyData);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/about", (req, res) => {
  res.send("About Page");
});

app.get("/login", (req, res) => {
  res.send("<h1>Login Page</h1>");
});

app.get("/youtube", (req, res) => {
  res.send("https://www.youtube.com");
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
