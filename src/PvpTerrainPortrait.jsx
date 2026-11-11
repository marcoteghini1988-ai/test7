import React from 'react';
import {pvpTerrainDefinition} from './pvpTerrainCards.js';

// Illustrazione del Terreno nella carta vera, mai in una plancia alternativa.
export default function PvpTerrainPortrait({type,className=''}) {
 const terrain=pvpTerrainDefinition(type);
 if(!terrain)return null;
 return <span className={'pvp-terrain-portrait '+className} aria-hidden="true">
  <span className="pvp-terrain-fallback">✧</span>
  <img src={terrain.imagePath} alt="" draggable={false}
   onError={event=>{event.currentTarget.hidden=true;}}/>
 </span>;
}
