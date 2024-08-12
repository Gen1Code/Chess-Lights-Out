import config from "@config";

export async function apiSetsReponse(
    path,
    method = "GET",
    postData = null,
    setResponse
) {
    //get user_id from local
    let user_id = localStorage.getItem("user_id");
    try {
        const res = await fetch(config.apiBaseUrl + path, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                Authorization: user_id ? "Bearer " + user_id : "",
            },
            //set body if method is POST
            body: method === "POST" ? JSON.stringify(postData) : null,
            credentials: "include",
        });

        const result = await res.json();
        setResponse(result);
    } catch (error) {
        console.error("Error during fetch:", error);
    }
}

export async function api(path, method = "GET", postData = null) {
    let result = null;

    //get user_id from local
    let user_id = localStorage.getItem("user_id");
    try {
        const res = await fetch(config.apiBaseUrl + path, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                Authorization: user_id ? "Bearer " + user_id : "",
            },
            //set body if method is POST
            body: method === "POST" ? JSON.stringify(postData) : null,
            credentials: "include",
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        result = await res.json();
    } catch (error) {
        console.error("Error during fetch:", error);
        result = { error: error.message };
    }
    return result;
}
