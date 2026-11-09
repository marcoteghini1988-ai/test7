// Segnale pubblico del boss nella plancia UFFICIALE, senza cambiare
// danni, ricompense, informazioni segrete, orari o coordinate grafiche.
// Usa solo fasi pubbliche, stato visibile e carte SPECIALI nella mano propria.
import {exclusiveMagmaPhase,exclusiveVoidDominantSuit} from './tacticalExclusiveBosses.js';

const PUBLIC_THREATS=Object.freeze({
 1:['GAIA · CORAZZA','Riduce soltanto il primo danno reale alla barriera del boss.'],
 2:['MARTE · ASSALTO','I colpi nativi efficaci consecutivi aumentano la pressione del boss.'],
 3:['VENERE · NEUROTOSSINA','Una precisione valida puo ridurre la prima riparazione nel ciclo seguente.'],
 6:['SATURNO · CONTROTEMPO','Una Contromisura efficace del boss arma un bonus nativo temporaneo.'],
 7:['URANO · SIFONE','Un colpo nativo alla barriera puo sottrarre fino a 8 Sincronia reale.'],
 8:['NETTUNO · PRESSIONE','Bonus nativo se il tuo scudo era al 40% o meno a inizio ciclo.'],
 9:['PLUTONE · PATTO','Il boss puo spendere 4 HP veri della propria barriera per potenziare le armi.'],
 11:['EUROPA · IDRA','Un colpo nativo efficace puo preparare una cura; Cuori validi possono contrastarla.'],
 14:['PROXIMA B · REATTORE','Tre colpi nativi efficaci caricano la prossima scarica nativa.'],
 17:['HAUMEA · RISONANZA','Almeno due numeriche spese possono alimentare Sincronia nel ciclo successivo.'],
 20:['ENCELADO · SEME','Il seme dominante pubblico cambia ogni tre cicli.']
});

// Il compact resta leggibile nel riquadro 9:16. Il detail e' sempre
// completo nei pannelli e nel testo accessibile (non affidarsi al tooltip
// desktop, invisibile al tocco su Android).
const readout=(label,detail,phase=null,urgent=false,compact=label)=>Object.freeze({
 label,detail,phase,urgent,compact
});

// Queste sono opportunita' possibili, NON carte assegnate o mosse eseguite.
// Non si suggerisce Riparazione con generatore KO, ne' Contromisura come
// difesa delle armi native: quest'ultima difende solo il vitale indicato.
export function officialIoAvailableDefenses(own){
 if(!own?.defense||!Array.isArray(own.special?.hand))return Object.freeze([]);
 const hand=new Set(own.special.hand.map(c=>c?.type));
 const barrier=own.defense.shield;
 const parts=own.defense.parts;
 const liveBarrier=barrier?.hp>0;
 const options=[];
 if(hand.has('support-shield-repair')&&parts?.shieldGenerator?.hp>0&&
  barrier?.hp<barrier?.max)options.push('Riparazione');
 if(hand.has('tactic-reactive')&&liveBarrier)options.push('Paratia');
 if(hand.has('tactic-impact')&&liveBarrier)options.push('Schermo');
 if(hand.has('tactical-cover')&&liveBarrier&&parts?.command?.hp>0&&
  own.escorts?.some(e=>e.hp>0))options.push('Copertura');
 return Object.freeze(options);
}

export function officialBossThreatReadout(battle){
 const boss=battle?.sides?.B?.bossExclusive;
 if(!boss||!Number.isInteger(battle?.round)||battle.round<1)return null;
 const id=boss.id;
 if(id===19){
  const phase=exclusiveMagmaPhase(battle.sides.B,battle.round);
  if(!phase)return null;
  if(phase==='eruzione'){
   const choices=officialIoAvailableDefenses(battle.sides.A);
   const detail=choices.length?
    'Fuoco nativo +10% · nella tua mano: '+choices.join(', ')+'.':
    'Fuoco nativo +10% · nessuna difesa barriera attualmente utile in mano.';
   return readout('IO · ERUZIONE',detail,phase,true,
    'ERUZIONE +10% · '+choices.length+' difese in mano');
  }
  return phase==='carica'?
   readout('IO · CARICA','Nessun bonus magmatico nativo in questo ciclo.',
    phase,false,'CARICA · NESSUN BONUS'): 
   readout('IO · RAFFREDDAMENTO','Fuoco nativo del boss −10% in questo ciclo.',
    phase,false,'RAFFREDDAMENTO · −10% ARMI');
 }
 const definition=PUBLIC_THREATS[id];
 if(!definition)return null;
 if(id===20){
  const suit=exclusiveVoidDominantSuit(battle.round);
  return readout(definition[0]+' '+suit,
   'Seme dominante: '+suit+'. Una precisione valida con questo seme contrasta il bonus successivo.');
 }
 if(id===1&&boss.armorUsed)
  return readout(definition[0],'Corazza iniziale gia consumata da un colpo reale.',null,false,'GAIA · CORAZZA CONSUMATA');
 if(id===14)
  return readout(definition[0],
   'Cariche pubbliche: '+Math.min(3,Math.max(0,boss.chaosCharges||0))+'/3. '+definition[1],
   null,false,'PROXIMA B · REATTORE '+Math.min(3,Math.max(0,boss.chaosCharges||0))+'/3');
 return readout(definition[0],definition[1]);
}
