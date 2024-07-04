import { useState } from "react";
import config from "@config";

export function ApiRequest({method, path, postData}) {
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const postData = {
      name: "exampleUser"
    };

    try {
      const res = await fetch(config.apiBaseUrl+path, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        //set body if method is POST
        body: method === "POST" ? JSON.stringify(postData) : null,
        credentials: "include",
      });

      const result = await res.text(); // Parse the JSON response
      setResponse(result); // Update the state with the response
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h3>API {method} Request</h3>
        <button type="submit">Send API Request</button>
      </form>
      {response && <div>Response: {response}</div>}
    </div>
  );
}