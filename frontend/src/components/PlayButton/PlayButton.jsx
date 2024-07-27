import React, {useState} from 'react';
import { api } from '@utils/api';
export function PlayButton({ settings }) {
 
    const [response, setResponse] = useState(null);

    function playGame() {
        if (settings.mode === "single") {
            console.log("Single Player Game");
        }else{
            api("/game/play", "POST", settings, setResponse)
        }
    }

  return (
      <button onClick={playGame}>Play</button>
  );
}