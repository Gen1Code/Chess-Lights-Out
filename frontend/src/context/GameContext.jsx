import React, { createContext, useEffect, useState } from "react";
import { api } from "../utils/api";
import { Chess } from "chess.js";
import { getRandomMaze } from "@utils/maze";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        mode: "Single",
        lightsOut: false,
        maze: "Shift",
    });
    const [currentGameSettings, setCurrentGameSettings] = useState({
        mode: "Single",
        lightsOut: false,
        maze: "Shift",
        color: "white",
        gameId: "",
        status: "Haven't started yet",
    });

    const [userId, setUserId] = useState(localStorage.getItem("user_id"));
    const [userName, setUserName] = useState(localStorage.getItem("user_name"));
    const [gameId, setGameId] = useState(localStorage.getItem("game_id"));

    const [game, setGame] = useState(new Chess());
    const [maze, setMaze] = useState(() => getRandomMaze());

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
        localId();
    }, []);

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
            }}
        >
            {children}
        </GameContext.Provider>
    );
};
