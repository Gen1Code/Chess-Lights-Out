import { useState } from "react";
import { ChessGame } from "@components/ChessGame";
import { ChessSettings } from "@components/ChessSettings";
import { ApiRequest } from "@components/ApiRequest";
import { PlayButton } from "@components/PlayButton";
import "./App.css";

export function App() {
  const [settings, setSettings] = useState({ mode: "single", lightsOut: false, maze: "off" });

  return (
    <>
      <h1>Chess Lights Out</h1>
      <div className="chessbox">
        <ChessGame settings={settings} />
        <div className="settingsbox">
          <ChessSettings settings={settings} onChangeSettings={setSettings} />
        </div>
        <br />
        <PlayButton settings={settings} />
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
