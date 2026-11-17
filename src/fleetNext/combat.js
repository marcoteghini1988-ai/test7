// Eclissi Stellare — progressione strutturale e combattimento delle flotte.
// Nessuna animazione o audio qui: gli eventi sono emessi per il renderer ufficiale.
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {buildFleetEscorts} from '../fleetEscortSupports.js';
import {ESCORT_ARMORY} from '../escortArmory.js';
import {getShipProgression} from './progression.js';
import {AURORA_ACTIONS,isAuroraModule,installedModule,liveModules,mountModule,removeModule,reconfigurationOptions,auroraPrecondition} from './auroraEngine.js';
import {LINCE_ATTACK_ACTIONS,LINCE_BYPASS_ACTIONS,isLinceModule,
 ensureLinceState,linceMarkedRouteReady,lincePrecondition,recallLinceModule,
 recallLinceMachine,recoveredMachineForDeploy} from './linceEngine.js';
import {PRISMA_ACTIONS,PRISMA_ATTACK_ACTIONS,isPrismaModule,ensurePrismaState,
 livePrismaUnits,prismaPrecondition} from './prismaEngine.js';
import {CORVO_ATTACK_ACTIONS,isCorvoModule,ensureCorvoState,corvoPrecondition,
 corvoModuleActive,canApplyCorvoStatus,unitSilenced} from './corvoEngine.js';
import {FALCO_ACTIONS,FALCO_ATTACK_ACTIONS,FALCO_PREP_ACTIONS,isFalcoModule,isFalcoPreparation,
 ensureFalcoState,falcoPrecondition,falcoUnits,falcoEscortReady,
 falcoCapacitorActive} from './falcoEngine.js';
import {MANTA_ATTACK_ACTIONS,isMantaModule,ensureMantaState,mantaPrecondition,
 mantaActiveSupports,mantaEnemyUnits,mantaVisibleProtections,mantaCapacitorActive,
 mantaForkActive,mantaEnergy,gainMantaEnergy,spendMantaEnergy} from './mantaEngine.js';
import {SHARK_ATTACK_ACTIONS,isSharkModule,ensureSharkState,sharkPrecondition,
 sharkChoiceReason,sharkUnits,sharkOperationalUnits,sharkActiveSupports,
 sharkWoundedSupports,sharkWoundedMachines,sharkModuleActive} from './sharkEngine.js';
import {NEBULA_ATTACK_ACTIONS,isNebulaModule,ensureNebulaState,nebulaPrecondition,
 nebulaChoiceReason,nebulaSupports,nebulaVisibleSupports,nebulaTargets,
 nebulaHidden,nebulaHiddenSupport,nebulaProtectionForbidden,
 nebulaModuleActive,nebulaHideReason} from './nebulaEngine.js';
import {STORM_ATTACK_ACTIONS,isStormModule,ensureStormState,stormPrecondition,
 stormChoiceReason,stormModuleActive,stormUnits,stormSupports} from './stormEngine.js';
import {ROYAL_ATTACK_ACTIONS,isRoyalModule,ensureRoyalState,royalPrecondition,
 royalChoiceReason,royalSupports,royalUnits,royalVisibleProtections,
 royalCapableModule,royalPart} from './royalEngine.js';
import {
 card,cardRole,shipConfig,
 effectiveDeck,exclusiveOperational,
 FLEET_HAND_SIZE,
 FLEET_MAX_PLAYED,FLEET_TURN_SECONDS,VITAL_KEYS,VITAL_LABELS
} from './rules.js';
import {effectiveEffectSpec,validateEffectSpec,effectNeedsOwnTarget,isCharacterCard,isTrapCard} from './simpleEffects.js';
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
const escortEnabled=(side,escort,ply)=>unitEnabled(escort,ply)&&!nebulaHidden(escort,ply)&&
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
  moduleSerial:0,lastModuleMountPly:-1,auroraVeil:null,lince:null,prisma:null,corvo:null,falco:null,manta:null,shark:null,nebula:null,storm:null,royal:null,recalledModules:[],recalledMachines:[],
  fusionsUsed:0,fusionLimit:progression.fusionLimit,
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
const visiblePlayed=ids=>ids.filter(id=>!isTrapCard(card(id)));
const defenseKind=def=>isTrapCard(def)?'trap':'defense';
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
 side.auroraVeil??=null;ensureLinceState(side);ensurePrismaState(side);ensureCorvoState(side);ensureFalcoState(side);ensureMantaState(side);ensureSharkState(side);ensureNebulaState(side);ensureStormState(side);ensureRoyalState(side);
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
 if(def.effectSpec.type==='lince'){
  const reason=lincePrecondition(def,side,battle);
  if(reason)return reason;
 }
 if(def.effectSpec.type==='prisma'){
  const reason=prismaPrecondition(def,side,battle);
  if(reason)return reason;
 }
 if(def.effectSpec.type==='corvo'){
  const reason=corvoPrecondition(def,side,battle);
  if(reason)return reason;
 }
 if(def.effectSpec.type==='falco'){
  const reason=falcoPrecondition(def,side,battle);
  if(reason)return reason;
 }
 if(def.effectSpec.type==='manta'){
  const reason=mantaPrecondition(def,side,battle);
  if(reason)return reason;
 }
 if(def.effectSpec.type==='shark'){
  const reason=sharkPrecondition(def,side,battle);
  if(reason)return reason;
 }
 if(def.effectSpec.type==='nebula'){
  const reason=nebulaPrecondition(def,side,battle);
  if(reason)return reason;
 }
 if(def.effectSpec.type==='storm'){
  const reason=stormPrecondition(def,side,battle);
  if(reason)return reason;
 }
 if(def.effectSpec.type==='royal'){
  const reason=royalPrecondition(def,side,battle);
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
 if(['protect','dodge'].includes(s.type)&&s.target==='escort'&&
  !livingEscorts(side).some(e=>!nebulaProtectionForbidden(e,battle?.ply??0)))
  return 'Nebbia polare: nessun supporto puo ricevere nuove protezioni';
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
 const linceCommands=chosen.filter(c=>c.effectSpec?.type==='lince'&&
  LINCE_ATTACK_ACTIONS.includes(c.effectSpec.action));
 if(linceCommands.length>1)return 'Scegli un solo comando offensivo Lince per turno';
 const prismaCommands=chosen.filter(c=>c.effectSpec?.type==='prisma'&&
  PRISMA_ATTACK_ACTIONS.includes(c.effectSpec.action));
 if(prismaCommands.length>1)return 'Scegli un solo comando offensivo Vespa per turno';
 const corvoCommands=chosen.filter(c=>c.effectSpec?.type==='corvo'&&
  CORVO_ATTACK_ACTIONS.includes(c.effectSpec.action));
 if(corvoCommands.length>1)return 'Scegli un solo comando offensivo Corvo per turno';
 const mantaCommands=chosen.filter(c=>c.effectSpec?.type==='manta'&&
  MANTA_ATTACK_ACTIONS.includes(c.effectSpec.action));
 if(mantaCommands.length>1)return 'Scegli un solo comando offensivo Manta per turno';
 const sharkCommands=chosen.filter(c=>c.effectSpec?.type==='shark'&&
  SHARK_ATTACK_ACTIONS.includes(c.effectSpec.action));
 if(sharkCommands.length>1)return 'Scegli un solo attacco dello Squalo per turno';
 const sharkChoice=sharkChoiceReason(side,b.sides[other(who)],chosen,order,b.ply);
 if(sharkChoice)return sharkChoice;
 const nebulaCommands=chosen.filter(c=>c.effectSpec?.type==='nebula'&&
  NEBULA_ATTACK_ACTIONS.includes(c.effectSpec.action));
 if(nebulaCommands.length>1)return 'Scegli un solo attacco Nebulosa per turno';
 const nebulaChoice=nebulaChoiceReason(side,b.sides[other(who)],chosen,order,b.ply);
 if(nebulaChoice)return nebulaChoice;
 const stormCommands=chosen.filter(c=>c.effectSpec?.type==='storm'&&
  STORM_ATTACK_ACTIONS.includes(c.effectSpec.action));
 if(stormCommands.length>1)return 'Tempesta: un solo comando offensivo per turno';
 const stormReason=stormChoiceReason(side,b.sides[other(who)],chosen,order,b.ply);
 if(stormReason)return stormReason;
 const royalCommands=chosen.filter(c=>c.effectSpec?.type==='royal'&&
  ROYAL_ATTACK_ACTIONS.includes(c.effectSpec.action));
 if(royalCommands.length>1)return 'Eclisse Reale: un solo comando offensivo per turno';
 const royalReason=royalChoiceReason(side,b.sides[other(who)],chosen,order,b.ply);
 if(royalReason)return royalReason;
 if(chosen.some(c=>c.effectSpec?.type==='royal'&&c.effectSpec.action==='crown-fusion')&&
  (chosen.some(c=>c.effectSpec?.type==='fusion')||
   chosen.some(c=>c.effectSpec?.type==='royal'&&
    c.effectSpec.action!=='crown-fusion'&&
    ['royal-rain','coordinated-judgment','cross-order','royal-bastion',
     'protective-crown','eclipse-sovereign'].includes(c.effectSpec.action))))
  return 'Fusione della Corona non si combina con altri comandi che richiedono i materiali';
 if(chosen.some(c=>c.id==='nx-r02-03')){
  const eligible=mantaActiveSupports(side,b.ply);
  const target=eligible.find(e=>e.id===order.mantaScreenEscortId)||eligible[0];
  if(target&&nebulaProtectionForbidden(target,b.ply))
   return 'Nebbia polare impedisce lo Schermo sul supporto scelto';
 }
 if(chosen.some(c=>c.id==='nx-c02-08')){
  const first=side.escorts.find(e=>e.slot===0&&escortEnabled(side,e,b.ply));
  if(first&&nebulaProtectionForbidden(first,b.ply))
   return 'Nebbia polare impedisce la Custodia sul primo supporto';
 }
 if(mantaCommands.some(c=>c.effectSpec.action==='arc-discharge')&&order?.mantaSilence&&
  (!mantaCapacitorActive(side,b.ply)||mantaEnergy(side)<1))
  return 'Arco di scarica: serve una energia per il Silenzio';
 if(order?.mantaFork){
  const enemy=b.sides[other(who)];
  if(!mantaForkActive(side,b.ply)||!mantaCapacitorActive(side,b.ply)||mantaEnergy(side)<1||
   ensureMantaState(side).lastForkPly===b.ply)
   return 'Forcella ionica richiede i due moduli operativi, una energia e un uso disponibile';
  if(order.pass||mantaCommands.length||chosen.some(c=>c.effectSpec?.type==='multishot')||
   b.terrain?.id==='T10')return 'Forcella converte soltanto un attacco normale singolo';
  const primary=selectedEnemyTarget(enemy,order,b.ply),units=mantaEnemyUnits(enemy);
  if(!primary||!['escort','machine'].includes(primary.kind)||
   !units.some(t=>t.unit.id===primary.unit.id&&t.kind===primary.kind)||
   !units.some(t=>t.unit.id!==primary.unit.id))
   return 'Forcella: scegli due unità nemiche diverse';
  if(order.mantaSecondTargetId&&!units.some(t=>t.kind===order.mantaSecondTargetKind&&
   t.unit.id===order.mantaSecondTargetId&&t.unit.id!==primary.unit.id))
   return 'Forcella: secondo bersaglio non valido';
 }
 const enemyFalco=b.sides[other(who)];
 const falcoCards=chosen.filter(c=>c.effectSpec?.type==='falco');
 const preparing=falcoCards.filter(c=>FALCO_PREP_ACTIONS.includes(c.effectSpec.action));
 if(preparing.length>1)return 'Falco: puoi preparare un solo attacco per turno';
 const pendingFalco=side.falco?.pending;
 const falcoDue=pendingFalco&&pendingFalco.releasePly<=b.ply;
 const loader=falcoCards.some(c=>c.effectSpec.action==='emergency-loader');
 const holding=!!(falcoDue&&order?.falcoHold&&!loader);
 if(holding&&(!falcoCapacitorActive(side,b.ply)||pendingFalco.held))
  return 'Il rinvio Falco richiede Capacitore operativo e non può ripetersi';
 if(falcoDue&&!holding&&!loader&&indices.length>FLEET_MAX_PLAYED-1)
  return 'Il rilascio Falco occupa una delle tre giocate: scegli al massimo due carte';
 if(preparing.length&&pendingFalco&&(!falcoDue||holding)&&!loader)
  return 'Devi rilasciare o annullare il colpo precedente prima di prepararne un altro';
 for(const action of ['ballistic-correction','emergency-loader']){
  if(falcoCards.some(c=>c.effectSpec.action===action)&&!pendingFalco&&!preparing.length)
   return 'Falco: nessun colpo preparato da modificare';
 }
 if(falcoCards.some(c=>c.effectSpec.action==='ballistic-correction')&&falcoDue&&!holding&&!loader&&
  !preparing.length)return 'Correzione balistica richiede un colpo rinviato o appena preparato';
 if(falcoCards.some(c=>c.effectSpec.action==='armored-chamber')&&
  ((!pendingFalco&&!preparing.length)||falcoDue&&!holding&&!preparing.length&&!loader))
  return 'Camera blindata richiede un colpo conservato o appena preparato';
 if(loader&&!pendingFalco)return 'Caricatore richiede un colpo già preparato';
 if(falcoCards.some(c=>c.effectSpec.action==='ballistic-correction')){
  const primaryId=pendingFalco?.shots?.[0]?.id||order?.falcoTargetId||
   falcoUnits(enemyFalco)[0]?.unit.id;
  if(falcoUnits(enemyFalco).filter(t=>t.unit.id!==primaryId).length===0)
   return 'Correzione balistica richiede un’altra unità ancora viva';
 }
 if((preparing.length||falcoCards.some(c=>c.effectSpec.action==='calibration-shot'))&&order?.pass)
  return 'Un attacco Falco non può essere passato';
 if(preparing.length){
  const units=falcoUnits(enemyFalco),primary=units.find(t=>
   t.kind===order.falcoTargetKind&&t.unit.id===order.falcoTargetId)||
   units.find(t=>t.kind===order.targetKind&&t.unit.id===order.targetId)||units[0];
  if(!primary)return 'Falco: nessuna unità nemica da mirare';
  if(preparing[0].effectSpec.action==='falcon-triangulation'&&
   !units.some(t=>t.unit.id!==primary.unit.id))
   return 'Triangolazione richiede due bersagli distinti';
  if(order.falcoTargetId&&primary.unit.id!==order.falcoTargetId)
   return 'Falco: bersaglio primario non valido';
  if(order.falcoSecondTargetId&&!units.some(t=>t.unit.id===order.falcoSecondTargetId&&
   t.kind===order.falcoSecondTargetKind&&t.unit.id!==primary.unit.id))
   return 'Falco: secondo bersaglio non valido';
 }
 if(falcoCards.some(c=>c.effectSpec.action==='ballistic-correction')&&
  order.falcoCorrectionTargetId&&
  !falcoUnits(enemyFalco).some(t=>t.kind===order.falcoCorrectionKind&&
   t.unit.id===order.falcoCorrectionTargetId))
  return 'Correzione balistica: nuova unità non valida';
 const roles=chosen.map(c=>cardRole(c.id)),count=x=>roles.filter(r=>r===x).length;
 if(count('character')>1)return 'Massimo un Personaggio per turno';
 if(count('defense')>2)return 'Massimo due carte Difesa per turno';
 if(count('terrain')>1)return 'Massimo una Carta Terreno per turno';
 const defenseCapacity=defenseCapacityReason(side,chosen.filter(c=>cardRole(c.id)==='defense'),b.ply);
 if(defenseCapacity)return defenseCapacity;
 const terrainCode=chosen.find(c=>c.effectSpec?.type==='terrain')?.effectSpec.code??b.terrain?.id;
 // Le esclusiva scelta per Adattamento deve restare in mano dopo le giocate.
 if(chosen.some(c=>c.effectSpec.type==='aurora'&&c.effectSpec.action==='adapt')&&
  !side.hand.some((id,i)=>!indices.includes(i)&&card(id)?.shipId==='N00'))
  return 'Adattamento richiede un’altra esclusiva non giocata nello stesso turno';
 for(const c of chosen){
  const reason=effectUnavailableReason(c,side,b,{ownPartId:order?.ownPartId,terrainCode});
  if(reason)return (c.nome||c.name)+': '+reason;
 }
 if(chosen.some(effectNeedsOwnTarget)&&order?.ownPartId&&!activePart(side,order.ownPartId))
  return 'Scegli un tuo componente ancora operativo';
 if(chosen.some(c=>c.effectSpec?.type==='corvo'&&c.effectSpec.action==='frequency-analysis')&&
  side.hand.length<=indices.length)return 'Analisi di frequenza richiede una carta non giocata da scartare';
 const machineCount=chosen.filter(c=>c.effectSpec.type==='deployMachine').length;
 if(machineCount+(side.machines||[]).filter(unitAlive).length>2)return 'Servono alloggiamenti liberi per le macchine scelte';
 const fusions=chosen.filter(c=>c.effectSpec.type==='fusion').length;
 const linceTrap=chosen.find(c=>c.effectSpec.type==='lince'&&c.effectSpec.action==='false-trail');
 if(linceTrap&&order.ownPartId&&!activePart(side,order.ownPartId))
  return 'Falsa scia: scegli un tuo vitale operativo';
 const routeCard=chosen.find(c=>c.effectSpec.type==='lince'&&c.effectSpec.action==='marked-route');
 if(routeCard){
  const dest=order.routePartId||order.partId||order.targetId;
  if(!activePart(b.sides[other(who)],dest))
   return 'Rotta marcata richiede un vitale avversario vivo';
 }
 if(fusions){
  const preview=clone(side);normalizeSide(preview);
  for(let i=0;i<fusions;i++){const result=fuseFleetSupports(preview,b.ply);if(!result.ok)return result.reason;}
 }
 if(!order?.pass){
  const enemy=b.sides[other(who)],selected=selectedEnemyTarget(enemy,order,b.ply);
  if(!selected)return 'Seleziona un bersaglio avversario ancora operativo';
  const bypass=chosen.some(c=>c.effectSpec.type==='bypass'||c.effectSpec.type==='lince'&&
   LINCE_BYPASS_ACTIONS.includes(c.effectSpec.action)||
   c.effectSpec.type==='shark'&&c.effectSpec.action==='ruthless-response')||
   selected.kind==='part'&&linceMarkedRouteReady(side,b.ply,selected.unit.id);
  if(['part','module'].includes(selected.kind)&&protectingFleetUnits(enemy,b.ply).length&&!bypass&&
   !preparing.length&&(order.targetKind!=null||order.targetId!=null))
   return 'Prima colpisci i supporti o le macchine operative, oppure gioca Aggiramento';
  if(falcoCards.some(c=>c.effectSpec.action==='calibration-shot')&&
   !['escort','machine'].includes(selected.kind))return 'Taratura richiede una unità avversaria';
  if(chosen.some(c=>c.effectSpec.type==='aurora'&&c.effectSpec.action==='burst')&&!['escort','machine'].includes(selected.kind))
   return 'Raffica di prova richiede una macchina o un supporto';
  const prismaAttack=prismaCommands[0]?.effectSpec.action;
  if(prismaAttack&&!['escort','machine'].includes(selected.kind))
   return 'Attacco Vespa: scegli una macchina o una navicella di supporto';
  if(prismaAttack==='broken-geometry'){
   const possible=livePrismaUnits(enemy,b.ply,false).filter(e=>e.unit.id!==selected.unit.id);
   if(!possible.length)return 'Geometria spezzata richiede una seconda unità viva';
   if(order.prismaSecondTargetId&&
    !possible.some(e=>e.unit.id===order.prismaSecondTargetId&&e.kind===order.prismaSecondTargetKind))
    return 'Secondo bersaglio di Geometria non valido';
  }
  const corvoAction=corvoCommands[0]?.effectSpec.action;
  if(corvoAction&&!['escort','machine'].includes(selected.kind))
   return 'Comando Corvo: scegli una unità avversaria';
  if(corvoAction==='targeted-short'&&selected.kind!=='machine')
   return 'Cortocircuito mirato colpisce soltanto una macchina';
  const mantaAction=mantaCommands[0]?.effectSpec.action;
  if(mantaAction&&!['escort','machine'].includes(selected.kind))
   return 'Attacco Manta: scegli una unità avversaria';
  if(mantaAction==='total-discharge'&&selected.kind!=='machine')
   return 'Scarica totale colpisce soltanto una macchina';
  const sharkAction=sharkCommands[0]?.effectSpec.action;
  if(sharkAction==='ruthless-response'&&selected.kind!=='part')
   return 'Risposta spietata colpisce esclusivamente un vitale nemico';
  if(sharkAction&&sharkAction!=='ruthless-response'&&
   !['escort','machine'].includes(selected.kind))
   return 'Attacco Squalo: scegli un supporto o una macchina nemici';
  if(nebulaCommands.length&&!['escort','machine'].includes(selected.kind))
   return 'Attacco Nebulosa: scegli un supporto o una macchina nemici';
  if(stormCommands.length&&!['escort','machine'].includes(selected.kind))
   return 'Attacco Tempesta: scegli una macchina o un supporto nemico';
  if(royalCommands.length&&!['escort','machine'].includes(selected.kind))
   return 'Comando Eclisse Reale: scegli una unità avversaria';
  const linceAction=linceCommands[0]?.effectSpec.action;
  if(['solar-bypass','crimson-raid'].includes(linceAction)&&selected.kind!=='part')
   return 'Lince: questo Attacco richiede un vitale avversario';
  if(['tail-claw','armed-disengage'].includes(linceAction)&&!['escort','machine'].includes(selected.kind))
   return 'Lince: questo Attacco richiede un supporto o una macchina';
  if(order.secondaryTargetId){
   const secondary=selectedEnemyTarget(enemy,{targetKind:order.secondaryTargetKind,targetId:order.secondaryTargetId},b.ply);
   if(!secondary||secondary.unit.id===selected.unit.id)return 'Secondo bersaglio assente o identico al primo';
   if(['part','module'].includes(secondary.kind)&&protectingFleetUnits(enemy,b.ply).length&&!bypass)
    return 'Il secondo bersaglio è protetto dalle unità';
   if(installedModule(side,'weapon')?.cardId!=='nx-n00-09')return 'Cannone biforcato non montato';
  }
 }
 if(order?.pass&&chosen.some(c=>c.effectSpec.type==='aurora'&&['burst','dismantle'].includes(c.effectSpec.action)||
  c.effectSpec.type==='lince'&&LINCE_ATTACK_ACTIONS.includes(c.effectSpec.action)||
  c.effectSpec.type==='prisma'&&PRISMA_ATTACK_ACTIONS.includes(c.effectSpec.action)||
  c.effectSpec.type==='corvo'&&CORVO_ATTACK_ACTIONS.includes(c.effectSpec.action)||
  c.effectSpec.type==='manta'&&MANTA_ATTACK_ACTIONS.includes(c.effectSpec.action)||
  c.effectSpec.type==='shark'&&SHARK_ATTACK_ACTIONS.includes(c.effectSpec.action)||
  c.effectSpec.type==='nebula'&&NEBULA_ATTACK_ACTIONS.includes(c.effectSpec.action)||
  c.effectSpec.type==='storm'&&STORM_ATTACK_ACTIONS.includes(c.effectSpec.action)||
  c.effectSpec.type==='royal'&&ROYAL_ATTACK_ACTIONS.includes(c.effectSpec.action)))
  return 'Un comando offensivo non può essere passato';
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
 if(side.lince?.route&&side.lince.route.usePly<ply)side.lince.route=null;
 if(side.prisma?.shard&&side.prisma.shard.ply<ply)side.prisma.shard=null;
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

function cancelCorvoDisturbance(b,who,defender,events,sourceCardId=null){
 const trap=defender.defenses.find(d=>d.hidden&&d.trigger==='disturbance'&&
  d.armedAtPly<b.ply);
 if(!trap)return false;
 discardDefense(defender,trap.source);
 if(events)events.push(emit(b,other(who),'trap-reveal',
  'Eco di ritorno annulla il disturbo, senza rifletterlo',
  {cardId:trap.id,blockedCardId:sourceCardId}));
 return true;
}
function corvoSafetySwitch(b,who,events){
 const side=b.sides[who],module=installedModule(side,'utility');
 const generator=motherPart(side.ships[0],'generator');
 if(module?.cardId!=='nx-c03-09'||!unitAlive(module)||!unitAlive(generator)||
  !(generator.disabledUntilPly>b.ply))return false;
 const name=module.name;removeModule(side,'utility');
 generator.disabledUntilPly=0;
 events.push(emit(b,who,'card','Interruttore di sicurezza: '+name+
  ' sacrificato, Generatore riattivato senza riparazioni',{cardId:'nx-c03-09'}));
 return true;
}
function applyCorvoSilence(b,who,kind,unit,events,cardId,order={}){
 if(!['escort','machine'].includes(kind)||!canApplyCorvoStatus(unit,b.ply))return false;
 const defender=b.sides[other(who)];
 if(kind==='escort'){
  const channel=defender.defenses.find(d=>d.id==='nx-c03-03'&&!d.hidden&&
   (d.untilPly==null||d.untilPly>b.ply));
  if(channel&&operational(defender.ships[0],'command')){
   discardDefense(defender,channel.source);
   events.push(emit(b,other(who),'block',
    'Canale di riserva annulla un blocco temporaneo della passiva',
    {cardId:'nx-c03-03',blockedCardId:cardId,targetKind:'escort',targetId:unit.id}));
   return false;
  }
 }
 if(cancelCorvoDisturbance(b,who,defender,events,cardId))return false;
 unit.silencedUntilPly=b.ply+2;unit.lastSilencedPly=b.ply;
 events.push(emit(b,who,'card','Passiva silenziata: '+unit.name+
  ' (la protezione fisica resta attiva)',{cardId,targetKind:kind,targetId:unit.id}));
 const side=b.sides[who],state=ensureCorvoState(side);
 if(side.commander?.id==='ex-c03-01'&&side.commander.untilPly>b.ply&&
  operational(side.ships[0],characterSystem(side))&&state.commanderPeekPly!==b.ply){
  state.commanderPeekPly=b.ply;
  const top=side.deck[0];
  if(top&&order.corvoBottomTop===true)side.deck.push(side.deck.shift());
  events.push(emit(b,who,'private-scan','Comandante Risonante: prima carta '+
   (top?(card(top)?.nome||card(top)?.name||top):'assente')+
   (top&&order.corvoBottomTop?' spostata sotto il mazzo':' lasciata in cima'),{
   cardId:'ex-c03-01',privateTo:who,peekCardId:top||null}));
 }
 return true;
}
function applyCorvoUnitBlock(b,who,kind,unit,events,cardId){
 if(!canApplyCorvoStatus(unit,b.ply,'disabled'))return false;
 const defender=b.sides[other(who)];
 if(kind==='escort'){
  const channel=defender.defenses.find(d=>d.id==='nx-c03-03'&&!d.hidden&&
   (d.untilPly==null||d.untilPly>b.ply));
  if(channel&&operational(defender.ships[0],'command')){
   discardDefense(defender,channel.source);
   events.push(emit(b,other(who),'block',
    'Canale di riserva annulla un blocco temporaneo del supporto',
    {cardId:'nx-c03-03',blockedCardId:cardId}));
   return false;
  }
 }
 if(cancelCorvoDisturbance(b,who,defender,events,cardId))return false;
 unit.disabledUntilPly=b.ply+2;unit.lastDisabledPly=b.ply;
 refreshEscortLinks(defender,b.ply);
 events.push(emit(b,who,'card',(kind==='module'?'Modulo d’arma':kind==='machine'?'Macchina':'Supporto')+
  ' disattivato fino alla fine del prossimo turno avversario',
  {cardId,targetKind:kind,targetId:unit.id}));
 return true;
}
function onCorvoDamage(b,ctx,events,hit,sourceCardId){
 if(!hit||hit.damage<=0||!['escort','machine'].includes(hit.kind))return;
 const side=b.sides[ctx.who];
 if(side.ships[0].id!=='C03')return;
 const state=ensureCorvoState(side);
 if(sourceCardId==='nx-c03-02')
  applyCorvoSilence(b,ctx.who,hit.kind,hit.unit,events,sourceCardId,ctx.order);
 if(sourceCardId==='nx-c03-07'&&hit.kind==='machine')
  applyCorvoUnitBlock(b,ctx.who,'machine',hit.unit,events,sourceCardId);
 const antenna=installedModule(side,'weapon');
 if(antenna?.cardId==='nx-c03-01'&&corvoModuleActive(antenna,b.ply)&&
  operational(side.ships[0],'weapons')&&state.firstSilencePly!==b.ply){
  state.firstSilencePly=b.ply;
  applyCorvoSilence(b,ctx.who,hit.kind,hit.unit,events,'nx-c03-01',ctx.order);
 }
}

function addWeaken(b,enemy,amount,source,attackerWho=null,events=null){
 if(attackerWho&&cancelCorvoDisturbance(b,attackerWho,enemy,events,source))return false;
 enemy.buffs.push({kind:'jam',power:amount+(b.terrain?.id==='T03'?1:0),source});
 return true;
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

// Ogni azione Aurora è eseguita sulla battaglia reale. Gli effetti che richiedono
// una scelta accettano il valore selezionato nella plancia, senza alterare i testi.
function activateAuroraCard(b,who,def,ctx,events,order={},ownPartId=null,source=null){
 const side=b.sides[who],action=def.effectSpec.action;
 const note=(message,extra={})=>events.push(emit(b,who,'card',(def.name||def.nome)+' · '+message,{cardId:def.id,...extra}));
 if(isAuroraModule(def.id)){
  const first=side.lastModuleMountPly!==b.ply;
  const result=mountModule(side,def,ownPartId);
  if(!result.ok)throw Error(result.reason);
  side.lastModuleMountPly=b.ply;
  note((result.replaced?'Sostituito':'Montato')+' modulo '+result.entry.name+' (2/2)',
   {moduleId:result.entry.id,moduleSlot:result.entry.slot});
  if(first&&installedModule(side,'utility')?.cardId==='nx-n00-01'&&side.deck.length>1){
   if(order.deckTopFlip)[side.deck[0],side.deck[1]]=[side.deck[1],side.deck[0]];
   note('Ottica: osservate e ordinate due carte in cima al mazzo');
  }
  return;
 }
 if(action==='burst'||action==='dismantle'){
  ctx.auroraAttacks.push({id:def.id,action});
  note(action==='burst'?'Due colpi leggeri':'Tiro di smontaggio');
  return;
 }
 if(action==='sacrificial-veil'){
  const module=installedModule(side,order.sacrificeSlot)||liveModules(side)[0];
  const part=motherPart(side.ships[0],ownPartId);
  if(!module||!unitAlive(part))throw Error('Il Velo richiede un modulo e un vitale operativo');
  side.auroraVeil={id:def.id,source,moduleId:module.id,partId:part.id,untilPly:b.ply+2};
  note('Velo pronto su '+(VITAL_LABELS[part.id]||part.id)+' con '+module.name);
  return;
 }
 if(action==='adapt'){
  const possible=side.hand.filter(id=>card(id)?.shipId==='N00');
  const sacrificed=possible.includes(order.exchangeCardId)?order.exchangeCardId:possible[0];
  if(!sacrificed)throw Error('Adattamento: nessuna esclusiva in mano');
  side.hand.splice(side.hand.indexOf(sacrificed),1);
  side.deck.push(sacrificed);
  const top=side.deck.splice(0,3);
  const picked=top.includes(order.peekPickId)?order.peekPickId:top[0];
  if(picked){side.hand.push(picked);top.splice(top.indexOf(picked),1);}
  side.deck.push(...top);
  note('Una esclusiva scambiata: scelta una carta fra le prime tre');
  return;
 }
 if(action==='cartographer'){
  const top=side.deck.splice(0,4),options=top.filter(id=>isAuroraModule(id));
  const picked=options.includes(order.cartographerPickId)?order.cartographerPickId:options[0];
  if(picked){side.hand.push(picked);top.splice(top.indexOf(picked),1);}
  side.deck.push(...top);
  note(picked?'Un modulo scelto fra quattro carte':'Nessun modulo fra le quattro carte');
  return;
 }
 if(action==='reconfigure'){
  const options=reconfigurationOptions(side,card,side.ships[0].level);
  const choice=options.find(c=>c.slot===order.reconfigureSlot&&c.cardId===order.reconfigureCardId)||options[0];
  if(!choice)throw Error('Nessun modulo alternativo da montare');
  const index=side.deck.indexOf(choice.cardId);
  if(index<0)throw Error('Il modulo scelto non è nel mazzo');
  side.deck.splice(index,1);
  const old=installedModule(side,choice.slot),partId=old?.attachedPartId;
  const result=mountModule(side,card(choice.cardId),partId||ownPartId);
  if(!result.ok)throw Error(result.reason);
  side.deck=shuffled(side.deck,b);
  note('Riconfigurazione: '+old.name+' sostituito con '+result.entry.name);
  return;
 }
 throw Error('Effetto Aurora mancante: '+action);
}


function cancelLinceBypass(b,who,events,sourceCardId){
 const defender=b.sides[other(who)];
 const defense=defender.defenses.find(d=>d.counterBypass&&!d.hidden&&(d.untilPly??0)>b.ply);
 if(!defense)return false;
 discardDefense(defender,defense.source);
 events.push(emit(b,other(who),'block','Passaggio scoperto: Aggiramento avversario annullato',
  {cardId:defense.id,blockedCardId:sourceCardId}));
 return true;
}
// La trappola redirige il medesimo pacchetto di danno; niente secondo impatto
// gratuito, niente deviazione di catene, nessun bersaglio inventato.
function redirectLinceHit(b,ctx,events,target,alreadyRedirected=false){
 if(alreadyRedirected||target?.kind!=='part')return target;
 const defender=b.sides[other(ctx.who)];
 const trap=defender.defenses.find(d=>d.hidden&&d.trigger==='mother-part-hit'&&
  d.armedAtPly<b.ply);
 if(!trap)return target;
 const part=activePart(defender,trap.redirectPartId);
 if(!part||part.id===target.unit.id)return target;
 discardDefense(defender,trap.source);
 events.push(emit(b,other(ctx.who),'trap-reveal',
  'Falsa scia devia il colpo verso '+VITAL_LABELS[part.id],
  {cardId:trap.id,redirected:true,fromPartId:target.unit.id,toPartId:part.id}));
 return {kind:'part',unit:part,redirected:true};
}
function activateLinceCard(b,who,def,ctx,events,order={},ownPartId=null){
 const side=b.sides[who],enemy=b.sides[other(who)],action=def.effectSpec.action;
 const note=message=>events.push(emit(b,who,'card',(def.name||def.nome)+' · '+message,{cardId:def.id}));
 const state=ensureLinceState(side);
 if(isLinceModule(def.id)){
  const mounted=mountModule(side,def,ownPartId);
  if(!mounted.ok)throw Error(mounted.reason);
  note('Modulo '+(mounted.replaced?'sostituito':'montato')+' con '+mounted.entry.hp+'/'+mounted.entry.maxHp+' integrità');
  return;
 }
 if(LINCE_ATTACK_ACTIONS.includes(action)){
  ctx.linceAttacks.push({id:def.id,action});
  if(LINCE_BYPASS_ACTIONS.includes(action))ctx.bypassPlayed=true;
  if(action==='crimson-raid'){
   const module=installedModule(side,order.sacrificeSlot)||liveModules(side)[0];
   if(!module)throw Error('Incursione cremisi richiede un modulo operativo');
   removeModule(side,module.slot); // costo definitivo anche se la Difesa annulla il colpo
   note('Sacrificato '+module.name+' per un colpo con Aggiramento');
  }else note('Comando offensivo preparato: '+action);
  return;
 }
 if(action==='false-trail'){
  events.push(emit(b,who,'trap-set','Una trappola è stata preparata coperta.'));
  return;
 }
 if(action==='exposed-passage'){note('Il prossimo Aggiramento avversario sarà annullato');return;}
 if(action==='helios'){note('Un ricambio facoltativo dopo Aggiramento, per due tuoi turni');return;}
 if(action==='marked-route'){
  const partId=order.routePartId||order.partId||order.targetId;
  const part=activePart(enemy,partId);
  if(!part)throw Error('Rotta marcata richiede un vitale nemico esistente');
  state.route={partId:part.id,usePly:b.ply+2,cardId:def.id};
  note('Marcato '+VITAL_LABELS[part.id]+' per il prossimo tuo turno');
  return;
 }
 throw Error('Lince: effetto non gestito '+action);
}
function processHelios(b,who,ctx,events,order){
 const side=b.sides[who],state=ensureLinceState(side);
 if(side.commander?.id!=='ex-c01-01'||!ctx.bypassPlayed||!order.heliosTrade||
  state.heliosUsedPly===b.ply||!operational(side.ships[0],characterSystem(side))||
  !side.hand.length)return;
 const index=side.hand.indexOf(order.heliosDiscardId);
 const discarded=side.hand.splice(index>=0?index:0,1)[0];
 side.discard.push(discarded);
 if(!side.deck.length&&side.discard.length){side.deck=shuffled(side.discard,b);side.discard=[];}
 const drawn=side.deck.shift();
 if(drawn)side.hand.push(drawn);
 state.heliosUsedPly=b.ply;
 events.push(emit(b,who,'card','Pilota Helios: scartata 1 carta e pescata 1',
  {cardId:'ex-c01-01',discardedCardId:discarded,drawnCardId:drawn||null}));
}


// Regole Vespa: il catalogo non conferisce effetti senza esecuzione.
// Tutte le scelte sono fissate nel turno del proprietario, senza interrompere
// i trenta secondi del turno avversario.
function activatePrismaCard(b,who,def,ctx,events,order={},source=null){
 const side=b.sides[who],enemy=b.sides[other(who)],action=def.effectSpec.action;
 const state=ensurePrismaState(side);
 const note=(message,other={})=>events.push(emit(b,who,'card',(def.name||def.nome)+' · '+message,
  {cardId:def.id,...other}));
 if(isPrismaModule(def.id)){
  const result=mountModule(side,def);
  if(!result.ok)throw Error(result.reason);
  note('Modulo '+(result.replaced?'sostituito':'montato')+' · '+result.entry.hp+'/'+result.entry.maxHp,
   {moduleId:result.entry.id,moduleSlot:result.entry.slot});
  return;
 }
 if(PRISMA_ATTACK_ACTIONS.includes(action)){
  ctx.prismaAttacks.push({id:def.id,action});
  note('Comando pronto: '+action);
  return;
 }
 if(action==='machine-deflection'){
  const machines=(side.machines||[]).filter(m=>unitEnabled(m,b.ply));
  const selected=machines.find(m=>m.id===order.prismaRedirectMachineId)||machines[0];
  const defense=side.defenses.find(d=>d.source===source);
  if(!selected||!defense)throw Error('Prisma: scegli una macchina operativa da usare come esca');
  defense.redirectMachineId=selected.id;
  note('Il prossimo colpo su un’altra macchina sarà deviato su '+selected.name);
  return;
 }
 if(action==='false-reflection'){
  const defense=side.defenses.find(d=>d.source===source);
  if(!defense)throw Error('Trappola Riflesso falso non posata');
  const candidates=availableFleetTargets(side,b.ply);
  const selected=candidates.find(t=>t.kind===order.prismaTrapKind&&t.id===order.prismaTrapTargetId)||
   candidates[0];
  if(!selected)throw Error('Nessun bersaglio da proteggere con Riflesso falso');
  defense.protectedKind=selected.kind;defense.protectedId=selected.id;
  events.push(emit(b,who,'trap-set','Una trappola è stata preparata coperta.'));
  return;
 }
 if(action==='prisma-artisan'){
  state.artisanPreference=order.prismaArtisanTargetId?
   {kind:order.prismaArtisanTargetKind,id:order.prismaArtisanTargetId}:null;
  note('Una carica residua può essere spostata dopo un blocco, una volta per turno');
  return;
 }
 if(action==='lens-cut'){
  const choices=livePrismaUnits(enemy,b.ply,false);
  const target=choices.find(t=>t.kind===order.prismaEnemyKind&&t.unit.id===order.prismaEnemyId)||
   choices.find(({kind,unit})=>(enemy.protections||[]).some(p=>p.remaining>0&&p.untilPly>b.ply&&
    (kind==='escort'&&p.target==='escort'&&p.escortSlot===unit.slot||
     kind==='machine'&&p.target==='machine'&&p.machineSlot===unit.slot)&&
    enemy.defenses.some(d=>d.source===p.source&&!d.hidden)));
  if(!target)throw Error('Taglio della lente: nessuna unità protetta');
  const p=enemy.protections.find(p=>p.remaining>0&&p.untilPly>b.ply&&
   (target.kind==='escort'&&p.target==='escort'&&p.escortSlot===target.unit.slot||
    target.kind==='machine'&&p.target==='machine'&&p.machineSlot===target.unit.slot)&&
   enemy.defenses.some(d=>d.source===p.source&&!d.hidden));
  if(!p)throw Error('Taglio della lente: il bersaglio non ha protezioni scoperte');
  p.remaining--;
  note('Rimossa una carica di protezione da '+target.unit.name,{
   targetKind:target.kind,targetId:target.unit.id});
  if(p.remaining<=0)discardDefense(enemy,p.source);
  return;
 }
 if(action==='prisma-custody'){
  const support=(side.escorts||[]).find(e=>e.slot===0&&escortEnabled(side,e,b.ply));
  const p=side.protections.find(p=>p.target==='part'&&p.partId==='generator'&&
   p.remaining>0&&p.untilPly>b.ply&&
   side.defenses.some(d=>d.source===p.source&&!d.hidden));
  if(!support||!p||!operational(side.ships[0],'command'))
   throw Error('Custodia richiede Centralina, primo supporto e Difesa sul Generatore');
  p.target='escort';p.escortSlot=support.slot;p.partId=null;
  note('Trasferita sul primo supporto la protezione del Generatore, cariche '+p.remaining);
  return;
 }
 throw Error('Azione Vespa non gestita: '+action);
}


function activateCorvoCard(b,who,def,ctx,events,order={},source=null){
 const side=b.sides[who],enemy=b.sides[other(who)],action=def.effectSpec.action;
 const note=(message,extra={})=>events.push(emit(b,who,'card',
  (def.nome||def.name)+' · '+message,{cardId:def.id,...extra}));
 if(isCorvoModule(def.id)){
  const result=mountModule(side,def);
  if(!result.ok)throw Error(result.reason);
  note('Modulo '+(result.replaced?'sostituito':'montato')+' · '+result.entry.hp+'/'+result.entry.maxHp,
   {moduleId:result.entry.id,moduleSlot:result.entry.slot});
  corvoSafetySwitch(b,who,events);
  return;
 }
 if(CORVO_ATTACK_ACTIONS.includes(action)){
  ctx.corvoAttacks.push({id:def.id,action});
  note('Comando offensivo pronto');
  return;
 }
 if(action==='reserve-channel'){
  const defense=side.defenses.find(d=>d.source===source);
  if(!defense)throw Error('Canale di riserva non posato');
  defense.interceptTemporaryEscort=true;
  note('Pronto ad annullare un blocco temporaneo sul supporto');
  return;
 }
 if(action==='return-echo'){
  events.push(emit(b,who,'trap-set','Una trappola è stata preparata coperta.'));
  return;
 }
 if(action==='resonant-commander'){
  note('Osserva la cima del mazzo dopo il primo silenzio riuscito per turno');
  return;
 }
 if(action==='frequency-analysis'){
  const trap=enemy.defenses.find(d=>d.hidden);
  const state=ensureCorvoState(side);
  state.scannedTrapId=trap?.id||null;state.scanPly=b.ply;
  events.push(emit(b,who,'private-scan','Analisi di frequenza: '+
   (trap?(card(trap.id)?.nome||card(trap.id)?.name||trap.id):'nessuna trappola avversaria'),
   {cardId:def.id,privateTo:who,peekCardId:trap?.id||null}));
  const selected=side.hand.includes(order.corvoExchangeCardId)?order.corvoExchangeCardId:side.hand[0];
  if(!selected)throw Error('Analisi richiede una carta non giocata da scartare');
  side.hand.splice(side.hand.indexOf(selected),1);side.discard.push(selected);
  if(!side.deck.length&&side.discard.length){
   side.deck=shuffled(side.discard,b);side.discard=[];
  }
  const drawn=side.deck.shift();
  if(drawn)side.hand.push(drawn);
  note('Ricambio effettuato: scarta una carta e pescane una');
  return;
 }
 if(action==='reverse-recall'){
  const first=side.escorts.find(e=>e.sourceIndices?.includes(0)&&!e.fused);
  if(!first||!escortEnabled(side,first,b.ply)||(first.grade||1)<2||
   unitSilenced(first,b.ply)||first.skill?.action!=='jam')
   throw Error('Il primo supporto non ha una passiva anticipabile');
  const amount=Math.max(1,first.grade||1);
  const applied=addWeaken(b,enemy,amount,first.id,who,events);
  ensureCorvoState(side).skippedPassives[first.id]=true;
  note(applied?'Anticipato il disturbo del primo supporto; salterà la prossima attivazione ordinaria':
   'La trappola nemica annulla il disturbo anticipato; prossima attivazione consumata');
  return;
 }
 if(action==='selective-blackout'){
  const module=installedModule(enemy,'weapon');
  if(!module||!corvoModuleActive(module,b.ply))
   throw Error('Blackout selettivo richiede un modulo d’arma raggiungibile');
  if(!applyCorvoUnitBlock(b,who,'module',module,events,def.id))
   note('Il blocco del modulo è stato annullato da una contromisura');
  return;
 }
 throw Error('Azione Corvo mancante: '+action);
}

// Il Falco conserva UNA carta-attacco in zona di preparazione: mai nel mazzo,
// scarti o mano fino al rilascio/cancellazione. I colpi si risolvono separatamente.
function falcoChooseUnit(enemy,kind,id,exclude=null){
 const units=falcoUnits(enemy).filter(t=>t.unit.id!==exclude);
 return units.find(t=>t.kind===kind&&t.unit.id===id)||units[0]||null;
}
function falcoGunnerSearch(b,who,events,order){
 const side=b.sides[who],state=ensureFalcoState(side);
 if(side.commander?.id!=='ex-r01-01'||side.commander.untilPly<=b.ply||
  !operational(side.ships[0],characterSystem(side))||state.gunnerUsedPly===b.ply)
  return;
 state.gunnerUsedPly=b.ply;
 const top=side.deck.splice(0,3),available=top.filter(id=>cardRole(id)==='defense'&&
  !isTrapCard(card(id))&&card(id)?.playable!==false);
 const selected=available.includes(order.falcoGunnerPickId)?order.falcoGunnerPickId:available[0]||null;
 if(selected){
  top.splice(top.indexOf(selected),1);
  side.hand.push(selected);
 }
 side.deck.push(...top);
 events.push(emit(b,who,'private-scan','Artigliere Binario: '+
  (selected?'presa '+(card(selected)?.nome||card(selected)?.name||selected):'nessuna Difesa scoperta trovata'),
  {cardId:'ex-r01-01',privateTo:who,pickedCardId:selected,seenCount:Math.min(3,top.length+(selected?1:0))}));
}
function activateFalcoCard(b,who,def,ctx,events,order={},source=null){
 const side=b.sides[who],enemy=b.sides[other(who)],state=ensureFalcoState(side);
 const action=def.effectSpec.action;
 const note=(message,rest={})=>events.push(emit(b,who,'card',
  (def.nome||def.name)+' · '+message,{cardId:def.id,...rest}));
 if(isFalcoModule(def.id)){
  const result=mountModule(side,def);
  if(!result.ok)throw Error(result.reason);
  note('Capacitore montato, integrità '+result.entry.hp+'/'+result.entry.maxHp,
   {moduleId:result.entry.id,moduleSlot:result.entry.slot});
  return;
 }
 if(FALCO_PREP_ACTIONS.includes(action)){
  if(state.pending)throw Error('È già presente un colpo preparato');
  const primary=falcoChooseUnit(enemy,order.falcoTargetKind||order.targetKind,
   order.falcoTargetId||order.targetId);
  if(!primary)throw Error('Nessuna unità su cui preparare un colpo');
  const attack={cardId:def.id,action,createdPly:b.ply,releasePly:b.ply+2,
   held:false,capacitorModuleId:null,calibrationBonus:0,calibrationTargetId:null,
   shots:action==='double-chamber'?
    [{kind:primary.kind,id:primary.unit.id,damage:1},
     {kind:primary.kind,id:primary.unit.id,damage:1}]:
    [{kind:primary.kind,id:primary.unit.id,damage:3}]};
  if(action==='falcon-triangulation'){
   const second=falcoChooseUnit(enemy,order.falcoSecondTargetKind,
    order.falcoSecondTargetId,primary.unit.id);
   if(!second)throw Error('Triangolazione: seconda unità non disponibile');
   attack.shots.push({kind:second.kind,id:second.unit.id,damage:1,
    requiresEscorts:true});
  }
  state.pending=attack;
  ctx.falcoPrepared=true;
  events.push(emit(b,who,'falco-prepared',(def.nome||def.name)+
   ': carica visibile pronta per il prossimo turno',
   {cardId:def.id,targetKind:primary.kind,targetId:primary.unit.id,
    releasePly:attack.releasePly,targets:attack.shots.map(x=>({kind:x.kind,id:x.id}))}));
  falcoGunnerSearch(b,who,events,order);
  return;
 }
 if(action==='calibration-shot'){
  ctx.falcoCalibration={cardId:def.id};
  note('Colpo leggero di taratura pronto');
  return;
 }
 if(action==='armored-chamber'){
  const module=installedModule(side,'weapon');
  const defense=side.defenses.find(d=>d.source===source);
  if(!module||!defense||!state.pending)
   throw Error('Camera blindata richiede il Capacitore carico');
  defense.falcoProtectedModuleId=module.id;
  note('La prossima hit sul Capacitore sarà annullata');
  return;
 }
 if(action==='binary-gunner'){
  note('Alla preparazione: guarda tre carte e prendi al massimo una Difesa scoperta');
  return;
 }
 if(action==='ballistic-correction'){
  const pending=state.pending;
  if(!pending)throw Error('Nessun colpo preparato da correggere');
  const first=pending.shots[0];
  const next=falcoChooseUnit(enemy,order.falcoCorrectionKind,
   order.falcoCorrectionTargetId,first.id);
  if(!next||next.unit.id===first.id||
   pending.shots.some(s=>s.id===next.unit.id&&s.id!==first.id))
   throw Error('Correzione richiede un’altra unità viva distinta');
  for(const shot of pending.shots)if(shot.id===first.id){
   shot.id=next.unit.id;shot.kind=next.kind;
  }
  // La taratura è sul bersaglio precedente: correggere la rotta la perde.
  if(pending.calibrationTargetId===first.id){
   pending.calibrationTargetId=null;pending.calibrationBonus=0;
  }
  note('Bersaglio preparato cambiato in '+next.unit.name,
   {targetKind:next.kind,targetId:next.unit.id});
  return;
 }
 if(action==='guardian-falcon'){
  const defense=side.defenses.find(d=>d.source===source);
  if(!defense)throw Error('Difesa Falco guardiano non posata');
  defense.falcoGuardian=true;
  note('Il primo supporto copre il Generatore anche contro Aggiramento');
  return;
 }
 if(action==='emergency-loader'){
  const pending=state.pending;
  if(!pending)throw Error('Non esiste una carica da recuperare');
  side.deck.push(pending.cardId);
  state.pending=null;
  // La carta del vecchio attacco resta sotto al mazzo anche con pesca vuota.
  if(!side.deck.length&&side.discard.length){
   side.deck=shuffled(side.discard,b);side.discard=[];
  }
  const drawn=side.deck.shift();
  if(drawn)side.hand.push(drawn);
  events.push(emit(b,who,'falco-cancel','Caricatore: colpo annullato, carta sotto al mazzo e una pescata',
   {cardId:def.id,cancelledCardId:pending.cardId,drawnCardId:drawn||null}));
  return;
 }
 throw Error('Azione Falco non implementata: '+action);
}


// Manta R02: effetti dedicati, energia limitata a due e protezioni concrete.
function activateMantaCard(b,who,def,ctx,events,order={},source=null){
 const side=b.sides[who],state=ensureMantaState(side),action=def.effectSpec.action;
 const note=(message,extra={})=>events.push(emit(b,who,'card',
  (def.nome||def.name)+' · '+message,{cardId:def.id,...extra}));
 if(isMantaModule(def.id)){
  const result=mountModule(side,def);
  if(!result.ok)throw Error(result.reason);
  if(action==='ion-capacitor')state.energy=0;
  note('Modulo '+(result.replaced?'sostituito':'montato')+' con '+result.entry.hp+' integrità',
   {moduleId:result.entry.id,moduleSlot:result.entry.slot});
  return;
 }
 if(MANTA_ATTACK_ACTIONS.includes(action)){
  if(action==='total-discharge'&&!spendMantaEnergy(side,b.ply,2))
   throw Error('Scarica totale: servono due energie');
  if(action==='arc-discharge'&&order.mantaSilence){
   if(!spendMantaEnergy(side,b.ply,1))throw Error('Arco ionico senza energia');
   ctx.mantaSilence=true;
  }
  ctx.mantaAttacks.push({id:def.id,action});
  note(action==='arc-discharge'?'Arco ionico pronto'+(ctx.mantaSilence?' · Silenzio alimentato':''):
   'Scarica totale alimentata con due energie');
  return;
 }
 if(action==='absorption-screen'){
  const supports=mantaActiveSupports(side,b.ply);
  const target=supports.find(e=>e.id===order.mantaScreenEscortId)||supports[0];
  if(!target)throw Error('Schermo: supporto non operativo');
  side.protections.push({source,id:def.id,kind:'protect',remaining:1,
   target:'escort',escortSlot:target.slot,untilPly:b.ply+2,placedPly:b.ply});
  note('Il prossimo colpo su '+target.name+' sarà bloccato');
  return;
 }
 if(action==='ion-ground'){
  events.push(emit(b,who,'trap-set','Messa a terra preparata coperta'));
  return;
 }
 if(action==='manta-navigator'){
  state.navigatorUses=0;state.lastNavigatorPly=-999;
  note('Può spendere fino a due energie per riparare i supporti, una per turno');
  return;
 }
 if(action==='reverse-polarity'){
  const supports=mantaActiveSupports(side,b.ply);
  const visible=mantaVisibleProtections(side,b.ply);
  const sourceEscort=supports.find(e=>e.id===order.mantaFromEscortId);
  const chosen=visible.find(p=>p.target==='escort'&&p.escortSlot===sourceEscort?.slot)||
   visible.find(p=>p.target==='escort'&&supports.some(e=>e.slot===p.escortSlot));
  if(!chosen)throw Error('Polarità: nessuna protezione trasferibile');
  const destination=supports.find(e=>e.id===order.mantaToEscortId&&e.slot!==chosen.escortSlot)||
   supports.find(e=>e.slot!==chosen.escortSlot);
  if(!destination)throw Error('Polarità: manca il supporto ricevente');
  if(nebulaProtectionForbidden(destination,b.ply))
   throw Error('Nebbia polare: impossibile trasferire lo scudo al supporto');
  chosen.escortSlot=destination.slot;
  if(destination.hp<destination.maxHp){
   if((destination.disabledUntilPly||0)>b.ply)destination.disabledUntilPly=0;
   else if((destination.jammedUntilPly||0)>b.ply)destination.jammedUntilPly=0;
   else if((destination.silencedUntilPly||0)>b.ply)destination.silencedUntilPly=0;
  }
  refreshEscortLinks(side,b.ply);
  note('Protezione spostata su '+destination.name+' · cariche residue '+chosen.remaining);
  return;
 }
 if(action==='manta-field'){
  const first=mantaActiveSupports(side,b.ply).find(e=>
   e.sourceIndices?.includes(0)&&!e.fused&&(e.grade||1)>=2);
  const defense=side.defenses.find(d=>d.source===source);
  if(!first||!defense||!spendMantaEnergy(side,b.ply,1))
   throw Error('Campo Manta non attivabile');
  defense.mantaFieldEscortId=first.id;
  note('Il primo colpo non bloccato contro '+first.name+' sarà limitato a 1 danno');
  return;
 }
 if(action==='dielectric-reserve'){
  const options=mantaVisibleProtections(side,b.ply);
  const selected=options.find(p=>p.source===order.mantaRecycleSource)||options[0];
  if(!selected)throw Error('Riserva dielettrica senza protezione');
  const transfer=Math.min(2-mantaEnergy(side),selected.remaining);
  if(!transfer)throw Error('Riserva dielettrica piena');
  discardDefense(side,selected.source);
  const gained=gainMantaEnergy(side,b.ply,transfer);
  note('Convertite '+gained+' cariche della protezione in energia');
  return;
 }
 throw Error('Azione Manta non implementata: '+action);
}
function chargeMantaOnDamage(b,attackerWho,damage,events){
 const defender=b.sides[other(attackerWho)];
 if(damage<=0||defender.ships[0].id!=='R02'||!mantaCapacitorActive(defender,b.ply))return;
 const state=ensureMantaState(defender);
 if(state.lastEnemyDamagePly===b.ply)return;
 state.lastEnemyDamagePly=b.ply;
 const gained=gainMantaEnergy(defender,b.ply);
 if(gained)events.push(emit(b,other(attackerWho),'manta-energy',
  'Capacitore Manta: +1 energia per il primo danno nemico del turno',
  {cardId:'nx-r02-01',energy:state.energy}));
}
function mantaCapDamage(b,defender,kind,unit,amount,events){
 if(kind!=='escort'||defender.ships[0].id!=='R02')return amount;
 const field=defender.defenses.find(d=>d.mantaFieldEscortId===unit.id&&
  !d.hidden&&d.untilPly>b.ply);
 if(!field)return amount;
 discardDefense(defender,field.source);
 events.push(emit(b,other(b.turn),'block','Campo Manta limita il primo colpo a 1 danno',
  {cardId:field.id,targetKind:'escort',targetId:unit.id}));
 return Math.min(1,amount);
}
function mantaNavigatorTurn(b,ctx,events){
 const side=b.sides[ctx.who],state=ensureMantaState(side),commander=side.commander;
 if(side.ships[0].id!=='R02'||commander?.id!=='ex-r02-01'||
  commander.untilPly<=b.ply||!operational(side.ships[0],characterSystem(side))||
  state.navigatorUses>=2||state.lastNavigatorPly===b.ply||
  ctx.order?.mantaRepair===false||b.terrain?.id==='T08')return;
 const damaged=mantaActiveSupports(side,b.ply).filter(e=>e.hp<e.maxHp);
 const target=damaged.find(e=>e.id===ctx.order?.mantaRepairTargetId)||
  damaged.sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0];
 if(!target||!spendMantaEnergy(side,b.ply,1))return;
 target.hp=Math.min(target.maxHp,target.hp+1);
 state.navigatorUses++;state.lastNavigatorPly=b.ply;
 events.push(emit(b,ctx.who,'repair','Navigatrice Manta ripara '+target.name+' +1',
  {cardId:'ex-r02-01',targetKind:'escort',targetId:target.id,
   escortSlot:target.slot,energy:state.energy}));
}


// Le esclusive dello Squalo usano bersagli fissati, risorse consumate e stati reali.
function activateSharkCard(b,who,def,ctx,events,order={},source=null){
 const side=b.sides[who],enemy=b.sides[other(who)],action=def.effectSpec.action;
 const note=(message,extra={})=>events.push(emit(b,who,'card',
  (def.nome||def.name)+' · '+message,{cardId:def.id,...extra}));
 const pick=(rows,kind,id)=>rows.find(t=>t.kind===kind&&t.unit.id===id)||rows[0];
 if(isSharkModule(def.id)){
  const result=mountModule(side,def);
  if(!result.ok)throw Error(result.reason);
  if(action==='toothed-armor'){
   const target=pick(sharkUnits(enemy),order.sharkArmorKind,order.sharkArmorId);
   if(!target)throw Error('Corazza dentata: nessuna unità nemica da designare');
   result.entry.sharkTargetKind=target.kind;
   result.entry.sharkTargetId=target.unit.id;
   note('Controcolpo fissato su '+target.unit.name,{
    targetKind:target.kind,targetId:target.unit.id,moduleId:result.entry.id});
  }else note('Arpione predatorio montato');
  return;
 }
 if(SHARK_ATTACK_ACTIONS.includes(action)){
  if(action==='retaliation-torpedo'){
   const machine=sharkWoundedMachines(side,b.ply).find(m=>m.id===order.sharkTorpedoMachineId)||
    sharkWoundedMachines(side,b.ply)[0];
   if(!machine)throw Error('Siluro richiede una macchina ferita');
   machine.hp=0;machine.destroyed=true;
   if(!machine.cardDiscarded){
    if(machine.sourceCardId)side.discard.push(machine.sourceCardId);
    machine.cardDiscarded=true;
   }
   note('Sacrificata '+machine.name+' per lanciare un colpo pesante',{
    machineId:machine.id,sacrificed:true});
  }
  if(action==='void-bite'){
   ctx.sharkPierceLeft=sharkWoundedSupports(side,b.ply).length?1:0;
   note(ctx.sharkPierceLeft?'Morso con perforazione di una Difesa scoperta':'Morso ordinario');
  }
  if(action==='ruthless-response'){
   ctx.sharkBypass=true;ctx.bypass=true;
   note('Ritorsione attiva: un vitale avversario raggiungibile');
  }
  ctx.sharkAttacks.push({id:def.id,action});
  return;
 }
 if(action==='abyssal-decoy'){
  const units=sharkOperationalUnits(side,b.ply);
  const target=pick(units,order.sharkDecoyKind,order.sharkDecoyId);
  const defense=side.defenses.find(d=>d.source===source);
  if(!target||!defense)throw Error('Esca abissale: bersaglio non valido');
  defense.sharkDecoyKind=target.kind;defense.sharkDecoyId=target.unit.id;
  note('Attira il prossimo attacco ordinario su '+target.unit.name,{
   targetKind:target.kind,targetId:target.unit.id});
  return;
 }
 if(action==='returning-teeth'){
  const units=sharkUnits(enemy);
  const first=pick(units,order.sharkTeethFirstKind,order.sharkTeethFirstId);
  const others=units.filter(t=>t.unit.id!==first?.unit?.id);
  const second=pick(others,order.sharkTeethSecondKind,order.sharkTeethSecondId);
  const defense=side.defenses.find(d=>d.source===source);
  if(!first||!second||!defense)throw Error('Denti di ritorno: servono due bersagli diversi');
  defense.sharkTeethTargets=[
   {kind:first.kind,id:first.unit.id},{kind:second.kind,id:second.unit.id}
  ];
  events.push(emit(b,who,'trap-set','Una Trappola è stata posata coperta'));
  return;
 }
 if(action==='abyssal-admiral'){
  const state=ensureSharkState(side);
  state.admiralDiscardId=order.sharkAdmiralDiscardId||null;
  state.admiralEnabled=order.sharkAdmiralEnabled!==false;
  state.admiralSeenPly=-999;
  note('Prima unità ferita nel turno nemico: scarta una vera carta per ripararla');
  return;
 }
 if(action==='predator-shield'){
  const escort=sharkWoundedSupports(side,b.ply).find(e=>e.id===order.sharkShieldEscortId)||
   sharkWoundedSupports(side,b.ply)[0];
  const defense=side.defenses.find(d=>d.source===source);
  if(!escort||!defense)throw Error('Scudo del predatore: supporto ferito assente');
  defense.sharkShieldEscortId=escort.id;
  note('Il primo colpo su '+escort.name+' sarà limitato a 1 danno');
  return;
 }
 if(action==='last-bite'){
  const supports=sharkActiveSupports(side,b.ply);
  const donor=supports.find(e=>e.id===order.sharkSacrificeEscortId)||
   supports.find(e=>e.hp<e.maxHp);
  const receiver=supports.find(e=>e.id===order.sharkRecipientEscortId&&e.id!==donor?.id)||
   supports.find(e=>e.id!==donor?.id&&e.hp<e.maxHp);
  if(!donor||!receiver||donor.hp>=donor.maxHp||receiver.hp>=receiver.maxHp)
   throw Error('Ultimo morso: servono due supporti feriti distinti');
  donor.hp=0;donor.destroyed=true;donor.linked=false;
  const healed=Math.min(2,receiver.maxHp-receiver.hp);
  receiver.hp+=healed;refreshEscortLinks(side,b.ply);
  if(!side.deck.length&&side.discard.length){
   side.deck=shuffled(side.discard,b);side.discard=[];
  }
  const drawn=side.deck.shift();
  if(drawn)side.hand.push(drawn);
  events.push(emit(b,who,'shark-sacrifice','Ultimo morso: '+donor.name+
   ' sacrificato, '+receiver.name+' riparato di '+healed+' punti'+
   (drawn?', pescata una carta':', nessuna carta da pescare'),{
    cardId:def.id,sacrificedId:donor.id,targetId:receiver.id,
    healed,drawnCardId:drawn||null}));
  return;
 }
 throw Error('Azione Squalo mancante: '+action);
}
// Le risposte non generano ulteriori risposte e non colpiscono parti vitali.
function sharkCounterShot(b,who,events,kind,id,sourceCard){
 const defender=b.sides[other(who)];
 const target=sharkUnits(defender).find(t=>t.kind===kind&&t.unit.id===id);
 if(!target)return 0;
 const ctx={who,pierceLeft:0,sharkPierceLeft:0,sharkBypass:false,
  sharkPrimary:null,sharkLureUsed:true,order:{},bypass:false};
 const redirected=redirectFleetHit(b,ctx,events,{kind,unit:target.unit});
 if(blockHit(b,defender,redirected.kind,redirected.unit,ctx,events))return 0;
 const amount=sharkCapDamage(b,defender,redirected.kind,redirected.unit,1,events);
 const actual=damageFleetUnit(defender,redirected.kind,redirected.unit,amount,b.ply);
 if(actual)events.push(emit(b,who,'shark-counter',
  'Ritorsione Squalo: '+redirected.unit.name+' −'+actual,{
   cardId:sourceCard,targetKind:redirected.kind,targetId:redirected.unit.id,
   damage:actual,destroyed:redirected.unit.destroyed,noRecursion:true}));
 return actual;
}
// Richiamato SOLO dopo un vero colpo da attacco. Mai da costi, riflessi o reazioni.
function onSharkAttackHit(b,ctx,events,hit){
 if(!hit||hit.damage<=0||!['escort','machine'].includes(hit.kind))return;
 const attacker=b.sides[ctx.who],defender=b.sides[other(ctx.who)];
 if(attacker.ships[0].id==='R04'&&sharkModuleActive(attacker,'weapon','nx-r04-07',b.ply)&&
  unitAlive(hit.unit)){
  hit.unit.sharkAnchorUntilPly=b.ply+2;
  events.push(emit(b,ctx.who,'shark-anchor',
   'Arpione predatorio: '+hit.unit.name+' non può essere ritirato',{
    cardId:'nx-r04-07',targetKind:hit.kind,targetId:hit.unit.id,
    untilPly:hit.unit.sharkAnchorUntilPly}));
 }
 if(defender.ships[0].id!=='R04')return;
 const state=ensureSharkState(defender),defenderWho=other(ctx.who);
 if(hit.unit.destroyed)state.lastEnemyLossPly=b.ply;
 const armor=installedModule(defender,'utility');
 if(sharkModuleActive(defender,'utility','nx-r04-01',b.ply)&&state.armorFiredPly!==b.ply){
  state.armorFiredPly=b.ply;
  if(sharkCounterShot(b,defenderWho,events,armor.sharkTargetKind,armor.sharkTargetId,armor.cardId)){
   events.push(emit(b,defenderWho,'card','Corazza dentata: controcolpo eseguito',
    {cardId:armor.cardId}));
  }else events.push(emit(b,defenderWho,'card',
   'Corazza dentata: bersaglio assente o colpo bloccato',{cardId:armor.cardId}));
 }
 const admiral=defender.commander;
 if(admiral?.id==='ex-r04-01'&&admiral.untilPly>b.ply&&
  operational(defender.ships[0],characterSystem(defender))&&
  state.admiralSeenPly!==b.ply){
  state.admiralSeenPly=b.ply;
  if(unitAlive(hit.unit)&&state.admiralEnabled!==false&&
   hit.unit.hp<hit.unit.maxHp&&defender.hand.length){
   const index=defender.hand.indexOf(state.admiralDiscardId);
   const discarded=defender.hand.splice(index>=0?index:0,1)[0];
   defender.discard.push(discarded);hit.unit.hp=Math.min(hit.unit.maxHp,hit.unit.hp+1);
   state.admiralUsedPly=b.ply;
   events.push(emit(b,defenderWho,'repair','Ammiraglio Abissale: '+hit.unit.name+
    ' +1, scartata '+(card(discarded)?.nome||card(discarded)?.name||discarded),{
     cardId:'ex-r04-01',discardedCardId:discarded,
     targetKind:hit.kind,targetId:hit.unit.id}));
  }
 }
 if(hit.kind==='machine'&&hit.unit.destroyed){
  const trap=defender.defenses.find(d=>d.id==='nx-r04-04'&&d.hidden&&
   d.trigger==='shark-machine-destroyed'&&d.armedAtPly<b.ply);
  if(trap){
   const targets=[...(trap.sharkTeethTargets||[])];
   discardDefense(defender,trap.source);
   events.push(emit(b,defenderWho,'trap-reveal',
    'Denti di ritorno: due arpioni verso le unità fissate alla posa',{
     cardId:trap.id,targetCount:targets.length}));
   for(const t of targets)sharkCounterShot(b,defenderWho,events,t.kind,t.id,trap.id);
  }
 }
}
// Scudo del predatore: un solo pacchetto di danno, non una salva intera.
function sharkCapDamage(b,defender,kind,unit,amount,events){
 if(kind!=='escort'||defender.ships[0].id!=='R04'||amount<=0)return amount;
 const defense=defender.defenses.find(d=>d.id==='nx-r04-08'&&!d.hidden&&
  d.sharkShieldEscortId===unit.id&&d.untilPly>b.ply);
 if(!defense)return amount;
 discardDefense(defender,defense.source);
 events.push(emit(b,other(b.turn),'block',
  'Scudo del predatore limita il colpo a un danno',{
   cardId:defense.id,targetKind:'escort',targetId:unit.id}));
 return Math.min(1,amount);
}


// Nebulosa: tutti i cambi di stato sono applicati al campo, senza carte gratuite.
function activateNebulaCard(b,who,def,ctx,events,order={},source=null){
 const side=b.sides[who],action=def.effectSpec.action;
 const note=(message,extra={})=>events.push(emit(b,who,'card',
  (def.nome||def.name)+' · '+message,{cardId:def.id,...extra}));
 if(isNebulaModule(def.id)){
  const mounted=mountModule(side,def);
  if(!mounted.ok)throw Error(mounted.reason);
  note('Modulo '+(mounted.replaced?'sostituito':'montato')+' · '+mounted.entry.name,
   {moduleId:mounted.entry.id,moduleSlot:mounted.entry.slot});
  return;
 }
 if(NEBULA_ATTACK_ACTIONS.includes(action)){
  if(action==='mist-needle'&&nebulaHiddenSupport(side,b.ply)&&
   b.terrain?.id!=='T06')
   ctx.nebulaPierceLeft=1;
  ctx.nebulaAttacks.push({id:def.id,action});
  note(action==='mist-needle'?'Ago pronto'+
   (ctx.nebulaPierceLeft?' · supera una protezione scoperta':''):
   'Nebbia polare pronta · blocca nuove protezioni solo dopo impatto');
  return;
 }
 if(action==='cryogenic-veil'){
  const choices=nebulaTargets(side);
  const chosen=choices.find(t=>t.kind===order.nebulaVeilTargetKind&&
   t.unit.id===order.nebulaVeilTargetId)||choices[0];
  const defense=side.defenses.find(d=>d.source===source);
  if(!chosen||!defense)throw Error('Velo criogenico: seleziona una tua unita viva');
  defense.nebulaVeilTargetKind=chosen.kind;defense.nebulaVeilTargetId=chosen.unit.id;
  note('Solo il primo colpo della stessa raffica potra ferire '+chosen.unit.name,
   {targetKind:chosen.kind,targetId:chosen.unit.id});
  return;
 }
 if(action==='false-target'){
  events.push(emit(b,who,'trap-set','Un Falso bersaglio e stato preparato coperto'));
  return;
 }
 if(action==='mist-archon'){
  note('Con un futuro Terreno giocato puo ricambiare una carta reale');
  return;
 }
 if(action==='dissipation'){
  let permanent=b.terrain;
  while(permanent&&['player','boss_override'].includes(permanent.source))
   permanent=permanent.underlying;
  if(!permanent?.id&&b.bossId){
   const locked=bossTerrain(b.planetId||b.bossId);
   if(locked.id)permanent=locked;
  }
  b.terrain=permanent?activeTerrain(permanent,b.ply):neutralTerrain();
  events.push(emit(b,who,'terrain-dissipate',
   b.terrain?.id?'Dissipazione: ritorna '+(TERRAIN_CATALOG[b.terrain.id]?.name||b.terrain.id):
   'Dissipazione: campo neutro ripristinato',{
    cardId:def.id,terrainId:b.terrain?.id||null}));
  return;
 }
 if(action==='wandering-mist'){
  const hidden=nebulaHiddenSupport(side,b.ply);
  const candidates=nebulaVisibleSupports(side,b.ply).filter(e=>e.id!==hidden?.id);
  const selected=candidates.find(e=>e.id===order.nebulaSwapTargetId)||candidates[0];
  if(!hidden||!selected)throw Error('Bruma itinerante richiede due supporti validi');
  hidden.nebulaHiddenUntilPly=0;
  selected.nebulaHiddenUntilPly=b.ply+3;
  refreshEscortLinks(side,b.ply);
  note(hidden.name+' riappare; '+selected.name+' si occulta fino al prossimo tuo turno',
   {revealedId:hidden.id,hiddenId:selected.id});
  return;
 }
 if(action==='cryogenic-night'){
  const defense=side.defenses.find(d=>d.source===source);
  if(!defense)throw Error('Notte criogenica non posata');
  defense.nebulaNight=true;
  note('Per il prossimo turno nemico: un solo bersaglio per attacco');
  return;
 }
 throw Error('Azione Nebulosa non eseguita: '+action);
}
function nebulaHideForTurn(b,ctx,events,order={}){
 if(!order.nebulaHide)return;
 const side=b.sides[ctx.who],reason=nebulaHideReason(side,b.ply,order.nebulaHideEscortId);
 if(reason)throw Error(reason);
 const visible=nebulaVisibleSupports(side,b.ply);
 const selected=visible.find(e=>e.id===order.nebulaHideEscortId)||visible[0];
 if(!selected)throw Error('Nessun supporto occultabile');
 selected.nebulaHiddenUntilPly=b.ply+3;
 ensureNebulaState(side).lastHidePly=b.ply;
 refreshEscortLinks(side,b.ply);
 events.push(emit(b,ctx.who,'nebula-hide',
  'Proiettore di bruma occulta '+selected.name+' (non agisce e non protegge)',{
   cardId:'nx-e01-01',targetKind:'escort',targetId:selected.id,
   untilPly:selected.nebulaHiddenUntilPly}));
}
function nebulaArchonTerrainTrade(b,ctx,events,order={}){
 const side=b.sides[ctx.who],state=ensureNebulaState(side);
 const active=side.commander?.id==='ex-e01-01'&&
  side.commander.untilPly>b.ply&&operational(side.ships[0],characterSystem(side));
 if(!order.nebulaTerrainTrade||!active||state.lastTerrainTradePly===b.ply||
  !ctx.cards.some(id=>cardRole(id)==='terrain'))return;
 const index=side.hand.indexOf(order.nebulaTradeCardId);
 const removed=side.hand.splice(index>=0?index:0,1)[0];
 if(!removed)return;
 side.deck.push(removed);
 const picked=side.deck.shift();
 if(picked)side.hand.push(picked);
 state.lastTerrainTradePly=b.ply;
 events.push(emit(b,ctx.who,'card',
  'Arconte della Bruma: '+(card(removed)?.nome||removed)+
  ' sotto al mazzo e pescata una carta',{
   cardId:'ex-e01-01',discardedCardId:null,putBottomCardId:removed,
   drawnCardId:picked||null,terrainTrade:true}));
}
// Una raffica corrisponde a una singola risoluzione di attacco, non a un intero turno.
function startNebulaVolley(ctx){
 ctx.stormEscortVictims=new Set();
 ctx.nebulaVolleySerial=(ctx.nebulaVolleySerial||0)+1;
 ctx.nebulaSeen=new Map();
 ctx.nebulaBlockedTargets=new Set();
}
function blockNebulaRepeat(b,ctx,events,target){
 const key=target.kind+':'+target.unit.id;
 if(ctx.nebulaBlockedTargets?.has(key))return true;
 const defender=b.sides[other(ctx.who)];
 const defense=defender.defenses.find(d=>d.id==='nx-e01-03'&&!d.hidden&&
  d.untilPly>b.ply&&d.nebulaVeilTargetKind===target.kind&&
  d.nebulaVeilTargetId===target.unit.id);
 if(!defense)return false;
 if(!ctx.nebulaSeen)ctx.nebulaSeen=new Map();
 if(!ctx.nebulaSeen.has(key)){
  ctx.nebulaSeen.set(key,true);
  return false; // Il primo colpo puo ferire; le difese normali restano valide.
 }
 discardDefense(defender,defense.source);
 ctx.nebulaBlockedTargets??=new Set();ctx.nebulaBlockedTargets.add(key);
 events.push(emit(b,other(ctx.who),'block',
  'Velo criogenico annulla i colpi successivi della stessa raffica',{
   cardId:defense.id,targetKind:target.kind,targetId:target.unit.id}));
 return true;
}


function nebulaRevealOnOwnTurn(b,ctx,events){
 const side=b.sides[ctx.who];
 if(side.ships[0].id!=='E01')return;
 for(const escort of side.escorts){
  // Il turno che segue l'occultamento puo giocare Bruma itinerante.
  // Dopo la scelta, l'occultamento precedente termina e tornano le passive.
  if(escort.nebulaHiddenUntilPly===b.ply+1){
   escort.nebulaHiddenUntilPly=0;
   events.push(emit(b,ctx.who,'nebula-reveal',escort.name+' esce dalla bruma',
    {targetKind:'escort',targetId:escort.id}));
  }
 }
 refreshEscortLinks(side,b.ply);
}


// Tempesta E02: ogni carta produce un effetto reale; nessuna catena ricorsiva.
function activateStormCard(b,who,def,ctx,events,order={},source=null){
 const side=b.sides[who],action=def.effectSpec.action;
 const note=(message,extra={})=>events.push(emit(b,who,'card',
  (def.name||def.nome)+' · '+message,{cardId:def.id,...extra}));
 if(isStormModule(def.id)){
  const mounted=mountModule(side,def);
  if(!mounted.ok)throw Error(mounted.reason);
  if(action==='storm-capacitor'){
   const state=ensureStormState(side);
   state.charge=false;state.chargeStoredPly=-999;
  }
  note('Modulo montato: '+mounted.entry.name,{
   moduleId:mounted.entry.id,moduleSlot:mounted.entry.slot});
  return;
 }
 if(STORM_ATTACK_ACTIONS.includes(action)){
  ctx.stormAttacks.push({action,id:def.id});
  note('Comando di fuoco '+(ctx.stormAttacks.length));
  return;
 }
 if(action==='storm-front'){
  const escort=stormSupports(side,b.ply).find(e=>e.id===order.stormFrontEscortId)||
   stormSupports(side,b.ply)[0];
  const defense=side.defenses.find(d=>d.source===source);
  if(!escort||!defense)throw Error('Fronte di Tempesta: supporto non operativo');
  defense.stormFrontEscortId=escort.id;
  note(escort.name+' intercetterà il prossimo colpo su una macchina alleata',{
   escortId:escort.id});
  return;
 }
 if(action==='storm-captain'){
  note('Ricambia una carta solo dopo aver ferito due unità distinte nello stesso turno');
  return;
 }
 if(action==='lightning-net'){
  events.push(emit(b,who,'trap-set','Rete parafulmine preparata coperta',
   {cardId:def.id}));
  return;
 }
 throw Error('Azione Tempesta non riconosciuta: '+action);
}
function stormRedirectFront(b,ctx,events,target){
 if(!target||target.kind!=='machine')return target;
 const defender=b.sides[other(ctx.who)];
 if(defender.ships[0].id!=='E02')return target;
 const defense=defender.defenses.find(d=>d.id==='nx-e02-04'&&!d.hidden&&
  d.untilPly>b.ply&&d.stormFrontEscortId);
 if(!defense)return target;
 const guard=stormSupports(defender,b.ply).find(e=>e.id===defense.stormFrontEscortId);
 if(!guard||!stormUnits(defender,b.ply).some(t=>t.kind==='machine'&&
  t.unit.id===target.unit.id))return target;
 discardDefense(defender,defense.source);
 events.push(emit(b,other(ctx.who),'storm-front',
  'Fronte di Tempesta: '+guard.name+' intercetta il colpo sulla macchina',{
   cardId:defense.id,fromTargetId:target.unit.id,targetId:guard.id,redirected:true}));
 return {kind:'escort',unit:guard,redirected:true,stormOriginKind:'machine'};
}
function stormNetStops(b,ctx,events,target){
 if(!target||target.kind!=='escort'||!ctx.stormEscortVictims?.size||ctx.stormEscortVictims.has(target.unit.id))
  return false;
 const defender=b.sides[other(ctx.who)];
 const defense=defender.defenses.find(d=>d.id==='nx-e02-08'&&d.hidden&&
  d.armedAtPly<b.ply&&d.trigger==='storm-second-support');
 if(!defense||defender.ships[0].id!=='E02')return false;
 discardDefense(defender,defense.source);
 events.push(emit(b,other(ctx.who),'trap-reveal',
  'Rete parafulmine annulla il secondo danno a un supporto',{
   cardId:defense.id,targetKind:'escort',targetId:target.unit.id}));
 return true;
}
function stormConsumeHeavy(b,ctx,events,target,amount){
 if(!target||!['escort','machine'].includes(target.kind))return amount;
 const side=b.sides[ctx.who];
 if(side.ships[0].id!=='E02'||!stormModuleActive(side,'nx-e02-09',b.ply))return amount;
 const state=ensureStormState(side);
 if(!state.charge||state.chargeStoredPly>=b.ply)return amount;
 state.charge=false;state.chargeStoredPly=-999;
 events.push(emit(b,ctx.who,'storm-heavy',
  'Condensatore Tempesta scarica il prossimo colpo pesante',{
   cardId:'nx-e02-09',targetKind:target.kind,targetId:target.unit.id}));
 return 3; // Il colpo pesante sostituisce la potenza, non la somma.
}
function stormOnHit(b,ctx,events,hit){
 if(!hit?.damage||!['escort','machine'].includes(hit.kind))return;
 if(hit.kind==='escort')ctx.stormEscortVictims?.add(hit.unit.id);
 const side=b.sides[ctx.who];
 if(side.ships[0].id!=='E02')return;
 ctx.stormHitIds??=new Set();
 ctx.stormHitIds.add(hit.kind+':'+hit.unit.id);
 const state=ensureStormState(side);
 if(ctx.stormSuppressChain||!stormModuleActive(side,'nx-e02-01',b.ply)||
  state.chainFiredPly===b.ply)return;
 const plan=ctx.stormChainPlan;
 if(!plan||plan.id===hit.unit.id)return;
 state.chainFiredPly=b.ply; // L'uso si consuma anche se la destinazione sparisce.
 const enemy=b.sides[other(ctx.who)];
 const otherUnit=stormUnits(enemy,b.ply).find(t=>t.kind===plan.kind&&t.unit.id===plan.id);
 if(!otherUnit){
  events.push(emit(b,ctx.who,'storm-chain','Bobina: bersaglio fissato non disponibile',
   {cardId:'nx-e02-01'}));
  return;
 }
 ctx.stormSuppressChain=true;
 const secondary={kind:otherUnit.kind,unit:otherUnit.unit};
 const hit2=linceHit(b,ctx,events,secondary,1,'nx-e02-01',ctx.order||{},false,0);
 ctx.stormSuppressChain=false;
 events.push(emit(b,ctx.who,'storm-chain',
  'Bobina a catena: '+(hit2.damage?'colpo leggero riuscito':'colpo bloccato'),{
   cardId:'nx-e02-01',targetKind:otherUnit.kind,targetId:otherUnit.unit.id,
   damage:hit2.damage||0}));
}
function stormEndOwnTurn(b,ctx,events){
 const side=b.sides[ctx.who];
 if(side.ships[0].id!=='E02')return;
 const state=ensureStormState(side),ids=[...(ctx.stormHitIds||[])];
 // Il Condensatore riceve la carica solo dopo la risoluzione completa.
 if(ids.length>=3&&stormModuleActive(side,'nx-e02-09',b.ply)&&
  !state.charge&&state.lastChargePly!==b.ply){
  state.charge=true;state.chargeStoredPly=b.ply;state.lastChargePly=b.ply;
  events.push(emit(b,ctx.who,'storm-charge',
   'Condensatore: tre unità diverse danneggiate, una carica per il prossimo attacco',{
    cardId:'nx-e02-09',chargeStoredPly:b.ply,hitCount:ids.length}));
 }
 if(ids.length>=2&&ctx.order?.stormCaptainSwap&&
  side.commander?.id==='ex-e02-01'&&side.commander.untilPly>b.ply&&
  operational(side.ships[0],characterSystem(side))&&
  state.captainUsedPly!==b.ply&&side.hand.length){
  const preferred=side.hand.indexOf(ctx.order.stormCaptainTradeId);
  const index=preferred>=0?preferred:0;
  const discarded=side.hand.splice(index,1)[0];
  if(discarded){
   side.discard.push(discarded);
   if(!side.deck.length&&side.discard.length){
    side.deck=shuffled(side.discard,b);side.discard=[];
   }
   const drawn=side.deck.shift();
   if(drawn)side.hand.push(drawn);
   state.captainUsedPly=b.ply;
   events.push(emit(b,ctx.who,'storm-captain',
    'Capitano della Tempesta: carta scartata e una pescata reale',{
     cardId:'ex-e02-01',discardedCardId:discarded,drawnCardId:drawn||null,
     damagedUnits:ids.length}));
  }
 }
 state.lastHits=ids;state.lastHitsPly=b.ply;
}


// Eclisse Reale: ordini autentici, scudi trasferiti e unica Fusione della Corona.
function activateRoyalCard(b,who,def,ctx,events,order={},source=null){
 const side=b.sides[who],action=def.effectSpec.action;
 const supports=royalSupports(side,b.ply);
 const note=(message,extra={})=>events.push(emit(b,who,'card',
  (def.nome||def.name)+' · '+message,{cardId:def.id,...extra}));
 if(isRoyalModule(def.id)){
  const result=mountModule(side,def);
  if(!result.ok)throw Error(result.reason);
  note('Modulo installato: '+result.entry.name,
   {moduleId:result.entry.id,moduleSlot:result.entry.slot});
  return;
 }
 if(ROYAL_ATTACK_ACTIONS.includes(action)){
  if(order.royalRelay){
   const relay=supports.find(e=>e.id===order.royalRelayEscortId)||supports[0];
   if(!relay||!royalCapableModule(side,'nx-l01-01',b.ply))
    throw Error('Relè della Corona richiede un supporto e alimentazione');
   ensureRoyalState(side).lastRelayPly=b.ply;
   ctx.royalRelay=true;ctx.royalRelayEscortId=relay.id;
   ctx.royalSupportCommand=true;
   note('Relè: '+relay.name+' esegue il comando al posto dell’Arsenale',{
    relayEscortId:relay.id,fromSupport:true});
  }
  if(action==='coordinated-judgment'){
   const p=royalVisibleProtections(side,b.ply).find(p=>p.source===order.royalSourceToken)||
    royalVisibleProtections(side,b.ply)[0];
   const performer=supports.find(e=>e.slot===p?.escortSlot);
   if(!p||!performer)throw Error('Giudizio richiede protezione reale su supporto operativo');
   discardDefense(side,p.source); // Costo prima dell'impatto, mai rimborsato.
   ctx.royalSupportCommand=true;ctx.royalJudgmentEscortId=performer.id;
   note('Sacrificata una Difesa scoperta di '+performer.name+' per il colpo pesante',
    {sacrificedDefenseId:p.id,performerId:performer.id});
  }
  ctx.royalAttacks.push({id:def.id,action});
  return;
 }
 if(action==='protective-crown'){
  const defender=supports.find(e=>e.id===order.royalGuardEscortId)||supports[0];
  const d=side.defenses.find(e=>e.source===source);
  if(!defender||!d)throw Error('Corona protettiva: supporto non operativo');
  d.royalGuardEscortId=defender.id;
  note('Il primo colpo sulla Centralina sarà intercettato da '+defender.name,
   {escortId:defender.id});
  return;
 }
 if(action==='interdiction-decree'){
  events.push(emit(b,who,'trap-set','Decreto di interdizione preparato coperto',
   {cardId:def.id}));
  return;
 }
 if(action==='eclipse-sovereign'){
  note('Con due supporti operativi, scegli una fra tre carte cambiandola con una carta in mano');
  return;
 }
 if(action==='cross-order'){
  const p=royalVisibleProtections(side,b.ply).find(p=>p.source===order.royalSourceToken)||
   royalVisibleProtections(side,b.ply)[0];
  const sourceEscort=supports.find(e=>e.slot===p?.escortSlot);
  const destination=supports.find(e=>e.id===order.royalDestinationEscortId&&e.id!==sourceEscort?.id)||
   supports.find(e=>e.id!==sourceEscort?.id);
  if(!p||!sourceEscort||!destination)throw Error('Ordine incrociato: protezione o supporti assenti');
  p.escortSlot=destination.slot;
  let switched=false;
  const a=sourceEscort.skill.targetPart,bid=destination.skill.targetPart;
  if(a&&bid&&royalPart(side,a)&&royalPart(side,bid)){
   sourceEscort.skill={...sourceEscort.skill,targetPart:bid};
   destination.skill={...destination.skill,targetPart:a};
   switched=true;
  }
  ctx.royalSupportCommand=true;
  note('Protezione su '+destination.name+
   (switched?' · bersagli compatibili delle abilità scambiati':' · abilità inalterate'),{
    sourceEscortId:sourceEscort.id,destinationEscortId:destination.id,
    sourceDefenseId:p.id,abilityTargetsSwapped:switched});
  return;
 }
 if(action==='royal-bastion'){
  const defender=supports.find(e=>e.id===order.royalBastionEscortId)||supports[0];
  const d=side.defenses.find(e=>e.source===source);
  if(!defender||!d||supports.length<2)
   throw Error('Bastione reale richiede due supporti e una Difesa scoperta');
  d.royalBastionEscortId=defender.id;
  note('Un colpo contro '+defender.name+' verrà diviso con l’altro supporto',
   {escortId:defender.id});
  return;
 }
 if(action==='crown-fusion'){
  const result=fuseFleetSupports(side,b.ply);
  if(!result.ok)throw Error(result.reason);
  result.fused.name='Corona Unita · Eclisse Reale';
  result.fused.royalCrown=true;
  result.fused.royalCrownUsedPly=-999;
  events.push(emit(b,who,'fusion','Fusione della Corona: due guardiani in Corona Unita',{
   cardId:def.id,fusedId:result.fused.id,stage:result.stage,
   escortCount:side.escorts.length,passives:result.fused.fusionSkills.length,
   royalCrown:true}));
  return;
 }
 throw Error('Azione regale non implementata: '+action);
}
// Il Relè e la Lancia non producono colpi aggiuntivi: agiscono sugli attacchi reali.
function royalOwnShotPierce(b,ctx,events,sourceCard){
 const side=b.sides[ctx.who];
 if(side.ships[0].id!=='L01'||!ctx.royalMotherShot||!ctx.royalSupportCommand||
  !royalCapableModule(side,'nx-l01-07',b.ply)||ctx.royalLanceUsed||
  ensureRoyalState(side).lastLancePly===b.ply||!royalPart(side,'weapons')||
  b.terrain?.id==='T06'||!ctx.royalFirstShot){ctx.royalLanceAvailable=false;return;}
 ctx.royalLanceAvailable=true;
}
function royalGuardCommand(b,ctx,events,target){
 if(target?.kind!=='part'||target.unit.id!=='command')return target;
 const defender=b.sides[other(ctx.who)];
 if(defender.ships[0].id!=='L01')return target;
 const d=defender.defenses.find(d=>d.id==='nx-l01-03'&&!d.hidden&&
  d.untilPly>b.ply&&d.royalGuardEscortId);
 const protector=d&&royalSupports(defender,b.ply).find(e=>e.id===d.royalGuardEscortId);
 if(protector){
  discardDefense(defender,d.source);
  events.push(emit(b,other(ctx.who),'royal-intercept',
   'Corona protettiva: '+protector.name+' intercetta la Centralina',{
    cardId:d.id,fromPartId:'command',targetKind:'escort',targetId:protector.id}));
  return {kind:'escort',unit:protector,redirected:true,royalSameDamage:true};
 }
 const state=ensureRoyalState(defender);
 const crowned=royalSupports(defender,b.ply).find(e=>e.royalCrown&&e.fused);
 if(!crowned||state.lastCrownGuardPly===b.ply)return target;
 state.lastCrownGuardPly=b.ply;
 events.push(emit(b,other(ctx.who),'royal-intercept',
  'Corona Unita devia su di sé il primo colpo alla Centralina',{
   cardId:'nx-l01-10',fromPartId:'command',targetKind:'escort',targetId:crowned.id,
   fusion:true}));
 return {kind:'escort',unit:crowned,redirected:true,royalSameDamage:true};
}
// Il Decreto agisce sul ritiro, mai sulla Fusione o su sacrifici volontari.
function royalCancelWithdrawal(b,actor,events,unit,targetKind){
 const defender=b.sides[other(actor)];
 const decree=defender.defenses.find(d=>d.id==='nx-l01-04'&&d.hidden&&
  d.trigger==='unit-withdrawal'&&d.armedAtPly<b.ply);
 if(!decree)return false;
 discardDefense(defender,decree.source);
 events.push(emit(b,other(actor),'trap-reveal',
  'Decreto di interdizione blocca il ritiro di '+unit.name,{
   cardId:decree.id,targetKind,targetId:unit.id,withdrawalCancelled:true}));
 return true;
}
// L'impatto iniziale ha già superato le Difese; il Bastione non ricontrolla né devia.
function royalDistributeDamage(b,ctx,events,defender,kind,unit,amount){
 if(kind!=='escort'||amount<=0||defender.ships[0].id!=='L01')
  return damageFleetUnit(defender,kind,unit,amount,b.ply);
 const d=defender.defenses.find(d=>d.id==='nx-l01-08'&&!d.hidden&&
  d.untilPly>b.ply&&d.royalBastionEscortId===unit.id);
 const supports=royalSupports(defender,b.ply);
 const second=d&&supports.find(e=>e.id!==unit.id);
 if(!second||!supports.some(e=>e.id===unit.id))
  return damageFleetUnit(defender,kind,unit,amount,b.ply);
 discardDefense(defender,d.source);
 const firstAmount=Math.ceil(amount/2),secondAmount=Math.floor(amount/2);
 const first=damageFleetUnit(defender,kind,unit,firstAmount,b.ply);
 const extra=secondAmount?damageFleetUnit(defender,'escort',second,secondAmount,b.ply):0;
 ctx.royalSplitExtra=(ctx.royalSplitExtra||0)+extra;
 events.push(emit(b,other(ctx.who),'royal-split',
  'Bastione reale: '+unit.name+' −'+first+', '+second.name+' −'+extra,{
   cardId:d.id,originalId:unit.id,secondId:second.id,
   originalDamage:first,secondDamage:extra,damage:first+extra}));
 if(extra){
  // Questo è danno del medesimo attacco, non un nuovo colpo o un contrattacco.
  onSharkAttackHit(b,ctx,events,{kind:'escort',unit:second,damage:extra});
  stormOnHit(b,ctx,events,{kind:'escort',unit:second,damage:extra});
  chargeMantaOnDamage(b,ctx.who,extra,events);
  triggerReactions(b,ctx.who,extra,events);
 }
 return first;
}
function royalSovereignTurn(b,ctx,events){
 const side=b.sides[ctx.who],state=ensureRoyalState(side);
 if(!ctx.order?.royalSovereignTrade||side.ships[0].id!=='L01'||
  side.commander?.id!=='ex-l01-01'||side.commander.untilPly<=b.ply||
  !royalPart(side,'command')||royalSupports(side,b.ply).length<2||
  state.lastSovereignPly===b.ply||!side.hand.length)return;
 const index=side.hand.indexOf(ctx.order.royalDiscardId);
 const discarded=side.hand.splice(index>=0?index:0,1)[0];
 if(!discarded)return;
 side.discard.push(discarded);
 if(!side.deck.length&&side.discard.length){
  side.deck=shuffled(side.discard,b);side.discard=[];
 }
 const top=side.deck.splice(0,3);
 if(!top.length){
  side.deck.push(discarded);side.discard.pop();side.hand.push(discarded);
  return;
 }
 const chosenIndex=top.indexOf(ctx.order.royalPickId),pick=top.splice(chosenIndex>=0?chosenIndex:0,1)[0];
 side.hand.push(pick);side.deck.push(...top);
 state.lastSovereignPly=b.ply;
 events.push(emit(b,ctx.who,'royal-sovereign',
  'Sovrano dell’Eclisse: carta scartata; una scelta tra tre, altre sotto il mazzo',{
   cardId:'ex-l01-01',discardedCardId:discarded,drawnCardId:pick,
   viewedCount:top.length+1,bottomCount:top.length,netCards:0}));
}

function applyEffect(b,who,def,spec,ctx,events,{source,ownPartId,order}={}){
 const side=b.sides[who],enemy=b.sides[other(who)];
 const s=spec,token=source||def.id+'@'+b.ply+'-'+ctx.effectSerial++;
 const at=text=>events.push(emit(b,who,'card',(def.nome||def.name||'Effetto')+' · '+text,{cardId:def.id}));
 const expiry=b.ply+2*(s.turns||1);
 switch(s.type){
  case 'aurora':activateAuroraCard(b,who,def,ctx,events,order,ownPartId,token);break;
  case 'lince':activateLinceCard(b,who,def,ctx,events,order,ownPartId);break;
  case 'prisma':activatePrismaCard(b,who,def,ctx,events,order,token);break;
  case 'corvo':activateCorvoCard(b,who,def,ctx,events,order,token);break;
  case 'falco':activateFalcoCard(b,who,def,ctx,events,order,token);break;
  case 'manta':activateMantaCard(b,who,def,ctx,events,order,token);break;
  case 'shark':activateSharkCard(b,who,def,ctx,events,order,token);break;
  case 'nebula':activateNebulaCard(b,who,def,ctx,events,order,token);break;
  case 'storm':activateStormCard(b,who,def,ctx,events,order,token);break;
  case 'royal':activateRoyalCard(b,who,def,ctx,events,order,token);break;
  case 'bypass':{
   ctx.bypassPlayed=true;
   if(cancelLinceBypass(b,who,events,def.id)){at('Aggiramento annullato dalla Difesa avversaria');break;}
   ctx.bypass=true;at('Questo attacco può raggiungere direttamente la madre');break;
  }
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
   const saved=recoveredMachineForDeploy(side,def.id);
   const machine={id:saved?.id||'machine:'+who+':'+token,slot,name:def.nome||def.name,
    sourceCardId:def.id,source:token,hp:saved?.hp??s.hp,
    maxHp:saved?.maxHp??s.hp,power:s.power||0,destroyed:false,
    disabledUntilPly:saved?.disabledUntilPly||0,jammedUntilPly:saved?.jammedUntilPly||0};
   side.machines.push(machine);
   events.push(emit(b,who,'machine-deploy',machine.name+' schierata: protegge la madre',
    {cardId:def.id,machineSlot:slot,machineId:machine.id}));
   break;
  }
  case 'power':ctx.power+=s.amount;at('+'+s.amount+' potenza');break;
  case 'pierce':ctx.pierce+=s.amount;at('Ignora '+s.amount+' protezioni sui componenti');break;
  case 'multishot':ctx.multiTargets=Math.max(ctx.multiTargets,s.targets);at('Fino a '+s.targets+' componenti');break;
  case 'protect':case 'dodge':{
   const escort=s.target==='escort'?weakest(livingEscorts(side).filter(e=>
   !nebulaProtectionForbidden(e,b.ply))):null;
   const part=s.target==='all'||escort?null:selectedOwnPart(side,s.target,ownPartId);
   if(s.target!=='all'&&!escort&&!part){at('Bersaglio non disponibile');break;}
   if(s.type==='dodge'&&!operational(side.ships[0],'generator')){at('Generatore non disponibile');break;}
   side.protections=side.protections.filter(p=>p.source!==token);
   side.protections.push({source:token,id:def.id,kind:s.type,remaining:s.amount,
    target:s.target==='all'?'all':escort?'escort':'part',partId:part?.id||null,
    escortSlot:escort?.slot??null,untilPly:expiry,placedPly:b.ply});
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
  case 'weaken':{
   const applied=addWeaken(b,enemy,s.amount,token,who,events);
   at(applied?'Prossimo attacco avversario indebolito':'Disturbo annullato da Eco di ritorno');break;
  }
  case 'disarm':
   if(enemy.lastDisarmedPly===b.ply-1){at('Armi avversarie protette da un secondo blocco consecutivo');break;}
   if(cancelCorvoDisturbance(b,who,enemy,events,def.id)){
    at('Disarmo annullato da Eco di ritorno');break;
   }
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
 if(role==='attack'&&ctx.nebulaUnredirectableCardId==null&&
  nebulaModuleActive(side,'nx-e01-09',b.ply)){
  ctx.nebulaUnredirectableCardId=id;
  events.push(emit(b,who,'card','Cannone velato: primo Attacco non deviabile',
   {cardId:'nx-e01-09',attackCardId:id}));
 }
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
  side.commander={id,untilPly:b.ply+4,repeatAtPly:b.ply+2,repeatsRemaining:['aurora','lince','prisma','corvo','falco','manta','shark','nebula','storm','royal'].includes(spec.type)?0:1,
   effectSpec:spec,source,ownPartId,kind:'simple',power:spec.amount||0};
 }
 if(role==='defense'){
  const falseTrail=spec.type==='lince'&&spec.action==='false-trail';
  const falseReflection=spec.type==='prisma'&&spec.action==='false-reflection';
  const returnEcho=spec.type==='corvo'&&spec.action==='return-echo';
  const mantaGround=spec.type==='manta'&&spec.action==='ion-ground';
  const sharkTeeth=spec.type==='shark'&&spec.action==='returning-teeth';
  const nebulaFalse=spec.type==='nebula'&&spec.action==='false-target';
  const stormNet=spec.type==='storm'&&spec.action==='lightning-net';
  const royalDecree=spec.type==='royal'&&spec.action==='interdiction-decree';
  side.defenses.push(royalDecree?
   {id,source,hidden:true,armedAtPly:b.ply,untilPly:null,trigger:'unit-withdrawal'}:
   stormNet?
   {id,source,hidden:true,armedAtPly:b.ply,untilPly:null,trigger:'storm-second-support'}:
   nebulaFalse?
   {id,source,hidden:true,armedAtPly:b.ply,untilPly:null,trigger:'prepared-release'}:
   sharkTeeth?
   {id,source,hidden:true,armedAtPly:b.ply,untilPly:null,trigger:'shark-machine-destroyed'}:
   mantaGround?
   {id,source,hidden:true,untilPly:null,armedAtPly:b.ply,trigger:'manta-secondary'}:
   returnEcho?
   {id,source,hidden:true,untilPly:null,armedAtPly:b.ply,trigger:'disturbance'}:
   falseReflection?
   {id,source,hidden:true,untilPly:null,armedAtPly:b.ply,
    trigger:'multi-secondary',protectedKind:null,protectedId:null}:
   falseTrail?
   {id,source,hidden:true,untilPly:null,armedAtPly:b.ply,trigger:'mother-part-hit',
    redirectPartId:ownPartId}:
   spec.type==='trap'?
   {id,source,hidden:true,untilPly:null,armedAtPly:b.ply,trigger:spec.trigger,action:spec.action}:
   {id,source,untilPly:spec.type==='corvo'&&spec.action==='reserve-channel'?b.ply+4:b.ply+2*(spec.turns||1),
     counterBypass:spec.type==='lince'&&spec.action==='exposed-passage'});
  side.defenseSlots=side.defenses.map(d=>d.id);
 }
 applyEffect(b,who,def,spec,ctx,events,{source,ownPartId,order});
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
 if(n===3&&side.lastDamage>0){if(addWeaken(b,enemy,1,'boss-3',ctx.who,events))note('Venere: prossimo attacco avversario −1 potenza');}
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
  if(unitSilenced(e,b.ply))continue;
  const amount=Math.max(1,e.grade||1);
  for(const s of e.fusionSkills||[e.skill]){
   if((side.turnCount+1)%Math.max(1,s.interval)!==0)continue;
   if(side.corvo?.skippedPassives?.[e.id]){
    delete side.corvo.skippedPassives[e.id];
    events.push(emit(b,ctx.who,'escort',e.name+' · attivazione già anticipata con Richiamo inverso'));
    continue;
   }
   const note=text=>events.push(emit(b,ctx.who,'escort',e.name+' · '+text));
   const part=resolvedPartId(b.sides[other(ctx.who)].ships[0],order.partId||order.targetId);
   if(['ion','strike','corrode'].includes(s.action)){ctx.power+=amount;note('+'+amount+' potenza');}
   else if(['focus','siege'].includes(s.action)&&s.targetPart===part){ctx.power+=amount;note('+'+amount+' potenza sul componente scelto');}
   else if(s.action==='revenge'&&livingEscorts(side).some(x=>x.hp<x.maxHp)){ctx.power+=amount;note('+'+amount+' potenza');}
   else if(s.action==='surge'&&side.ships[0].parts.some(p=>!p.destroyed&&p.hp<p.maxHp)){ctx.power+=amount;note('+'+amount+' potenza');}
   else if(s.action==='precision'||s.action==='pierce'&&s.targetPart===part){ctx.pierce+=amount;note('Ignora '+amount+' protezioni');}
   else if(['repair','mend'].includes(s.action)){const h=heal(b,side,amount,s.action==='mend'?'escort':'weakest');if(h)note('Ripara '+h.name+' +'+h.amount);}
   else if(s.action==='draw')note('Ricambia '+exchangeCards(b,side,amount)+' carte');
   else if(s.action==='jam'){
    const applied=addWeaken(b,b.sides[other(ctx.who)],amount,e.id,ctx.who,events);
    note(applied?'Prossimo attacco avversario −'+amount+' potenza':'Disturbo annullato');
   }
   else if(s.action==='guard'){addTemporaryGuard(side,b.ply,amount);note('Prossimo turno avversario −'+amount+' potenza');}
  }
 }
 for(const machine of (side.machines||[]).filter(e=>unitEnabled(e,b.ply)&&!unitSilenced(e,b.ply))){
  if(machine.power){ctx.power+=machine.power;events.push(emit(b,ctx.who,'machine',machine.name+' · +'+machine.power+' potenza',
   {machineId:machine.id,machineSlot:machine.slot}));}
 }
}

function redirectPrismaMachineHit(b,ctx,events,target){
 if(target?.kind!=='machine')return target;
 const defender=b.sides[other(ctx.who)];
 const defense=defender.defenses.find(d=>d.id==='nx-c02-03'&&!d.hidden&&
  d.untilPly>b.ply&&d.redirectMachineId);
 if(!defense)return target;
 const module=defender.modules?.utility;
 const machine=(defender.machines||[]).find(m=>m.id===defense.redirectMachineId&&
  unitEnabled(m,b.ply));
 if(!machine||machine.id===target.unit.id)return target;
 discardDefense(defender,defense.source);
 events.push(emit(b,other(ctx.who),'card','Prisma di deviazione intercetta il colpo diretto a una macchina',
  {cardId:'nx-c02-03',originalTargetId:target.unit.id,targetId:machine.id,
   targetKind:'machine'}));
 return {kind:'machine',unit:machine,redirected:true};
}
// Falco guardiano si applica anche a colpi che hanno Aggiramento: devia lo
// stesso pacchetto sul primo supporto, senza aggiungere danni alla madre.
function redirectFalcoGenerator(b,ctx,events,target){
 if(target?.kind!=='part'||target.unit.id!=='generator')return target;
 const defender=b.sides[other(ctx.who)];
 const protection=defender.defenses.find(d=>d.falcoGuardian&&!d.hidden&&
  d.untilPly>b.ply);
 if(!protection)return target;
 const first=defender.escorts.find(e=>e.sourceIndices?.includes(0)&&
  !e.fused&&falcoEscortReady(defender,e,b.ply));
 if(!first)return target;
 discardDefense(defender,protection.source);
 events.push(emit(b,other(ctx.who),'falco-intercept','Falco guardiano intercetta il colpo sul Generatore',
  {cardId:protection.id,fromPartId:'generator',targetKind:'escort',targetId:first.id,
   escortSlot:first.slot,redirected:true}));
 return {kind:'escort',unit:first,redirected:true};
}
// L'Esca devia solo il primo bersaglio ordinario, mai la madre o un colpo secondario.
function redirectSharkDecoy(b,ctx,events,target){
 if(!target||!['escort','machine'].includes(target.kind)||!ctx.sharkPrimary||
  ctx.sharkLureUsed||ctx.bypass||ctx.sharkBypass||
  ctx.sharkPrimary.kind!==target.kind||ctx.sharkPrimary.id!==target.unit.id)return target;
 const defender=b.sides[other(ctx.who)];
 if(defender.ships[0].id!=='R04')return target;
 const d=defender.defenses.find(d=>d.id==='nx-r04-03'&&!d.hidden&&
  d.untilPly>b.ply&&d.sharkDecoyId);
 if(!d)return target;
 const lure=sharkOperationalUnits(defender,b.ply).find(t=>
  t.kind===d.sharkDecoyKind&&t.unit.id===d.sharkDecoyId);
 if(!lure||lure.unit.id===target.unit.id)return target;
 ctx.sharkLureUsed=true;discardDefense(defender,d.source);
 events.push(emit(b,other(ctx.who),'shark-lure',
  'Esca abissale sposta il colpo principale su '+lure.unit.name,{
   cardId:d.id,fromTargetId:target.unit.id,targetKind:lure.kind,targetId:lure.unit.id}));
 return {kind:lure.kind,unit:lure.unit,redirected:true};
}
function redirectFleetHit(b,ctx,events,target){
 // Cannone velato impedisce ogni deviazione, anche quella regale.
 if(ctx.nebulaUnredirectableCardId)return target;
 const crown=royalGuardCommand(b,ctx,events,target);
 if(crown!==target)return crown;
 return redirectPrismaMachineHit(b,ctx,events,redirectLinceHit(b,ctx,events,
  redirectFalcoGenerator(b,ctx,events,redirectSharkDecoy(b,ctx,events,
   stormRedirectFront(b,ctx,events,target)))));
}
function cancelPrismaSecondaryHit(b,ctx,events,target,primary){
 if(!target||!primary||!target.unit||target.unit.id===primary.unit?.id)return false;
 const defender=b.sides[other(ctx.who)];
 const night=defender.defenses.find(d=>d.nebulaNight&&!d.hidden&&d.untilPly>b.ply);
 if(night){
  events.push(emit(b,other(ctx.who),'block',
   'Notte criogenica vieta un secondo bersaglio nello stesso attacco',
   {cardId:night.id,targetKind:target.kind,targetId:target.unit.id}));
  return true;
 }
 if(ctx.mantaGrounded)return true;
 const grounding=defender.defenses.find(d=>d.hidden&&d.trigger==='manta-secondary'&&
  d.armedAtPly<b.ply);
 if(grounding&&mantaCapacitorActive(defender,b.ply)&&spendMantaEnergy(defender,b.ply,1)){
  ctx.mantaGrounded=true;discardDefense(defender,grounding.source);
  events.push(emit(b,other(ctx.who),'trap-reveal',
   'Messa a terra annulla tutti i colpi su bersagli secondari',
   {cardId:grounding.id,secondaryCancelled:true}));
  return true;
 }
 const trap=defender.defenses.find(d=>d.hidden&&d.trigger==='multi-secondary'&&
  d.armedAtPly<b.ply&&d.protectedKind===target.kind&&
  d.protectedId===target.unit.id);
 if(!trap)return false;
 discardDefense(defender,trap.source);
 events.push(emit(b,other(ctx.who),'trap-reveal',
  'Riflesso falso annulla un colpo secondario, il colpo principale resta valido',
  {cardId:trap.id,blockedCardId:null,secondaryCancelled:true,
   targetKind:target.kind,targetId:target.unit.id}));
 return true;
}
function transferPrismaProtection(b,defender,p,ctx,events){
 if(p.remaining<=0||defender.commander?.id!=='ex-c02-01'||
  defender.commander.untilPly<=b.ply||!operational(defender.ships[0],characterSystem(defender)))
  return;
 const state=ensurePrismaState(defender);
 if(state.artisanShiftPly===b.ply)return;
 const category=p.target;
 const candidates=category==='part'?
  defender.ships[0].parts.filter(unitAlive).map(unit=>({kind:'part',unit})):
  category==='escort'?(defender.escorts||[]).filter(e=>escortEnabled(defender,e,b.ply))
   .map(unit=>({kind:'escort',unit})):
  category==='machine'?(defender.machines||[]).filter(e=>unitEnabled(e,b.ply))
   .map(unit=>({kind:'machine',unit})):[];
 const from=candidates.find(c=>category==='part'?c.unit.id===p.partId:c.unit.slot===
  (category==='escort'?p.escortSlot:p.machineSlot));
 const alternatives=candidates.filter(c=>c.unit.id!==from?.unit.id);
 const pref=state.artisanPreference;
 const allowed=alternatives.filter(c=>!nebulaProtectionForbidden(c.unit,b.ply));
 const chosen=allowed.find(c=>c.kind===pref?.kind&&c.unit.id===pref?.id)||allowed[0];
 if(!chosen)return;
 if(category==='part')p.partId=chosen.unit.id;
 else if(category==='escort')p.escortSlot=chosen.unit.slot;
 else if(category==='machine')p.machineSlot=chosen.unit.slot;
 state.artisanShiftPly=b.ply;
 events.push(emit(b,other(ctx.who),'card',
  'Artigiana Prisma trasferisce la protezione residua su '+(chosen.unit.name||VITAL_LABELS[chosen.unit.id]),
  {cardId:'ex-c02-01',remaining:p.remaining,targetKind:chosen.kind,targetId:chosen.unit.id}));
}

function blockHit(b,defender,targetKind,target,ctx,events){
 royalOwnShotPierce(b,ctx,events);
 const chamber=targetKind==='module'&&defender.defenses.find(d=>
  d.id==='nx-r01-04'&&!d.hidden&&d.untilPly>b.ply&&
  d.falcoProtectedModuleId===target.id);
 if(chamber){
  discardDefense(defender,chamber.source);
  events.push(emit(b,other(ctx.who),'block',
   'Camera blindata annulla un colpo sul Capacitore carico',
   {cardId:chamber.id,moduleId:target.id,targetKind:'module'}));
  return true;
 }
 for(const p of [...defender.protections]){
  if(p.untilPly<=b.ply||p.remaining<=0)continue;
  const matches=targetKind==='escort'?p.target==='escort'&&p.escortSlot===target.slot:
   targetKind==='machine'?p.target==='machine'&&p.machineSlot===target.slot:
   targetKind==='module'?p.target==='module'&&p.moduleSlot===target.slot:
   p.target==='all'||p.target==='part'&&p.partId===target.id;
  if(!matches)continue;
  if(nebulaProtectionForbidden(target,b.ply)&&p.placedPly!=null&&
   p.placedPly>=(target.nebulaNoProtectionAppliedPly??Infinity))continue;
  if(p.kind==='dodge'&&(!activePart(defender,'generator')||b.terrain?.id==='T01'))continue;
  const attacker=b.sides[ctx.who];
  const visible=defender.defenses.some(d=>d.source===p.source&&!d.hidden);
  const barrel=installedModule(attacker,'weapon');
  const canBarrel=targetKind==='part'&&barrel?.cardId==='nx-n00-07'&&corvoModuleActive(barrel,b.ply)&&
   barrel.activatedPly!==b.ply&&operational(attacker.ships[0],'weapons');
  const shard=attacker.prisma?.shard;
  const canShard=visible&&shard?.ply===b.ply&&
   shard.kind===targetKind&&shard.targetId===target.id;
  const sharkPierce=visible&&['escort','machine'].includes(targetKind)&&
   ctx.sharkPierceLeft>0&&ctx.sharkPrimary?.id===target.id&&
   ctx.sharkPrimary?.kind===targetKind;
  const royalPierce=visible&&ctx.royalLanceAvailable&&!ctx.royalLanceUsed&&
   ['escort','machine'].includes(targetKind);
  const stormPierce=visible&&b.terrain?.id!=='T06'&&ctx.stormSinglePierceLeft>0&&
   ctx.stormSingleTargetKind===targetKind&&ctx.stormSingleTargetId===target.id;
  const nebulaPierce=visible&&['escort','machine'].includes(targetKind)&&
   ctx.nebulaPierceLeft>0;
  const bypass=targetKind==='part'&&(ctx.pierceLeft>0||canBarrel)||canShard||sharkPierce||nebulaPierce||stormPierce||royalPierce;
  p.remaining--;
  if(!bypass&&p.id==='nx-r02-03'){
   const energy=gainMantaEnergy(defender,b.ply,1);
   if(energy)events.push(emit(b,other(ctx.who),'manta-energy',
    'Schermo di assorbimento converte il colpo bloccato in energia',
    {cardId:p.id,energy:mantaEnergy(defender)}));
  }
  if(bypass){
   if(royalPierce){
    ctx.royalLanceUsed=true;ctx.royalLanceAvailable=false;
    ensureRoyalState(attacker).lastLancePly=b.ply;
    events.push(emit(b,ctx.who,'royal-lance',
     'Lancia regale: una Difesa scoperta ignorata dal primo colpo della madre',{
      cardId:'nx-l01-07',targetKind,targetId:target.id}));
   }else if(stormPierce)ctx.stormSinglePierceLeft--;
   else if(sharkPierce)ctx.sharkPierceLeft--;
   else if(nebulaPierce)ctx.nebulaPierceLeft--;
   else if(canShard)attacker.prisma.shard=null;
   else if(targetKind==='part'&&ctx.pierceLeft>0)ctx.pierceLeft--;
   else if(canBarrel)barrel.activatedPly=b.ply;
  }else{
   const lens=installedModule(attacker,'weapon');
   if(visible&&lens?.cardId==='nx-c02-01'&&corvoModuleActive(lens,b.ply)&&
    operational(attacker.ships[0],'weapons')){
    const state=ensurePrismaState(attacker);
    if(state.shardGeneratedPly!==b.ply){
     state.shardGeneratedPly=b.ply;
     state.shard={kind:targetKind,targetId:target.id,ply:b.ply};
     events.push(emit(b,ctx.who,'card',
      'Lente prismatica: scheggia sul bersaglio, la prossima protezione scoperta sarà ignorata',
      {cardId:'nx-c02-01',targetKind,targetId:target.id}));
    }
   }
   if(visible)transferPrismaProtection(b,defender,p,ctx,events);
  }
  events.push(emit(b,ctx.who,bypass?'pierce':'block',bypass?
   'Il colpo ignora una protezione scoperta':'La protezione blocca il colpo',
   {cardId:p.id,partId:targetKind==='part'?target.id:null,
    escortSlot:targetKind==='escort'?target.slot:null}));
  if(p.remaining<=0)discardDefense(defender,p.source);
  if(!bypass)return true;
 }
 if(targetKind==='part'){
  const veil=defender.auroraVeil;
  const sacrificed=liveModules(defender).find(m=>m.id===veil?.moduleId);
  if(veil&&sacrificed&&veil.partId===target.id&&veil.untilPly>b.ply){
   removeModule(defender,sacrificed.slot);
   discardDefense(defender,veil.source);
   defender.auroraVeil=null;
   events.push(emit(b,ctx.who,'block','Velo di Salvataggio: '+sacrificed.name+' si sacrifica',
    {cardId:veil.id,partId:target.id}));
   return true;
  }
  const armor=installedModule(defender,'utility');
  if(armor?.cardId==='nx-n00-08'&&armor.attachedPartId===target.id){
   removeModule(defender,'utility');
   events.push(emit(b,ctx.who,'block','Corazza modulare distrutta al posto del vitale',
    {cardId:'nx-n00-08',partId:target.id}));
   return true;
  }
 }
 return false;
}
function damageFleetUnit(side,kind,unit,amount,ply){
 // Specchio segmentato limita soltanto il primo danno subito dal modulo nel turno.
 if(kind==='module'&&unit.cardId==='nx-c02-09'&&amount>0&&
  unit.hp>0&&!unit.destroyed&&unit.lastCappedPly!==ply){
  unit.lastCappedPly=ply;amount=Math.min(1,amount);
 }
 const damage=applyDamage(unit,amount);
 if(kind==='module'&&unit.destroyed&&installedModule(side,unit.slot)?.id===unit.id)
  removeModule(side,unit.slot);
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

// I nuovi attacchi sono comandi autonomi, non potenziamenti della salva gratuita.
function auroraHit(b,ctx,events,target,amount,sourceCard){
 const defender=b.sides[other(ctx.who)];
 if(!target||!unitAlive(target.unit))return 0;
 if(['part','module'].includes(target.kind)&&protectingFleetUnits(defender,b.ply).length&&!ctx.bypass)return 0;
 ctx.pierceLeft=b.terrain?.id==='T06'?0:ctx.pierce;
 target=redirectFleetHit(b,ctx,events,target);
 amount=stormConsumeHeavy(b,ctx,events,target,amount);
 if(blockNebulaRepeat(b,ctx,events,target))return 0;
 if(blockHit(b,defender,target.kind,target.unit,ctx,events))return 0;
 if(stormNetStops(b,ctx,events,target))return 0;
 const actual=royalDistributeDamage(b,ctx,events,defender,target.kind,target.unit,
  sharkCapDamage(b,defender,target.kind,target.unit,
   mantaCapDamage(b,defender,target.kind,target.unit,amount,events),events));
 if(actual){
  const name=target.unit.name||VITAL_LABELS[target.unit.id]||'Bersaglio';
  events.push(emit(b,ctx.who,'impact',name+' −'+actual,{
   cardId:sourceCard,targetKind:target.kind,targetId:target.unit.id,damage:target.kind==='part'?actual:0,
   escortDamage:target.kind==='escort'?actual:0,machineDamage:target.kind==='machine'?actual:0,
   moduleDamage:target.kind==='module'?actual:0,partId:target.kind==='part'?target.unit.id:null,
   escortSlot:target.kind==='escort'?target.unit.slot:null,
   machineSlot:target.kind==='machine'?target.unit.slot:null,
   destroyed:target.unit.destroyed,
   targets:[{kind:target.kind,id:target.unit.id,damage:actual,destroyed:target.unit.destroyed}]
  }));
  onCorvoDamage(b,ctx,events,{kind:target.kind,unit:target.unit,damage:actual},sourceCard);
  onSharkAttackHit(b,ctx,events,{kind:target.kind,unit:target.unit,damage:actual});
  stormOnHit(b,ctx,events,{kind:target.kind,unit:target.unit,damage:actual});
  chargeMantaOnDamage(b,ctx.who,actual,events);
  triggerReactions(b,ctx.who,actual,events);
 }
 return actual;
}
function resolveAuroraShots(b,ctx,events,order,commands=null){
 startNebulaVolley(ctx);
 const enemy=b.sides[other(ctx.who)],mother=b.sides[ctx.who].ships[0];
 const first=selectedEnemyTarget(enemy,order,b.ply);
 const shot={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  targetKind:first?.kind,targetId:first?.unit?.id,played:visiblePlayed(ctx.cards),targets:[]};
 const record=(target,amount,cardId,isSecondary=false)=>{
  if(!target||!unitAlive(target.unit))return;
  if(isSecondary&&cancelPrismaSecondaryHit(b,ctx,events,target,first))return;
  const dealt=auroraHit(b,ctx,events,target,amount,cardId);
  const field={part:'damage',escort:'escortDamage',machine:'machineDamage',module:'moduleDamage'}[target.kind];
  if(field)shot[field]+=dealt;
  if(dealt)shot.targets.push({kind:target.kind,id:target.unit.id,damage:dealt,destroyed:target.unit.destroyed});
 };
 const power=Math.max(1,(mother.attackPower||1)-(enemy.ships[0].defensePower||0)+ctx.power);
 if(commands){
  for(const command of commands){
   if(command.action==='burst'){
    if(first&&['escort','machine'].includes(first.kind)){
     record(first,1,command.id);
     record(first,1,command.id); // il secondo colpo si perde se il primo ha distrutto l'unità
    }
   }else if(command.action==='dismantle'){
    if(first)record(first,first.kind==='module'?2:first.kind==='part'?1:power,command.id);
   }
  }
  return shot;
 }
 const module=installedModule(b.sides[ctx.who],'weapon');
 const second=order.secondaryTargetId?
  selectedEnemyTarget(enemy,{targetKind:order.secondaryTargetKind,targetId:order.secondaryTargetId},b.ply):null;
 if(module?.cardId!=='nx-n00-09'||!corvoModuleActive(module,b.ply)||module.activatedPly===b.ply||
  !first||!second||first.unit.id===second.unit.id)return null;
 module.activatedPly=b.ply;
 record(first,1,'nx-n00-09');
 record(second,1,'nx-n00-09',true);
 return shot;
}


function onLinceDamage(b,ctx,events,hit,order={},didBypass=false){
 if(!hit||hit.damage<=0)return;
 const side=b.sides[ctx.who],defender=b.sides[other(ctx.who)];
 if(side.ships[0].id!=='C01')return;
 const state=ensureLinceState(side);
 if(hit.kind==='part'&&didBypass){
  state.lastSuccessfulBypassPly=b.ply;
  const module=installedModule(side,'utility');
  if(module?.cardId==='nx-c01-01'&&state.radentUsedPly!==b.ply&&
   order.radentRecall===true){
   const machines=(side.machines||[]).filter(e=>unitAlive(e)&&e.sourceCardId);
   const selected=machines.find(e=>e.id===order.radentMachineId)||machines[0];
   if(selected){
    const recovered=royalCancelWithdrawal(b,ctx.who,events,selected,'machine')?
     null:recallLinceMachine(side,selected,b.ply);
    if(recovered){
     state.radentUsedPly=b.ply;
     events.push(emit(b,ctx.who,'card','Propulsori radenti: '+recovered.name+' torna in mano senza riparazioni',
      {cardId:'nx-c01-01',machineId:recovered.id}));
    }
   }
  }
 }
 if(['escort','machine'].includes(hit.kind)&&state.bladeUsedPly!==b.ply&&
  installedModule(side,'weapon')?.cardId==='nx-c01-07'&&
  corvoModuleActive(installedModule(side,'weapon'),b.ply)&&operational(side.ships[0],'weapons')){
  const defense=defender.protections.find(p=>p.remaining>0&&p.untilPly>b.ply&&
   (hit.kind==='escort'&&p.target==='escort'&&p.escortSlot===hit.unit.slot||
    hit.kind==='machine'&&p.target==='machine'&&p.machineSlot===hit.unit.slot)&&
   defender.defenses.some(d=>d.source===p.source&&!d.hidden));
  if(defense){
   defense.remaining--;
   state.bladeUsedPly=b.ply;
   events.push(emit(b,ctx.who,'card','Lama di prua: rimossa una protezione residua da '+hit.unit.name,
    {cardId:'nx-c01-07',targetId:hit.unit.id,targetKind:hit.kind}));
   if(defense.remaining<=0)discardDefense(defender,defense.source);
  }
 }
}
function linceHit(b,ctx,events,target,amount,cardId,order={},bypass=false,pierce=0){
 const enemy=b.sides[other(ctx.who)];
 if(!target||!unitAlive(target.unit))return {damage:0,target};
 if(['part','module'].includes(target.kind)&&protectingFleetUnits(enemy,b.ply).length&&!bypass)
  return {damage:0,target};
 const finalTarget=redirectFleetHit(b,ctx,events,target);
 amount=stormConsumeHeavy(b,ctx,events,finalTarget,amount);
 if(blockNebulaRepeat(b,ctx,events,finalTarget))return {damage:0,target:finalTarget,blocked:true};
 ctx.pierceLeft=pierce;
 if(blockHit(b,enemy,finalTarget.kind,finalTarget.unit,ctx,events))
  return {damage:0,target:finalTarget,blocked:true};
 if(stormNetStops(b,ctx,events,finalTarget))return {damage:0,target:finalTarget,blocked:true};
 const actual=royalDistributeDamage(b,ctx,events,enemy,finalTarget.kind,finalTarget.unit,
  sharkCapDamage(b,enemy,finalTarget.kind,finalTarget.unit,
   mantaCapDamage(b,enemy,finalTarget.kind,finalTarget.unit,amount,events),events));
 if(actual){
  events.push(emit(b,ctx.who,'impact',(finalTarget.unit.name||VITAL_LABELS[finalTarget.unit.id]||'Bersaglio')+' −'+actual,{
   cardId,targetKind:finalTarget.kind,targetId:finalTarget.unit.id,
   damage:finalTarget.kind==='part'?actual:0,
   escortDamage:finalTarget.kind==='escort'?actual:0,
   machineDamage:finalTarget.kind==='machine'?actual:0,
   moduleDamage:finalTarget.kind==='module'?actual:0,
   partId:finalTarget.kind==='part'?finalTarget.unit.id:null,
   escortSlot:finalTarget.kind==='escort'?finalTarget.unit.slot:null,
   machineSlot:finalTarget.kind==='machine'?finalTarget.unit.slot:null,
   destroyed:finalTarget.unit.destroyed,
   targets:[{kind:finalTarget.kind,id:finalTarget.unit.id,damage:actual,
    destroyed:finalTarget.unit.destroyed}]
  }));
  onLinceDamage(b,ctx,events,{kind:finalTarget.kind,unit:finalTarget.unit,damage:actual},order,bypass);
  onCorvoDamage(b,ctx,events,{kind:finalTarget.kind,unit:finalTarget.unit,damage:actual},cardId);
  onSharkAttackHit(b,ctx,events,{kind:finalTarget.kind,unit:finalTarget.unit,damage:actual});
  stormOnHit(b,ctx,events,{kind:finalTarget.kind,unit:finalTarget.unit,damage:actual});
  chargeMantaOnDamage(b,ctx.who,actual,events);
  triggerReactions(b,ctx.who,actual,events);
 }
 return {damage:actual,target:finalTarget};
}
function resolveLinceShots(b,ctx,events,order){
 startNebulaVolley(ctx);
 const side=b.sides[ctx.who],enemy=b.sides[other(ctx.who)],first=selectedEnemyTarget(enemy,order,b.ply);
 const shot={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  targetKind:first?.kind,targetId:first?.unit?.id,
  played:visiblePlayed(ctx.cards),targets:[]};
 if(!first)return shot;
 const blocked=side.fireBlocked||side.fireDisabledUntil>b.ply;
 if(blocked){
  side.fireBlocked=false;side.fireDisabledUntil=0;
  if(side.lastDisarmedPly!==b.ply-2){
   side.lastDisarmedPly=b.ply;
   events.push(emit(b,ctx.who,'no-shot','Comando Lince bloccato'));
   return shot;
  }
 }
 const jam=side.buffs.filter(x=>x.kind==='jam').reduce((n,x)=>n+(x.power||0),0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 const guard=enemy.buffs.filter(x=>x.kind==='guard'&&(x.untilPly==null||x.untilPly>b.ply))
  .reduce((n,x)=>n+(x.power||0),0);
 const terrain=terrainSalvoModifier(b.terrain,side.ships[0].id);
 const power=Math.max(0,Math.max(1,side.ships[0].attackPower-enemy.ships[0].defensePower)+
  ctx.power+terrain.value-jam-guard);
 if(power===0){events.push(emit(b,ctx.who,'block','Potenza zero: comando Lince fallito'));return shot;}
 for(const command of ctx.linceAttacks){
  const action=command.action,bypass=LINCE_BYPASS_ACTIONS.includes(action);
  if(bypass&&cancelLinceBypass(b,ctx.who,events,command.id))continue;
  if(!unitAlive(first.unit))break;
  const amount=action==='tail-claw'?(first.unit.hp<first.unit.maxHp?3:1):
   action==='solar-bypass'||action==='crimson-raid'?1:
   Math.max(1,power);
  const hit=linceHit(b,ctx,events,first,amount,command.id,order,bypass,
   action==='crimson-raid'?1:0);
  if(hit.damage){
   const kind=hit.target.kind,field={part:'damage',escort:'escortDamage',
    machine:'machineDamage',module:'moduleDamage'}[kind];
   if(field)shot[field]+=hit.damage;
   shot.targets.push({kind,id:hit.target.unit.id,damage:hit.damage,
    destroyed:hit.target.unit.destroyed});
  }
  if(action==='armed-disengage'&&order.linceRecallWeapon===true){
   const candidate=installedModule(side,'weapon');
   const module=candidate&&royalCancelWithdrawal(b,ctx.who,events,candidate,'module')?
    null:recallLinceModule(side,'weapon');
   if(module)events.push(emit(b,ctx.who,'card',
    'Disimpegno armato: '+module.name+' torna in mano con '+module.hp+' integrità',
    {cardId:command.id,moduleId:module.id}));
  }
 }
 return shot;
}



function resolveCorvoShots(b,ctx,events,order){
 startNebulaVolley(ctx);
 const side=b.sides[ctx.who],enemy=b.sides[other(ctx.who)];
 const first=selectedEnemyTarget(enemy,order,b.ply);
 const shot={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  targetKind:first?.kind,targetId:first?.unit?.id,played:visiblePlayed(ctx.cards),targets:[]};
 if(!first)return shot;
 if(side.fireBlocked||side.fireDisabledUntil>b.ply){
  side.fireBlocked=false;side.fireDisabledUntil=0;
  if(side.lastDisarmedPly!==b.ply-2){
   side.lastDisarmedPly=b.ply;
   events.push(emit(b,ctx.who,'no-shot','Comando Corvo bloccato'));
   return shot;
  }
 }
 const jam=side.buffs.filter(x=>x.kind==='jam').reduce((sum,x)=>sum+(x.power||0),0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 const guard=enemy.buffs.filter(x=>x.kind==='guard'&&(x.untilPly==null||x.untilPly>b.ply))
  .reduce((sum,x)=>sum+(x.power||0),0);
 const terrain=terrainSalvoModifier(b.terrain,side.ships[0].id);
 const power=Math.max(0,Math.max(1,side.ships[0].attackPower-enemy.ships[0].defensePower)+
  ctx.power+terrain.value-jam-guard);
 if(!power){
  events.push(emit(b,ctx.who,'block','Potenza zero: comando Corvo fallito'));
  return shot;
 }
 for(const command of ctx.corvoAttacks){
  const hit=linceHit(b,ctx,events,first,1,command.id,order,false,0);
  if(hit.damage){
   const field=hit.target.kind==='machine'?'machineDamage':'escortDamage';
   shot[field]+=hit.damage;
   shot.targets.push({kind:hit.target.kind,id:hit.target.unit.id,damage:hit.damage,
    destroyed:hit.target.unit.destroyed});
  }
 }
 return shot;
}

// Vespa: le quantità e il numero dei colpi sono fissati dalla carta.
// I colpi bloccati non procurano danni e non possono rimbalzare in catena.
function resolvePrismaShots(b,ctx,events,order){
 startNebulaVolley(ctx);
 const side=b.sides[ctx.who],defender=b.sides[other(ctx.who)];
 const primary=selectedEnemyTarget(defender,order,b.ply);
 const shot={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  targetKind:primary?.kind,targetId:primary?.unit?.id,
  played:visiblePlayed(ctx.cards),targets:[]};
 if(!primary)return shot;
 const live=livePrismaUnits(defender,b.ply,false);
 const secondaryOptions=live.filter(t=>t.unit.id!==primary.unit.id);
 const selectedSecond=secondaryOptions.find(t=>
  t.kind===order.prismaSecondTargetKind&&t.unit.id===order.prismaSecondTargetId)||
  secondaryOptions[0];
 const thirdOptions=secondaryOptions.filter(t=>t.unit.id!==selectedSecond?.unit.id);
 const selectedThird=thirdOptions.find(t=>
  t.kind===order.prismaThirdTargetKind&&t.unit.id===order.prismaThirdTargetId)||
  thirdOptions[0];
 const first={kind:primary.kind,unit:primary.unit};
 const second=selectedSecond?{kind:selectedSecond.kind,unit:selectedSecond.unit}:null;
 const third=selectedThird?{kind:selectedThird.kind,unit:selectedThird.unit}:null;
 const blocked=side.fireBlocked||side.fireDisabledUntil>b.ply;
 if(blocked){
  side.fireBlocked=false;side.fireDisabledUntil=0;
  if(side.lastDisarmedPly!==b.ply-2){
   side.lastDisarmedPly=b.ply;
   events.push(emit(b,ctx.who,'no-shot','Comando Vespa bloccato'));
   return shot;
  }
 }
 const jam=side.buffs.filter(x=>x.kind==='jam').reduce((sum,x)=>sum+(x.power||0),0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 const guard=defender.buffs.filter(x=>x.kind==='guard'&&(x.untilPly==null||x.untilPly>b.ply))
  .reduce((sum,x)=>sum+(x.power||0),0);
 const terrain=terrainSalvoModifier(b.terrain,side.ships[0].id);
 const power=Math.max(0,Math.max(1,side.ships[0].attackPower-
  defender.ships[0].defensePower)+ctx.power+terrain.value-jam-guard);
 if(power===0){
  events.push(emit(b,ctx.who,'block','Potenza zero: attacco Vespa fallito'));
  return shot;
 }
 const record=(target,amount,id,isSecondary=false)=>{
  if(!target||!unitAlive(target.unit))return {damage:0,target};
  if(isSecondary&&cancelPrismaSecondaryHit(b,ctx,events,target,first))
   return {damage:0,target,blocked:true,secondaryCancelled:true};
  const hit=linceHit(b,ctx,events,target,amount,id,order,false,0);
  if(hit.damage){
   const kind=hit.target.kind,field={
    part:'damage',escort:'escortDamage',machine:'machineDamage',module:'moduleDamage'
   }[kind];
   if(field)shot[field]+=hit.damage;
   shot.targets.push({kind,id:hit.target.unit.id,damage:hit.damage,
    destroyed:hit.target.unit.destroyed});
  }
  return hit;
 };
 for(const command of ctx.prismaAttacks){
  if(command.action==='reflected-shard'){
   const firstHit=record(first,power,command.id);
   if(firstHit.blocked&&second)record(second,1,command.id,true);
  }else if(command.action==='broken-geometry'){
   record(first,1,command.id);
   record(first,1,command.id); // secondo colpo perso se il primo ha distrutto il bersaglio
   if(second)record(second,1,command.id,true);
  }else if(command.action==='crystal-rose'){
   record(first,1,command.id);
   if(second)record(second,1,command.id,true);
   if(third)record(third,1,command.id,true);
  }else throw Error('Comando Vespa non riconosciuto: '+command.action);
 }
 return shot;
}

// Salva eseguibile del Falco. Le carte preparate sono una zona fisica separata
// e non possono mai essere eseguite due volte, neppure se il bersaglio scompare.
function falcoReleaseAtTurnStart(b,who,ctx,events,order){
 const side=b.sides[who],q=ensureFalcoState(side).pending;
 if(!q||q.releasePly>b.ply)return null;
 if(order.falcoHold){
  const module=installedModule(side,'weapon');
  if(!falcoCapacitorActive(side,b.ply)||q.held)
   throw Error('Non puoi rinviare il colpo senza un Capacitore operativo');
  q.held=true;q.capacitorModuleId=module.id;q.releasePly+=2;
  events.push(emit(b,who,'falco-hold','Capacitore: colpo trattenuto per un unico turno aggiuntivo',
   {cardId:'nx-r01-01',pendingCardId:q.cardId,releasePly:q.releasePly}));
  return null;
 }
 side.falco.pending=null;
 side.discard.push(q.cardId);
 ctx.falcoReleased=true; // niente sparo ordinario nello stesso turno
 const result={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  played:visiblePlayed(ctx.cards),targets:[]};
 const lose=message=>{
  events.push(emit(b,who,'falco-lost',message,{cardId:q.cardId}));
  return result;
 };
 const defender=b.sides[other(who)];
 const falseTarget=defender.defenses.find(d=>d.id==='nx-e01-04'&&d.hidden&&
  d.armedAtPly<b.ply&&d.trigger==='prepared-release');
 if(falseTarget){
  discardDefense(defender,falseTarget.source);
  events.push(emit(b,other(who),'trap-reveal',
   'Falso bersaglio annulla tutta la preparazione nemica',
   {cardId:falseTarget.id,blockedCardId:q.cardId}));
  return lose('Colpo preparato annullato da Falso bersaglio');
 }
 startNebulaVolley(ctx);
 if(!operational(side.ships[0],'weapons'))
  return lose('Colpo preparato perso: Arsenale distrutto');
 if(q.held&&!falcoCapacitorActive(side,b.ply))
  return lose('Colpo conservato perso: Capacitore non operativo');
 if(side.fireBlocked||side.fireDisabledUntil>b.ply){
  side.fireBlocked=false;side.fireDisabledUntil=0;side.lastDisarmedPly=b.ply;
  return lose('Colpo preparato annullato dal blocco delle Armi');
 }
 const enemy=b.sides[other(who)];
 const power=terrainSalvoModifier(b.terrain,side.ships[0].id).value+
  Math.max(1,side.ships[0].attackPower-enemy.ships[0].defensePower)-
  side.buffs.filter(x=>x.kind==='jam').reduce((n,x)=>n+x.power,0)-
  enemy.buffs.filter(x=>x.kind==='guard'&&x.untilPly>b.ply)
   .reduce((n,x)=>n+x.power,0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 if(power<=0)return lose('Colpo preparato fallito: potenza annullata');
 events.push(emit(b,who,'falco-release',
  'Falco Binario rilascia '+(card(q.cardId)?.nome||card(q.cardId)?.name||q.cardId),
  {cardId:q.cardId,shotCount:q.shots.length,held:q.held}));
 const supports=(side.escorts||[]).filter(e=>falcoEscortReady(side,e,b.ply));
 for(const [index,shot] of q.shots.entries()){
  if(index>0&&shot.id!==q.shots[0]?.id){
   const second=falcoUnits(enemy).find(t=>t.kind===shot.kind&&t.unit.id===shot.id);
   const first=falcoUnits(enemy).find(t=>t.kind===q.shots[0].kind&&t.unit.id===q.shots[0].id);
   if(second&&first&&cancelPrismaSecondaryHit(b,ctx,events,second,first))continue;
  }
  if(shot.requiresEscorts&&(supports.length<2||
   supports.some(e=>(e.grade||1)<2)||!operational(side.ships[0],'command'))){
   events.push(emit(b,who,'falco-lost','Triangolazione: colpo leggero perso, manca un supporto operativo',
    {cardId:q.cardId,shotIndex:index}));
   continue;
  }
  const target=falcoUnits(enemy).find(t=>t.kind===shot.kind&&t.unit.id===shot.id);
  if(!target){
   events.push(emit(b,who,'falco-lost','Falco: bersaglio preparato distrutto, colpo perso',
    {cardId:q.cardId,shotIndex:index,targetId:shot.id}));
   continue;
  }
  const bonus=q.calibrationBonus&&q.calibrationTargetId===shot.id&&
   !result.calibrationUsed?q.calibrationBonus:0;
  const hit=linceHit(b,ctx,events,target,shot.damage+bonus,q.cardId,order,false,0);
  if(bonus){result.calibrationUsed=true;}
  if(hit.damage){
   const key=hit.target.kind==='escort'?'escortDamage':'machineDamage';
   result[key]+=hit.damage;
   result.targets.push({kind:hit.target.kind,id:hit.target.unit.id,
    damage:hit.damage,destroyed:hit.target.unit.destroyed});
  }
 }
 return result;
}
function falcoCalibrationShot(b,ctx,events,order){
 startNebulaVolley(ctx);
 const enemy=b.sides[other(ctx.who)],target=selectedEnemyTarget(enemy,order,b.ply);
 const shot={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  played:visiblePlayed(ctx.cards),targets:[]};
 if(!target||!['escort','machine'].includes(target.kind))return shot;
 const side=b.sides[ctx.who];
 if(!operational(side.ships[0],'weapons')||side.fireBlocked||side.fireDisabledUntil>b.ply){
  side.fireBlocked=false;side.fireDisabledUntil=0;
  events.push(emit(b,ctx.who,'no-shot','Taratura Falco: sparo bloccato'));
  return shot;
 }
 const hit=linceHit(b,ctx,events,target,1,ctx.falcoCalibration.cardId,order,false,0);
 if(!hit.damage)return shot;
 const key=hit.target.kind==='escort'?'escortDamage':'machineDamage';
 shot[key]=hit.damage;
 shot.targets.push({kind:hit.target.kind,id:hit.target.unit.id,damage:hit.damage,
  destroyed:hit.target.unit.destroyed});
 const q=side.falco?.pending;
 if(q&&q.shots.some(s=>s.id===hit.target.unit.id&&s.kind===hit.target.kind)&&
  !q.calibrationBonus){
  q.calibrationBonus=2;q.calibrationTargetId=hit.target.unit.id;
  events.push(emit(b,ctx.who,'falco-calibration',
   'Taratura riuscita: +2 danni a un solo colpo preparato sulla stessa unità',
   {cardId:ctx.falcoCalibration.cardId,pendingCardId:q.cardId,
    targetId:hit.target.unit.id}));
 }
 return shot;
}
function mergeFalcoShots(a,b){
 const empty={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  targets:[],played:[]};
 // Quando Falco non ha rilasciato una carica, conserva INTATTI bersaglio,
 // blocchi, tiro di emergenza e tutti gli altri metadati del tiro classico.
 if(!a)return {...empty,...b};
 if(!b)return {...empty,...a};
 return {...empty,...b,...a,
  damage:(a.damage||0)+(b.damage||0),
  escortDamage:(a.escortDamage||0)+(b.escortDamage||0),
  machineDamage:(a.machineDamage||0)+(b.machineDamage||0),
  moduleDamage:(a.moduleDamage||0)+(b.moduleDamage||0),
  targets:[...(a.targets||[]),...(b.targets||[])],
  played:[...new Set([...(a.played||[]),...(b.played||[])])]};
}


// Gli attacchi ionici hanno un colpo proprio, senza duplicare la salva ordinaria.
// Ogni comando Squalo sostituisce la salva ordinaria: mai due attacchi gratis.
// Tempesta sostituisce la salva ordinaria con colpi esattamente dichiarati.
function resolveStormShots(b,ctx,events,order){
 startNebulaVolley(ctx);
 const side=b.sides[ctx.who],enemy=b.sides[other(ctx.who)];
 const command=ctx.stormAttacks[0];
 const units=stormUnits(enemy,b.ply);
 const primary=units.find(t=>t.kind===order.targetKind&&t.unit.id===order.targetId)||units[0];
 const second=units.find(t=>t.kind===order.stormSecondKind&&t.unit.id===order.stormSecondId&&
  t.unit.id!==primary?.unit.id)||units.find(t=>t.unit.id!==primary?.unit.id);
 const result={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  played:visiblePlayed(ctx.cards),targetKind:primary?.kind,targetId:primary?.unit?.id,targets:[]};
 if(!command||!primary)return result;
 if(side.fireBlocked||side.fireDisabledUntil>b.ply){
  side.fireBlocked=false;side.fireDisabledUntil=0;side.lastDisarmedPly=b.ply;
  events.push(emit(b,ctx.who,'no-shot','Tempesta: Attacco bloccato'));return result;
 }
 const jam=side.buffs.filter(x=>x.kind==='jam').reduce((v,x)=>v+(x.power||0),0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 const guard=enemy.buffs.filter(x=>x.kind==='guard'&&
  (x.untilPly==null||x.untilPly>b.ply)).reduce((v,x)=>v+(x.power||0),0);
 const power=Math.max(0,Math.max(1,side.ships[0].attackPower-
  enemy.ships[0].defensePower)+ctx.power+
  terrainSalvoModifier(b.terrain,side.ships[0].id).value-jam-guard);
 if(!power){
  events.push(emit(b,ctx.who,'block','Tempesta: potenza zero, nessun colpo'));return result;
 }
 const record=(planned,amount,index=0)=>{
  if(!planned||!unitAlive(planned.unit))return {damage:0,target:planned};
  if(index>0&&planned.unit.id!==primary.unit.id&&
   cancelPrismaSecondaryHit(b,ctx,events,planned,primary))return {damage:0,target:planned};
  const hit=linceHit(b,ctx,events,planned,amount,command.id,order,false,0);
  if(hit.damage){
   const field=hit.target.kind==='escort'?'escortDamage':'machineDamage';
   result[field]+=hit.damage;
   result.targets.push({kind:hit.target.kind,id:hit.target.unit.id,
    damage:hit.damage,destroyed:hit.target.unit.destroyed});
  }
  return hit;
 };
 switch(command.action){
  case 'comb-wave':{
   // Copia indipendente dal campo: un KO non apre un nuovo bersaglio.
   const declared=[primary,...units.filter(t=>t.unit.id!==primary.unit.id)].slice(0,4);
   for(const [index,t] of declared.entries())record(t,1,index);
   break;
  }
  case 'rebound-lightning':{
   const first=record(primary,1);
   if(first.damage&&first.target.unit.destroyed&&second)record(second,power,1);
   break;
  }
  case 'thunder-reprise':{
   const state=ensureStormState(side);
   const repeated=state.lastHitsPly===b.ply-2&&state.lastHits.includes(
    primary.kind+':'+primary.unit.id);
   record(primary,repeated?3:1);
   events.push(emit(b,ctx.who,'storm-reprise',
    repeated?'Ripresa del tuono: bersaglio segnato, colpo da 3':
     'Ripresa del tuono: nessun segno precedente, colpo leggero',{
      cardId:command.id,repeat:repeated,targetId:primary.unit.id}));
   break;
  }
  case 'selective-discharge':{
   record(primary,1);
   record(primary,1);
   if(second){
    ctx.stormSinglePierceLeft=b.terrain?.id==='T06'?0:1;
    ctx.stormSingleTargetKind=second.kind;
    ctx.stormSingleTargetId=second.unit.id;
    record(second,1,2);
    ctx.stormSinglePierceLeft=0;
   }
   break;
  }
  case 'storm-quadrant':{
   record(primary,1);
   record(primary,1);
   if(second){record(second,1,2);record(second,1,3);}
   break;
  }
  default:throw Error('Comando Tempesta sconosciuto: '+command.action);
 }
 return result;
}

function resolveSharkShots(b,ctx,events,order){
 startNebulaVolley(ctx);
 const side=b.sides[ctx.who],enemy=b.sides[other(ctx.who)];
 const command=ctx.sharkAttacks[0],selected=selectedEnemyTarget(enemy,order,b.ply);
 const result={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  played:visiblePlayed(ctx.cards),targetKind:selected?.kind,
  targetId:selected?.unit?.id,targets:[]};
 if(!selected||!command)return result;
 if(side.fireBlocked||side.fireDisabledUntil>b.ply){
  side.fireBlocked=false;side.fireDisabledUntil=0;side.lastDisarmedPly=b.ply;
  events.push(emit(b,ctx.who,'no-shot','Attacco Squalo bloccato: eventuali costi restano pagati'));
  return result;
 }
 const jam=side.buffs.filter(x=>x.kind==='jam').reduce((n,x)=>n+(x.power||0),0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 const guard=enemy.buffs.filter(x=>x.kind==='guard'&&x.untilPly>b.ply)
  .reduce((n,x)=>n+(x.power||0),0);
 const power=Math.max(0,Math.max(1,side.ships[0].attackPower-
  enemy.ships[0].defensePower)+ctx.power+
  terrainSalvoModifier(b.terrain,side.ships[0].id).value-jam-guard);
 if(power<=0){
  events.push(emit(b,ctx.who,'block','Attacco Squalo fermato dai disturbi'));
  return result;
 }
 const action=command.action,bypass=action==='ruthless-response';
 if(bypass&&selected.kind!=='part')return result;
 if(!bypass&&!['escort','machine'].includes(selected.kind))return result;
 const amount=bypass?1:action==='retaliation-torpedo'?3:power;
 const hit=linceHit(b,ctx,events,selected,amount,command.id,order,bypass,0);
 if(hit.damage){
  const field={part:'damage',escort:'escortDamage',machine:'machineDamage'}[hit.target.kind];
  if(field)result[field]=hit.damage;
  result.targets.push({kind:hit.target.kind,id:hit.target.unit.id,
   damage:hit.damage,destroyed:hit.target.unit.destroyed});
 }
 return result;
}


// Attacchi Nebulosa: nessuna salva normale aggiuntiva o danni automatici.
function resolveNebulaShots(b,ctx,events,order){
 startNebulaVolley(ctx);
 const side=b.sides[ctx.who],enemy=b.sides[other(ctx.who)];
 const target=selectedEnemyTarget(enemy,order,b.ply),command=ctx.nebulaAttacks[0];
 const shot={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  targetKind:target?.kind,targetId:target?.unit?.id,played:visiblePlayed(ctx.cards),targets:[]};
 if(!target||!command||!['escort','machine'].includes(target.kind))return shot;
 if(side.fireBlocked||side.fireDisabledUntil>b.ply){
  side.fireBlocked=false;side.fireDisabledUntil=0;side.lastDisarmedPly=b.ply;
  events.push(emit(b,ctx.who,'no-shot','Attacco Nebulosa annullato dal blocco Armi'));
  return shot;
 }
 const jam=side.buffs.filter(x=>x.kind==='jam').reduce((n,x)=>n+(x.power||0),0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 const guard=enemy.buffs.filter(x=>x.kind==='guard'&&(x.untilPly==null||x.untilPly>b.ply))
  .reduce((n,x)=>n+(x.power||0),0);
 const power=Math.max(0,Math.max(1,side.ships[0].attackPower-
  enemy.ships[0].defensePower)+ctx.power+
  terrainSalvoModifier(b.terrain,side.ships[0].id).value-jam-guard);
 if(!power){
  events.push(emit(b,ctx.who,'block','Attacco Nebulosa annullato dai disturbi'));
  return shot;
 }
 const damage=command.action==='polar-mist'?1:power;
 const hit=linceHit(b,ctx,events,target,damage,command.id,order,false,0);
 if(!hit.damage)return shot;
 const field=hit.target.kind==='escort'?'escortDamage':'machineDamage';
 shot[field]=hit.damage;
 shot.targets.push({kind:hit.target.kind,id:hit.target.unit.id,
  damage:hit.damage,destroyed:hit.target.unit.destroyed});
 if(command.action==='polar-mist'&&!hit.target.unit.destroyed){
  hit.target.unit.nebulaNoProtectionAppliedPly=b.ply+1;
  hit.target.unit.nebulaNoProtectionUntilPly=b.ply+2;
  events.push(emit(b,ctx.who,'nebula-frost',
   'Nebbia polare: nuove protezioni vietate a '+hit.target.unit.name+
   ' nel prossimo turno avversario',{
    cardId:command.id,targetKind:hit.target.kind,targetId:hit.target.unit.id,
    untilPly:hit.target.unit.nebulaNoProtectionUntilPly}));
 }
 return shot;
}

function resolveMantaShots(b,ctx,events,order){
 startNebulaVolley(ctx);
 const side=b.sides[ctx.who],enemy=b.sides[other(ctx.who)];
 const target=selectedEnemyTarget(enemy,order,b.ply),command=ctx.mantaAttacks[0];
 const shot={damage:0,escortDamage:0,machineDamage:0,moduleDamage:0,
  targetKind:target?.kind,targetId:target?.unit?.id,played:visiblePlayed(ctx.cards),targets:[]};
 if(!target||!['escort','machine'].includes(target.kind)||!command)return shot;
 if(side.fireBlocked||side.fireDisabledUntil>b.ply){
  side.fireBlocked=false;side.fireDisabledUntil=0;side.lastDisarmedPly=b.ply;
  events.push(emit(b,ctx.who,'no-shot','Attacco ionico bloccato'));return shot;
 }
 const jam=side.buffs.filter(x=>x.kind==='jam').reduce((n,x)=>n+(x.power||0),0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 const guard=enemy.buffs.filter(x=>x.kind==='guard'&&(x.untilPly==null||x.untilPly>b.ply))
  .reduce((n,x)=>n+(x.power||0),0);
 const power=Math.max(0,Math.max(1,side.ships[0].attackPower-
  enemy.ships[0].defensePower)+ctx.power+
  terrainSalvoModifier(b.terrain,side.ships[0].id).value-jam-guard);
 if(!power){events.push(emit(b,ctx.who,'block','Attacco ionico fermato dai disturbi'));return shot;}
 const amount=command.action==='total-discharge'?3:power;
 const hit=linceHit(b,ctx,events,target,amount,command.id,order,false,0);
 if(!hit.damage)return shot;
 const key=hit.target.kind==='machine'?'machineDamage':'escortDamage';
 shot[key]=hit.damage;
 shot.targets.push({kind:hit.target.kind,id:hit.target.unit.id,damage:hit.damage,
  destroyed:hit.target.unit.destroyed});
 if(command.action==='arc-discharge'&&ctx.mantaSilence)
  applyCorvoSilence(b,ctx.who,hit.target.kind,hit.target.unit,events,command.id,order);
 if(command.action==='total-discharge'&&!hit.target.unit.destroyed)
  applyCorvoUnitBlock(b,ctx.who,'machine',hit.target.unit,events,command.id);
 return shot;
}

function resolveSalvo(b,ctx,events,order){
 startNebulaVolley(ctx);
 const side=b.sides[ctx.who],defender=b.sides[other(ctx.who)],mother=side.ships[0],enemy=defender.ships[0];
 ctx.royalMotherShot=true;
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
 const mantaFork=!!(order.mantaFork&&mantaForkActive(side,b.ply)&&mantaCapacitorActive(side,b.ply));
 if(mantaFork){
  if(!spendMantaEnergy(side,b.ply,1))throw Error('Forcella senza energia');
  ensureMantaState(side).lastForkPly=b.ply;
  events.push(emit(b,ctx.who,'card','Forcella ionica divide il tiro in due colpi leggeri',
   {cardId:'nx-r02-07'}));
 }
 if(selected.kind==='part'&&linceMarkedRouteReady(side,b.ply,selected.unit.id)){
  if(!cancelLinceBypass(b,ctx.who,events,side.lince.route.cardId)){
   ctx.bypass=true;ctx.routeMarkedBypass=true;
  }
 }
 if(['part','module'].includes(selected.kind)&&guards.length&&!ctx.bypass){
   selected={kind:guards[0].kind,unit:guards[0].unit};
   ctx.sharkPrimary={kind:selected.kind,id:selected.unit.id};
  }
 // Aggiramento abilita un solo componente dietro le unità: multicolpo non
 // moltiplica un'eccezione di accesso in un attacco all'intera madre.
 const count=mantaFork?2:guards.length&&selected.kind==='part'&&ctx.bypass?1:
  Math.min(4,(emergency?1:ctx.multiTargets)+(b.terrain?.id==='T10'?1:0));
 const forkUnits=mantaFork?mantaEnemyUnits(defender):[];
 const otherFork=forkUnits.find(x=>x.kind===order.mantaSecondTargetKind&&
  x.unit.id===order.mantaSecondTargetId&&x.unit.id!==selected.unit.id)||
  forkUnits.find(x=>x.unit.id!==selected.unit.id);
 const targets=mantaFork?[selected,...(otherFork?[otherFork]:[])]:selected.kind==='part'?
  [selected,...enemy.parts.filter(p=>unitAlive(p)&&p!==selected.unit).slice(0,count-1).map(unit=>({kind:'part',unit}))]:
  selected.kind==='module'?[selected]:
   [selected,...guards.filter(g=>g.unit!==selected.unit).slice(0,count-1).map(g=>({kind:g.kind,unit:g.unit}))];
 ctx.pierceLeft=b.terrain?.id==='T06'?0:ctx.pierce;
 const hits=[];
 for(const [hitIndex,planned] of targets.entries()){
  ctx.royalFirstShot=hitIndex===0;
  if(hitIndex>0&&cancelPrismaSecondaryHit(b,ctx,events,planned,selected))continue;
  const redirected=redirectFleetHit(b,ctx,events,planned);
  const {kind,unit}=redirected;
  if(blockNebulaRepeat(b,ctx,events,redirected))continue;
  if(!unitAlive(unit)||blockHit(b,defender,kind,unit,ctx,events))continue;
  if(stormNetStops(b,ctx,events,redirected))continue;
  const amount=stormConsumeHeavy(b,ctx,events,redirected,
   mantaFork?1:planned.kind==='part'||planned.kind==='module'||redirected.royalSameDamage?1:
   power+(kind==='escort'&&redirected.stormOriginKind!=='machine'&&b.terrain?.id==='T04'?1:0));
  const damage=royalDistributeDamage(b,ctx,events,defender,kind,unit,
   sharkCapDamage(b,defender,kind,unit,
   mantaCapDamage(b,defender,kind,unit,amount,events),events));
  if(damage){
   hits.push({id:unit.id,kind,slot:unit.slot,damage,destroyed:unit.destroyed,
    name:kind==='part'?VITAL_LABELS[unit.id]:unit.name});
   onLinceDamage(b,ctx,events,{kind,unit,damage},order,kind==='part'&&ctx.bypass);
   onCorvoDamage(b,ctx,events,{kind,unit,damage},null);
   onSharkAttackHit(b,ctx,events,{kind,unit,damage});
   stormOnHit(b,ctx,events,{kind,unit,damage});
   chargeMantaOnDamage(b,ctx.who,damage,events);
  }
 }
 const damage=hits.filter(h=>h.kind==='part').reduce((sum,h)=>sum+h.damage,0);
 const escortDamage=hits.filter(h=>h.kind==='escort').reduce((sum,h)=>sum+h.damage,0);
 const machineDamage=hits.filter(h=>h.kind==='machine').reduce((sum,h)=>sum+h.damage,0);
 const moduleDamage=hits.filter(h=>h.kind==='module').reduce((sum,h)=>sum+h.damage,0);
 const main=selected.unit,targetKind=selected.kind;
 const data={shipIndex:0,shipName:enemy.name,partId:targetKind==='part'?main.id:order.partId||null,
  targetKind,targetId:main.id,damage,escortDamage,machineDamage,moduleDamage,destroyed:main.destroyed,
  escortSlot:targetKind==='escort'?main.slot:null,machineSlot:targetKind==='machine'?main.slot:null,
  escortName:targetKind==='escort'?main.name:null,escortDestroyed:targetKind==='escort'&&main.destroyed,
  played:visiblePlayed(ctx.cards),targets:hits,terrainBonus:terrain.value,power,emergency};
 events.push(emit(b,ctx.who,'impact',hits.length?'Attacco: '+hits.map(h=>h.name+' −'+h.damage).join(', '):'Tutti i colpi sono stati bloccati',data));
 triggerReactions(b,ctx.who,damage+escortDamage+machineDamage+moduleDamage,events);
 return data;
}
function finishTurn(b,ctx,events){
 royalSovereignTurn(b,ctx,events);
 stormEndOwnTurn(b,ctx,events);
 mantaNavigatorTurn(b,ctx,events);
 const side=b.sides[ctx.who];side.turnCount++;refill(b,side);
 side.lastPlayed=visiblePlayed(ctx.cards);b.ply++;b.round=1+Math.floor(b.ply/2);b.turn=other(ctx.who);
 b.terrain=activeTerrain(b.terrain,b.ply);
 for(const [id,side] of Object.entries(b.sides)){
  expireSide(side,b.ply);corvoSafetySwitch(b,id,events);
 }
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
 for(const [id,s] of Object.entries(b.sides)){
  expireSide(s,b.ply);corvoSafetySwitch(b,id,events);
 }
 const cards=takeCards(side,order.cards||[]);
 const ctx={who,nowMs,order,cards:[],auroraAttacks:[],linceAttacks:[],prismaAttacks:[],corvoAttacks:[],
  falcoReleased:false,falcoPrepared:false,falcoCalibration:null,mantaAttacks:[],mantaSilence:false,
  sharkAttacks:[],sharkPierceLeft:0,sharkBypass:false,sharkLureUsed:false,sharkPrimary:null,
  nebulaAttacks:[],nebulaPierceLeft:0,nebulaUnredirectableCardId:null,
  stormAttacks:[],stormSinglePierceLeft:0,stormEscortVictims:new Set(),
  royalAttacks:[],royalSupportCommand:false,royalRelay:false,
  royalMotherShot:false,royalLanceUsed:false,royalSplitExtra:0,
  stormHitIds:new Set(),stormSuppressChain:false,stormFrontUsed:false,stormChainPlan:null,
  nebulaVolleySerial:0,nebulaSeen:new Map(),
  bypassPlayed:false,
  power:0,pierce:0,bypass:false,multiTargets:1,pierceLeft:0,effectSerial:0};
 if(!order.pass){
  const planned=selectedEnemyTarget(b.sides[other(who)],order,b.ply);
  ctx.sharkPrimary=planned?{kind:planned.kind,id:planned.unit.id}:null;
  const enemies=stormUnits(b.sides[other(who)],b.ply);
  const picked=enemies.find(t=>t.kind===order.stormChainTargetKind&&
   t.unit.id===order.stormChainTargetId&&t.unit.id!==planned?.unit.id)||
   enemies.find(t=>t.unit.id!==planned?.unit.id);
  ctx.stormChainPlan=picked?{kind:picked.kind,id:picked.unit.id}:null;
 }
 for(const charge of side.charges.filter(c=>c.atPly===b.ply))ctx.power+=charge.amount;
 side.charges=side.charges.filter(c=>c.atPly>b.ply);
 // Il Caricatore annulla una carica prima del suo rilascio automatico.
 const priority=id=>card(id)?.effectSpec?.type==='falco'&&
  card(id).effectSpec.action==='emergency-loader';
 for(const id of cards.filter(priority))if(applyCard(b,who,id,ctx,events,order))ctx.cards.push(id);
 const releasedShot=falcoReleaseAtTurnStart(b,who,ctx,events,order);
 // Terreno e Personaggio Falco precedono la preparazione.
 for(const id of cards.filter(id=>cardRole(id)==='terrain'))
  if(applyCard(b,who,id,ctx,events,order))ctx.cards.push(id);
 applyCharacterRepeat(b,who,ctx,events);
 for(const id of cards.filter(id=>id==='ex-r01-01'))
  if(applyCard(b,who,id,ctx,events,order))ctx.cards.push(id);
 const after=cards.filter(id=>cardRole(id)!=='terrain'&&!priority(id)&&
  id!=='ex-r01-01');
 nebulaHideForTurn(b,ctx,events,order); // Occultamento precede eventuale Ago nello stesso turno
 after.sort((x,y)=>Number(isFalcoPreparation(y))-Number(isFalcoPreparation(x)));
 for(const id of after)if(applyCard(b,who,id,ctx,events,order))ctx.cards.push(id);
 nebulaArchonTerrainTrade(b,ctx,events,order);
 nebulaRevealOnOwnTurn(b,ctx,events);
 processHelios(b,who,ctx,events,order);
 applyBossPassive(b,ctx,events);escortPassive(b,side,ctx,events,order);
 side.stagedComboCards=[];side.attackSlots=ctx.cards.filter(id=>cardRole(id)==='attack').slice(0,3);
 const ownShot=order.pass?{damage:0,played:visiblePlayed(ctx.cards)}:
  ctx.falcoCalibration?falcoCalibrationShot(b,ctx,events,order):
  ctx.falcoPrepared||ctx.falcoReleased?{damage:0,played:visiblePlayed(ctx.cards)}:
  ctx.corvoAttacks.length?resolveCorvoShots(b,ctx,events,order):
  ctx.mantaAttacks.length?resolveMantaShots(b,ctx,events,order):
  ctx.sharkAttacks.length?resolveSharkShots(b,ctx,events,order):
  ctx.nebulaAttacks.length?resolveNebulaShots(b,ctx,events,order):
  ctx.stormAttacks.length?resolveStormShots(b,ctx,events,order):
  ctx.royalAttacks.length?resolveRoyalShots(b,ctx,events,order):
  ctx.prismaAttacks.length?resolvePrismaShots(b,ctx,events,order):
  ctx.linceAttacks.length?resolveLinceShots(b,ctx,events,order):
  ctx.auroraAttacks.length?resolveAuroraShots(b,ctx,events,order,ctx.auroraAttacks):
  resolveAuroraShots(b,ctx,events,order)||resolveSalvo(b,ctx,events,order);
 const shot=mergeFalcoShots(releasedShot,ownShot);
 side.lastDamage=(shot.damage||0)+(shot.escortDamage||0)+(shot.machineDamage||0)+(shot.moduleDamage||0);
 side.discard.push(...ctx.cards.filter(id=>!['character','defense'].includes(cardRole(id))&&card(id)?.effectSpec?.type!=='deployMachine'&&!isAuroraModule(id)&&!isLinceModule(id)&&!isPrismaModule(id)&&!isCorvoModule(id)&&!isFalcoModule(id)&&!isFalcoPreparation(id)&&!isMantaModule(id)&&!isSharkModule(id)&&!isNebulaModule(id)&&!isStormModule(id)&&!isRoyalModule(id)));
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
  const attack=c.def.effectSpec;
  const direct=attack?.type==='lince'&&LINCE_BYPASS_ACTIONS.includes(attack.action)||
   attack?.type==='shark'&&attack.action==='ruthless-response';
  const short=attack?.type==='corvo'&&attack.action==='targeted-short'||
   attack?.type==='manta'&&attack.action==='total-discharge';
  const machine=enemy.machines?.find(u=>unitAlive(u));
  const target=short&&machine?{targetKind:'machine',targetId:machine.id,
   machineSlot:machine.slot,partId:part?.id}:direct&&part?
   {targetKind:'part',targetId:part.id,partId:part.id}:defaultOrder;
  const alreadyDirect=cards.some(i=>card(side.hand[i]).effectSpec?.type==='lince'&&
   LINCE_BYPASS_ACTIONS.includes(card(side.hand[i]).effectSpec?.action)||
   card(side.hand[i]).effectSpec?.type==='shark'&&
   card(side.hand[i]).effectSpec?.action==='ruthless-response');
  const preview=alreadyDirect&&part?{targetKind:'part',targetId:part.id,partId:part.id}:target;
  if(validateFleetTurn(b,who,{...preview,ownPartId,cards:[...cards,c.i],pass:!part}))continue;
  cards.push(c.i);
 }
 const bypass=cards.some(i=>card(side.hand[i]).effectSpec.type==='bypass'||
  card(side.hand[i]).effectSpec.type==='lince'&&
  LINCE_BYPASS_ACTIONS.includes(card(side.hand[i]).effectSpec.action)||
  card(side.hand[i]).effectSpec.type==='shark'&&
  card(side.hand[i]).effectSpec.action==='ruthless-response');
 const marked=side.lince?.route?.usePly===b.ply?
  enemy.ships[0].parts.find(p=>p.id===side.lince.route.partId&&!p.destroyed):null;
 const hasShort=cards.some(i=>side.hand[i]==='nx-c03-07'||side.hand[i]==='nx-r02-09');
 const shortTarget=enemy.machines?.find(m=>unitAlive(m));
 const target=hasShort&&shortTarget?
  {targetKind:'machine',targetId:shortTarget.id,machineSlot:shortTarget.slot,
   partId:part?.id}:(bypass&&part||marked&&!cards.some(i=>card(side.hand[i]).effectSpec.type==='lince'&&
  LINCE_ATTACK_ACTIONS.includes(card(side.hand[i]).effectSpec.action)))?
  {targetKind:'part',targetId:(marked||part).id,partId:(marked||part).id}:defaultOrder;
 const helm=side.commander?.id==='ex-c01-01'||cards.some(i=>side.hand[i]==='ex-c01-01');
 const machines=(side.machines||[]).filter(unitAlive);
 const nebulaAiHide=side.ships[0].id==='E01'&&
  !cards.some(i=>card(side.hand[i])?.effectSpec?.action==='wandering-mist')&&
  !nebulaHideReason(side,b.ply);
 const nebulaAiEscort=nebulaAiHide?nebulaVisibleSupports(side,b.ply)[0]:null;
 return {...target,ownPartId,cards,pass:!part,
  nebulaHide:!!nebulaAiEscort,nebulaHideEscortId:nebulaAiEscort?.id,
  heliosTrade:helm&&bypass&&side.hand.length>cards.length,
  radentRecall:bypass&&installedModule(side,'utility')?.cardId==='nx-c01-01'&&machines.length>0,
  radentMachineId:machines[0]?.id,
  linceRecallWeapon:cards.some(i=>side.hand[i]==='nx-c01-09')&&
   installedModule(side,'weapon')?.hp<installedModule(side,'weapon')?.maxHp};
}
export function timeoutFleetTurn(battle,nowMs){
 if(battle.phase!=='playing'||nowMs<battle.deadlineMs)return {ok:false,battle,events:[]};
 return resolveFleetNextTurn(battle,battle.turn,{partId:null,cards:[],pass:true},nowMs);
}
