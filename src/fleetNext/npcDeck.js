// Mazzo completo e deterministico per l'avversario ufficiale della campagna.
// Il vecchio deckB:['gen-216'] non alimentava il Generatore e non schierava
// le Carte Arma necessarie alla meccanica senza tiro gratuito.
// Non inventa nuove carte, non copia il mazzo acquistato dal giocatore.
// Le esclusive della madre sono inserite automaticamente dal motore.
import {card,cardCopyLimit,cardRole} from './rules.js';
import {nextGenericCapacity} from './nextDeckLoadout.js';
import {ALL_WEAPON_CARDS} from './weaponRarityEvolutions.js';
import {ENERGY_CARD_BY_ID,energyIdForRarity} from './energyCards.js';
import {NEXT_COMMON_CARDS} from './newCardRegistry.js';
import {ELEMENTAL_TERRAIN_CARDS} from './elementalTerrainCards.js';
import {activeFleetElements} from './elementalAffinities.js';
import {SHIP_RARITIES} from './shipRarity.js';
import {LEGENDARY_MOTHER_PROFILES} from './motherBalance.js';

const SIMPLE_MODES=new Set(['base-shot','polarity-shot','double-shot',
 'repeat-shot','sweep-shot','energy-burst-shot','designed-shot',
 'discard-attacks','escort-count','sequence']);
const rotating=(items,offset)=>items.length?
 [...items.slice(offset%items.length),...items.slice(0,offset%items.length)]:[];
const rolePlan=role=>{
 if(['assalto','pressione','precisione'].includes(role))
  return {weapons:17,energy:10,systems:6,terrain:3};
 if(['resistenza','corazza','contrattacco','controllo'].includes(role))
  return {weapons:12,energy:10,systems:12,terrain:5};
 return {weapons:15,energy:10,systems:8,terrain:4};
};

export function buildCampaignNpcDeck(shipId,level,rarity,seed=1){
 const profile=LEGENDARY_MOTHER_PROFILES[shipId];
 const index=SHIP_RARITIES.indexOf(rarity);
 if(!profile||index<0)throw Error('Nave CPU o rarita non riconosciuta');
 const capacity=nextGenericCapacity(shipId,level);
 const own=activeFleetElements(shipId,level);
 const selected=[],counts=new Map();
 const add=(ids,targetCount)=>{
  let added=0;
  for(const id of ids){
   if(added>=targetCount||selected.length>=capacity)break;
   const def=card(id),limit=cardCopyLimit(id);
   if(!def||def.playable===false||def.shipId||
    cardRole(id)==='character'||!Number.isFinite(limit)||limit<1||
    (counts.get(id)||0)>=limit)continue;
   selected.push(id);counts.set(id,(counts.get(id)||0)+1);added++;
  }
  return added;
 };
 const weaponPool=ALL_WEAPON_CARDS.filter(c=>c.rarita===rarity)
  .sort((a,b)=>Number(own.includes(b.elementId))-Number(own.includes(a.elementId))||
   Number(SIMPLE_MODES.has(b.effectSpec.damageMode))-
   Number(SIMPLE_MODES.has(a.effectSpec.damageMode))||
   a.id.localeCompare(b.id)).map(c=>c.id);
 const energyPool=own.flatMap(element=>
  SHIP_RARITIES.slice(0,index+1).reverse().flatMap(tier=>
   Array(4).fill(energyIdForRarity(element,tier))
  )).filter(id=>Object.hasOwn(ENERGY_CARD_BY_ID,id));
 const systemPool=NEXT_COMMON_CARDS.filter(c=>c.rarita===rarity&&
  c.effectSpec?.type==='systemModifier'&&
  ['weapons','command','bridge','generator'].includes(c.effectSpec.system))
  .sort((a,b)=>a.id.localeCompare(b.id)).map(c=>c.id);
 const terrainPool=ELEMENTAL_TERRAIN_CARDS.filter(c=>c.rarita===rarity&&
  own.includes(c.elementId)).sort((a,b)=>a.id.localeCompare(b.id)).map(c=>c.id);
 const rot=Math.max(0,Math.floor(Number(seed)||0));
 const plans=rolePlan(profile.role);
 add(rotating(weaponPool,rot%Math.max(1,weaponPool.length)),plans.weapons);
 add(rotating(energyPool,rot%Math.max(1,energyPool.length)),plans.energy);
 add(rotating(systemPool,rot%Math.max(1,systemPool.length)),plans.systems);
 add(rotating(terrainPool,rot%Math.max(1,terrainPool.length)),plans.terrain);
 const more=[...rotating(energyPool,rot),...rotating(weaponPool,rot+3),
  ...rotating(systemPool,rot+7),...rotating(terrainPool,rot+11)];
 for(let i=0;selected.length<capacity&&i<capacity*24;i++)
  add(rotating(more,i),1);
 if(selected.length!==capacity)throw Error('Mazzo CPU incompleto: '+shipId+'/'+rarity+
  ' '+selected.length+'/'+capacity);
 return Object.freeze(selected);
}
