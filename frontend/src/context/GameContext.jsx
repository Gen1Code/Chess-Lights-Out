import React, { createContext, useEffect, useState } from "react";
import { api, apiSetsReponse } from "../utils/api";
import { Chess } from "chess.js";
import { getRandomMaze } from "@utils/OriginShiftMaze";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        mode: "Multi",
        lightsOut: true,
        maze: "Static",
        timeLimit: 600000,
    });
    const [currentGameSettings, setCurrentGameSettings] = useState({
        mode: "Single",
        lightsOut: false,
        maze: "Shift",
        timeLimit: 600000,
        color: "white",
        gameId: "",
        status: "Haven't started yet",
    });

    const [userId, setUserId] = useState(localStorage.getItem("user_id"));
    const [userName, setUserName] = useState(localStorage.getItem("user_name"));
    const [gameId, setGameId] = useState(localStorage.getItem("game_id"));

    const [game, setGame] = useState(new Chess());
    const [maze, setMaze] = useState(() => getRandomMaze());
    const [moves, setMoves] = useState([]);

    const [response, setResponse] = useState(null);

    useEffect(() => {
        async function localId() {
            if (!userId) {
                let resp = await api("/auth/");
                if (resp && resp.user_id) {
                    localStorage.setItem("user_id", resp.user_id);
                    setUserId(resp.user_id);
                }
            }
        }

        function getLastGame() {
            if (gameId && gameId !== "") {
                console.log("Getting last game");
                apiSetsReponse(
                    "/game/get",
                    "POST",
                    { gameId: gameId },
                    setResponse
                );
            }
        }

        localId();
        getLastGame();
    }, []);

    useEffect(() => {
        if (response !== null) {
            // console.log(response);
            let message = response.message;
            if (message === "Game Found") {
                setCurrentGameSettings({
                    ...settings,
                    gameId: response.gameId,
                    color: response.color,
                    status: "Starting",
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
            } else if (message === "Game Cancelled") {
                setCurrentGameSettings({
                    ...settings,
                    gameId: "",
                    color: "",
                    status: "Game Cancelled!",
                });
            } else if (message === "You are already in a game") {
                apiSetsReponse(
                    "/game/get",
                    "POST",
                    { gameId: response.gameId },
                    setResponse
                );
            } else if (message === "Game") {
                let gameStatus = response.status;
                if (gameStatus === "ongoing") {
                    gameStatus = "Playing";
                } else if (gameStatus === "finished") {
                    gameStatus = "Game Over";
                } else {
                    gameStatus = "Looking For a Game";
                }
                setCurrentGameSettings({
                    mode: "Multi",
                    gameId: response.gameId,
                    color: response.color,
                    status: gameStatus,
                    maze: response.mazeSetting,
                    lightsOut: response.lightsOutSetting,
                });

                let maze = response.maze;
                let board = response.board;
                let moves = response.moves;

                setMoves(moves);
                setGame(new Chess(board));
                setMaze(maze);
            }

            if (response.gameId) {
                localStorage.setItem("game_id", response.gameId);
                setGameId(response.gameId);
            }
        }
    }, [response]);

    return (
        <GameContext.Provider
            value={{
                settings,
                setSettings,
                currentGameSettings,
                setCurrentGameSettings,
                userName,
                setUserName,
                userId,
                setUserId,
                gameId,
                setGameId,
                game,
                setGame,
                maze,
                setMaze,
                moves,
                setMoves,
                setResponse,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};
