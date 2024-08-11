import React from "react";
import { useContext } from "react";
import { GameContext } from "@context/GameContext";
import { AblyProvider } from "ably/react";
import { Realtime } from "ably";
import config from "@config";

export const Ably = ({ children }) => {
    const { userId } = useContext(GameContext);

    const ablyClient = new Realtime({
        authUrl: config.apiBaseUrl + "/auth/ably",
        authHeaders: {
            authorization: `Bearer ${userId ? userId : ""}`,
        },
    });

    return <AblyProvider client={ablyClient}>{children}</AblyProvider>;
};
