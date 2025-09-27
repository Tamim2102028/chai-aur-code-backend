import { useState } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [jokes, setJokes] = useState([]);
  axios.get("/api/jokes").then((response) => {
    setJokes(response.data);
  });

  return (
    <center className="p-4 w-[50%]">
      <h1 className="text-3xl font-bold">Tamim Ikbal</h1>
      {jokes.map((joke) => (
        <div key={joke.id} className="p-4 border-b">
          <h3 className="text-xl font-semibold">{joke.title}</h3>
          <p className="text-gray-700">{joke.content}</p>
        </div>
      ))}
    </center>
  );
}

export default App;
