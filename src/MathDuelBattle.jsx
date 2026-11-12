// Ingresso ufficiale UNICO del combattimento: carte di flotta ed elementi.
// Home, Hangar, ricompense della campagna e inventari rimangono invariati.
// Le battaglie precedenti rimangono nel repository per migrazione dei dati,
// ma non vengono piu' avviate dalla campagna o dal PvP simulato.
import React from 'react';
import FleetCardBattle from './FleetCardBattle.jsx';
import {officialCampaignBattleProps} from './officialCampaignRouting.js';

export default function MathDuelBattle(props){
 return <FleetCardBattle {...officialCampaignBattleProps(props)}/>;
}
