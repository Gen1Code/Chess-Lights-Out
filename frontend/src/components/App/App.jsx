import { useState } from "react";
import { ChessGame } from "@components/ChessGame";
import { ChessSettings } from "@components/ChessSettings";
import { ApiRequest } from "@components/ApiRequest";
import "./App.css";

export function App() {
  const [settings, setSettings] = useState({ mode: "single", playerColor: "" });

  return (
    <>
      <h1>Chess Lights Out</h1>
      <div className="chessbox">
        <ChessGame settings={settings} />
        <div className="settingsbox">
          <ChessSettings settings={settings} onChangeSettings={setSettings} />
        </div>
      </div>
      <ApiRequest
        method="POST"
        path="/auth/"
        postData={{ name: "examplePlayer" }}
      />
      <ApiRequest method="GET" path="/game/play" postData={null} />
    </>
  );
}
