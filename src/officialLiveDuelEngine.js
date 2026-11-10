// Motore ufficiale live: turni alternati da 30s. Le vecchie risoluzioni
// simultanee restano isolate per compatibilita' dei salvataggi/test storici.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {TACTICAL_SPECIALS} from './simultaneousDuelEngine.js';
import {VITAL_IDS,damageMotherShield,restoreMotherShield,exposeMotherPart,
 hitMotherPart,remainingExposureSlots,motherDestroyed} from './vitalDefense.js';
import {tacticalSignatureOperation,tacticalSignatureSlotCount} from './tacticalShipSignatures.js';
import {isPvpTerrain,pvpTerrainDefinition,pvpTerrainEffects,pvpTerrainRepairAmount} from './pvpTerrainCards.js';
import {isBossCharacterCard,activateBossCharacter,expireBossCharacter,
 bossCharacterNativeBonus,bossCharacterShieldFactor} from './bossCharacterCards.js';
import {gunEfficiency,escortInterceptionEfficiency} from './fleetSystems.js';
import {TACTICAL_VITAL_EFFECTS} from './tacticalVitalConsequences.js';
import {VULNERABILITY_RIFT_CARD_ID,riftProtectedDamage} from './tacticalVulnerabilityRift.js';
import {hitMotherPartThroughRift} from './vitalDefense.js';

export const LIVE_TURN_MS=30000;
export const LIVE_NUMERIC_LIMIT=3;
export const LIVE_SPECIAL_LIMIT=2;
export const LIVE_MAX_TURNS=40;
const other=k=>k==='A'?'B':'A';
const copy=v=>structuredClone(v);
const keys=['A','B'];
const SUIT_CODES=Object.freeze({'♥':'H','♦':'D','♣':'C','♠':'S'});
const TRAP_CARDS=Object.freeze({
 'tactic-reactive':'flat-shield','tactic-impact':'percent-shield',
 'tactical-cover':'escort-cover','tactic-counter':'vital-counter'
});
const DIRECT_SPECIALS=new Set(['support-shield-repair','support-escort-repair',
 'tactic-scan','tactic-numeric-recycle','support-status-purge',
 'tactic-power-shift','tactic-kinetic','shot-piercing','shot-ion',
 'shot-corrosion','tactic-suppress','fusion-barrier','fusion-strike',
 'fusion-twin','fusion-triad']);
const initialZones=()=>({character:null,traps:[null,null],open:[null,null]});
const initialBuilds=()=>Object.fromEntries(VITAL_IDS.map(id=>[id,[]]));
const remaining=(b,k)=>b.sides[k].numeric.hand.length;
export function supportedLiveSpecial(type){
 return type===VULNERABILITY_RIFT_CARD_ID||!!TRAP_CARDS[type]||DIRECT_SPECIALS.has(type)||isBossCharacterCard(type)||isPvpTerrain(type);
}
export function createOfficialLiveDuel(initial,nowMs=0){
 if(!initial?.sides?.A||!initial?.sides?.B)throw new TypeError('Duello ufficiale non valido');
 const battle=copy(initial);
 for(const k of ['A','B'])battle.sides[k].liveWeaponCharges={};
 return {...battle,live:true,phase:'playing',activeSide:'A',turn:1,round:1,
  deadlineMs:nowMs+LIVE_TURN_MS,resolveUntilMs:null,
  actionUsed:{numeric:0,special:0},zones:{A:initialZones(),B:initialZones()},
  vitalBuilds:{A:initialBuilds(),B:initialBuilds()},pendingShot:{A:null,B:null},
  history:[],winner:null,lastEvents:['Turno 1 · TU · 30 secondi per agire in diretta'],
  orders:{A:null,B:null},aiReadyAtMs:nowMs+650};
}
function consume(pile,index){
 const [card]=pile.hand.splice(index,1);
 pile.discard.push(card);
 return card;
}
function nextDraw(pile,size=7){
 while(pile.hand.length<size){
  if(!pile.deck.length){
   if(!pile.discard.length)break;
   pile.deck=pile.discard.splice(0);
  }
  pile.hand.push(pile.deck.shift());
 }
}
function event(b,message,kind='info',payload={}){
 b.lastEvents=[...b.lastEvents.slice(-24),message];
 b.history.push({turn:b.turn,by:b.activeSide,kind,message,...payload});
}
function closeIfWon(b){
 const a=motherDestroyed(b.sides.A.defense),z=motherDestroyed(b.sides.B.defense);
 if(a||z){b.winner=a&&z?'draw':a?'B':'A';b.phase='finished';}
}
export function finishOfficialLiveTurn(battle,nowMs=0){
 if(!battle?.live||battle.phase!=='playing')return battle;
 const b=copy(battle),previous=b.activeSide;
 b.zones[previous].open=[null,null];
 b.pendingShot[previous]=null;
 b.turn++;
 if(b.turn>LIVE_MAX_TURNS){b.phase='finished';b.winner='draw';event(b,'Limite turni raggiunto: pareggio');return b;}
 b.activeSide=other(previous);
 b.round=Math.ceil(b.turn/2);
 b.deadlineMs=nowMs+LIVE_TURN_MS;
 b.aiReadyAtMs=nowMs+850;
 b.actionUsed={numeric:0,special:0};
 nextDraw(b.sides[b.activeSide].numeric,7);
 nextDraw(b.sides[b.activeSide].special,5);
 expireBossCharacter(b.sides[b.activeSide],b.round);
 if(!b.sides[b.activeSide].bossCharacter)b.zones[b.activeSide].character=null;
 event(b,'Turno '+b.turn+' · '+(b.activeSide==='A'?'TU':'AVVERSARIO')+' · 30 secondi');
 return b;
}
export function advanceOfficialLiveDuel(battle,nowMs=0){
 if(!battle?.live||battle.phase==='finished'||nowMs<battle.deadlineMs)return battle;
 return finishOfficialLiveTurn(battle,nowMs);
}
function reject(battle,reason){return {ok:false,reason,battle};}
function weaponForCard(side,card,escortIndex=null){
 if(escortIndex!=null&&(!side.escorts[escortIndex]||side.escorts[escortIndex].hp<=0))return null;
 const suit=SUIT_CODES[card?.suit];if(!suit)return null;
 const guns=PHASE1_CATALOG.weapons.filter(w=>w.nave_id===side.shipId);
 const charges=side.liveWeaponCharges||{};
 const pending=guns.filter(w=>{
  const loaded=charges[w.id];
  if(!loaded?.values?.length||w.tipo==='Immediata'||w.tipo==='Accumulo')return false;
  const needed=w.combo.split('@')[0].split('+');
  return needed.includes(suit)&&!loaded.suits.includes(suit);
 });
 const possible=pending.length?pending:guns.filter(w=>w.seme_trigger==='*'||w.seme_trigger===suit);
 if(!possible.length)return null;
 const chosen=possible.slice().sort((a,b)=>b.danno_colpo_L1-a.danno_colpo_L1)[0];
 const installed=side.weapons.find(w=>w.id===chosen.id);
 return {weapon:chosen,damage:installed?.damage??chosen.danno_colpo_L1};
}
export function liveCompatibleShips(side,card){
 return [{id:'mother',label:side.name,compatible:!!weaponForCard(side,card)},...
  side.escorts.map((e,i)=>({id:'escort-'+i,label:'Scudiera '+(i+1),
   compatible:!!weaponForCard(side,card,i)}))];
}
function runTraps(b,defenderKey,trigger,damage,vital=null){
 const owner=b.sides[defenderKey],slots=b.zones[defenderKey].traps;
 let value=damage,blocked=false;
 for(let i=0;i<slots.length;i++){
  const card=slots[i];if(!card)continue;
  const type=card.type;let activated=false;
  if(trigger==='shield'&&type==='tactic-reactive'&&value>0){
   value=Math.max(0,value-9);activated=true;
  }else if(trigger==='shield'&&type==='tactic-impact'&&value>0){
   value=Math.floor(value*.8);activated=true;
  }else if(trigger==='shield'&&type==='tactical-cover'&&value>0&&
   owner.escorts.some(e=>e.hp>0)&&owner.defense.parts.command.hp>0){
   const escort=owner.escorts.find(e=>e.hp>0);
   const taken=Math.min(escort.hp,Math.floor(value*.75));
   escort.hp-=taken;value-=taken;activated=taken>0;
  }else if(trigger==='vital'&&type==='tactic-counter'&&
   (!card.target||card.target===vital)){
   blocked=true;activated=true;
  }
  if(activated){
   slots[i]=null;owner.special.discard.push(card);
   event(b,defenderKey+': trappola '+TACTICAL_SPECIALS[type].name+' attivata in risposta a '+trigger,
    'trap',{type,trigger});
  }
 }
 return {damage:value,blocked};
}
function fireNumeric(b,key,card,shipId){
 const attacker=b.sides[key],defenderKey=other(key),enemy=b.sides[defenderKey];
 const escortMatch=/^escort-(\d+)$/.exec(shipId||'mother');
 const escortIndex=escortMatch?Number(escortMatch[1]):null;
 if(shipId!=='mother'&&escortIndex==null)return {ok:false,reason:'invalid_ship'};
 const profile=weaponForCard(attacker,card,escortIndex);
 if(!profile)return {ok:false,reason:'suit_incompatible'};
 // Le categorie originali W01–W42 non diventano spari automatici.
 const w=profile.weapon,charges=attacker.liveWeaponCharges||(attacker.liveWeaponCharges={});
 const previous=charges[w.id]||{values:[],suits:[],startedRound:b.round};
 const suit=SUIT_CODES[card.suit];
 let totalValue=card.value;
 if(w.tipo==='Accumulo'){
  totalValue=previous.values.reduce((sum,v)=>sum+v,card.value);
  if(totalValue<w.soglia_munizioni){
   charges[w.id]={values:[...previous.values,card.value],suits:[],startedRound:b.round};
   event(b,key+': '+w.nome+' in accumulo · '+totalValue+'/'+w.soglia_munizioni,
    'weapon_charge',{weaponId:w.id,charge:totalValue,threshold:w.soglia_munizioni});
   return {ok:true,charging:true,weaponId:w.id};
  }
  delete charges[w.id];
 }else if(w.tipo==='Combo simultanea'||w.tipo==='Combo a memoria'){
  const needed=w.combo.split('@')[0].split('+');
  const maxRounds=w.tipo==='Combo a memoria'?Number(w.combo.split('@')[1])||4:1;
  const stored=b.round-previous.startedRound<maxRounds?previous:
   {values:[],suits:[],startedRound:b.round};
  if(stored.suits.includes(suit))return {ok:false,reason:'combo_suit_already_loaded'};
  const suits=[...stored.suits,suit],values=[...stored.values,card.value];
  if(!needed.every(x=>suits.includes(x))){
   charges[w.id]={values,suits,startedRound:stored.startedRound};
   event(b,key+': '+w.nome+' · '+suits.join('+')+' / '+needed.join('+'),
    'weapon_charge',{weaponId:w.id,suits,needed});
   return {ok:true,charging:true,weaponId:w.id};
  }
  totalValue=values.reduce((sum,value)=>sum+value,0);
  delete charges[w.id];
 }
 let packet=Math.max(1,Math.floor(totalValue*profile.damage*
  gunEfficiency(attacker.defense,escortIndex==null?'mother':'escort')));
 const queued=b.pendingShot[key];
 if(queued){
  if(queued.power)packet+=queued.power;
  if(queued.fusion)packet=Math.floor(packet*(1+queued.fusion));
 }
 const bossCharacter=bossCharacterNativeBonus(attacker,enemy,b.round,packet);
 packet+=bossCharacter.extra||0;
 if(enemy.corroded){packet+=Math.floor(packet*.25);enemy.corroded=false;}
 if(enemy.livePowerShiftDebt){packet+=enemy.livePowerShiftDebt;enemy.livePowerShiftDebt=0;}
 const terrain=pvpTerrainEffects(b.activeTerrain,b.round);
 packet=Math.floor(packet*terrain.nativeFactor);
 let intercepted=0;
 if(!queued?.piercing&&escortInterceptionEfficiency(enemy.defense)>0){
  for(const escort of enemy.escorts){
   if(escort.hp<=0)continue;
   if(queued?.suppress){break;}
   const taken=Math.min(escort.hp,Math.floor(packet*.2*escortInterceptionEfficiency(enemy.defense)*terrain.escortFactor));
   escort.hp-=taken;intercepted+=taken;
  }
 }
 let motherPacket=Math.max(0,packet-intercepted);
 const traps=runTraps(b,defenderKey,'shield',motherPacket);
 motherPacket=Math.floor(traps.damage*terrain.shieldFactor*bossCharacterShieldFactor(enemy,b.round));
 const hit=damageMotherShield(enemy.defense,motherPacket);
 enemy.defense=hit.defense;
 if(hit.damage>0&&queued?.ion)enemy.ionized=true;
 if(hit.damage>0&&queued?.corrosion)enemy.corroded=true;
 b.pendingShot[key]=null;
 event(b,key+': '+profile.weapon.nome+' · carica '+totalValue+' · '+hit.damage+
  ' danni barriera ('+intercepted+' intercettati)','shot',
  {card,shipId,weaponId:profile.weapon.id,damage:hit.damage});
 b.sides[key].sync=Math.min(100,b.sides[key].sync+(hit.damage>0?20:5));
 return {ok:true,damage:hit.damage,weaponId:profile.weapon.id};
}
function placeVital(b,key,card,vitalId){
 const defender=b.sides[other(key)],part=defender.defense.parts[vitalId];
 const attacker=b.sides[key],rift=!!attacker.liveRift&&!part?.exposed;
 if(!part||part.hp<=0)return {ok:false,reason:'vital_unavailable'};
 if(!part.exposed&&!rift)return {ok:false,reason:'vital_protected'};
 const list=b.vitalBuilds[key][vitalId];
 if(list.length>=tacticalSignatureSlotCount(part.signature))return {ok:false,reason:'vital_slots_full'};
 list.push(card);
 event(b,key+': '+card.value+card.suit+' nello slot '+vitalId+' ('+list.length+'/5)','vital_card');
 const op=tacticalSignatureOperation(part.signature,list);
 if(!op)return {ok:true,completed:false};
 const defended=runTraps(b,other(key),'vital',0,vitalId);
 if(defended.blocked){
  b.sides[key].numeric.discard.push(...list);
  b.vitalBuilds[key][vitalId]=[];
  event(b,other(key)+': precisione su '+vitalId+' annullata dalla Contromisura','counter');
  return {ok:true,completed:false,countered:true};
 }
 const impact=rift?hitMotherPartThroughRift(defender.defense,vitalId,riftProtectedDamage(part.hp,true),list):
  hitMotherPart(defender.defense,vitalId,part.hp,list);
 if(!impact.damage)return {ok:false,reason:impact.reason};
 defender.defense=impact.defense;
 if(rift)attacker.liveRift=false;
 b.sides[key].numeric.discard.push(...list);
 b.vitalBuilds[key][vitalId]=[];
 b.sides[key].sync=Math.min(100,b.sides[key].sync+25);
 event(b,key+': combinazione '+op+' completata · '+vitalId.toUpperCase()+
  (impact.destroyed?' DISTRUTTO · esplosione diretta':' colpito per '+impact.damage+' HP'),
  impact.destroyed?'vital_destroyed':'vital_hit',{vitalId,op,damage:impact.damage});
 if(impact.destroyed){
  event(b,other(key)+': '+TACTICAL_VITAL_EFFECTS[vitalId].destroyed);
  if(vitalId==='shieldGenerator')
   defender.defense=damageMotherShield(defender.defense,defender.defense.shield.hp).defense;
 }
 closeIfWon(b);
 return {ok:true,completed:true,op};
}
function playSpecial(b,key,index,slot,target){
 const side=b.sides[key],card=side.special.hand[index],type=card.type;
 const opposite=b.sides[other(key)];
 if(!supportedLiveSpecial(type))return {ok:false,reason:'special_pending_migration'};
 if(isPvpTerrain(type)){
  if(slot!=='terrain'||b.mode!=='pvp'||b.sides.B.bossPlanetId!=null)return {ok:false,reason:'terrain_pvp_only'};
  const terrain=pvpTerrainDefinition(type);
  b.activeTerrain={id:type,startedRound:b.round,untilRound:999999};
  side.special.hand.splice(index,1);side.special.discard.push(card);
  event(b,key+': terreno '+terrain.name+' attivo immediatamente, finche non viene sostituito','terrain',{type});
  return {ok:true};
 }
 if(isBossCharacterCard(type)){
  if(slot!=='character'||b.zones[key].character)return {ok:false,reason:'character_slot_busy'};
  const result=activateBossCharacter(side,type,b.round);
  if(!result.ok)return result;
  side.special.hand.splice(index,1);side.special.discard.push(card);
  b.zones[key].character={type,untilRound:side.bossCharacter.untilRound};
  event(b,key+': personaggio '+result.character.name+' attivato','character',{type});
  return {ok:true};
 }
 if(Object.hasOwn(TRAP_CARDS,type)){
  const match=/^trap-([01])$/.exec(slot||'');
  if(!match)return {ok:false,reason:'trap_slot_required'};
  const i=Number(match[1]);
  if(b.zones[key].traps[i])return {ok:false,reason:'trap_slot_busy'};
  if(b.zones[key].traps.some(t=>t?.type===type))return {ok:false,reason:'duplicate_trap_effect'};
  side.special.hand.splice(index,1);
  b.zones[key].traps[i]={...card,target:type==='tactic-counter'?target??null:null};
  event(b,key+': trappola coperta posizionata nello slot '+(i+1),'trap_placed');
  return {ok:true};
 }
 if(!/^open-[01]$/.test(slot||''))return {ok:false,reason:'open_slot_required'};
 const i=Number(slot.slice(-1));
 if(b.zones[key].open[i])return {ok:false,reason:'open_slot_busy'};
 if(type==='support-shield-repair'){
  if(side.defense.parts.shieldGenerator.hp===0||side.defense.shield.hp===side.defense.shield.max)
   return {ok:false,reason:'repair_unavailable'};
  side.defense=restoreMotherShield(side.defense,pvpTerrainRepairAmount(20,pvpTerrainEffects(b.activeTerrain,b.round))).defense;
 }else if(type==='support-escort-repair'){
  const escort=side.escorts.find(e=>e.hp>0&&e.hp<e.max);
  if(!escort)return {ok:false,reason:'escort_repair_unavailable'};
  escort.hp=Math.min(escort.max,escort.hp+15);
 }else if(type==='tactic-scan'){
  side.seen=[...new Set([...side.seen,...VITAL_IDS.filter(id=>!side.seen.includes(id)).slice(0,2)])];
 }else if(type==='tactic-numeric-recycle'){
  if(side.numeric.hand.length===7)return {ok:false,reason:'recycle_unavailable'};
  nextDraw(side.numeric,7);
 }else if(type==='support-status-purge'){
  side.ionized=false;side.corroded=false;side.heated=false;
 }else if(type===VULNERABILITY_RIFT_CARD_ID){
  if(side.riftUsed)return {ok:false,reason:'rift_already_used'};
  side.riftUsed=true;side.liveRift=true;
 }else if(type.startsWith('fusion-')){
  const need=type==='fusion-twin'||type==='fusion-triad'?2:1;
  if(side.sync<100||side.escorts.filter(e=>e.hp>0).length<need||
   side.defense.parts.command.hp===0||side.defense.parts.engine.hp===0)
   return {ok:false,reason:'fusion_unavailable'};
  side.sync-=100;
  b.pendingShot[key]={...(b.pendingShot[key]||{}),
   fusion:type==='fusion-triad'?.35:type==='fusion-strike'?.25:0};
 }else{
  const p=b.pendingShot[key]||{};
  if(type==='tactic-power-shift'||type==='tactic-kinetic')p.power=(p.power||0)+6;
  if(type==='tactic-power-shift')side.livePowerShiftDebt=(side.livePowerShiftDebt||0)+3;
  if(type==='shot-piercing')p.piercing=true;
  if(type==='tactic-suppress')p.suppress=true;
  if(type==='shot-ion')p.ion=true;
  if(type==='shot-corrosion')p.corrosion=true;
  b.pendingShot[key]=p;
 }
 side.special.hand.splice(index,1);side.special.discard.push(card);
 b.zones[key].open[i]={type};
 event(b,key+': '+TACTICAL_SPECIALS[type].name+' attivata in diretta','special',{type});
 return {ok:true};
}
export function applyOfficialLiveAction(battle,key,action,nowMs=0){
 if(!battle?.live||battle.phase!=='playing'||battle.activeSide!==key)
  return reject(battle,'not_your_turn');
 if(!Number.isFinite(nowMs)||nowMs>=battle.deadlineMs)
  return reject(battle,'turn_expired');
 if(!action||typeof action.type!=='string')return reject(battle,'invalid_action');
 if(action.type==='end')return {ok:true,battle:finishOfficialLiveTurn(battle,nowMs)};
 const b=copy(battle),side=b.sides[key];
 if(action.type==='expose'){
  const enemy=b.sides[other(key)],id=action.vitalId;
  if(!VITAL_IDS.includes(id)||enemy.defense.parts[id].hp<=0)return reject(battle,'vital_unavailable');
  if(remainingExposureSlots(enemy.defense)<=0)return reject(battle,'shield_threshold_not_reached');
  const revealed=exposeMotherPart(enemy.defense,id);
  if(!revealed.exposed)return reject(battle,'shield_threshold_not_reached');
  enemy.defense=revealed.defense;
  event(b,key+': bersaglio '+id+' esposto alla soglia barriera','vital_exposed',{vitalId:id});
  return {ok:true,battle:b};
 }
 if(action.type==='clearVital'){
  const id=action.vitalId;
  if(!VITAL_IDS.includes(id)||!b.vitalBuilds[key][id].length)return reject(battle,'vital_empty');
  side.numeric.discard.push(...b.vitalBuilds[key][id]);
  b.vitalBuilds[key][id]=[];
  event(b,key+': combinazione di '+id+' annullata, carte agli scarti');
  return {ok:true,battle:b};
 }
 if(action.type==='numeric'){
  if(b.actionUsed.numeric>=LIVE_NUMERIC_LIMIT)return reject(battle,'numeric_turn_limit');
  const index=action.index;
  if(!Number.isInteger(index)||index<0||index>=side.numeric.hand.length)return reject(battle,'numeric_not_in_hand');
  const card=side.numeric.hand[index];
  if(action.target==='ship'){
   const shipId=action.shipId||'mother';
   if(!weaponForCard(side,card,shipId==='mother'?null:
     /^escort-[01]$/.test(shipId)?Number(shipId.at(-1)):-1))
    return reject(battle,'suit_incompatible');
   const fired=fireNumeric(b,key,card,shipId);
   if(!fired.ok)return reject(battle,fired.reason);
   consume(side.numeric,index);
  }else if(action.target==='vital'){
   if(!VITAL_IDS.includes(action.vitalId))return reject(battle,'vital_unavailable');
   if(!b.sides[other(key)].defense.parts[action.vitalId].exposed&&!side.liveRift)
    return reject(battle,'vital_protected');
   side.numeric.hand.splice(index,1);
   const placed=placeVital(b,key,card,action.vitalId);
   if(!placed.ok)return reject(battle,placed.reason);
  }else return reject(battle,'invalid_numeric_target');
  b.actionUsed.numeric++;
  return {ok:true,battle:b};
 }
 if(action.type==='special'){
  if(b.actionUsed.special>=LIVE_SPECIAL_LIMIT)return reject(battle,'special_turn_limit');
  const index=action.index;
  if(!Number.isInteger(index)||index<0||index>=side.special.hand.length)return reject(battle,'special_not_in_hand');
  const played=playSpecial(b,key,index,action.slot,action.vitalId);
  if(!played.ok)return reject(battle,played.reason);
  b.actionUsed.special++;
  return {ok:true,battle:b};
 }
 return reject(battle,'invalid_action');
}
export function chooseOfficialLiveAiAction(battle){
 if(!battle?.live||battle.phase!=='playing'||battle.activeSide!=='B')return null;
 const me=battle.sides.B,enemy=battle.sides.A;
 if(battle.actionUsed.numeric<LIVE_NUMERIC_LIMIT){
  for(const id of VITAL_IDS){
   const target=enemy.defense.parts[id];
   if(!target||target.hp<=0)continue;
   if(!target.exposed&&remainingExposureSlots(enemy.defense)>0)
    return {type:'expose',vitalId:id};
   if(target.exposed){
    const stored=battle.vitalBuilds.B[id];
    const matching=me.numeric.hand.findIndex(c=>stored.length<tacticalSignatureSlotCount(target.signature)&&(
     tacticalSignatureOperation(target.signature,[...stored,c])||
     stored.length<tacticalSignatureSlotCount(target.signature)-1));
    if(matching>=0)return {type:'numeric',index:matching,target:'vital',vitalId:id};
   }
  }
  const found=me.numeric.hand.findIndex(c=>weaponForCard(me,c));
  if(found>=0)return {type:'numeric',index:found,target:'ship',shipId:'mother'};
 }
 if(battle.actionUsed.special<LIVE_SPECIAL_LIMIT){
  for(const [index,card] of me.special.hand.entries()){
   const type=card.type;
   if(!supportedLiveSpecial(type))continue;
   const slot=isPvpTerrain(type)?'terrain':isBossCharacterCard(type)?'character':
    Object.hasOwn(TRAP_CARDS,type)?'trap-'+battle.zones.B.traps.findIndex(x=>!x):
    'open-'+battle.zones.B.open.findIndex(x=>!x);
   if(/-(-1)$/.test(slot)||slot==='character'&&battle.zones.B.character||
    slot==='terrain'&&battle.mode!=='pvp')continue;
   const probe=applyOfficialLiveAction(battle,'B',{type:'special',index,slot},battle.deadlineMs-1);
   if(probe.ok)return {type:'special',index,slot};
  }
 }
 return {type:'end'};
}
