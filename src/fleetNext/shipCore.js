// Identità e geometria logica delle dodici madri, condivise con la battaglia attuale.
// Questo modulo non importa i comandanti o il motore di combattimento precedente.
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';

export const ENGINE_KEYS=['plus','minus','times','divide'];
export const META={plus:{sign:'+',name:'Addizione',color:'#26baff'},minus:{sign:'−',name:'Sottrazione',color:'#57e4a1'},times:{sign:'×',name:'Moltiplicazione',color:'#ff674d'},divide:{sign:'÷',name:'Divisione',color:'#b780ff'}};
export const SUIT_SIGNS={H:'♥',D:'♦',C:'♣',S:'♠'};
export const PHASE1_SHIPS=PHASE1_CATALOG.ships;
export const rankLabel=value=>value===1?'A':value===11?'J':value===12?'Q':value===13?'K':String(value);

export function getShipDefinition(id){return PHASE1_SHIPS.find(x=>x.id===id)||null;}
export function getWeaponsForShip(id){return PHASE1_CATALOG.weapons.filter(x=>x.nave_id===id);}
export function shipSuits(id){
 return [...new Set(getWeaponsForShip(id).flatMap(w=>[
  w.seme_trigger,...w.combo.split('@')[0].split('+'),
 ]).filter(s=>Object.hasOwn(SUIT_SIGNS,s)))];
}
export function validFleet(ids){
 if(!Array.isArray(ids)||ids.length<1||ids.length>3||ids.some(x=>!getShipDefinition(x))||new Set(ids).size!==ids.length)return false;
 const counts={H:0,D:0,C:0,S:0};
 for(const id of ids){if(id==='N00')continue;for(const suit of shipSuits(id))if(++counts[suit]>2)return false;}
 return true;
}
const vesselLevel=level=>Math.max(1,Math.min(5,Math.floor(Number(level)||1)));
const shipLevel=(id,level)=>PHASE1_CATALOG.shipLevels.find(x=>x.nave_id===id&&x.livello===level);
const gunLevel=(id,level)=>PHASE1_CATALOG.weaponLevels.find(x=>x.arma_id===id&&x.livello===level);
export function fleetCompatibility(playerIds,enemyIds,level=1,playerLevels={},enemyLevels={}){
 if(!validFleet(playerIds)||!validFleet(enemyIds))return {compatible:false,playerMissing:[],enemyMissing:[]};
 const operators=(ids,levels)=>new Set(ids.flatMap(id=>
  ENGINE_KEYS.slice(0,shipLevel(id,vesselLevel(levels[id]??level)).motori)));
 const player=operators(playerIds,playerLevels),enemy=operators(enemyIds,enemyLevels);
 const playerMissing=ENGINE_KEYS.filter(op=>enemy.has(op)&&!player.has(op));
 const enemyMissing=ENGINE_KEYS.filter(op=>player.has(op)&&!enemy.has(op));
 return {compatible:!playerMissing.length&&!enemyMissing.length,playerMissing,enemyMissing};
}
export function newVessel(id='N00',level=1){
 const def=getShipDefinition(id);if(!def)throw Error('Nave inesistente '+id);
 const l=vesselLevel(level);
 const prog=shipLevel(id,l);if(!prog)throw Error('Progressione assente '+id+'/'+l);
 const engines={};ENGINE_KEYS.forEach((op,i)=>{if(i<prog.motori)engines[op]={hp:prog.hp_per_motore,max:prog.hp_per_motore};});
 return {id,name:def.nome,rarity:def.rarita,level:l,engines,weapons:getWeaponsForShip(id).map(w=>({...w,damage:gunLevel(w.id,l)?.danno_per_proiettile??w.danno_colpo_L1,charge:0})),};
}
