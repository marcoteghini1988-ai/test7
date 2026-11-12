// Eclissi Stellare - combattimento carte di flotta 2026.
// Motore puro: nessuna modifica all'inventario, nessuna carta o nave regalata.
// Tutte le navi equipaggiate sparano insieme; una nave cade con DUE vitali distrutti.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';

export const FLEET_PARTS=Object.freeze([
 {id:'engine',name:'Motori',effect:'Mobilita: perde evasione elementale'},
 {id:'weapons',name:'Armi',effect:'Fuoco: la nave non contribuisce all attacco'},
 {id:'generator',name:'Generatore',effect:'Difesa: scudi e riparazioni disabilitati'},
 {id:'command',name:'Centralina',effect:'Sincronia: la flotta perde il bonus combinato'}
]);
export const FLEET_ELEMENTS=Object.freeze({
 refrigerant:{name:'Refrigerante',symbol:'❄',beats:'plasma',color:'#58c5ff'},
 plasma:{name:'Plasma',symbol:'✹',beats:'mineral',color:'#ff805c'},
 mineral:{name:'Minerale',symbol:'⬡',beats:'ionic',color:'#d6bb8a'},
 ionic:{name:'Ionico',symbol:'ϟ',beats:'refrigerant',color:'#a58aff'}
});
export const FLEET_SLOTS=Object.freeze({second:11,third:31});
export function fleetSlotCount(sectorNumber=1,mode='campaign'){
 if(mode==='pvp')return 3;
 const n=Math.max(1,Math.floor(Number(sectorNumber)||1));
 return n>=FLEET_SLOTS.third?3:n>=FLEET_SLOTS.second?2:1;
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
const validElement=e=>Object.hasOwn(FLEET_ELEMENTS,e);
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
 return {id:def.id,name:def.nome,level,rarity:def.rarita,role:ROLE_BY_SHIP[def.id],
  element:ELEMENT_BY_SHIP[def.id],shield:2,maxShield:2,
  weapons:(WEAPONS_BY_SHIP.get(def.id)||[]).map(w=>w.nome),
  parts:FLEET_PARTS.map(p=>({id:p.id,damage:0,destroyed:false}))};
}
function buildSide(ships,types,seed){
 if(!Array.isArray(ships)||ships.length<1||ships.length>3)
  throw new Error('La flotta deve contenere da una a tre navicelle');
 if(new Set(ships.map(s=>s.shipId??s.id)).size!==ships.length)
  throw new Error('Non puoi schierare due copie della stessa navicella');
 if(!Array.isArray(types)||types.length!==24||types.some(t=>!knownCard(t)))
  throw new Error('Il mazzo speciale deve contenere 24 carte reali');
 const ordered=seededShuffle(types,seed);
 return {ships:ships.map(buildShip),deck:ordered.slice(5),hand:ordered.slice(0,5),
  discard:[],buffs:[],status:null};
}
export function createFleetCardBattle({shipsA,shipsB,deckA,deckB,mode='campaign',
 seed=1988,nowMs=0,bossName=null,bossLockedTerrain=false}={}){
 return {version:1,phase:'playing',winner:null,round:1,mode,
  bossName,bossLockedTerrain,terrain:null,
  sides:{A:buildSide(shipsA,deckA,seed),B:buildSide(shipsB,deckB,seed+77)},
  log:[{round:0,text:'Le flotte sono schierate. Seleziona un nemico e uno dei quattro sistemi.'}],
  startedAtMs:nowMs,finishedAtMs:null};
}
export const FLEET_SPECIAL_EFFECTS=Object.freeze({
 'fusion-barrier':['guard','Copertura con scudi di flotta'],
 'fusion-strike':['power','Potenzia il fuoco coordinato'],
 'fusion-twin':['guard','Difesa gemellare'],
 'fusion-triad':['power','Assalto delle tre navicelle'],
 'tactical-cover':['guard','Copertura tattica'],
 'shot-piercing':['pierce','Perfora gli scudi'],
 'shot-ion':['ion','Impulso ionico: risonanza e sabotaggio'],
 'shot-corrosion':['corrosion','Corrosione sul bersaglio'],
 'support-shield-repair':['repair','Ripristina uno scudo'],
 'support-status-purge':['repair','Ripristina sistemi'],
 'support-escort-repair':['repair','Ripara una navicella'],
 'tactic-quantum-dice':['power','Dado quantico: sovraccarico'],
 'tactic-bomb':['jam','Bomba elettromagnetica'],
 'tactic-malus':['jam','Disturbo ai sistemi di tiro'],
 'tactic-golden':['power','Carta dorata: risonanza potenziata'],
 'tactic-vulnerability-rift':['pierce','Faglia: aggira gli scudi'],
 'tactic-signature-mutation':['ion','Mutazione della firma elementale'],
 'tactic-power-shift':['repair','Deviazione energetica'],
 'tactic-scan':['pierce','Scansione dei punti deboli'],
 'tactic-suppress':['jam','Soppressione della flotta'],
 'tactic-counter':['guard','Contromisura programmata'],
 'tactic-reactive':['guard','Paratia reattiva'],
 'tactic-kinetic':['power','Carica cinetica'],
 'tactic-impact':['guard','Schermo di impatto'],
 'tactic-numeric-recycle':['draw','Ricambio tattico di carte']
});
export function fleetCardEffect(type){
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
 if(!Number.isInteger(order.shipIndex)||!enemy.ships[order.shipIndex]||
    !alive(enemy.ships[order.shipIndex]))return 'Scegli una navicella avversaria ancora attiva';
 if(!FLEET_PARTS.some(p=>p.id===order.partId)||
   part(enemy.ships[order.shipIndex],order.partId).destroyed)return 'Scegli un componente non distrutto';
 const indices=order.cards??[];
 if(!Array.isArray(indices)||indices.length>2||new Set(indices).size!==indices.length||
   indices.some(i=>!Number.isInteger(i)||i<0||i>=side.hand.length))
  return 'Puoi usare fino a due carte presenti nella tua mano';
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
 const attacks=aliveFleet(side).filter(canFire);
 const elements=forcedIon?['ionic',...attacks.map(s=>s.element)]:attacks.map(s=>s.element);
 return {advantage:elements.some(e=>FLEET_ELEMENTS[e].beats===defender.element),
  resisted:part(defender,'engine').damage<2&&
   elements.length>0&&elements.every(e=>FLEET_ELEMENTS[defender.element].beats===e),
  attackers:attacks};
}
function prepareEffects(b,who,order){
 const side=b.sides[who],played=removeCards(side,order.cards);
 const effects={power:0,guard:0,pierce:false,ion:false,corrosion:false,
  jam:false,repair:0,draw:0,aura:0,cards:played};
 // Gli effetti persistenti hanno durata limitata: non si accumulano senza fine.
 side.buffs=side.buffs.filter(a=>a.until>=b.round);
 if(side.buffs.length)effects.power+=1;
 for(const type of played){
  const kind=fleetCardEffect(type).kind;
  switch(kind){
   case 'power': effects.power++;break;
   case 'guard': effects.guard++;break;
   case 'pierce': effects.pierce=true;break;
   case 'ion': effects.ion=true;break;
   case 'corrosion': effects.corrosion=true;break;
   case 'jam': effects.jam=true;break;
   case 'repair':effects.repair++;break;
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
 }
 if(played.length===2){
  const kinds=played.map(t=>fleetCardEffect(t).kind);
  if(kinds.includes('power')&&kinds.includes('ion'))effects.power++;
  if(kinds.includes('guard')&&kinds.includes('repair'))effects.guard++;
 }
 // Le riparazioni si attivano prima degli attacchi simultanei.
 for(let r=0;r<effects.repair;r++){
  const damaged=aliveFleet(side).filter(s=>part(s,'generator').damage<2);
  damaged.sort((a,z)=>a.shield-z.shield);
  const target=damaged[0];
  if(target){
   if(target.shield<target.maxShield)target.shield++;
   else{
    const injured=target.parts.find(p=>p.damage===1);
    if(injured)injured.damage=0;
   }
  }
 }
 return effects;
}
function resolveAttack(attacker,defender,order,eff,defEff,activeTerrain,round){
 const target=defender.ships[order.shipIndex],vital=part(target,order.partId);
 const profile=strongestElementAttack(attacker,target,eff.ion);
 const sync=aliveFleet(attacker).filter(canFire).length>=2 &&
  aliveFleet(attacker).every(s=>part(s,'command').damage<2);
 const fireCount=profile.attackers.length;
 const base=fireCount>0?1+(fireCount>=2?1:0)+(sync?1:0):0;
 const terrainBonus=activeTerrain&&profile.attackers.some(s=>s.element===activeTerrain)?1:0;
 const effectBoost=eff.power+(eff.corrosion?1:0)+eff.aura+terrainBonus;
 const advantageBonus=profile.advantage?1:0;
 const blocked=defEff.guard+(defEff.jam?1:0)+(profile.resisted?1:0);
 const strength=clamp(base+effectBoost+advantageBonus-blocked,0,5);
 const shieldBefore=target.shield;
 let damage=0,shieldsHit=0;
 if(strength>0){
  if(shieldBefore>0&&!eff.pierce){
   shieldsHit=Math.min(shieldBefore,strength);
   target.shield-=shieldsHit;
  }else{
   if(shieldBefore>0&&eff.pierce){
    shieldsHit=Math.min(1,shieldBefore);
    target.shield-=shieldsHit;
   }
   // Danno normale: una frattura. Elemento favorevole o vera combinazione:
   // distruzione in un colpo. Il numero di navi aiuta a superare gli scudi,
   // non trasforma automaticamente ogni turno in un KO.
   const resonance=profile.advantage||eff.corrosion||
    eff.power>=2||(eff.power>=1&&eff.ion);
   damage=Math.min(2-vital.damage,resonance?2:1);
   vital.damage+=damage;
   vital.destroyed=vital.damage>=2;
   if(vital.destroyed&&vital.id==='generator')target.shield=0;
  }
 }
 const destroyedCount=target.parts.filter(p=>p.destroyed).length;
 const sunk=destroyedCount>=2;
 return {round,from:attacker===defender?'?':null,shipIndex:order.shipIndex,
  shipName:target.name,partId:order.partId,partName:FLEET_PARTS.find(p=>p.id===order.partId).name,
  fireCount,strength,shieldsHit,damage,advantage:profile.advantage,resisted:profile.resisted,
  destroyed:vital.destroyed,sunk,played:eff.cards,terrainBonus,
  text:fireCount===0?'Le armi della flotta non possono sparare':
   strength===0?'Attacco annullato dalle difese':
   shieldsHit&&!damage?target.name+': barriera -'+shieldsHit:
   target.name+': '+(vital.destroyed?'SISTEMA DISTRUTTO: ':'Frattura: ')+
   FLEET_PARTS.find(p=>p.id===order.partId).name+(sunk?' · NAVICELLA DISTRUTTA':'')
 };
}
function refillOne(side){
 if(side.deck.length&&side.hand.length<5)side.hand.push(side.deck.shift());
}
export function resolveFleetCardRound(battle,orderA,orderB,nowMs=0){
 const a=validateOrder(battle,'A',orderA),c=validateOrder(battle,'B',orderB);
 if(a||c)return {ok:false,reason:a||c,battle};
 const b=copy(battle);
 const effA=prepareEffects(b,'A',orderA),effB=prepareEffects(b,'B',orderB);
 // Le carte Terreno modificano il campo per due round; boss bloccati.
 const terrainChoice=effA.terrain&&effB.terrain?null:effA.terrain||effB.terrain;
 if(terrainChoice)b.terrain={element:terrainChoice,until:b.round+1};
 if(b.terrain&&b.terrain.until<b.round)b.terrain=null;
 // Si fotografa la flotta prima dei danni: gli ordini sono simultanei.
 const snapA=copy(b.sides.A),snapB=copy(b.sides.B);
 // Ai bersagli si applicano gli effetti nello stesso ciclo, senza vantaggio di iniziativa.
 const hitA=resolveAttack(snapA,b.sides.B,orderA,effA,effB,b.terrain?.element,b.round);
 const hitB=resolveAttack(snapB,b.sides.A,orderB,effB,effA,b.terrain?.element,b.round);
 const events=[
  {round:b.round,text:'Giocatore: '+hitA.text,who:'A',...hitA},
  {round:b.round,text:'Avversario: '+hitB.text,who:'B',...hitB}
 ];
 b.log=[...b.log,...events].slice(-36);
 const finishedA=b.sides.A.ships.every(s=>!alive(s));
 const finishedB=b.sides.B.ships.every(s=>!alive(s));
 if(finishedA||finishedB){
  b.phase='finished';b.winner=finishedA&&finishedB?'draw':finishedB?'A':'B';
  b.finishedAtMs=nowMs;
 }else{
  b.round++;
  refillOne(b.sides.A);refillOne(b.sides.B);
  for(const e of [effA,effB])if(e.draw){for(let i=0;i<e.draw;i++)
    refillOne(e===effA?b.sides.A:b.sides.B);}
 }
 return {ok:true,battle:b,events};
}
export function selectFleetAiOrder(battle){
 const side=battle.sides.B,enemy=battle.sides.A;
 const targets=enemy.ships.map((ship,i)=>({ship,i})).filter(o=>alive(o.ship));
 targets.sort((a,b)=>{
  const sa=a.ship.parts.filter(p=>p.destroyed).length*10+
   a.ship.parts.reduce((n,p)=>n+p.damage,0)*2-a.ship.shield;
  const sb=b.ship.parts.filter(p=>p.destroyed).length*10+
   b.ship.parts.reduce((n,p)=>n+p.damage,0)*2-b.ship.shield;
  return sb-sa||a.i-b.i;
 });
 const target=targets[0],parts=['command','weapons','generator','engine'];
 const preferred=parts.find(p=>!part(target.ship,p).destroyed);
 const useful=side.hand.map((t,i)=>({i,kind:fleetCardEffect(t).kind}))
  .filter(x=>['power','ion','pierce','corrosion','guard','repair','jam','aura'].includes(x.kind));
 const indexes=useful.slice(0,battle.round%3===0?2:1).map(x=>x.i);
 return {shipIndex:target.i,partId:preferred,cards:indexes};
}
export function fleetSurvivors(side){return aliveFleet(side).length;}
export function fleetShipDestroyed(ship){return !alive(ship);}
