import { useState, useEffect } from "react";
import { fetchData } from "../api/dataApi";

function Home() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>TOURNAPLAY Docker on Windows</h1>
      <p>Data from backend:</p>
      <pre>{data ? JSON.stringify(data, null, 2) : "Loading....."}</pre>
    </div>
  );
}

export default Home;
