// Ingresso ufficiale: la PLANCIA 3D LIVE originale non si sostituisce.
// L'adattatore conserva navicelle, hardpoint fisici, arena, mazzi e 5 slot 3D;
// cambia soltanto le regole nel motore carte di flotta.
import React from 'react';
import OfficialFleetBattle3D from './OfficialFleetBattle3D.jsx';
import {officialCampaignBattleProps} from './officialCampaignRouting.js';

export default function MathDuelBattle(props){
 return <OfficialFleetBattle3D {...officialCampaignBattleProps(props)}/>;
}
