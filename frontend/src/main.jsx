import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@components/App";
import { GameProvider } from "@context/GameContext.jsx";
import { Ably } from "@components/Ably";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <GameProvider>
            <Ably>
                <App />
            </Ably>
        </GameProvider>
    </React.StrictMode>
);
