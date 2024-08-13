import React, { useState, useContext, useEffect } from "react";
import { GameContext } from "@context/GameContext";
import { apiSetsReponse } from "@utils/api";
export function PlayButton() {
    const { settings, currentGameSettings, setCurrentGameSettings, setGameId } =
        useContext(GameContext);
    const [response, setResponse] = useState(null);

    const playing = currentGameSettings.status === "Playing";
    const looking = currentGameSettings.status === "Looking For a Game";

    function playGame() {
        if (settings.mode === "Single") {
            let color = Math.random() > 0.5 ? "white" : "black";
            setCurrentGameSettings({
                ...settings,
                status: "Playing",
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

    useEffect(() => {
        console.log(response);
        if (response) {
            let message = response.message;
            if (message === "Game Found") {
                setCurrentGameSettings({
                    ...settings,
                    gameId: response.gameId,
                    color: response.color,
                    status: "Playing",
                });
            } else if (message === "Resigned") {
                setCurrentGameSettings((prev) => ({
                    ...prev,
                    status: "You resigned!",
                }));
            } else if (message === "Looking For a Game") {
                setCurrentGameSettings({
                    ...settings,
                    gameId: response.gameId,
                    color: response.color,
                    status: "Looking For a Game",
                });
            } else if (message === "You are already in a game") {
                apiSetsReponse(
                    "/game/get",
                    "POST",
                    { gameId: response.gameId },
                    setResponse
                );
            } else if(message === "Game") {
                setCurrentGameSettings({
                    mode: "Multi",
                    gameId: response.gameId,
                    color: response.color,
                    status: response.status,
                    maze: response.mazeSetting,
                    lightsOut: response.lightsOutSetting
                });
                
                //TODO: Set the board and maze or Moves depending on the game settings
                // let board = response.board;
                // let maze = JSON.parse(response.maze);
                // let moves = response.moves;
            }

            if (response.gameId) {
                localStorage.setItem("game_id", response.gameId);
                setGameId(response.gameId);
            }
        }
    }, [response]);

    return (
        <>
            {!playing && !looking && <button onClick={playGame}>Play</button>}
            {looking && <button disabled>Looking for a game</button>}
            {playing && <button onClick={resign}>Resign</button>}
        </>
    );
}
