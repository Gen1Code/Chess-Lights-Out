import React, { useState, useRef, useEffect } from "react";
import "./ChessTimer.css";

const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export function ChessTimer({ timesRemaining, orientation, turn, children }) {
    const [times, setTimes] = useState(timesRemaining);
    const intervalRef = useRef(null);
    const oppositeOrientation = orientation === "white" ? "black" : "white";

    useEffect(() => {
        setTimes(timesRemaining);
        //console.log("Timer got Updated with", times);
    }, [timesRemaining]);

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setTimes((prevTimes) => {
                const newTimes = [...prevTimes];
                const activePlayerIndex = turn === "white" ? 0 : 1;
                newTimes[activePlayerIndex] -= 1000;
                return newTimes;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [turn]);

    //brightness/opacity on turn (css)

    return (
        <div className="chess-game-container">
            <div
                className={`chess-timer ${oppositeOrientation} ${
                    turn === oppositeOrientation ? "active" : ""
                }`}
            >
                {formatTime(orientation === "white" ? times[1] : times[0])}
            </div>
            {children}
            <div
                className={`chess-timer ${orientation} ${
                    turn === orientation ? "active" : ""
                }`}
            >
                {formatTime(orientation === "white" ? times[0] : times[1])}
            </div>
        </div>
    );
}
