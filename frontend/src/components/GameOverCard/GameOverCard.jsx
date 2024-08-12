import { useState, useEffect, useContext } from "react";
import { GameContext } from "@context/GameContext";
import "./GameOverCard.css";

export function GameOverCard() {
    const { currentGameSettings, setCurrentGameSettings } = useContext(GameContext);
    const [isVisible, setIsVisible] = useState(false);

    function handleClose() {
        setIsVisible(false);
    }

    function resetGame() {
        if (currentGameSettings.mode === "Single") {
            let color = Math.random() > 0.5 ? "white" : "black";
            setCurrentGameSettings((prev) => ({ ...prev, status: "Playing", color: color }));
        }
    }

    useEffect(() => {
        // console.log("status", status);
        setIsVisible(currentGameSettings.status !== "Playing");
    }, [currentGameSettings.status]);

    if (!isVisible || currentGameSettings.status === "Haven't started yet") {
        return null;
    }

    return (
        <div className="card">
            <button className="close-button" onClick={handleClose}>
                X
            </button>
            <h3>
                {currentGameSettings.status !== "Looking For a Game" && (
                    <>
                        Game Over
                        <br />
                    </>
                )}
                {currentGameSettings.status}
            </h3>
            {currentGameSettings.mode === "Single" && (
                <button onClick={resetGame}>Play Again</button>
            )}
        </div>
    );
}
