import { useContext } from "react";
import { ChessGame } from "@components/ChessGame";
import { ChessSettings } from "@components/ChessSettings";
import { ApiRequest } from "@components/ApiRequest";
import { PlayButton } from "@components/PlayButton";
import { GameContext } from "@context/GameContext";
import { api } from "@utils/api";
import "./App.css";

export function App() {
  const { userName, setUserName, setUserId } = useContext(GameContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    let res = await api("/auth/", "POST", { name: name });
    if(res.user_id){
      localStorage.setItem("user_id", res.user_id);
      localStorage.setItem("user_name", name);
      setUserName(name);
      setUserId(res.user_id);
    }else{
      console.log("Error: ", res.error);
    }
  }

  if(userName === null){
    return (
      <>
        <h1>Chess Lights Out</h1>
        <h2>Please choose a name to play</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" />
          <input type="submit" value="Submit" />
        </form>
      </>
    );
  }

  return (
    <>
      <h1>Chess Lights Out</h1>
      <div className="chessbox">
        <ChessGame />
        <div className="settingsbox">
          <ChessSettings />
        </div>
        <br />
        <PlayButton />
      </div>
    </>
  );
}
