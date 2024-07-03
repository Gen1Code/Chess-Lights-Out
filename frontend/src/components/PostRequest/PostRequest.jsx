import { useState } from "react";
import config from "@config";

export function PostRequest() {
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submit action

    const postData = {
      name: "exampleUser"
    };

    try {
      const res = await fetch(config.apiBaseUrl+"/auth/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData), // Convert the data to JSON string
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
        <button type="submit">Send POST Request</button>
      </form>
      {response && <div>Response: {response}</div>}
    </div>
  );
}