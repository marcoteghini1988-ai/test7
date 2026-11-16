// Eclissi Stellare — progressione strutturale e combattimento delle flotte.
// Nessuna animazione o audio qui: gli eventi sono emessi per il renderer ufficiale.
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {buildFleetEscorts} from '../fleetEscortSupports.js';
import {ESCORT_ARMORY} from '../escortArmory.js';
import {getShipProgression} from './progression.js';
import {AURORA_ACTIONS,isAuroraModule,installedModule,liveModules,mountModule,removeModule,reconfigurationOptions,auroraPrecondition} from './auroraEngine.js';
import {
 card,cardRole,shipConfig,
 effectiveDeck,exclusiveOperational,
 FLEET_HAND_SIZE,
 FLEET_MAX_PLAYED,FLEET_TURN_SECONDS,VITAL_KEYS,VITAL_LABELS
} from './rules.js';
import {effectiveEffectSpec,validateEffectSpec,effectNeedsOwnTarget,isCharacterCard} from './simpleEffects.js';
import {
 activateTerrain,activeTerrain,terrainSalvoModifier,
 neutralTerrain,bossTerrain,campaignTerrain,TERRAIN_CATALOG
} from './terrains.js';

const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const SHIPS=new Map(PHASE1_CATALOG.ships.map(s=>[s.id,s]));
const roll=(state,n)=>{
 state.rng=(1664525*(state.rng>>>0)+1013904223)>>>0;
 return n?(state.rng>>>0)%n:0;
};
const shuffled=(cards,state)=>{
 const a=[...cards];for(let i=a.length-1;i>0;i--){const j=roll(state,i+1);[a[i],a[j]]=[a[j],a[i]];}return a;
};
export function createFleetMother(id,level=1){
 const config=shipConfig(id),model=SHIPS.get(id);
 if(!config||!model)throw new Error('Madre inesistente '+id);
 const n=clamp(Math.floor(Number(level)||1),1,5),progression=getShipProgression(id,n);
 const parts=progression.vitalIds.map(id=>({id,hp:progression.integrityByPart[id],
  maxHp:progression.integrityByPart[id],damage:0,destroyed:false}));
 return {id:model.id,name:model.nome,level:n,rarity:model.rarita,
  role:progression.role,parts,element:({N00:'ionic',C01:'plasma',C02:'refrigerant',
  C03:'ionic',C04:'plasma',R01:'plasma',R02:'ionic',R03:'refrigerant',
  R04:'mineral',E01:'refrigerant',E02:'ionic',E03:'plasma',E04:'mineral',
  L01:'plasma',L02:'ionic',L03:'mineral',L04:'refrigerant'})[model.id],
  attackPower:progression.attackPower,defensePower:progression.defensePower,
  weaponRating:Math.max(0,progression.attackPower-1)};
}
export const shipAlive=ship=>ship.parts.some(p=>!p.destroyed&&p.hp>0);
export const allVitalsDestroyed=ship=>ship.parts.every(p=>p.destroyed||p.hp<=0);
// Compatibilità delle carte già possedute: i vecchi Motori sono alimentati
// dal Generatore. Non si inventa un terzo vitale su Aurora.
const resolvedPartId=(mother,id)=>id==='engine'&&!mother.parts.some(p=>p.id==='engine')?'generator':id;
const motherPart=(mother,id)=>mother.parts.find(x=>x.id===resolvedPartId(mother,id));
const operational=(mother,id)=>{const p=motherPart(mother,id);return !!p&&!p.destroyed&&p.hp>0;};
const unitAlive=unit=>!!unit&&unit.hp>0&&!unit.destroyed;
const unitEnabled=(unit,ply)=>unitAlive(unit)&&(unit.disabledUntilPly||0)<=ply&&(unit.jammedUntilPly||0)<=ply;
const escortEnabled=(side,escort,ply)=>unitEnabled(escort,ply)&&
 (escort.skill?.requires||['command']).every(id=>operational(side.ships[0],id));
const characterSystem=side=>side.ships[0].parts.some(p=>p.id==='bridge')?'bridge':'generator';
export function createFleetSide(shipId,level,baseDeck,seed,upgrades={}){
 const mother=createFleetMother(shipId,level),n=mother.level;
 const config=shipConfig(shipId),progression=getShipProgression(shipId,n);
 // I modelli ufficiali restano gli stessi; quantità, gradi e riserve sono
 // specifici della madre. La terza e quarta unità non partono in campo.
 const prototypes=buildFleetEscorts({...mother,level:5});
 const model=SHIPS.get(shipId);
 const base=model.hp_motore_L1+(model.hp_motore_L5-model.hp_motore_L1)*(n-1)/4;
 const build=(index,grade,reserve=false)=>{
  const original=prototypes[index%2],arm=ESCORT_ARMORY[shipId][index%2];
  const tough=['cover','bulwark','partCover','phase'].includes(original.skill.action);
  const hp=Math.max(2,Math.min(12,Math.round(2+base/65+
   (original.skill.action==='bulwark'?4:tough?2:0)+arm.shield*3)))+2*(grade-1);
  const requires=[...new Set(['command',...original.skill.requires.map(id=>resolvedPartId(mother,id))])];
  const skill={...original.skill,requires,targetPart:resolvedPartId(mother,original.skill.targetPart)};
  return {...original,id:shipId+':escort:'+(index+1),name:original.name+(reserve?' · Riserva '+(index+1):''),
   slot:index,sourceIndices:[index],grade,skill,hp,maxHp:hp,reserve,
   unlockLevel:progression.escortUnlockLevels?.[index]??(index===0?config.escort1UnlockLevel:config.escort2UnlockLevel),
   linked:true,fused:false};
 };
 const escorts=Array.from({length:progression.escortCount},(_,i)=>build(i,progression.escortGrades[i]||1));
 const reserveEscorts=Array.from({length:progression.reserveCount},(_,i)=>build(i+2,progression.reserveGrades[i]||1,true));
 const rng={rng:seed>>>0},shuffledDeck=shuffled(effectiveDeck(baseDeck,shipId,n),rng);
 const side={ships:[mother],escorts,reserveEscorts,machines:[],modules:{weapon:null,utility:null},
  moduleSerial:0,lastModuleMountPly:-1,auroraVeil:null,fusionsUsed:0,fusionLimit:progression.fusionLimit,
  deck:shuffledDeck.slice(FLEET_HAND_SIZE),hand:shuffledDeck.slice(0,FLEET_HAND_SIZE),discard:[],commander:null,
  buffs:[],defenses:[],stagedComboCards:[],exclusiveUpgrades:{...upgrades},
  lastPlayed:[],attackSlots:[null,null,null],defenseSlots:[null,null],
  turnCount:0,fireDisabledUntil:0,fireBlocked:false,lastDisarmedPly:null,
  protections:[],reactions:[],charges:[],pendingRepair:0,drawBlockedUntil:0,usedCardEvents:[]};
 refreshEscortLinks(side);return side;
}
export function refreshEscortLinks(side,ply=0){
 for(const e of side.escorts||[])e.linked=escortEnabled(side,e,ply);
}
export function protectingFleetUnits(side,ply=0){
 const escortRows=(side.escorts||[]).filter(e=>escortEnabled(side,e,ply)).map(unit=>({kind:'escort',unit}));
 const machineRows=(side.machines||[]).filter(e=>unitEnabled(e,ply)).map(unit=>({kind:'machine',unit}));
 return [...escortRows,...machineRows].map(({kind,unit})=>({kind,id:unit.id,slot:unit.slot,
  name:unit.name,hp:unit.hp,maxHp:unit.maxHp,unit}));
}
export function availableFleetTargets(side,ply=0){
 const guards=protectingFleetUnits(side,ply);
 const units=[...(side.escorts||[]).filter(unitAlive).map(unit=>({kind:'escort',unit})),
  ...(side.machines||[]).filter(unitAlive).map(unit=>({kind:'machine',unit}))];
 return [...units.map(({kind,unit})=>({kind,id:unit.id,slot:unit.slot,name:unit.name,
  hp:unit.hp,maxHp:unit.maxHp,unit,blocked:false})),
  ...liveModules(side).map(unit=>({kind:'module',id:unit.id,slot:unit.slot,name:unit.name,
   hp:unit.hp,maxHp:unit.maxHp,unit,blocked:guards.length>0})),
  ...side.ships[0].parts.filter(unitAlive).map(unit=>({kind:'part',id:unit.id,name:VITAL_LABELS[unit.id],
   hp:unit.hp,maxHp:unit.maxHp,unit,blocked:guards.length>0}))];
}
export function fusionUnavailableReason(side,ply=0){
 const used=side.fusionsUsed||0;
 if(!side.fusionLimit||used>=side.fusionLimit)return 'Le fusioni disponibili sono già state usate';
 if(!operational(side.ships[0],'command'))return 'La Fusione richiede la Centralina attiva';
 if(used===0){
  const first=side.escorts.find(e=>!e.fused&&e.sourceIndices?.includes(0));
  const second=side.escorts.find(e=>!e.fused&&e.sourceIndices?.includes(1));
  if(!first||!second||!escortEnabled(side,first,ply)||!escortEnabled(side,second,ply))
   return 'Servono i primi due supporti ancora operativi';
 }else{
  const third=side.escorts.find(e=>!e.fused&&e.sourceIndices?.includes(2));
  const fourth=(side.reserveEscorts||[]).find(e=>e.sourceIndices?.includes(3));
  if(!third||!fourth||!escortEnabled(side,third,ply)||!escortEnabled(side,fourth,ply))
   return 'Servono il terzo supporto operativo e il quarto sbloccato in riserva';
 }
 return '';
}
export function fuseFleetSupports(side,ply=0){
 const reason=fusionUnavailableReason(side,ply);
 if(reason)return {ok:false,reason};
 const stage=side.fusionsUsed||0;
 const first=side.escorts.find(e=>!e.fused&&e.sourceIndices.includes(stage===0?0:2));
 const second=stage===0?side.escorts.find(e=>!e.fused&&e.sourceIndices.includes(1)):
  side.reserveEscorts.find(e=>e.sourceIndices.includes(3));
 const maxHp=first.maxHp+second.maxHp+2;
 const hp=Math.max(1,Math.floor(maxHp*(first.hp+second.hp)/(first.maxHp+second.maxHp)));
 const requires=[...new Set([...first.skill.requires,...second.skill.requires])];
 const fused={...first,id:side.ships[0].id+':fusion:'+(stage+1),slot:stage,
  name:'Fusione '+(stage===0?'I':'II')+' · '+side.ships[0].name,hp,maxHp,fused:true,reserve:false,
  grade:Math.max(first.grade||1,second.grade||1)+1,sourceIndices:[...first.sourceIndices,...second.sourceIndices],
  skill:{...first.skill,requires},fusionSkills:[{...first.skill},{...second.skill}],linked:true};
 side.escorts=side.escorts.filter(e=>e!==first&&e!==second);
 side.reserveEscorts=(side.reserveEscorts||[]).filter(e=>e!==second);
 side.escorts.push(fused);
 let deployed=null;
 if(stage===0){
  const third=side.reserveEscorts.find(e=>e.sourceIndices.includes(2));
  if(third){side.reserveEscorts=side.reserveEscorts.filter(e=>e!==third);third.slot=1;third.reserve=false;side.escorts.push(third);deployed=third;}
 }
 side.escorts.sort((a,z)=>a.slot-z.slot);side.fusionsUsed=stage+1;
 refreshEscortLinks(side,ply);
 return {ok:true,fused,deployed,stage:stage+1};
}
function emit(b,who,kind,text,rest={}){
 const event={round:b.round,ply:b.ply,who,kind,text,...rest};
 b.log=[...b.log,event].slice(-80);
 return event;
}
function refill(b,side){
 while(side.hand.length<FLEET_HAND_SIZE){
  if(!side.deck.length&&side.discard.length){
   side.deck=shuffled(side.discard,b);side.discard=[];
  }
  if(!side.deck.length)break;
  side.hand.push(side.deck.shift());
 }
}
export function createFleetNextBattle({
 shipA='N00',levelA=1,shipB='C01',levelB=1,deckA,deckB,
 upgradesA={},upgradesB={},mode='campaign',bossId=null,planetId=null,sectorNumber=1,
 seed=1988,nowMs=0,bossName=null
}={}){
 const terrain=bossId?bossTerrain(bossId):mode==='pvp'?neutralTerrain():campaignTerrain(sectorNumber,planetId);
 const b={version:4,phase:'playing',winner:null,round:1,ply:0,turn:'A',
  deadlineMs:nowMs+FLEET_TURN_SECONDS*1000,mode,
  bossName,bossId:bossId||null,planetId:terrain.planetId??planetId??null,
  bossLockedTerrain:false,seed,rng:seed>>>0,startedAtMs:nowMs,finishedAtMs:null,
  terrain,
  log:[],sides:{
   A:createFleetSide(shipA,levelA,deckA,seed+11,upgradesA),
   B:createFleetSide(shipB,levelB,deckB,seed+29,upgradesB)
  },lastEvents:[]};
 emit(b,'system','start','Le flotte sono schierate. Ogni turno dura 30 secondi.');
 return b;
}
export const MAX_FLEET_ROUNDS=50;
export const FLEET_MAX_ROUNDS=MAX_FLEET_ROUNDS;
const other=who=>who==='A'?'B':'A';
const activePart=(side,id)=>{const p=motherPart(side.ships[0],id);return p&&!p.destroyed&&p.hp>0?p:null;};
const livingEscorts=side=>(side.escorts||[]).filter(unitAlive);
const weakest=items=>[...items].sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0]||null;
const weakestPart=side=>weakest(side.ships[0].parts.filter(p=>!p.destroyed));
const visiblePlayed=ids=>ids.filter(id=>card(id)?.effectSpec?.type!=='trap');
const defenseKind=definition=>definition?.effectSpec?.type==='trap'?'trap':'defense';
const activeDefenses=(side,ply)=>(side?.defenses||[]).filter(d=>d.untilPly==null||d.untilPly>ply);
export function defenseSlotsAvailable(side,ply=0,kind=null){
 if(!operational(side.ships[0],'generator'))return 0;
 const occupied=activeDefenses(side,ply);
 if(kind)return Math.max(0,1-occupied.filter(d=>(d.hidden?'trap':'defense')===kind).length);
 return Math.max(0,2-occupied.length);
}
export function defenseCapacityReason(side,newDefenseCount=1,ply=0,kind=null){
 if(Array.isArray(newDefenseCount)){
  const counts={defense:0,trap:0};
  for(const item of newDefenseCount){const def=typeof item==='string'?card(item):item;if(def)counts[defenseKind(def)]++;}
  for(const key of ['defense','trap']){
   const error=defenseCapacityReason(side,counts[key],ply,key);if(error)return error;
  }
  return '';
 }
 if(newDefenseCount<=0)return '';
 if(!operational(side.ships[0],'generator'))return 'Il Generatore distrutto disattiva Difesa e Trappola';
 const available=defenseSlotsAvailable(side,ply,kind);
 if(newDefenseCount<=available)return '';
 if(kind==='trap')return 'Lo spazio Trappola è occupato: massimo una Trappola coperta';
 if(kind==='defense')return 'Lo spazio Difesa è occupato: massimo una Difesa scoperta';
 return available===0?'Gli spazi Difesa e Trappola sono occupati':'Hai spazio per una sola nuova carta Difesa o Trappola';
}
function normalizeSide(side){
 for(const key of ['protections','reactions','charges','buffs','defenses','discard','machines','reserveEscorts'])side[key]??=[];
 side.fireBlocked??=false;side.lastDisarmedPly??=null;side.fusionsUsed??=0;
 side.fusionLimit??=getShipProgression(side.ships[0].id,side.ships[0].level).fusionLimit;
 side.modules??={weapon:null,utility:null};side.moduleSerial??=0;side.lastModuleMountPly??=-1;
 side.auroraVeil??=null;
}
function enforceDestroyedSystems(side,ply=0){
 if(!operational(side.ships[0],'generator')){
  for(const entry of [...side.defenses])discardDefense(side,entry.source);
 }
 if(!operational(side.ships[0],characterSystem(side))&&side.commander){
  side.discard.push(side.commander.id);removeSource(side,side.commander.source);side.commander=null;
 }
 refreshEscortLinks(side,ply);
}
function uniqueIndexList(list,hand){
 return Array.isArray(list)&&list.length<=FLEET_MAX_PLAYED&&
  list.every(x=>Number.isInteger(x)&&x>=0&&x<hand.length)&&new Set(list).size===list.length;
}
function selectedOwnPart(side,target,ownPartId){
 if(target==='selected')return ownPartId?activePart(side,ownPartId):weakestPart(side);
 if(target==='weakest')return weakestPart(side);
 return activePart(side,target);
}
export function effectUnavailableReason(def,side,battle=null,{ownPartId,terrainCode}={}){
 if(!def||!side)return 'Carta non disponibile';
 if(def.playable===false)return 'Esclusiva registrata: effetto di battaglia ancora da implementare';
 if(def.effectSpec.type==='aurora'){
  const reason=auroraPrecondition(def,side,card,side.ships[0].level);
  if(reason)return reason;
 }
 const invalid=validateEffectSpec(def.effectSpec);
 if(invalid)return invalid;
 const s=effectiveEffectSpec(def,side.exclusiveUpgrades?.[def.id]||1);
 const character=isCharacterCard(def);
 const terrain=terrainCode===undefined?battle?.terrain?.id:terrainCode;
 if(cardRole(def.id)==='defense'){
  const capacity=defenseCapacityReason(side,1,battle?.ply??0,defenseKind(def));
  if(capacity)return capacity;
 }
 if(character&&!operational(side.ships[0],characterSystem(side)))return 'Il sistema del Personaggio è distrutto';
 if(character&&side.commander&&side.commander.untilPly>(battle?.ply??0))return 'È già attivo un Personaggio';
 if(def.shipId&&s.type!=='fusion'&&!exclusiveOperational(def.id,side.ships[0],side.escorts))return 'Nave o componenti richiesti non disponibili';
 if(VITAL_KEYS.includes(s.target)&&!activePart(side,s.target))return VITAL_LABELS[s.target]+' non disponibili';
 if(s.target==='escort'&&!livingEscorts(side).length)return 'Nessuna scudiera disponibile';
 if(s.type==='dodge'&&!activePart(side,'generator'))return 'La schivata richiede il Generatore attivo';
 if(s.type==='dodge'&&terrain==='T01')return 'La Distesa Gelida blocca le schivate';
 if(s.type==='repair'&&terrain==='T08')return 'La Palude di Silicio blocca le riparazioni';
 if(['power','pierce','multishot','charge','bypass'].includes(s.type)&&!activePart(side,'weapons'))return 'L’Arsenale è distrutto: resta il tiro di emergenza';
 if(s.type==='fusion'){
  if(def.shipId&&def.shipId!==side.ships[0].id)return 'La Fusione appartiene a un’altra nave';
  const reason=fusionUnavailableReason(side,battle?.ply??0);if(reason)return reason;
 }
 if(s.type==='deployMachine'&&(side.machines||[]).filter(unitAlive).length>=2)return 'I due alloggiamenti delle macchine d’assalto sono occupati';
 if(s.type==='repair'&&!character){
  const unit=s.target==='escort'?weakest(livingEscorts(side)):selectedOwnPart(side,s.target,ownPartId);
  if(!unit||unit.hp>=unit.maxHp)return s.target==='escort'?'Nessuna scudiera da riparare':'Nessun danno da riparare sul componente';
 }
 if(s.type==='disarm'&&battle){
  const who=battle.sides.A===side?'A':battle.sides.B===side?'B':battle.turn;
  const enemy=battle.sides[other(who)];
  if(!activePart(enemy,'weapons'))return 'Le Armi avversarie sono già distrutte';
  if(enemy.fireBlocked)return 'Il prossimo attacco avversario è già bloccato';
  if(enemy.lastDisarmedPly===battle.ply-1)return 'Non puoi bloccare due turni avversari consecutivi';
 }
 return '';
}
export function validateFleetTurn(b,who,order){
 if(!b||b.phase!=='playing')return 'Partita non in corso';
 if(!['A','B'].includes(who)||b.turn!==who)return 'Non è il tuo turno';
 const side=b.sides[who],indices=order?.cards||[];
 if(!uniqueIndexList(indices,side.hand))return 'Puoi usare fino a tre carte presenti nella mano';
 const chosen=indices.map(i=>card(side.hand[i]));
 if(chosen.some(c=>!c))return 'Carta non riconosciuta';
 const roles=chosen.map(c=>cardRole(c.id)),count=x=>roles.filter(r=>r===x).length;
 if(count('character')>1)return 'Massimo un Personaggio per turno';
 if(count('defense')>2)return 'Massimo due carte Difesa per turno';
 if(count('terrain')>1)return 'Massimo una Carta Terreno per turno';
 const defenseCapacity=defenseCapacityReason(side,chosen.filter(c=>cardRole(c.id)==='defense'),b.ply);
 if(defenseCapacity)return defenseCapacity;
 const terrainCode=chosen.find(c=>c.effectSpec?.type==='terrain')?.effectSpec.code??b.terrain?.id;
 for(const c of chosen){
  const reason=effectUnavailableReason(c,side,b,{ownPartId:order?.ownPartId,terrainCode});
  if(reason)return (c.nome||c.name)+': '+reason;
 }
 if(chosen.some(effectNeedsOwnTarget)&&order?.ownPartId&&!activePart(side,order.ownPartId))
  return 'Scegli un tuo componente ancora operativo';
 const machineCount=chosen.filter(c=>c.effectSpec.type==='deployMachine').length;
 if(machineCount+(side.machines||[]).filter(unitAlive).length>2)return 'Servono alloggiamenti liberi per le macchine scelte';
 const fusions=chosen.filter(c=>c.effectSpec.type==='fusion').length;
 if(fusions){
  const preview=clone(side);normalizeSide(preview);
  for(let i=0;i<fusions;i++){const result=fuseFleetSupports(preview,b.ply);if(!result.ok)return result.reason;}
 }
 if(!order?.pass){
  const enemy=b.sides[other(who)],selected=selectedEnemyTarget(enemy,order,b.ply);
  if(!selected)return 'Seleziona un bersaglio avversario ancora operativo';
  const bypass=chosen.some(c=>c.effectSpec.type==='bypass');
  if(order.targetKind==='part'&&protectingFleetUnits(enemy,b.ply).length&&!bypass)
   return 'Prima colpisci i supporti o le macchine operative, oppure gioca Aggiramento';
 }
 return null;
}
function selectedEnemyTarget(side,order={},ply=0){
 const kind=order.targetKind||(order.escortSlot!=null?'escort':order.machineSlot!=null?'machine':'part');
 if(kind==='escort'||kind==='machine'||kind==='module'){
  const list=kind==='escort'?side.escorts:kind==='machine'?side.machines||[]:liveModules(side);
  const slot=kind==='escort'?order.escortSlot:kind==='machine'?order.machineSlot:order.moduleSlot;
  const unit=list.find(e=>order.targetId?e.id===order.targetId:e.slot===slot);
  return unitAlive(unit)?{kind,unit}:null;
 }
 if(kind!=='part')return null;
 const unit=motherPart(side.ships[0],order.targetId||order.partId);
 return unitAlive(unit)?{kind:'part',unit}:null;
}
function takeCards(side,indices){
 const selected=indices.map(i=>side.hand[i]);
 for(const i of [...indices].sort((a,z)=>z-a))side.hand.splice(i,1);
 return selected;
}
function removeSource(side,token){
 side.protections=side.protections.filter(s=>s.source!==token);
 side.reactions=side.reactions.filter(s=>s.source!==token);
}
function discardDefense(side,token){
 const entry=side.defenses.find(d=>d.source===token);
 if(entry){side.discard.push(entry.id);side.defenses=side.defenses.filter(d=>d!==entry);}
 removeSource(side,token);
 side.defenseSlots=side.defenses.map(d=>d.id).slice(-2);
}
function expireSide(side,ply){
 normalizeSide(side);
 for(const entry of [...side.defenses])if(entry.untilPly!=null&&entry.untilPly<=ply)discardDefense(side,entry.source);
 if(side.auroraVeil&&side.auroraVeil.untilPly<=ply)side.auroraVeil=null;
 side.protections=side.protections.filter(s=>s.untilPly>ply&&s.remaining>0);
 side.reactions=side.reactions.filter(s=>s.untilPly>ply);
 side.buffs=side.buffs.filter(s=>s.untilPly==null||s.untilPly>ply);
 side.charges=side.charges.filter(s=>s.atPly>=ply);
 if(side.commander?.untilPly<=ply){
  side.discard.push(side.commander.id);removeSource(side,side.commander.source);side.commander=null;
 }
 enforceDestroyedSystems(side,ply);
}
function heal(b,side,amount,target='weakest',ownPartId=null){
 if(b.terrain?.id==='T08')return null;
 const escort=target==='escort';
 const unit=escort?weakest(livingEscorts(side)):selectedOwnPart(side,target,ownPartId);
 if(!unit||unit.hp>=unit.maxHp)return null;
 const extra=escort&&b.terrain?.id==='T09'?1:0;
 const previous=unit.hp;unit.hp=Math.min(unit.maxHp,unit.hp+amount+extra);
 if(!escort)unit.damage=unit.hp<unit.maxHp?1:0;
 return {kind:escort?'escort':'mother',id:unit.id,name:escort?unit.name:VITAL_LABELS[unit.id],amount:unit.hp-previous};
}
function applyDamage(part,amount){
 if(!part||part.destroyed)return 0;
 const actual=Math.min(part.hp,Math.max(0,Math.floor(amount)));
 part.hp-=actual;part.destroyed=part.hp<=0;part.damage=part.destroyed?2:part.hp<part.maxHp?1:0;
 return actual;
}
function exchangeCards(b,side,amount){
 const count=Math.min(amount,side.hand.length);
 for(let i=0;i<count;i++)side.discard.push(side.hand.splice(roll(b,side.hand.length),1)[0]);
 const targetSize=side.hand.length+count;
 while(side.hand.length<targetSize){
  if(!side.deck.length&&side.discard.length){side.deck=shuffled(side.discard,b);side.discard=[];}
  if(!side.deck.length)break;
  side.hand.push(side.deck.shift());
 }
 return count;
}
function addWeaken(b,enemy,amount,source){
 enemy.buffs.push({kind:'jam',power:amount+(b.terrain?.id==='T03'?1:0),source});
}
function cancelTerrainWithTrap(b,who,terrainCard,ctx,events){
 const defenderWho=other(who),defender=b.sides[defenderWho];
 const trap=defender.defenses.find(d=>d.hidden&&d.trigger==='terrain'&&d.action==='cancel'&&
  (d.armedAtPly??-1)<b.ply);
 if(!trap)return false;
 const name=card(trap.id)?.nome||card(trap.id)?.name||'Trappola';
 const terrainName=card(terrainCard)?.nome||card(terrainCard)?.name||'Terreno';
 discardDefense(defender,trap.source);
 events.push(emit(b,defenderWho,'trap-reveal',name+' si rivela e annulla '+terrainName+'.',
  {cardId:trap.id,blockedCardId:terrainCard}));
 events.push(emit(b,who,'terrain-cancelled',terrainName+' non si attiva. Il Terreno attuale resta invariato.',
  {cardId:terrainCard,terrainCardId:terrainCard}));
 ctx.terrainCancelled=true;
 return true;
}
function applyEffect(b,who,def,spec,ctx,events,{source,ownPartId}={}){
 const side=b.sides[who],enemy=b.sides[other(who)];
 const s=spec,token=source||def.id+'@'+b.ply+'-'+ctx.effectSerial++;
 const at=text=>events.push(emit(b,who,'card',(def.nome||def.name||'Effetto')+' · '+text,{cardId:def.id}));
 const expiry=b.ply+2*(s.turns||1);
 switch(s.type){
  case 'bypass':ctx.bypass=true;at('Questo attacco può raggiungere direttamente la madre');break;
  case 'fusion':{
   const result=fuseFleetSupports(side,b.ply);
   if(!result.ok)throw new Error(result.reason);
   events.push(emit(b,who,'fusion',result.fused.name+' formata'+(result.deployed?'; entra '+result.deployed.name:''),
    {cardId:def.id,escortSlot:result.fused.slot,stage:result.stage,deployed:result.deployed?.id||null}));
   break;
  }
  case 'deployMachine':{
   const slot=[0,1].find(i=>!side.machines.some(m=>unitAlive(m)&&m.slot===i));
   if(slot==null)throw new Error('Alloggiamenti macchine occupati');
   side.machines=side.machines.filter(m=>m.slot!==slot);
   const machine={id:'machine:'+who+':'+token,slot,name:def.nome||def.name,sourceCardId:def.id,source:token,
    hp:s.hp,maxHp:s.hp,power:s.power||0,destroyed:false,disabledUntilPly:0};
   side.machines.push(machine);
   events.push(emit(b,who,'machine-deploy',machine.name+' schierata: protegge la madre',
    {cardId:def.id,machineSlot:slot,machineId:machine.id}));
   break;
  }
  case 'power':ctx.power+=s.amount;at('+'+s.amount+' potenza');break;
  case 'pierce':ctx.pierce+=s.amount;at('Ignora '+s.amount+' protezioni sui componenti');break;
  case 'multishot':ctx.multiTargets=Math.max(ctx.multiTargets,s.targets);at('Fino a '+s.targets+' componenti');break;
  case 'protect':case 'dodge':{
   const escort=s.target==='escort'?weakest(livingEscorts(side)):null;
   const part=s.target==='all'||escort?null:selectedOwnPart(side,s.target,ownPartId);
   if(s.target!=='all'&&!escort&&!part){at('Bersaglio non disponibile');break;}
   if(s.type==='dodge'&&!operational(side.ships[0],'generator')){at('Generatore non disponibile');break;}
   side.protections=side.protections.filter(p=>p.source!==token);
   side.protections.push({source:token,id:def.id,kind:s.type,remaining:s.amount,
    target:s.target==='all'?'all':escort?'escort':'part',partId:part?.id||null,
    escortSlot:escort?.slot??null,untilPly:expiry});
   at((s.type==='dodge'?'Schivata':'Protezione')+' pronta: '+s.amount+' colpi');break;
  }
  case 'repair':{
   const result=heal(b,side,s.amount,s.target,ownPartId);
   at(result?'Ripara '+result.name+' +'+result.amount:b.terrain?.id==='T08'?'Riparazione bloccata dal terreno':'Nessun punto da riparare');break;
  }
  case 'regenerate':case 'counter':
   side.reactions=side.reactions.filter(r=>r.source!==token);
   side.reactions.push({source:token,id:def.id,type:s.type,trigger:s.trigger||'hurt',amount:s.amount,
    untilPly:expiry,lastTriggeredPly:null});at('Reazione pronta');break;
  case 'weaken':addWeaken(b,enemy,s.amount,token);at('Prossimo attacco avversario indebolito');break;
  case 'disarm':
   if(enemy.lastDisarmedPly===b.ply-1){at('Armi avversarie protette da un secondo blocco consecutivo');break;}
   enemy.fireBlocked=true;at('Prossimo attacco avversario bloccato');break;
  case 'cleanse':
   side.buffs=side.buffs.filter(x=>x.kind!=='jam');side.fireBlocked=false;side.fireDisabledUntil=0;
   for(const e of [...side.escorts,...side.machines]){e.jammedUntilPly=0;e.disabledUntilPly=0;}
   refreshEscortLinks(side,b.ply);at('Disturbi e blocchi rimossi');break;
  case 'exchange':at('Ricambiate '+exchangeCards(b,side,s.amount)+' carte');break;
  case 'recover':{
   let index=-1;
   for(let i=side.discard.length-1;i>=0;i--)if(s.role==='any'||cardRole(side.discard[i])===s.role){index=i;break;}
   if(index>=0){const recovered=side.discard.splice(index,1)[0];side.deck.unshift(recovered);at('Recuperata '+(card(recovered)?.nome||card(recovered)?.name));}
   else at('Nessuna carta adatta negli scarti');break;
  }
  case 'charge':side.charges.push({amount:s.amount,atPly:b.ply+2,source:token});at('+'+s.amount+' potenza al prossimo turno');break;
  case 'trap':
   events.push(emit(b,who,'trap-set','Una trappola è stata preparata coperta.'));
   break;
  case 'terrain':{
   const terrainCard=TERRAIN_CATALOG[s.code]?.cardId;
   const result=activateTerrain(b.terrain,terrainCard,b.ply,who,{boss:!!b.bossId,bossOverride:true});
   if(result.ok&&!cancelTerrainWithTrap(b,who,terrainCard,ctx,events)){
    b.terrain=result.terrain;at(TERRAIN_CATALOG[s.code].description+' Vale per 3 round.');
   }
   break;
  }
  default:throw new Error('Effetto non implementato: '+s.type);
 }
}
function applyCard(b,who,id,ctx,events,order){
 const side=b.sides[who],def=card(id),role=cardRole(id);
 const spec=effectiveEffectSpec(def,side.exclusiveUpgrades?.[id]||1);
 const source=id+'@'+b.ply+'-'+ctx.effectSerial++;
 const ownPartId=order.ownPartId||weakestPart(side)?.id;
 // La selezione non consulta le trappole nascoste. Se il Terreno viene
 // annullato, le carte che il Terreno rimasto impedisce tornano in mano.
 if(ctx.terrainCancelled&&(spec.type==='dodge'&&b.terrain?.id==='T01'||
  spec.type==='repair'&&b.terrain?.id==='T08')){
  side.hand.push(id);
  events.push(emit(b,who,'card-returned',(def.nome||def.name)+' resta in mano: il Terreno attuale ne impedisce l’effetto.',
   {cardId:id}));
  return false;
 }
 if(role==='character'){
  side.commander={id,untilPly:b.ply+4,repeatAtPly:b.ply+2,repeatsRemaining:1,
   effectSpec:spec,source,ownPartId,kind:'simple',power:spec.amount||0};
 }
 if(role==='defense'){
  side.defenses.push(spec.type==='trap'?
   {id,source,hidden:true,untilPly:null,armedAtPly:b.ply,trigger:spec.trigger,action:spec.action}:
   {id,source,untilPly:b.ply+2*(spec.turns||1)});
  side.defenseSlots=side.defenses.map(d=>d.id);
 }
 applyEffect(b,who,def,spec,ctx,events,{source,ownPartId});
 return true;
}
function applyCharacterRepeat(b,who,ctx,events){
 const side=b.sides[who],c=side.commander;
 if(c&&operational(side.ships[0],characterSystem(side))&&c.repeatsRemaining>0&&c.repeatAtPly<=b.ply){
  c.repeatsRemaining--;
  applyEffect(b,who,card(c.id),c.effectSpec,ctx,events,{source:c.source,ownPartId:c.ownPartId});
 }
}
function addTemporaryGuard(side,ply,power=1){side.buffs.push({kind:'guard',power,untilPly:ply+2});}
function applyBossPassive(b,ctx,events){
 if(!b.bossId||ctx.who!=='B')return;
 const side=b.sides.B,enemy=b.sides.A,n=Number(b.bossId),mother=side.ships[0];
 const note=t=>events.push(emit(b,'B','boss',t));
 if(n===1&&side.turnCount===0){addTemporaryGuard(side,b.ply);note('Gaia: prossimo attacco avversario −1 potenza');}
 if(n===2&&side.turnCount>0&&side.lastDamage>0){ctx.power++;note('Tharsis: +1 potenza');}
 if(n===3&&side.lastDamage>0){addWeaken(b,enemy,1,'boss-3');note('Venere: prossimo attacco avversario −1 potenza');}
 if(n===6&&ctx.cards.length>=2){addTemporaryGuard(side,b.ply);note('Crono: prossimo attacco avversario −1 potenza');}
 if(n===7&&enemy.buffs.some(x=>x.kind==='jam')){ctx.power++;note('Sentinella: +1 potenza contro una flotta disturbata');}
 if(n===8&&enemy.ships[0].parts.some(p=>!p.destroyed&&p.hp<p.maxHp)){ctx.power++;note('Leviatano: +1 potenza');}
 if(n===9&&side.escorts.some(e=>e.hp>1)){const e=side.escorts.find(e=>e.hp>1);e.hp--;ctx.power++;note('Ombre: scudiera −1 punto, attacco +1 potenza');}
 if(n===11&&operational(mother,'generator')){const h=heal(b,side,1);if(h)note('Idra: ripara 1 punto a '+h.name);}
 if(n===14&&side.turnCount%3===2){ctx.power+=2;note('Caos: +2 potenza');}
 if(n===17&&enemy.discard.length>=4){ctx.power++;note('Cristallo: +1 potenza');}
 if(n===19){const phase=side.turnCount%3;if(phase===1){ctx.power+=2;note('Io: +2 potenza');}else if(phase===2){ctx.power--;note('Io: −1 potenza');}}
 if(n===20&&side.turnCount%2===1){addTemporaryGuard(side,b.ply);note('Vuoto: prossimo turno avversario −1 potenza');}
}
function escortPassive(b,side,ctx,events,order){
 refreshEscortLinks(side,b.ply);
 for(const e of side.escorts.filter(x=>x.linked)){
  const amount=Math.max(1,e.grade||1);
  for(const s of e.fusionSkills||[e.skill]){
   if((side.turnCount+1)%Math.max(1,s.interval)!==0)continue;
   const note=text=>events.push(emit(b,ctx.who,'escort',e.name+' · '+text));
   const part=resolvedPartId(b.sides[other(ctx.who)].ships[0],order.partId||order.targetId);
   if(['ion','strike','corrode'].includes(s.action)){ctx.power+=amount;note('+'+amount+' potenza');}
   else if(['focus','siege'].includes(s.action)&&s.targetPart===part){ctx.power+=amount;note('+'+amount+' potenza sul componente scelto');}
   else if(s.action==='revenge'&&livingEscorts(side).some(x=>x.hp<x.maxHp)){ctx.power+=amount;note('+'+amount+' potenza');}
   else if(s.action==='surge'&&side.ships[0].parts.some(p=>!p.destroyed&&p.hp<p.maxHp)){ctx.power+=amount;note('+'+amount+' potenza');}
   else if(s.action==='precision'||s.action==='pierce'&&s.targetPart===part){ctx.pierce+=amount;note('Ignora '+amount+' protezioni');}
   else if(['repair','mend'].includes(s.action)){const h=heal(b,side,amount,s.action==='mend'?'escort':'weakest');if(h)note('Ripara '+h.name+' +'+h.amount);}
   else if(s.action==='draw')note('Ricambia '+exchangeCards(b,side,amount)+' carte');
   else if(s.action==='jam'){addWeaken(b,b.sides[other(ctx.who)],amount,e.id);note('Prossimo attacco avversario −'+amount+' potenza');}
   else if(s.action==='guard'){addTemporaryGuard(side,b.ply,amount);note('Prossimo turno avversario −'+amount+' potenza');}
  }
 }
 for(const machine of (side.machines||[]).filter(e=>unitEnabled(e,b.ply))){
  if(machine.power){ctx.power+=machine.power;events.push(emit(b,ctx.who,'machine',machine.name+' · +'+machine.power+' potenza',
   {machineId:machine.id,machineSlot:machine.slot}));}
 }
}
function blockHit(b,defender,targetKind,target,ctx,events){
 for(const p of [...defender.protections]){
  if(p.untilPly<=b.ply||p.remaining<=0)continue;
  const matches=targetKind==='escort'?p.target==='escort'&&p.escortSlot===target.slot:
   targetKind==='machine'?p.target==='machine'&&p.machineSlot===target.slot:
   p.target==='all'||p.target==='part'&&p.partId===target.id;
  if(!matches)continue;
  if(p.kind==='dodge'&&(!activePart(defender,'generator')||b.terrain?.id==='T01'))continue;
  p.remaining--;
  const bypass=targetKind==='part'&&ctx.pierceLeft>0;
  if(bypass)ctx.pierceLeft--;
  events.push(emit(b,ctx.who,bypass?'pierce':'block',bypass?'Il colpo ignora una protezione':'La protezione blocca il colpo',
   {cardId:p.id,partId:targetKind==='part'?target.id:null,escortSlot:targetKind==='escort'?target.slot:null}));
  if(p.remaining<=0)discardDefense(defender,p.source);
  if(!bypass)return true;
 }
 return false;
}
function damageFleetUnit(side,kind,unit,amount,ply){
 const damage=applyDamage(unit,amount);
 if(kind==='machine'&&unit.destroyed&&!unit.cardDiscarded){
  if(unit.sourceCardId)side.discard.push(unit.sourceCardId);
  unit.cardDiscarded=true;
 }
 enforceDestroyedSystems(side,ply);return damage;
}
function triggerReactions(b,attackerWho,damage,events){
 if(damage<=0)return;
 const attacker=b.sides[attackerWho],defender=b.sides[other(attackerWho)];
 for(const [side,who,trigger] of [[attacker,attackerWho,'hit'],[defender,other(attackerWho),'hurt']]){
  for(const reaction of [...side.reactions]){
   // Un effetto precedente può aver distrutto il sistema o consumato la
   // carta che alimentava questa reazione: una copia dell'elenco non la riattiva.
   if(!side.reactions.includes(reaction)||reaction.untilPly<=b.ply||reaction.trigger!==trigger||reaction.lastTriggeredPly===b.ply)continue;
   reaction.lastTriggeredPly=b.ply;
   if(reaction.type==='regenerate'){
    const h=heal(b,side,reaction.amount);
    if(h)events.push(emit(b,who,'repair','Rigenerazione: '+h.name+' +'+h.amount,{cardId:reaction.id}));
   }else if(reaction.type==='counter'){
    const guard=protectingFleetUnits(attacker,b.ply)[0];
    const target=guard?.unit||activePart(attacker,'weapons'),kind=guard?.kind||'part';
    const blocked=target&&blockHit(b,attacker,kind,target,{who,pierceLeft:0},events);
    const actual=!target||blocked?0:damageFleetUnit(attacker,kind,target,reaction.amount,b.ply);
    if(actual)events.push(emit(b,who,'counter','Contrattacco: '+(guard?.name||'Arsenale avversario')+' −'+actual,
     {cardId:reaction.id,partId:kind==='part'?target.id:null,escortSlot:kind==='escort'?target.slot:null,
      machineSlot:kind==='machine'?target.slot:null,targetKind:kind,damage:actual,destroyed:target.destroyed,noRecursion:true}));
   }
  }
 }
 if(b.terrain?.id==='T07'&&attacker.terrainHitPly!==b.ply){
  attacker.terrainHitPly=b.ply;
  const h=heal(b,attacker,1);
  if(h)events.push(emit(b,attackerWho,'repair','Foresta Ionizzata: '+h.name+' +'+h.amount));
 }
}
function resolveSalvo(b,ctx,events,order){
 const side=b.sides[ctx.who],defender=b.sides[other(ctx.who)],mother=side.ships[0],enemy=defender.ships[0];
 let selected=selectedEnemyTarget(defender,order,b.ply);
 if(!selected){events.push(emit(b,ctx.who,'no-shot','Bersaglio non valido'));return {damage:0};}
 if(side.fireBlocked||side.fireDisabledUntil>b.ply){
  side.fireBlocked=false;side.fireDisabledUntil=0;
  if(side.lastDisarmedPly!==b.ply-2){
   side.lastDisarmedPly=b.ply;events.push(emit(b,ctx.who,'no-shot','Questo attacco è bloccato'));return {damage:0,blocked:true};
  }
  events.push(emit(b,ctx.who,'card','Le Armi non possono essere bloccate per due turni consecutivi'));
 }
 const jam=side.buffs.filter(x=>x.kind==='jam').reduce((sum,x)=>sum+(x.power||0),0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 const guardPower=defender.buffs.filter(x=>x.kind==='guard'&&(x.untilPly==null||x.untilPly>b.ply)).reduce((sum,x)=>sum+(x.power||0),0);
 const terrain=terrainSalvoModifier(b.terrain,mother.id),emergency=!operational(mother,'weapons');
 // La corazza riduce la potenza, ma non rende una nave invulnerabile.
 // Il tiro di emergenza conserva almeno 1 potenza prima degli effetti temporanei.
 const basePower=Math.max(1,(emergency?1:mother.attackPower??1+mother.weaponRating)-(enemy.defensePower||0));
 const power=Math.max(0,basePower+ctx.power+terrain.value-jam-guardPower);
 if(power===0){events.push(emit(b,ctx.who,'block','Potenza zero: l’attacco fallisce'));return {damage:0,partId:order.partId,played:visiblePlayed(ctx.cards),power};}
 if(emergency)events.push(emit(b,ctx.who,'emergency-shot','Tiro di emergenza: l’Arsenale è distrutto'));
 const guards=protectingFleetUnits(defender,b.ply);
 if(selected.kind==='part'&&guards.length&&!ctx.bypass)selected={kind:guards[0].kind,unit:guards[0].unit};
 // Aggiramento abilita un solo componente dietro le unità: multicolpo non
 // moltiplica un'eccezione di accesso in un attacco all'intera madre.
 const count=guards.length&&selected.kind==='part'&&ctx.bypass?1:
  Math.min(4,(emergency?1:ctx.multiTargets)+(b.terrain?.id==='T10'?1:0));
 const targets=selected.kind==='part'?
  [selected,...enemy.parts.filter(p=>unitAlive(p)&&p!==selected.unit).slice(0,count-1).map(unit=>({kind:'part',unit}))]:
  [selected,...guards.filter(g=>g.unit!==selected.unit).slice(0,count-1).map(g=>({kind:g.kind,unit:g.unit}))];
 ctx.pierceLeft=b.terrain?.id==='T06'?0:ctx.pierce;
 const hits=[];
 for(const {kind,unit} of targets){
  if(!unitAlive(unit)||blockHit(b,defender,kind,unit,ctx,events))continue;
  const amount=kind==='part'?1:power+(kind==='escort'&&b.terrain?.id==='T04'?1:0);
  const damage=damageFleetUnit(defender,kind,unit,amount,b.ply);
  if(damage)hits.push({id:unit.id,kind,slot:unit.slot,damage,destroyed:unit.destroyed,name:kind==='part'?VITAL_LABELS[unit.id]:unit.name});
 }
 const damage=hits.filter(h=>h.kind==='part').reduce((sum,h)=>sum+h.damage,0);
 const escortDamage=hits.filter(h=>h.kind==='escort').reduce((sum,h)=>sum+h.damage,0);
 const machineDamage=hits.filter(h=>h.kind==='machine').reduce((sum,h)=>sum+h.damage,0);
 const main=selected.unit,targetKind=selected.kind;
 const data={shipIndex:0,shipName:enemy.name,partId:targetKind==='part'?main.id:order.partId||null,
  targetKind,targetId:main.id,damage,escortDamage,machineDamage,destroyed:main.destroyed,
  escortSlot:targetKind==='escort'?main.slot:null,machineSlot:targetKind==='machine'?main.slot:null,
  escortName:targetKind==='escort'?main.name:null,escortDestroyed:targetKind==='escort'&&main.destroyed,
  played:visiblePlayed(ctx.cards),targets:hits,terrainBonus:terrain.value,power,emergency};
 events.push(emit(b,ctx.who,'impact',hits.length?'Attacco: '+hits.map(h=>h.name+' −'+h.damage).join(', '):'Tutti i colpi sono stati bloccati',data));
 triggerReactions(b,ctx.who,damage+escortDamage+machineDamage,events);
 return data;
}
function finishTurn(b,ctx,events){
 const side=b.sides[ctx.who];side.turnCount++;refill(b,side);
 side.lastPlayed=visiblePlayed(ctx.cards);b.ply++;b.round=1+Math.floor(b.ply/2);b.turn=other(ctx.who);
 b.terrain=activeTerrain(b.terrain,b.ply);
 for(const s of Object.values(b.sides))expireSide(s,b.ply);
 const deadA=allVitalsDestroyed(b.sides.A.ships[0]),deadB=allVitalsDestroyed(b.sides.B.ships[0]);
 if(deadA||deadB){b.phase='finished';b.winner=deadA&&deadB?'draw':deadA?'B':'A';
  b.finishReason=deadA&&deadB?'Entrambe le navi hanno perso tutti i componenti.':'Una nave ha perso tutti i suoi componenti.';}
 else if(b.ply>=2*FLEET_MAX_ROUNDS){
  b.phase='finished';b.winner='draw';b.finishReason='Pareggio: raggiunto il limite di '+MAX_FLEET_ROUNDS+' round.';
  events.push(emit(b,'system','finish','Pareggio dopo '+FLEET_MAX_ROUNDS+' round'));
 }
 if(b.phase==='finished'){
  b.finishedAtMs=ctx.nowMs;events.push(emit(b,'system','finish','Partita terminata: '+b.winner));
 }
 b.deadlineMs=ctx.nowMs+FLEET_TURN_SECONDS*1000;b.lastEvents=events;
}
export function resolveFleetNextTurn(battle,who,order={},nowMs=0){
 const error=validateFleetTurn(battle,who,order);
 if(error)return {ok:false,reason:error,battle,events:[]};
 const b=clone(battle),events=[],side=b.sides[who];
 b.terrain=activeTerrain(b.terrain,b.ply);
 for(const s of Object.values(b.sides))expireSide(s,b.ply);
 const cards=takeCards(side,order.cards||[]);
 const ctx={who,nowMs,cards:[],power:0,pierce:0,bypass:false,multiTargets:1,pierceLeft:0,effectSerial:0};
 for(const charge of side.charges.filter(c=>c.atPly===b.ply))ctx.power+=charge.amount;
 side.charges=side.charges.filter(c=>c.atPly>b.ply);
 // Il terreno scelto entra prima delle altre carte e degli effetti del turno.
 for(const id of cards.filter(id=>cardRole(id)==='terrain'))
  if(applyCard(b,who,id,ctx,events,order))ctx.cards.push(id);
 applyCharacterRepeat(b,who,ctx,events);
 for(const id of cards.filter(id=>cardRole(id)!=='terrain'))
  if(applyCard(b,who,id,ctx,events,order))ctx.cards.push(id);
 applyBossPassive(b,ctx,events);escortPassive(b,side,ctx,events,order);
 side.stagedComboCards=[];side.attackSlots=ctx.cards.filter(id=>cardRole(id)==='attack').slice(0,3);
 const shot=order.pass?{damage:0,played:visiblePlayed(ctx.cards)}:resolveSalvo(b,ctx,events,order);
 side.lastDamage=(shot.damage||0)+(shot.escortDamage||0)+(shot.machineDamage||0);
 side.discard.push(...ctx.cards.filter(id=>!['character','defense'].includes(cardRole(id))&&card(id)?.effectSpec?.type!=='deployMachine'));
 finishTurn(b,ctx,events);
 return {ok:true,battle:b,events,shot};
}
export function autoFleetTurn(b,who=b.turn){
 const side=b.sides[who],enemy=b.sides[other(who)],ownPartId=weakestPart(side)?.id;
 const part=enemy.ships[0].parts.filter(unitAlive).sort((a,z)=>a.hp-z.hp)[0];
 const guard=protectingFleetUnits(enemy,b.ply).sort((a,z)=>a.hp-z.hp)[0];
 const defaultOrder=guard?{targetKind:guard.kind,targetId:guard.id,partId:part?.id,
  ...(guard.kind==='escort'?{escortSlot:guard.slot}:{machineSlot:guard.slot})}:
  {targetKind:'part',targetId:part?.id,partId:part?.id};
 const candidates=side.hand.map((id,i)=>({id,i,role:cardRole(id),def:card(id)}))
  .filter(x=>!effectUnavailableReason(x.def,side,b,{ownPartId}));
 const score=x=>x.def.effectSpec.type==='fusion'?10:x.def.effectSpec.type==='deployMachine'?8:
  x.def.effectSpec.type==='bypass'&&guard?7:x.def.effectSpec.type==='repair'?6:
  x.role==='attack'?5:x.role==='character'?4:x.role==='defense'?3:x.role==='terrain'?1:2;
 candidates.sort((a,z)=>score(z)-score(a)||a.i-z.i);
 const cards=[];
 for(const c of candidates){
  if(cards.length>=FLEET_MAX_PLAYED)break;
  if(validateFleetTurn(b,who,{...defaultOrder,ownPartId,cards:[...cards,c.i],pass:!part}))continue;
  cards.push(c.i);
 }
 const bypass=cards.some(i=>card(side.hand[i]).effectSpec.type==='bypass');
 const target=bypass&&part?{targetKind:'part',targetId:part.id,partId:part.id}:defaultOrder;
 return {...target,ownPartId,cards,pass:!part};
}
export function timeoutFleetTurn(battle,nowMs){
 if(battle.phase!=='playing'||nowMs<battle.deadlineMs)return {ok:false,battle,events:[]};
 return resolveFleetNextTurn(battle,battle.turn,{partId:null,cards:[],pass:true},nowMs);
}
