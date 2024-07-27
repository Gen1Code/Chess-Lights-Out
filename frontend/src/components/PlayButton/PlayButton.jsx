import React, { useState, useContext} from 'react';
import { GameContext } from '@context/GameContext';
import { api } from '@utils/api';
export function PlayButton() {
    const {settings, setCurrentSettings, status, setStatus } = useContext(GameContext);
    const [response, setResponse] = useState(null);
    
    const playing = status === "Playing";

    function playGame() {
        if (settings.mode === "single") {
            setCurrentSettings(settings);
            setStatus("Playing");
        }else{
            api("/game/play", "POST", settings, setResponse)
        }
    }

    function resign() {
        if (settings.mode === "single") {
            setStatus("You resigned!");
        }else{
            api("/game/resign", "POST", settings, setResponse)
        }
    }

  return (
    <> 
      {!playing &&(<button onClick={playGame}>Play</button>)}
      {playing &&(<button onClick={resign}>Resign</button>)}
    </>  
  );
}