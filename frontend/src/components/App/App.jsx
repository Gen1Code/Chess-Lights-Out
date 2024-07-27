import { ChessGame } from "@components/ChessGame";
import { ChessSettings } from "@components/ChessSettings";
import { ApiRequest } from "@components/ApiRequest";
import { PlayButton } from "@components/PlayButton";
import "./App.css";

export function App() {

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
      <ApiRequest
        method="POST"
        path="/auth/"
        postData={{ name: "examplePlayer" }}
      />
      <ApiRequest method="GET" path="/game/play" postData={null} />
    </>
  );
}
