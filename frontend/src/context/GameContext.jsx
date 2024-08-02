import React, { createContext, useEffect, useState } from "react";
import { Realtime } from "ably";
import config from "@config";

export const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        mode: "Multi",
        lightsOut: false,
        maze: "Shift",
    });
    const [currentSettings, setCurrentSettings] = useState({
        mode: "Multi",
        lightsOut: false,
        maze: "Shift",
    });
    const [status, setStatus] = useState("Haven't started yet");

    const [ablyClient, _] = useState(
      new Realtime({
        authUrl: config.apiBaseUrl + "/auth/ably",
        authHeaders: {
            authorization: `Bearer ${localStorage.getItem("user_id")}`,
        }
      })
    );

    useEffect(() => {
        console.log("Ably client", ablyClient);
    }, [ablyClient]);

    return (
        <GameContext.Provider
            value={{
                settings,
                setSettings,
                currentSettings,
                setCurrentSettings,
                status,
                setStatus,
                ablyClient
            }}
        >
            {children}
        </GameContext.Provider>
    );
};
