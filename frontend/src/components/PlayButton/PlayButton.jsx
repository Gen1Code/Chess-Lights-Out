import React, { useState, useContext, useEffect} from 'react';
import { GameContext } from '@context/GameContext';
import { apiSetsReponse } from '@utils/api';
export function PlayButton() {
    const {settings, currentSettings, setCurrentSettings, status, setStatus, setGameId } = useContext(GameContext);
    const [response, setResponse] = useState(null);
    
    const playing = status === "Playing";
    const looking = status === "Looking for a game";

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
            let postData = {gameId: currentSettings.gameId};
            apiSetsReponse("/game/resign", "POST", postData, setResponse)
        }
    }

    useEffect(() => {
        console.log(response);
        if (response) {
            let message = response.message;
            if (message === "Game Found") {
                setCurrentSettings({...settings, gameId: response.gameId, color: response.color});
                setStatus("Playing");
            }else if (message === "Resigned") {
                setStatus("You resigned!");
            }else if (message === "Looking For a Game") {
                setCurrentSettings({...settings, gameId: response.gameId, color: response.color});
                setStatus("Looking for a game");
            }

            if(response.gameId) {
                localStorage.setItem("game_id", response.gameId);
                setGameId(response.gameId);
            }
                
        }
        
    }, [response]);

  return (
    <> 
      {!playing && !looking && (<button onClick={playGame}>Play</button>)}
      {looking && (<button disabled>Looking for a game</button>)}
      {playing && (<button onClick={resign}>Resign</button>)}
    </>  
  );
}