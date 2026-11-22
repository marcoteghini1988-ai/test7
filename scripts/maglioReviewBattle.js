// Fixture di collaudo: usa il motore e la plancia ufficiali, senza inventario o ricompense.
import {createFleetNextBattle} from '../src/fleetNext/combat.js';
import {HP_SYNC_RULESET} from '../src/fleetNext/hpSynchronization.js';
import {MAGLIO_CARD_ID} from '../src/maglioBattleVisuals.js';

export function createMaglioReviewBattle({nowMs=Date.now(),slot=0,blocked=false}={}){
 const b=createFleetNextBattle({shipA:'N00',shipB:'C01',raritaA:'Comune',raritaB:'Comune',
  supportRosterA:[],supportRosterB:[],deckA:[],deckB:[],mode:'pvp',
  ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,strategicNoDeterioration:true,
  seed:20261122,nowMs});
 for(const side of Object.values(b.sides)){
  side.hand=[MAGLIO_CARD_ID,...Array(6).fill('energy-metallic')];
  // Il Maglio base è autonomo: senza Energie evitiamo anche il colpo
  // del Generatore IA, così la prova visiva isola soltanto questa Arma.
  side.energyPile=[];
  side.deck=Array(25).fill('energy-metallic');
  side.discard=[];
  // La configurazione slot 2 serve a verificare anche il secondo alloggiamento.
  if(slot===1)side.machines=[{id:'review-existing',sourceCardId:'weapon-confirmed-metallic-slitta',
   name:'Cannone a Slitta d’Acciaio',slot:0,hp:1,maxHp:1,power:0,untilPly:99,deployedPly:-2}];
 }
 if(blocked)b.sides.A.fireDisabledUntil=20;
 return b;
}
