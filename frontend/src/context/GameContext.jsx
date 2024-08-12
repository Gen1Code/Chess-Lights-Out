import React, { createContext, useEffect, useState } from "react";
import { api } from "../utils/api";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        mode: "Single",
        lightsOut: false,
        maze: "Shift",
    });
    const [currentSettings, setCurrentSettings] = useState({
        mode: "Single",
        lightsOut: false,
        maze: "Shift",
        color: "white",
        gameId: "",
    });
    const [status, setStatus] = useState("Haven't started yet");

    const [userId, setUserId] = useState(localStorage.getItem("user_id"));
    const [userName, setUserName] = useState(localStorage.getItem("user_name"));
    const [gameId, setGameId] = useState(localStorage.getItem("game_id"));

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
                currentSettings,
                setCurrentSettings,
                status,
                setStatus,
                userName,
                setUserName,
                userId,
                setUserId,
                gameId,
                setGameId,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};
