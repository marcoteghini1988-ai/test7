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
   short:module.name.split(' · ')[0].slice(0,16).toUpperCase(),family:'equipment',effect:module.effect,maxCopies:1,
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
const sideSync=(side,delta)=>{side.sync=Math.max(0,Math.min(100,side.sync+delta));};
export function activateTacticalModuleCards(sides,playedTypes,log){
 const effects={A:{},B:{}};
 const activations=[];
 const syncAtStart={A:sides.A.sync,B:sides.B.sync};
 const siphonDelta={A:0,B:0};
 // Le carte offensiva e curativa si risolvono in un solo scambio.
 // Ogni condizione usa gli HP al momento in cui entrambi hanno sigillato.
 const shieldAtStart={A:sides.A.defense.shield.hp,B:sides.B.defense.shield.hp};
 const plannedDamage={A:0,B:0},plannedHeal={A:0,B:0};
 const healingFromHit={A:false,B:false};
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
   case 'pure_hit':plannedDamage[key]=n+2;break;
   case 'healing':plannedHeal[key]=n+3;break;
   case 'execution':plannedDamage[key]=shieldAtStart[other(key)]<=foe.defense.shield.max*.4?n*2:n;break;
   case 'guard':e.guard=(e.guard||0)+n+3;break;
   case 'module_lock':target.lockWeapon=true;break;
   case 'life_drain':plannedDamage[key]=n;healingFromHit[key]=true;break;
   case 'hand_jam':target.precisionFactor=.8;break; // sempre 7 numeriche vere
   case 'prevent_skip':e.preventMalus=true;break; // preparazione mai saltata
   case 'shield_and_ether':plannedHeal[key]=n;addSync(side,4);break;
   case 'ether_gain':actual=addSync(side,Math.min(8,2+2*Math.floor((level-1)/3)));break;
   case 'boost_focus':actual=addSync(side,n+2);break;
   case 'boost_siphon':{
    // Due Sifoni simultanei si misurano sugli stessi valori sigillati:
    // nessun vantaggio al primo elemento della sequenza A/B.
    actual=Math.min(n,Math.max(0,syncAtStart[other(key)]),
     Math.max(0,100-syncAtStart[key]));
    siphonDelta[key]+=actual;siphonDelta[other(key)]-=actual;
    break;
   }
   case 'ammo_refill':e.escortBoost=n;break; // soltanto se la scudiera spara davvero
   case 'refill':e.recycle=2;break; // ricambio di 2 numeriche reali, mano 7
   case 'free_swap':e.recycle=1;break;
   case 'clear_malus':e.preventMalus=true;break; // purifica il sabotaggio ricevuto, non la barra positiva
   case 'dice_charge':side.legacy.diceReady=true;side.legacy.dicePatterns=['plus','minus','times'];break;
   case 'burn':e.burn=true;break; // soltanto su pacchetto armi vero
   case 'singularity':plannedDamage[key]=n+2;healingFromHit[key]=true;addSync(side,3);break;
   default:throw new Error('Modulo non supportato: '+data.effect);
  }
  activations.push({by:key,type,name:data.name,effect:data.effect,level,actual});
 }
 // Applica prima ENTRAMBI i danni veri, poi ENTRAMBE le cure.
 // Un colpo e una cura contemporanei hanno la stessa priorità per A e B;
 // il drenaggio rigenera solo proporzionalmente ai danni realmente inflitti.
 const actualDamage={A:0,B:0},actualHealing={A:0,B:0};
 for(const key of ['A','B']){
  if(plannedDamage[key]>0)
   actualDamage[key]=damage(sides[other(key)],plannedDamage[key]);
 }
 for(const key of ['A','B']){
  const heal=plannedHeal[key]+(healingFromHit[key]?Math.ceil(actualDamage[key]/2):0);
  if(heal>0)actualHealing[key]=repair(sides[key],heal);
  sideSync(sides[key],siphonDelta[key]);
 }
 for(const activation of activations){
  const {by:key,effect}=activation;
  if(plannedDamage[key])activation.actual=actualDamage[key];
  else if(plannedHeal[key])activation.actual=actualHealing[key];
  log.push(key+': CARTA MODULO '+activation.name+' L'+activation.level+' · '+effect+
   (activation.actual?' ('+activation.actual+' effettivi)':''));
 }
 return {effects,activations};
}
