import React, { useContext } from "react";
import { GameContext } from "@context/GameContext";
import { apiSetsReponse } from "@utils/api";

export function PlayButton() {
    const {
        settings,
        currentGameSettings,
        setCurrentGameSettings,
        setResponse,
    } = useContext(GameContext);

    const playing = currentGameSettings.status === "Playing";
    const looking = currentGameSettings.status === "Looking For a Game";

    function playGame() {
        if (settings.mode === "Single") {
            let color = Math.random() > 0.5 ? "white" : "black";
            setCurrentGameSettings({
                ...settings,
                status: "Starting",
                gameId: "",
                color: color,
            });
        } else {
            apiSetsReponse("/game/play", "POST", settings, setResponse);
        }
    }

    function resign() {
        if (currentGameSettings.mode === "Single") {
            setCurrentGameSettings((prev) => ({
                ...prev,
                status: "You resigned!",
            }));
        } else {
            let postData = { gameId: currentGameSettings.gameId };
            apiSetsReponse("/game/resign", "POST", postData, setResponse);
        }
    }

    function cancelGame(){
        apiSetsReponse("/game/cancel", "GET", null, setResponse);
    }

    return (
        <>
            {!playing && !looking && <button onClick={playGame}>Play</button>}
            {looking && <button onClick={cancelGame}>Looking for a game</button>}
            {playing && <button onClick={resign}>Resign</button>}
        </>
    );
}
