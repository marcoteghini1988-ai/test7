// Un unico accesso ufficiale dalla campagna, senza URL o schermate di prova.
// Le battaglie con passive boss/pilota non ancora migrate preservano le regole 3D esistenti.
import React from 'react';
import OfficialBattle3D from './OfficialBattle3D.jsx';
import BossBattle3D from './BossBattle3D.jsx';
import {officialSimultaneousEligibility} from './officialSimultaneousBridge.js';

export default function MathDuelBattle(props){
 const eligibility=officialSimultaneousEligibility(props);
 return eligibility.enabled?<OfficialBattle3D {...props}/>:<BossBattle3D {...props}/>;
}
