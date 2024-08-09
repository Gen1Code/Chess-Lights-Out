import React, { useState, useContext, useEffect} from 'react';
import { GameContext } from '@context/GameContext';
import { apiSetsReponse } from '@utils/api';
export function PlayButton() {
    const {settings, currentSettings, setCurrentSettings, status, setStatus, setTokenRequest } = useContext(GameContext);
    const [response, setResponse] = useState(null);
    
    const playing = status === "Playing";

    function playGame() {
        if (settings.mode === "Single") {
            setCurrentSettings(settings);
            setStatus("Playing");
        }else{
            apiSetsReponse("/game/play", "POST", settings, setResponse)
        }
    }

    function resign() {
        if (currentSettings.mode === "Single") {
            setStatus("You resigned!");
        }else{
            apiSetsReponse("/game/resign", "POST", setResponse)
        }
    }

    useEffect(() => {
        console.log(response);
        if(response && response.keyName){
            setTokenRequest(response);
        }
    }, [response]);

  return (
    <> 
      {!playing &&(<button onClick={playGame}>Play</button>)}
      {playing &&(<button onClick={resign}>Resign</button>)}
    </>  
  );
}