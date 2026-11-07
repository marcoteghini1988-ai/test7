// Un unico accesso ufficiale dalla campagna, senza URL o schermate di prova.
// I 12 settori boss riconosciuti usano la plancia simultanea con piloti e
// mazzi originali. Salvataggi o piloti non compatibili usano la 3D legacy.
import React from 'react';
import OfficialBattle3D from './OfficialBattle3D.jsx';
import BossBattle3D from './BossBattle3D.jsx';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';

export default function MathDuelBattle(props){
 const eligibility=officialSimultaneousEligibility(props);
 return eligibility.enabled?<OfficialBattle3D {...props}/>:<BossBattle3D {...props}/>;
}
