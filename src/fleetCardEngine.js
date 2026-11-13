// Eclissi Stellare - combattimento carte di flotta 2026.
// Motore puro: nessuna modifica all'inventario, nessuna carta o nave regalata.
// Solo la madre spara con le proprie armi. Evoluzioni passive ai livelli 3 e 5.
// Due sistemi vitali distrutti eliminano la madre, anche se le scudiere sopravvivono.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {fleetAdvancedCardProfile} from './fleetSpecialProfiles.js';
import {fleetShipPassive,applyFleetShipPassives} from './fleetShipPassives.js';
import {buildFleetEscorts,escortAlive,motherWounded,readyFleetEscorts,repairFleetUnit,mendFleetEscort,absorbFleetAttack} from './fleetEscortSupports.js';
import {createFleetBossState,applyFleetBossBeforeRound,applyFleetBossAfterRound} from './fleetBossPassives.js';

export const FLEET_PARTS=Object.freeze([
 {id:'engine',name:'Motori',effect:'Mobilita: perde evasione elementale'},
 {id:'weapons',name:'Armi',effect:'Fuoco: la madre non puo piu attaccare'},
 {id:'generator',name:'Generatore',effect:'Energia: disattiva riparazioni e supporti collegati'},
 {id:'command',name:'Centralina',effect:'Sincronia: disattiva i supporti collegati e la Formazione triplice'}
]);
export const FLEET_ELEMENTS=Object.freeze({
 refrigerant:{name:'Refrigerante',symbol:'❄',beats:'plasma',color:'#58c5ff'},
 plasma:{name:'Plasma',symbol:'✹',beats:'mineral',color:'#ff805c'},
 mineral:{name:'Minerale',symbol:'⬡',beats:'ionic',color:'#d6bb8a'},
 ionic:{name:'Ionico',symbol:'ϟ',beats:'refrigerant',color:'#a58aff'}
});
export const FLEET_SLOTS=Object.freeze({second:3,third:5});
export function fleetSlotCount(motherLevel=1){
 const n=Math.max(1,Math.min(5,Math.floor(Number(motherLevel)||1)));
 return n>=5?3:n>=3?2:1; // madre inclusa, evoluzioni automatiche
}
const ELEMENT_BY_SHIP=Object.freeze({
 N00:'ionic',C01:'plasma',C02:'refrigerant',C03:'ionic',C04:'plasma',
 R01:'plasma',R02:'ionic',R03:'refrigerant',R04:'mineral',
 E01:'refrigerant',E02:'ionic',E03:'plasma',E04:'mineral',
 L01:'plasma',L02:'ionic',L03:'mineral',L04:'refrigerant'
});
const ROLE_BY_SHIP=Object.freeze({
 N00:'Versatile',C01:'Assalto',C02:'Tecnica',C03:'Interferenza',
 C04:'Intercettazione',R01:'Assalto',R02:'Controllo',R03:'Supporto',
 R04:'Artiglieria',E01:'Controllo',E02:'Raffica',E03:'Assedio',
 E04:'Supporto',L01:'Assalto',L02:'Controllo',L03:'Artiglieria',L04:'Supporto'
});
const SHIPS=new Map(PHASE1_CATALOG.ships.map(s=>[s.id,s]));
const WEAPONS_BY_SHIP=new Map(PHASE1_CATALOG.ships.map(ship=>[
 ship.id,PHASE1_CATALOG.weapons.filter(w=>w.nave_id===ship.id)
]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const alive=s=>s.parts.filter(p=>p.destroyed).length<2;
const aliveFleet=side=>side.ships.filter(alive);
const canFire=s=>alive(s)&&s.parts.find(p=>p.id==='weapons').damage<2;
const part=(ship,id)=>ship.parts.find(p=>p.id===id);
const copy=o=>JSON.parse(JSON.stringify(o));
const knownCard=t=>Object.hasOwn(SPECIAL_CARD_CATALOG,t);
function seededShuffle(items,seed){
 let x=(Number(seed)||1818)>>>0;
 const a=[...items];
 for(let i=a.length-1;i>0;i--){
  x^=x<<13;x^=x>>>17;x^=x<<5;
  const j=(x>>>0)%(i+1);
  [a[i],a[j]]=[a[j],a[i]];
 }
 return a;
}
function buildShip(ship){
 const def=SHIPS.get(ship?.shipId??ship?.id);
 if(!def)throw new Error('Navicella non presente nel catalogo ufficiale');
 const level=clamp(Math.floor(Number(ship?.level)||1),1,5);
 const installed=WEAPONS_BY_SHIP.get(def.id)||[];
 const rawFire=installed.reduce((sum,w)=>sum+Math.round(
  Number(w.danno_colpo_L1)+(Number(w.danno_colpo_L5)-Number(w.danno_colpo_L1))*(level-1)/4),0);
 const weaponRating=1+(rawFire>=8?1:0)+(rawFire>=18?1:0);
 // Gli upgrade ufficiali L1-L5 aumentano resistenza e qualita delle armi,
 // senza cambiare i quattro stati fisici dei componenti vitali.
 // Non esiste piu' una barriera obbligatoria prima dei quattro vitali.
 const maxShield=0;
 return {id:def.id,name:def.nome,level,rarity:def.rarita,role:ROLE_BY_SHIP[def.id],
  passive:fleetShipPassive(def.id),
  element:ELEMENT_BY_SHIP[def.id],shield:maxShield,maxShield,weaponRating,
  weapons:installed.map(w=>w.nome),
  parts:FLEET_PARTS.map(p=>({id:p.id,damage:0,destroyed:false}))};
}
function buildSide(ships,types,seed,moduleLevels={}){
 if(!Array.isArray(ships)||ships.length!==1)
  throw new Error('La flotta usa una sola carta madre: le scudiere sono evoluzioni automatiche');
 if(!Array.isArray(types)||types.length!==24||types.some(t=>!knownCard(t)))
  throw new Error('Il mazzo speciale deve contenere 24 carte reali');
 const ordered=seededShuffle(types,seed);
 const mother=buildShip(ships[0]);
 return {ships:[mother],escorts:buildFleetEscorts(mother),deck:ordered.slice(5),hand:ordered.slice(0,5),
  discard:[],buffs:[],commander:null,status:null,equipmentLevels:{...moduleLevels}};
}
export function createFleetCardBattle({shipsA,shipsB,deckA,deckB,mode='campaign',
 seed=1988,nowMs=0,bossName=null,bossId=null,bossLockedTerrain=false,
 moduleLevelsA={},moduleLevelsB={}}={}){
 const bossState=createFleetBossState(bossId);
 return {version:1,phase:'playing',winner:null,round:1,mode,
  bossName:bossState?.name||bossName,bossState,
  bossLockedTerrain:bossLockedTerrain||!!bossState,
  terrain:bossState?{element:bossState.terrainElement,until:null,source:'boss'}:null,
  sides:{A:buildSide(shipsA,deckA,seed,moduleLevelsA),
   B:buildSide(shipsB,deckB,seed+77,moduleLevelsB)},
  log:[{round:0,text:'Le flotte sono schierate. Seleziona un nemico e uno dei quattro sistemi.'}],
  startedAtMs:nowMs,finishedAtMs:null};
}
export const FLEET_SPECIAL_EFFECTS=Object.freeze({
 'fusion-barrier':['guard','Manovra difensiva di flotta'],
 'fusion-strike':['power','Potenzia il fuoco coordinato'],
 'fusion-twin':['guard','Difesa gemellare delle scudiere'],
 'fusion-triad':['power','Fuoco della madre coordinato da entrambe le scudiere'],
 'tactical-cover':['guard','Copertura tattica'],
 'shot-piercing':['pierce','Potenzia un colpo mirato sui vitali'],
 'shot-ion':['ion','Impulso ionico: risonanza e sabotaggio'],
 'shot-corrosion':['corrosion','Corrosione sul bersaglio'],
 'support-shield-repair':['repair','Ripara una frattura o un supporto'],
 'support-status-purge':['repair','Ripristina sistemi'],
 'support-escort-repair':['repair','Ripara la madre o una scudiera viva'],
 'tactic-quantum-dice':['power','Dado quantico: sovraccarico'],
 'tactic-bomb':['jam','Bomba elettromagnetica'],
 'tactic-malus':['jam','Disturbo ai sistemi di tiro'],
 'tactic-golden':['power','Carta dorata: risonanza potenziata'],
 'tactic-vulnerability-rift':['pierce','Faglia: colpo di precisione ai vitali'],
 'tactic-signature-mutation':['ion','Mutazione della firma elementale'],
 'tactic-power-shift':['repair','Deviazione energetica'],
 'tactic-scan':['pierce','Scansione dei punti deboli'],
 'tactic-suppress':['jam','Soppressione della flotta'],
 'tactic-counter':['guard','Contromisura programmata'],
 'tactic-reactive':['guard','Paratia reattiva anti-salva'],
 'tactic-kinetic':['power','Carica cinetica'],
 'tactic-impact':['guard','Schermo di impatto anti-salva'],
 'tactic-numeric-recycle':['draw','Ricambio tattico di carte']
});
export function fleetCardEffect(type){
 const advanced=fleetAdvancedCardProfile(type);
 if(advanced)return advanced;
 if(FLEET_SPECIAL_EFFECTS[type])return {kind:FLEET_SPECIAL_EFFECTS[type][0],
  description:FLEET_SPECIAL_EFFECTS[type][1]};
 if(type.startsWith('terrain-'))return {kind:'terrain',description:'Modifica la risonanza del campo'};
 const family=SPECIAL_CARD_CATALOG[type]?.family;
 if(family==='boss-character')return {kind:'aura',description:'Comandante: bonus di flotta per due round'};
 if(family==='equipment')return {kind:'aura',description:'Modulo: bonus di flotta per due round'};
 if(family==='epic')return {kind:'power',description:'Reliquia: attacco risonante'};
 throw new Error('Effetto speciale da convertire: '+type);
}
function validateOrder(b,who,order){
 const side=b.sides[who],enemy=b.sides[who==='A'?'B':'A'];
 if(!side||!enemy||!order||b.phase!=='playing')return 'Partita non in corso';
 if(order.shipIndex!==0||!enemy.ships[0]||!alive(enemy.ships[0]))
  return 'Il bersaglio e la nave madre avversaria';
 if(!FLEET_PARTS.some(p=>p.id===order.partId)||
   part(enemy.ships[order.shipIndex],order.partId).destroyed)return 'Scegli un componente non distrutto';
 const indices=order.cards??[];
 if(!Array.isArray(indices)||indices.length>2||new Set(indices).size!==indices.length||
   indices.some(i=>!Number.isInteger(i)||i<0||i>=side.hand.length))
  return 'Puoi usare fino a due carte presenti nella tua mano';
 if(b.bossLockedTerrain&&indices.some(i=>fleetCardEffect(side.hand[i]).kind==='terrain'))
  return 'Il boss impone il suo terreno: questa carta non e disponibile';
 if(indices.some(i=>['fusion-twin','fusion-triad'].includes(side.hand[i]))&&
   readyFleetEscorts(side).length<2)
  return 'Fusione Gemellare e Trina richiedono due scudiere collegate (livello 5)';
 const playedCommanders=indices.filter(i=>fleetCardEffect(side.hand[i]).kind==='character');
 if(playedCommanders.length>1)return 'Puoi attivare un solo personaggio alla volta';
 if(playedCommanders.length&&side.commander&&side.commander.until>=b.round)
  return 'Hai gia un personaggio attivo: attendi la fine della sua durata';
 return null;
}
function removeCards(side,indices){
 const sorted=[...(indices??[])].sort((a,b)=>b-a);
 const cards=sorted.map(i=>side.hand[i]);
 for(const i of sorted)side.hand.splice(i,1);
 side.discard.push(...cards);
 return cards;
}
function strongestElementAttack(side,defender,forcedIon){
 const mother=side.ships[0];
 const attacks=canFire(mother)?[mother]:[];
 const elements=forcedIon?['ionic',...attacks.map(s=>s.element)]:attacks.map(s=>s.element);
 return {advantage:elements.some(e=>FLEET_ELEMENTS[e].beats===defender.element),
  resisted:part(defender,'engine').damage<2&&
   elements.length>0&&elements.every(e=>FLEET_ELEMENTS[defender.element].beats===e),
  attackers:attacks};
}
function generatorActive(side){return part(side.ships[0],'generator').damage<2;}
function healOneShield(side){return generatorActive(side)&&!!repairFleetUnit(side);}
function upgradeFleetAdvanced(side,enemy,order,round,type,effects){
 const profile=fleetAdvancedCardProfile(type);
 if(!profile)return false;
 const target=enemy.ships[order.shipIndex];
 if(profile.kind==='character'){
  side.commander={type,until:round+profile.duration-1};
  return true;
 }
 if(profile.kind==='epic'){
  // Una carta epica resta attiva esattamente per il numero di round del
  // suo catalogo. Non si inventano reliquie, livelli o ricompense.
  side.buffs=side.buffs.filter(buff=>buff.type!==type);
  side.buffs.push({type,until:round+profile.duration-1});
  return true;
 }
 const active=aliveFleet(side);
 const moduleLevel=clamp(Number(side.equipmentLevels?.[type])||1,1,9);
 const moduleTier=1+Math.floor((moduleLevel-1)/3);
 const tuned=moduleTier===3?2:1;
 switch(profile.action){
  case 'impulse':effects.power+=tuned;break;
  case 'repair':if(generatorActive(side))effects.repair+=tuned;break;
  case 'swap1':effects.draw++;break;
  case 'swap2':effects.draw+=2;break;
  case 'execute':
   if(target&&(target.parts.some(p=>p.damage>0)||enemy.escorts.some(e=>escortAlive(e)&&e.hp<e.maxHp)))effects.power++;
   break;
  case 'guard':effects.guard+=tuned;break;
  case 'jam':effects.jam=true;break;
  case 'drain':effects.power++;effects.healOnHit=tuned;break;
  case 'interfere':effects.jam=true;effects.jamDraw=true;break;
  case 'cleanse':effects.antiJam=true;break;
  case 'fortify':effects.guard++;if(generatorActive(side))effects.repair+=tuned;break;
  case 'formation':if(readyFleetEscorts(side).length>=1)effects.power+=tuned;break;
  case 'focus':effects.power+=tuned;break;
  case 'siphon':effects.power++;effects.jam=true;break;
  case 'escort':if(readyFleetEscorts(side).length>=1)effects.power+=tuned;break;
  case 'purge':effects.antiJam=true;effects.guard++;break;
  case 'quantum':effects.power++;effects.ion=true;break;
  case 'burn':effects.corrosion=true;break;
  case 'singularity':effects.power+=tuned;effects.ion=true;effects.healOnHit=tuned;break;
  default:throw Error('Modulo avanzato senza regola di flotta: '+type);
 }
 return true;
}
function ongoingFleetAdvanced(side,enemy,enemyOrder,battle,effects){
 const commander=side.commander;
 if(commander?.until<battle.round)side.commander=null;
 const active=aliveFleet(side);
 const opposing=aliveFleet(enemy);
 if(side.commander){
  const {action}=fleetAdvancedCardProfile(side.commander.type);
  switch(action){
   case 'armor':effects.guard++;break;
   case 'assault':effects.power++;break;
   case 'corrosion':effects.corrosion=true;break;
   case 'counter':
    effects.guard++;if((enemyOrder.cards??[]).length)effects.power++;
    break;
   case 'ionGuard':if(opposing.some(s=>s.element==='ionic'))effects.guard++;break;
   case 'escortGuard':if(readyFleetEscorts(side).length>=1)effects.guard++;break;
   case 'shadow':if(motherWounded(active[0]))effects.power++;break;
   case 'regeneration':if(generatorActive(side))effects.repair++;break;
   case 'sync':
    if(readyFleetEscorts(side).length>=1&&alive(side.ships[0])&&
      part(side.ships[0],'command').damage<2)effects.power++;
    break;
   case 'harmonic':if(readyFleetEscorts(side).length>=1)effects.power++;break;
   case 'magma':
    if(battle.terrain?.element==='plasma'||
      motherWounded(enemy.ships[0]))effects.power++;
    break;
   case 'precision':effects.pierce=true;effects.power++;break;
   default:throw Error('Personaggio senza abilita di flotta: '+action);
  }
 }
 side.buffs=side.buffs.filter(buff=>buff.until>=battle.round);
 for(const buff of side.buffs){
  const {action}=fleetAdvancedCardProfile(buff.type);
  switch(action){
   case 'calice':effects.power++;effects.healOnHit=Math.max(1,effects.healOnHit);break;
   case 'pendolo':effects.draw++;break;
   case 'monolite':
    if(opposing.some(s=>s.element==='plasma'))effects.guard++;
    break;
   case 'matrice':
    if(motherWounded(active[0]))
     effects.power+=2;
    break;
   case 'mobius':effects.jam=true;break;
   case 'astrolabio':effects.draw+=2;break;
   default:throw Error('Carta epica senza abilita di flotta: '+action);
  }
 }
}
function prepareEffects(b,who,order,opposingOrder){
 const side=b.sides[who],enemy=b.sides[who==='A'?'B':'A'];
 const played=removeCards(side,order.cards);
 const effects={power:0,guard:0,pierce:false,ion:false,corrosion:false,
  jam:false,repair:0,draw:0,aura:0,healOnHit:0,antiJam:false,
  jamDraw:false,repairEscort:0,cards:played};
 for(const type of played){
  if(upgradeFleetAdvanced(side,enemy,order,b.round,type,effects))continue;
  const kind=fleetCardEffect(type).kind;
  switch(kind){
   case 'power': effects.power++;break;
   case 'guard': effects.guard++;break;
   case 'pierce': effects.pierce=true;effects.power++;break;
   case 'ion': effects.ion=true;break;
   case 'corrosion': effects.corrosion=true;break;
   case 'jam': effects.jam=true;break;
   case 'repair':
    if(generatorActive(side)){
     if(type==='support-escort-repair')effects.repairEscort++;
     else effects.repair++;
    }
    break;
   case 'draw':effects.draw++;break;
   case 'aura':side.buffs=[{until:b.round+1,type}];effects.aura++;break;
   case 'terrain':
    if(!b.bossLockedTerrain){
     const t=type==='terrain-ionic'?'ionic':type==='terrain-plasma'?'plasma':
      type==='terrain-resonance'?'refrigerant':'mineral';
     effects.terrain=t;
    }else effects.guard++;
    break;
   default:break;
  }
  if(type==='fusion-strike'&&readyFleetEscorts(side).length)effects.power++;
  if(type==='fusion-triad'&&readyFleetEscorts(side).length===2)effects.power++;
  if(type==='fusion-twin'&&readyFleetEscorts(side).length===2)effects.guard++;
  if(['tactical-cover','fusion-barrier','fusion-twin'].includes(type)&&readyFleetEscorts(side).length){
   const scudiere=[...readyFleetEscorts(side)].sort((a,z)=>z.hp-a.hp);
   effects.coverEscortSlot=scudiere[0].slot;
  }
 }
 ongoingFleetAdvanced(side,enemy,opposingOrder,b,effects);
 if(played.length===2){
  const kinds=played.map(t=>fleetCardEffect(t).kind);
  if(kinds.includes('power')&&kinds.includes('ion'))effects.power++;
  if(kinds.includes('guard')&&kinds.includes('repair'))effects.guard++;
 }
 // Carte di riparazione: una frattura sulla madre oppure HP su scudiera viva.
 for(let r=0;r<effects.repair;r++)repairFleetUnit(side);
 for(let r=0;r<effects.repairEscort;r++)mendFleetEscort(side);
 return effects;
}
function resolveAttack(attacker,defender,order,eff,defEff,activeTerrain,round){
 const target=defender.ships[0],vital=part(target,order.partId);
 const profile=strongestElementAttack(attacker,target,eff.ion);
 const fireCount=profile.attackers.length; // SOLO la nave madre spara
 const weaponBonus=fireCount?Math.max(0,attacker.ships[0].weaponRating-1):0;
 const base=fireCount?1+weaponBonus:0;
 const terrainBonus=activeTerrain&&fireCount&&attacker.ships[0].element===activeTerrain?1:0;
 const effectBoost=eff.power+(eff.corrosion?1:0)+eff.aura+terrainBonus;
 const blocked=defEff.guard+(defEff.jam&&!eff.antiJam?1:0)+(profile.resisted?1:0);
 const strength=fireCount?clamp(base+effectBoost+(profile.advantage?1:0)-blocked,0,5):0;
 let damage=0,escortDamage=0,escortSlot=null,escortName=null,escortDestroyed=false;
 let cover=null;
 if(strength>0){
  cover=absorbFleetAttack(defender,defEff,strength);
  if(cover){
   ({escortDamage,escortSlot,escortName,escortDestroyed}=cover);
  }else{
   const resonance=strength>=2&&(profile.advantage||eff.corrosion||
    eff.power>=2||(eff.power>=1&&eff.ion)||(eff.pierce&&eff.power>=1));
   damage=Math.min(2-vital.damage,resonance?2:1);
   vital.damage+=damage;
   vital.destroyed=vital.damage>=2;
  }
 }
 const sunk=target.parts.filter(p=>p.destroyed).length>=2;
 const name=FLEET_PARTS.find(p=>p.id===order.partId).name;
 return {round,shipIndex:0,shipName:target.name,partId:order.partId,
  partName:name,fireCount,strength,shieldsHit:0,damage,
  escortDamage,escortSlot,escortName,escortDestroyed,
  advantage:profile.advantage,resisted:profile.resisted,
  destroyed:vital.destroyed,sunk,played:eff.cards,terrainBonus,
  text:fireCount===0?'La madre non puo sparare: Armi distrutte':
   strength===0?'Attacco della madre neutralizzato':
   cover?escortName+': intercetta '+escortDamage+' danni'+
    (escortDestroyed?' · SCUDIERA DISTRUTTA':''):
   target.name+': '+(vital.destroyed?'SISTEMA DISTRUTTO: ':'Frattura: ')+
    name+(sunk?' · NAVE MADRE DISTRUTTA':'')};
}
function refillOne(side){
 if(side.deck.length&&side.hand.length<5)side.hand.push(side.deck.shift());
}
export function resolveFleetCardRound(battle,orderA,orderB,nowMs=0){
 const a=validateOrder(battle,'A',orderA),c=validateOrder(battle,'B',orderB);
 if(a||c)return {ok:false,reason:a||c,battle};
 const b=copy(battle);
 const effA=prepareEffects(b,'A',orderA,orderB),effB=prepareEffects(b,'B',orderB,orderA);
 // Le carte Terreno modificano il campo per due round; boss bloccati.
 const terrainClash=!!effA.terrain&&!!effB.terrain;
 const terrainChoice=terrainClash?null:effA.terrain||effB.terrain;
 if(terrainClash)b.terrain=null;
 else if(terrainChoice)b.terrain={element:terrainChoice,until:b.round+1};
 if(b.terrain&&b.terrain.until!=null&&b.terrain.until<b.round)b.terrain=null;
 const bossPre=applyFleetBossBeforeRound(b,{A:effA,B:effB},{A:orderA,B:orderB});
 const passiveA=applyFleetShipPassives(b.sides.A,b.sides.B,orderA,orderB,b.round,effA);
 const passiveB=applyFleetShipPassives(b.sides.B,b.sides.A,orderB,orderA,b.round,effB);
 // Si fotografa la flotta prima dei danni: gli ordini sono simultanei.
 const snapA=copy(b.sides.A),snapB=copy(b.sides.B);
 // Ai bersagli si applicano gli effetti nello stesso ciclo, senza vantaggio di iniziativa.
 const hitA=resolveAttack(snapA,b.sides.B,orderA,effA,effB,b.terrain?.element,b.round);
 const hitB=resolveAttack(snapB,b.sides.A,orderB,effB,effA,b.terrain?.element,b.round);
 const bossPost=applyFleetBossAfterRound(b,hitA,hitB);
 // Il sifone e il Calice riparano soltanto in risposta a un colpo reale.
 // Il generatore deve essere operativo: nessuna guarigione di una nave distrutta.
 if(effA.healOnHit&&(hitA.damage>0||hitA.escortDamage>0))
  for(let i=0;i<effA.healOnHit;i++)healOneShield(b.sides.A);
 if(effB.healOnHit&&(hitB.damage>0||hitB.escortDamage>0))
  for(let i=0;i<effB.healOnHit;i++)healOneShield(b.sides.B);
 const events=[
  {round:b.round,text:'Giocatore: '+hitA.text,who:'A',...hitA},
  {round:b.round,text:'Avversario: '+hitB.text,who:'B',...hitB}
 ];
 b.log=[...b.log,...bossPre.map(text=>({round:b.round,text})),
   ...passiveA.map(text=>({round:b.round,text:'Giocatore · '+text})),
   ...passiveB.map(text=>({round:b.round,text:'Avversario · '+text})),...events,
  ...bossPost.map(text=>({round:b.round,text}))].slice(-36);
 const finishedA=b.sides.A.ships.every(s=>!alive(s));
 const finishedB=b.sides.B.ships.every(s=>!alive(s));
 if(finishedA||finishedB){
  b.phase='finished';b.winner=finishedA&&finishedB?'draw':finishedB?'A':'B';
  b.finishedAtMs=nowMs;
 }else if(!canFire(b.sides.A.ships[0])&&!canFire(b.sides.B.ships[0])){
  // Le Armi completamente distrutte non si riparano: evita un duello infinito.
  b.phase='finished';b.winner='draw';b.finishedAtMs=nowMs;
  b.log.push({round:b.round,text:'Entrambe le madri senza armamenti: pareggio tecnico.'});
 }else{
  b.round++;
  if(!effB.jamDraw||effA.antiJam)refillOne(b.sides.A);
  if(!effA.jamDraw||effB.antiJam)refillOne(b.sides.B);
  for(const e of [effA,effB])if(e.draw&&!(e===effA?effB.jamDraw&&!effA.antiJam:effA.jamDraw&&!effB.antiJam)){
   const side=e===effA?b.sides.A:b.sides.B;
   // Il ricambio non crea copie: sostituisce una carta rimasta in mano
   // con la prossima carta del mazzo, dopo la pesca normale.
   for(let i=0;i<e.draw;i++){
    if(!side.deck.length||!side.hand.length)break;
    side.discard.push(side.hand.shift());
    refillOne(side);
   }
  }
 }
 return {ok:true,battle:b,events};
}
export function selectFleetAiOrder(battle){
 const side=battle.sides.B,enemy=battle.sides.A;
 const target=enemy.ships[0],mother=side.ships[0];
 // La madre non attacca a caso: mira ai vitali che rompono una difesa reale.
 const targetPart=(()=> {
  const available=['command','generator','weapons','engine'].filter(id=>part(target,id).damage<2);
  if(!available.length)return 'command';
  const defending=readyFleetEscorts(enemy);
  const candidates=available.map(id=>{
   let score=part(target,id).damage*3;
   if(id==='weapons'&&canFire(target))score+=4;
   if(id==='generator'&&defending.some(e=>e.skill.requires.includes('generator')))score+=5;
   if(id==='command'&&defending.some(e=>e.skill.requires.includes('command')))score+=5;
   if(id==='engine'&&defending.some(e=>e.skill.requires.includes('engine')))score+=5;
   if(defending.some(e=>e.skill.targetPart===id))score+=1;
   return {id,score};
  });
  candidates.sort((a,b)=>b.score-a.score);
  return candidates[0].id;
 })();
 const cards=[];
 const cap=battle.round%3===0?2:1;
 const candidates=side.hand.map((type,index)=>{
  const fx=fleetCardEffect(type);
  const id=type;
  let score=0;
  if(['power','pierce','ion','corrosion'].includes(fx.kind))score=5;
  if(['guard','repair','jam'].includes(fx.kind))score=3;
  if(['character','epic','module'].includes(fx.kind))score=4;
  if(fx.kind==='terrain')score=battle.bossLockedTerrain?-1:1;
  if(fx.kind==='draw')score=1;
  if(fx.kind==='repair'&&!generatorActive(side))score=0;
  if(fx.kind==='repair'&&!motherWounded(mother)&&
    !(side.escorts||[]).some(e=>escortAlive(e)&&e.hp<e.maxHp))score=0;
  if(['fusion-twin','fusion-triad'].includes(id)&&readyFleetEscorts(side).length<2)score=-1;
  if(fx.kind==='character'&&side.commander?.until>=battle.round)score=-1;
  if(id==='support-escort-repair'&&!side.escorts.some(e=>escortAlive(e)&&e.hp<e.maxHp))score=-1;
  return {index,score,type:id,kind:fx.kind};
 }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
 for(const card of candidates){
  if(cards.length>=cap)break;
  if(card.kind==='character'&&cards.some(i=>fleetCardEffect(side.hand[i]).kind==='character'))continue;
  cards.push(card.index);
 }
 return {shipIndex:0,partId:targetPart,cards};
}
export function fleetSurvivors(side){return aliveFleet(side).length;}
export function fleetShipDestroyed(ship){return !alive(ship);}
