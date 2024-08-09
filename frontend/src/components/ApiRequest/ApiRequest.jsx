import { useState } from "react";
import { apiSetsReponse } from "@utils/api";

export function ApiRequest({method, path, postData}) {
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    apiSetsReponse(path, method, postData, setResponse);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h3>API {method} Request</h3>
        <button type="submit">Send API Request</button>
      </form>
      {response && <div>Response: {JSON.stringify(response)}</div>}
    </div>
  );
}