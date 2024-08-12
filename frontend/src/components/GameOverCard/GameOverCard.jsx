import { useState, useEffect, useContext } from "react";
import { GameContext } from "@context/GameContext";
import "./GameOverCard.css";

export function GameOverCard() {
    const { status, setStatus, currentSettings } = useContext(GameContext);
    const [isVisible, setIsVisible] = useState(false);

    function handleClose() {
        setIsVisible(false);
    }

    function resetGame() {
        if (currentSettings.mode === "Single") {
            setStatus("Playing");
        }
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
                {status !== "Looking For a Game" && (
                    <>
                        Game Over
                        <br />
                    </>
                )}
                {status}
            </h3>
            {currentSettings.mode === "Single" && (
                <button onClick={resetGame}>Play Again</button>
            )}
        </div>
    );
}
