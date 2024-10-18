import React, { useEffect, useState, useContext } from "react";
import { GameContext } from "@context/GameContext";
import { AblyProvider } from "ably/react";
import { Realtime } from "ably";
import config from "@config";

export const Ably = ({ children }) => {
    const { userId } = useContext(GameContext);

    const [ablyClient, setAblyClient] = useState("null");

    useEffect(() => {
        if (userId) {
            setAblyClient(new Realtime({
                authUrl: config.apiBaseUrl + "/auth/ably",
                authHeaders: {
                    authorization: `Bearer ${userId ? userId : ""}`,
                },
            }))
        }else{
            setAblyClient("null");
        }
    }, [userId]);

    useEffect(() => {
        if (ablyClient === "null") {
            return;
        }

        return () => {
            if (ablyClient !== "null") {
                ablyClient.close();
            }
        };
    }, [ablyClient]);

    return <AblyProvider client={ablyClient}>{children}</AblyProvider>;
};
