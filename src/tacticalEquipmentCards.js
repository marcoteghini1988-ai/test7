// Bridge non distruttivo del catalogo Moduli 16F nel mazzo speciale.
// Tutti gli ID e nomi provengono da phase16FModules.js. Una carta per
// abilita' acquistata/sbloccata, niente attivazione dal solo equipaggiamento.
import {PHASE16F_MODULES,PHASE16F_EFFECT_LABELS} from './newCombat/phase16FModules.js';
import {damageMotherShield,restoreMotherShield} from './vitalDefense.js';

export const MODULE_CARD_PREFIX='module-card-';
export const MODULE_STORAGE_KEY='eclissi_abilities';
export const moduleCardType=id=>MODULE_CARD_PREFIX+id;
export const moduleIdForCard=type=>typeof type==='string'&&type.startsWith(MODULE_CARD_PREFIX)?
 type.slice(MODULE_CARD_PREFIX.length):null;
export const TACTICAL_MODULE_CARDS=Object.freeze(Object.fromEntries(
 Object.values(PHASE16F_MODULES).map(module=>[
  moduleCardType(module.id),Object.freeze({
   id:moduleCardType(module.id),moduleId:module.id,name:module.name,
   short:'MODULO',family:'equipment',effect:module.effect,maxCopies:1,
   description:'Carta Modulo · '+(PHASE16F_EFFECT_LABELS[module.effect]??module.effect)+
    '. Si attiva SOLO giocandola dalle cinque speciali; nessun effetto passivo.'
  })
 ])
));
export const MODULE_CARD_TYPES=Object.freeze(Object.keys(TACTICAL_MODULE_CARDS));
export const isModuleCard=type=>Object.hasOwn(TACTICAL_MODULE_CARDS,type);

const plain=obj=>obj!==null&&typeof obj==='object'&&!Array.isArray(obj);
export function legacyModuleLevels(raw={}){
 if(!plain(raw))throw new Error('Inventario moduli non valido');
 const levels={};
 for(const [id,details] of Object.entries(raw)){
  if(!Object.hasOwn(PHASE16F_MODULES,id))continue;
  if(details?.unlocked===true){
   const lvl=Number(details.level);
   if(!Number.isInteger(lvl)||lvl<1||lvl>9)
    throw new Error('Livello modulo acquistato non valido: '+id);
   levels[moduleCardType(id)]=lvl;
  }
 }
 return levels;
}
export function readLegacyModuleLevels(storage=globalThis.localStorage){
 const raw=storage.getItem(MODULE_STORAGE_KEY);
 return legacyModuleLevels(raw?JSON.parse(raw):{});
}
export function mergeOwnedModuleCards(collection,levels){
 const original=collection.owned;
 const next={...original};let changed=false;
 for(const card of Object.keys(levels)){
  if(!isModuleCard(card))continue;
  if((next[card]||0)<1){next[card]=1;changed=true;}
 }
 return changed?{...collection,owned:next}:collection;
}
const other=key=>key==='A'?'B':'A';
const damage=(side,n)=>{
 const r=damageMotherShield(side.defense,n);
 side.defense=r.defense;
 return r.damage;
};
const repair=(side,n)=>{
 const r=restoreMotherShield(side.defense,n);
 side.defense=r.defense;
 return r.repaired;
};
const addSync=(side,n)=>{
 const before=side.sync;
 side.sync=Math.max(0,Math.min(100,before+n));
 return side.sync-before;
};
function transferSync(from,to,n){
 const moved=Math.min(n,Math.max(0,from.sync),Math.max(0,100-to.sync));
 from.sync-=moved;to.sync+=moved;return moved;
}
export function activateTacticalModuleCards(sides,playedTypes,log){
 const effects={A:{},B:{}};
 const activations=[];
 // Calcola entrambi gli ordini su risorse pubbliche nel medesimo snapshot,
 // senza ispezionare le carte nascoste dell'avversario.
 for(const key of ['A','B']){
  const type=playedTypes[key].find(isModuleCard);
  if(!type)continue;
  const data=TACTICAL_MODULE_CARDS[type],side=sides[key],foe=sides[other(key)];
  const level=side.equipmentLevels?.[type];
  if(!Number.isInteger(level)||level<1||level>9)continue;
  const n=4+2*(1+Math.floor((level-1)/3));
  const e=effects[key],target=effects[other(key)];
  let actual=0;
  switch(data.effect){
   case 'pure_hit':actual=damage(foe,n+2);break;
   case 'healing':actual=repair(side,n+3);break;
   case 'execution':actual=damage(foe,foe.defense.shield.hp<=foe.defense.shield.max*.4?n*2:n);break;
   case 'guard':e.guard=(e.guard||0)+n+3;break;
   case 'module_lock':target.lockWeapon=true;break;
   case 'life_drain':actual=damage(foe,n);repair(side,Math.ceil(actual/2));break;
   case 'hand_jam':target.precisionFactor=.8;break; // sempre 7 numeriche vere
   case 'prevent_skip':e.preventMalus=true;break; // preparazione mai saltata
   case 'shield_and_ether':actual=repair(side,n);addSync(side,4);break;
   case 'ether_gain':actual=addSync(side,Math.min(8,2+2*Math.floor((level-1)/3)));break;
   case 'boost_focus':actual=addSync(side,n+2);break;
   case 'boost_siphon':actual=transferSync(foe,side,n);break;
   case 'ammo_refill':e.escortBoost=n;break; // soltanto se la scudiera spara davvero
   case 'refill':e.recycle=2;break; // ricambio di 2 numeriche reali, mano 7
   case 'free_swap':e.recycle=1;break;
   case 'clear_malus':e.preventMalus=true;side.legacy.malusCharge=0;break;
   case 'dice_charge':side.legacy.diceReady=true;side.legacy.dicePatterns=['plus','minus','times'];break;
   case 'burn':e.burn=true;break; // soltanto su pacchetto armi vero
   case 'singularity':actual=damage(foe,n+2);repair(side,Math.ceil(actual/2));addSync(side,3);break;
   default:throw new Error('Modulo non supportato: '+data.effect);
  }
  activations.push({by:key,type,name:data.name,effect:data.effect,level,actual});
  log.push(key+': CARTA MODULO '+data.name+' L'+level+' · '+data.effect+
   (actual?' ('+actual+' effettivi)':''));
 }
 for(const key of ['A','B']){
  if(effects[key].preventMalus){
   effects[key].preventMalus=true;
  }
 }
 return {effects,activations};
}
