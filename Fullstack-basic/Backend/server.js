import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// get routes of 5 jokes
app.get("/api/jokes", (req, res) => {
  const jokes = [
    {
      id: 1,
      title: "joke 1",
      content: "This is joke no. 1",
    },
    {
      id: 2,
      title: "joke 2",
      content: "This is joke no. 2",
    },
    {
      id: 3,
      title: "joke 3",
      content: "This is joke no. 3",
    },
    {
      id: 4,
      title: "joke 4",
      content: "This is joke no. 4",
    },
    {
      id: 5,
      title: "joke 5",
      content: "This is joke no. 5",
    },
  ];
  res.send(jokes);
});

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Server is running on http://localhost:${process.env.PORT || 3000}`
  );
});
