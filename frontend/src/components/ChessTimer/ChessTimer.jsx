import React, { useState, useRef, useEffect, useContext } from "react";
import { GameContext } from "@context/GameContext";
import { api } from "@utils/api";
import "./ChessTimer.css";

const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const refreshInterval = 500;

export function ChessTimer({ turn, children }) {
    const { currentGameSettings, timesRemaining, gameId, activityTimestamp } =
        useContext(GameContext);
    const [times, setTimes] = useState(timesRemaining);
    const intervalRef = useRef(null);
    const orientation = currentGameSettings.color[0];
    const status = currentGameSettings.status;
    const oppositeOrientation = orientation === "w" ? "b" : "w";

    useEffect(() => {
        setTimes(timesRemaining);
    }, [timesRemaining]);

    useEffect(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (status === "Playing") {
            intervalRef.current = setInterval(() => {
                const activePlayerIndex = turn[0] === "w" ? 0 : 1;
                setTimes((prevTimes) => {
                    const newTimes = [...prevTimes];
                    let newTime = Math.max(
                        timesRemaining[activePlayerIndex] -
                            (Date.now() - activityTimestamp),
                        0
                    );

                    if (newTime === 0) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                        console.log("Sending checkTime POST");
                        api("/game/checkTime", "POST", {
                            gameId: gameId,
                        });
                    }

                    newTimes[activePlayerIndex] = newTime;

                    return newTimes;
                });
            }, refreshInterval);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [activityTimestamp, status]);

    return (
        <div className="chess-game-container">
            <div
                className={`chess-timer ${oppositeOrientation} ${
                    turn[0] === oppositeOrientation ? "active" : ""
                }`}
            >
                {formatTime(orientation === "w" ? times[1] : times[0])}
            </div>
            {children}
            <div
                className={`chess-timer ${orientation} ${
                    turn[0] === orientation ? "active" : ""
                }`}
            >
                {formatTime(orientation === "w" ? times[0] : times[1])}
            </div>
        </div>
    );
}
