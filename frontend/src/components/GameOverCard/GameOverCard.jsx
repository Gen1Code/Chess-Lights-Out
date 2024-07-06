import { useState, useEffect } from "react";
import "./GameOverCard.css";

export function GameOverCard({ message, onClickReset, isGameOver }) {
  const [isVisible, setIsVisible] = useState(isGameOver);

  function handleClose() {
    setIsVisible(false);
  }

  useEffect(() => {
    setIsVisible(isGameOver);
  }, [isGameOver]);

  if (!isVisible) {
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
      <button onClick={onClickReset}>Reset</button>
    </div>
  );
}
