import config from "@config";

export async function api(path, method = "GET", postData = null, setResponse) {
    //get user_id from local
    let user_id = localStorage.getItem("user_id");
    try {
    const res = await fetch(config.apiBaseUrl+path, {
        method: method,
        headers: {
        "Content-Type": "application/json",
        "Authorization": user_id ? "Bearer " + user_id : ""
        },
        //set body if method is POST
        body: method === "POST" ? JSON.stringify(postData) : null,
        credentials: "include"
    });

    const result = await res.json(); 
    setResponse(result); 

    if(path === "/auth/" && result.user_id){
        localStorage.setItem("user_id", result.user_id);
    }

    } catch (error) {
    console.error("Error during fetch:", error);
    }
};