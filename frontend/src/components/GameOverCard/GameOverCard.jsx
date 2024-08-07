import { useState, useEffect, useContext } from "react";
import { GameContext } from "@context/GameContext";
import "./GameOverCard.css";

export function GameOverCard({ message }) {
  const { status, setStatus } = useContext(GameContext);
  const [isVisible, setIsVisible] = useState(false);

  function handleClose() {
    setIsVisible(false);
  }

  function resetGame() {
    setStatus("Playing");
  }

  useEffect(() => {
    // console.log("status", status);
    setIsVisible(status !== "Playing");
  }, [status]);

  if (!isVisible || status === "Haven't started yet") {
    return null;
  }

  return (
    <div className="card">
      <button className="close-button" onClick={handleClose}>
        X
      </button>
      <h3>
        Game Over<br></br>
        {message}
      </h3>
      <button onClick={resetGame}>Play Again</button>
    </div>
  );
}
