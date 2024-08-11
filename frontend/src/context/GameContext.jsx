import React, { createContext, useState } from "react";

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
    });
    const [status, setStatus] = useState("Haven't started yet");

    const [userId, setUserId] = useState(localStorage.getItem("user_id"));
    const [userName, setUserName] = useState(localStorage.getItem("user_name"));

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
            }}
        >
            {children}
        </GameContext.Provider>
    );
};
