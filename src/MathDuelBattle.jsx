// Un unico accesso ufficiale dalla campagna, senza URL o schermate di prova.
// I 12 settori boss riconosciuti usano la plancia live a turni alternati con piloti e
// mazzi originali. Salvataggi o piloti non compatibili usano la 3D legacy.
import React from 'react';
import OfficialBattle3D from './OfficialLiveBattle3D.jsx';
import BossBattle3D from './BossBattle3D.jsx';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';
import {officialCampaignBattleProps} from './officialCampaignRouting.js';

export default function MathDuelBattle(props){
 // Mantiene gli ID di pianeta originali ma usa settori 1..120 in entrambi i motori.
 const battleProps=officialCampaignBattleProps(props);
 const eligibility=officialSimultaneousEligibility(battleProps);
 return eligibility.enabled?<OfficialBattle3D {...battleProps}/>:<BossBattle3D {...battleProps}/>;
}
