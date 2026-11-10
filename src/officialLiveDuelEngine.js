// Motore ufficiale live: turni alternati da 30s. Le vecchie risoluzioni
// simultanee restano isolate per compatibilita' dei salvataggi/test storici.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {TACTICAL_SPECIALS} from './simultaneousDuelEngine.js';
import {VITAL_IDS,damageMotherShield,restoreMotherShield,exposeMotherPart,
 hitMotherPart,remainingExposureSlots,motherDestroyed} from './vitalDefense.js';
import {tacticalSignatureOperation,tacticalSignatureSlotCount} from './tacticalShipSignatures.js';
import {findOfficialLiveVitalCompletion} from './officialLiveAiPlanning.js';
import {isPvpTerrain,pvpTerrainDefinition,pvpTerrainEffects,pvpTerrainRepairAmount} from './pvpTerrainCards.js';
import {isBossCharacterCard,activateBossCharacter,expireBossCharacter,
 bossCharacterNativeBonus,bossCharacterShieldFactor,bossCharacterActive,
 bossCharacterRememberHit,bossCharacterApplyRegen,bossCharacterCounterSync,
 bossCharacterSyncExtra,bossCharacterEscortExtra} from './bossCharacterCards.js';
import {gunEfficiency,escortInterceptionEfficiency} from './fleetSystems.js';
import {prepareTacticalEscortVolley} from './tacticalEscortVolley.js';
import {TACTICAL_VITAL_EFFECTS} from './tacticalVitalConsequences.js';
import {VULNERABILITY_RIFT_CARD_ID,riftProtectedDamage} from './tacticalVulnerabilityRift.js';
import {hitMotherPartThroughRift} from './vitalDefense.js';
import {LIVE_LEGACY_TYPES,createLiveLegacy,playLiveLegacyCard,liveLegacyOnTurnStart,
 liveLegacyOnTurnEnd,liveLegacyOnNumericShot,liveLegacyOnNumericDiscard,
 liveLegacyOnNumericRecycle,liveLegacyOnVitalFormula,liveLegacySyncGain,
 liveLegacyOutgoingFactor,liveLegacyIncomingFactor} from './officialLiveLegacyCards.js';
import {isModuleCard,TACTICAL_MODULE_CARDS} from './tacticalEquipmentCards.js';
import {supportedLiveModule,initialLiveModuleEffects,playOfficialLiveModule} from './officialLiveModules.js';
import {liveBossStartTurn,liveBossIncomingShieldFactor,liveBossOnShieldHit,
 liveBossNativeModifiers,liveBossAfterNativeShot,liveBossOnCounter,
 liveBossOnVitalImpact,liveBossOnNumericCardsSpent,liveBossRepairValue,
 liveBossClearPoisonOnHeal} from './officialLiveBossPowers.js';
import {isTacticalEpic,tacticalEpicActive} from './tacticalEpicCards.js';
import {supportedLiveEpic,playLiveEpic,liveEpicBeforeDraw,liveEpicChoose,
 liveEpicOnShieldDamage,liveEpicRecycle,liveEpicOnVitalFormula,
 liveEpicMatriceBonus,liveEpicAfterMatriceShot} from './officialLiveEpics.js';
import {liveCommanderDefensePacket,liveCommanderRememberShot,
 liveCommanderRememberVital} from './officialLiveCommanderDefense.js';
import {liveCommanderArmFormula,liveCommanderNativeBonus,
 liveCommanderAfterNativeShot} from './officialLiveCommanderAttack.js';
import {liveNumericBossShieldFactor,liveNumericBossRememberShield,
 liveNumericBossNativeBonus,liveNumericBossAfterShot,liveNumericBossAfterVital,
 liveNumericBossArmFormula,
 liveNumericBossSyncBonus,liveNumericBossRepairAmount,liveNumericBossBeforeDraw,
 liveNumericBossEscortCooperation,
 liveNumericBossRememberEscortCooperation} from './officialLiveNumericBossPassives.js';
import {beginLiveFusion,liveFusionExpires,liveFusionBlocksEscort,
 interceptWithLiveFusion} from './officialLiveFusion.js';

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
 return type===VULNERABILITY_RIFT_CARD_ID||LIVE_LEGACY_TYPES.has(type)||supportedLiveModule(type)||supportedLiveEpic(type)||!!TRAP_CARDS[type]||DIRECT_SPECIALS.has(type)||isBossCharacterCard(type)||isPvpTerrain(type);
}
export function createOfficialLiveDuel(initial,nowMs=0){
 if(!initial?.sides?.A||!initial?.sides?.B)throw new TypeError('Duello ufficiale non valido');
 const battle=copy(initial);
 for(const k of ['A','B'])battle.sides[k].liveWeaponCharges={};
 return {...battle,live:true,phase:'playing',activeSide:'A',turn:1,round:1,
  deadlineMs:nowMs+LIVE_TURN_MS,resolveUntilMs:null,
  actionUsed:{numeric:0,special:0},zones:{A:initialZones(),B:initialZones()},
  vitalBuilds:{A:initialBuilds(),B:initialBuilds()},pendingShot:{A:null,B:null},liveLegacy:createLiveLegacy(),liveModuleEffects:initialLiveModuleEffects(),
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
   pile.recycleEvents=(pile.recycleEvents||0)+1;
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
 liveLegacyOnTurnEnd(b,previous);
 if(b.liveModuleEffects[previous].lockUntilTurn&&
    b.turn>=b.liveModuleEffects[previous].lockUntilTurn)
  b.liveModuleEffects[previous].lockUntilTurn=0;
 if(b.liveModuleEffects[previous].precisionUntilTurn&&
    b.turn>=b.liveModuleEffects[previous].precisionUntilTurn){
  b.liveModuleEffects[previous].precisionUntilTurn=0;
  b.liveModuleEffects[previous].precisionFactor=1;
 }
 liveBossOnNumericCardsSpent(b,previous,b.actionUsed.numeric,b.round);
 // Una Combo SIMULTANEA deve chiudersi nel turno corrente; le combinazioni
 // a memoria seguono invece i propri cicli W33/W42, le armi Accumulo restano cariche.
 const charged=b.sides[previous].liveWeaponCharges;
 for(const weaponId of Object.keys(charged||{})){
  const gun=PHASE1_CATALOG.weapons.find(w=>w.id===weaponId);
  if(gun?.tipo==='Combo simultanea'){
   delete charged[weaponId];
   event(b,previous+': carica '+gun.nome+' scaduta (combo simultanea non completata)',
    'weapon_charge_expired',{weaponId});
  }
 }
 b.zones[previous].open=[null,null];
 b.pendingShot[previous]=null;
 b.turn++;
 if(b.turn>LIVE_MAX_TURNS){b.phase='finished';b.winner='draw';event(b,'Limite turni raggiunto: pareggio');return b;}
 b.activeSide=other(previous);
 b.round=Math.ceil(b.turn/2);
 b.deadlineMs=nowMs+LIVE_TURN_MS;
 b.aiReadyAtMs=nowMs+850;
 b.actionUsed={numeric:0,special:0};
 liveEpicBeforeDraw(b.sides[b.activeSide],b.round);
 liveFusionExpires(b.sides[b.activeSide],b.turn);
 liveNumericBossBeforeDraw(b.sides[b.activeSide]);
 nextDraw(b.sides[b.activeSide].numeric,7);
 nextDraw(b.sides[b.activeSide].special,5);
 liveLegacyOnTurnStart(b,b.activeSide);
 const bossRegen=liveBossStartTurn(b.sides[b.activeSide],b.round);
 const playableRegen=bossCharacterApplyRegen(b.sides[b.activeSide],b.round,
  pvpTerrainEffects(b.activeTerrain,b.round));
 if(playableRegen>0)
  event(b,b.activeSide+': carta Idra ripara '+playableRegen+' HP reali','character_regen');
 if(bossRegen?.repaired>0)
  event(b,b.activeSide+': Idra Criogenica rigenera '+bossRegen.repaired+' HP reali','boss_regen');
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
 const suit=SUIT_CODES[card?.suit];if(!suit)return null;
 if(escortIndex!=null){
  const escort=side.escorts?.[escortIndex];
  if(!escort||escort.hp<=0||!escort.weapon?.suits?.includes(suit))return null;
  return {weapon:{id:escort.weapon.id,nome:escort.weapon.name,tipo:escort.weapon.tipo,
   sourceWeaponId:escort.weapon.sourceWeaponId},damage:escort.weapon.damage};
 }
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
   if(type==='tactic-counter'){
    liveBossOnCounter(owner,b.round);
    owner.sync=Math.min(100,owner.sync+bossCharacterCounterSync(owner,b.round,true));
   }
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
 if(escortIndex!=null&&liveFusionBlocksEscort(attacker,b.turn))
  return {ok:false,reason:'escort_fused'};
 const profile=weaponForCard(attacker,card,escortIndex);
 if(!profile)return {ok:false,reason:'suit_incompatible'};
 if(b.liveModuleEffects[key].lockUntilTurn>=b.turn)
  return {ok:false,reason:'module_weapon_locked'};
 // Le categorie originali W01–W42 non diventano spari automatici.
 const w=profile.weapon,charges=attacker.liveWeaponCharges||(attacker.liveWeaponCharges={});
 const previous=charges[w.id]||{values:[],suits:[],startedRound:b.round};
 const suit=SUIT_CODES[card.suit];
 let totalValue=card.value;
 const escortVolley=escortIndex==null?null:prepareTacticalEscortVolley(attacker,card,escortIndex);
 if(escortVolley&&!escortVolley.ready){
  if(escortVolley.reason!=='charging')return {ok:false,reason:escortVolley.reason};
  event(b,key+': '+w.nome+' in accumulo · '+escortVolley.charge+'/'+escortVolley.threshold,
   'weapon_charge',{weaponId:w.sourceWeaponId,escortWeaponId:w.id,
    charge:escortVolley.charge,threshold:escortVolley.threshold});
  return {ok:true,charging:true,weaponId:w.sourceWeaponId};
 }
 if(!escortVolley&&w.tipo==='Accumulo'){
  totalValue=previous.values.reduce((sum,v)=>sum+v,card.value);
  if(totalValue<w.soglia_munizioni){
   charges[w.id]={values:[...previous.values,card.value],suits:[],startedRound:b.round};
   event(b,key+': '+w.nome+' in accumulo · '+totalValue+'/'+w.soglia_munizioni,
    'weapon_charge',{weaponId:w.id,charge:totalValue,threshold:w.soglia_munizioni});
   return {ok:true,charging:true,weaponId:w.id};
  }
  delete charges[w.id];
 }else if(!escortVolley&&(w.tipo==='Combo simultanea'||w.tipo==='Combo a memoria')){
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
 let packet=escortVolley?escortVolley.packet:
  Math.max(1,Math.floor(totalValue*profile.damage*gunEfficiency(attacker.defense,'mother')));
 const matriceBonus=escortIndex==null?liveEpicMatriceBonus(b,key,w.tipo):0;
 packet+=matriceBonus;
 const escortCooperation=escortIndex==null?null:
  liveNumericBossEscortCooperation(attacker,packet,b.round);
 if(escortCooperation)packet=escortCooperation.damage;
 if(escortIndex!=null&&b.liveModuleEffects[key].escortBoost>0){
  packet+=b.liveModuleEffects[key].escortBoost;
  b.liveModuleEffects[key].escortBoost=0;
 }
 const queued=b.pendingShot[key];
 if(queued){
  if(queued.power)packet+=queued.power;
  if(queued.fusion)packet=Math.floor(packet*(1+queued.fusion));
 }
 const bossCharacter=bossCharacterNativeBonus(attacker,enemy,b.round,packet);
 packet+=bossCharacter.extra||0;
 if(escortIndex!=null&&attacker.liveMotherHitRound===b.round)
  packet+=bossCharacterEscortExtra(attacker,b.round,packet,1);
 // Fotografare prima gli stati dell'avversario: la Corrosione si consuma
 // durante questa stessa salva, ma il pilota deve vedere lo stato reale.
 const pilotPower=liveCommanderNativeBonus(attacker,enemy,packet,{queued});
 packet=pilotPower.damage;
 if(enemy.heated)packet+=3; // Solo il prossimo colpo reale beneficia del calore.
 if(enemy.corroded){packet+=Math.floor(packet*.25);enemy.corroded=false;}
 if(enemy.livePowerShiftDebt){packet+=enemy.livePowerShiftDebt;enemy.livePowerShiftDebt=0;}
 packet=Math.floor(packet*liveLegacyOutgoingFactor(b,key));
 const terrain=pvpTerrainEffects(b.activeTerrain,b.round);
 packet=Math.floor(packet*terrain.nativeFactor);
 const bossPower=liveBossNativeModifiers(attacker,enemy,packet,b.round);
 packet=bossPower.damage;
 const numericBossPower=liveNumericBossNativeBonus(attacker,packet,w.id,queued,b.round);
 packet=numericBossPower.damage;
 const precision=b.liveModuleEffects[key];
 if(precision.precisionUntilTurn>=b.turn&&precision.precisionFactor<1)
  packet=Math.max(0,Math.floor(packet*precision.precisionFactor));
 let intercepted=0;
 // Perforante bypassa il 20% e NON la totalità delle scudiere.
 // Ionico dimezza solo la successiva intercettazione, non riduce HP fittizi.
 const bypass=queued?.piercing?Math.ceil(packet*.2):0;
 const routedPacket=Math.max(0,packet-bypass);
 const ionActive=enemy.ionized&&b.turn<=(enemy.ionizedUntilTurn??b.turn);
 const ionFactor=ionActive?.5:1;
 const fusionCover=interceptWithLiveFusion(enemy,Math.floor(routedPacket*ionFactor),b.turn);
 intercepted+=fusionCover.absorbed;
 if(!fusionCover.active&&escortInterceptionEfficiency(enemy.defense)>0){
  let firstSuppressed=false;
  for(const escort of enemy.escorts){
   if(escort.hp<=0)continue;
   if(queued?.suppress&&!firstSuppressed){firstSuppressed=true;continue;}
   const taken=Math.min(escort.hp,Math.floor(routedPacket*.2*
    escortInterceptionEfficiency(enemy.defense)*terrain.escortFactor*ionFactor));
   escort.hp-=taken;intercepted+=taken;
  }
 }
 if(ionActive&&routedPacket>0){
  enemy.ionized=false;
  enemy.ionizedUntilTurn=0;
 }
 let motherPacket=Math.max(0,packet-intercepted);
 const traps=runTraps(b,defenderKey,'shield',motherPacket);
 motherPacket=Math.floor(traps.damage*terrain.shieldFactor*liveLegacyIncomingFactor(b,defenderKey)*
  bossCharacterShieldFactor(enemy,b.round)*liveBossIncomingShieldFactor(enemy)*
  liveNumericBossShieldFactor(enemy));
 const liveGuard=b.liveModuleEffects[defenderKey];
 const blocked=Math.min(liveGuard.guard,motherPacket);
 if(blocked>0){
  liveGuard.guard-=blocked;motherPacket-=blocked;
  event(b,defenderKey+': Modulo difensivo assorbe '+blocked+' danni','module_guard',{damage:blocked});
 }
 const commanderGuard=liveCommanderDefensePacket(attacker,enemy,motherPacket);
 motherPacket=commanderGuard.damage;
 const hit=damageMotherShield(enemy.defense,motherPacket);
 enemy.defense=hit.defense;
 liveBossOnShieldHit(enemy,hit.damage,b.round);
 bossCharacterRememberHit(enemy,b.round,hit.damage);
 liveNumericBossRememberShield(enemy,hit.damage);
 liveCommanderRememberShot(attacker,enemy,hit.damage);
 if(liveCommanderAfterNativeShot(attacker,hit.damage,pilotPower))
  event(b,key+': pilota '+pilotPower.trigger+' · bonus '+pilotPower.extra+
   ' su proiettile autentico','pilot_bonus',
   {pilotId:attacker.commander.id,trigger:pilotPower.trigger,extra:pilotPower.extra});
 liveBossAfterNativeShot(attacker,enemy,b.round,hit.damage,bossPower);
 liveNumericBossAfterShot(attacker,hit.damage,w.id,numericBossPower.bonus,b.round,
  numericBossPower.formulaBonus);
 if(escortCooperation)
  liveNumericBossRememberEscortCooperation(attacker,hit.damage,escortCooperation.bonus);
 liveEpicOnShieldDamage(b,defenderKey,hit.damage);
 liveEpicAfterMatriceShot(b,key,hit.damage,matriceBonus);
 if(hit.damage>0&&enemy.heated)enemy.heated=false;
 const liveBurn=b.liveModuleEffects[key];
 if(hit.damage>0&&liveBurn.burnCharges>0){
  liveBurn.burnCharges--;
  if(tacticalEpicActive(enemy,'epic_item_7',b.round))
   event(b,defenderKey+': Monolite impedisce ustione da '+key,'module_burn_blocked');
  else {
   enemy.heated=true;
   event(b,key+': ustione da Modulo attivata su salva reale','module_burn',{target:defenderKey});
  }
 }
 if(hit.damage>0&&queued?.ion){
  enemy.ionized=true;
  enemy.ionizedUntilTurn=b.turn+2;
 }
 if(hit.damage>0&&queued?.corrosion)enemy.corroded=true;
 if(hit.damage>0&&bossCharacterActive(attacker,b.round)?.effect==='corrosion')
  enemy.corroded=true;
 if(hit.damage>0&&escortIndex==null)attacker.liveMotherHitRound=b.round;
 b.pendingShot[key]=null;
 event(b,key+': '+profile.weapon.nome+' · carica '+totalValue+' · '+hit.damage+
  ' danni barriera ('+intercepted+' intercettati)','shot',
  {card,shipId,weaponId:escortVolley?.weaponId??w.id,
    escortWeaponId:escortVolley?.escortWeaponId??null,damage:hit.damage});
 const syncBeforeShot=attacker.sync;
 liveLegacySyncGain(b,key,hit.damage>0?20:5);
 attacker.sync=Math.min(100,attacker.sync+
  liveNumericBossSyncBonus(attacker,attacker.sync-syncBeforeShot));
 liveLegacyOnNumericShot(b,key,card);
 return {ok:true,damage:hit.damage,weaponId:escortVolley?.weaponId??w.id};
}
function placeVital(b,key,card,vitalId){
 const defender=b.sides[other(key)],part=defender.defense.parts[vitalId];
 const attacker=b.sides[key],rift=!!attacker.liveRift&&!part?.exposed;
 if(!part||part.hp<=0)return {ok:false,reason:'vital_unavailable'};
 if(!part.exposed&&!rift)return {ok:false,reason:'vital_protected'};
 const list=b.vitalBuilds[key][vitalId];
 if(list.length>=tacticalSignatureSlotCount(part.signature))return {ok:false,reason:'vital_slots_full'};
 list.push(card);
 event(b,key+': '+card.value+card.suit+' nello slot '+vitalId+' ('+list.length+'/'+tacticalSignatureSlotCount(part.signature)+')','vital_card');
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
 liveCommanderArmFormula(attacker,defender,{vitalId,op,cards:list,damage:impact.damage});
 liveCommanderRememberVital(attacker,defender,{vitalId,op,cards:list,damage:impact.damage});
 liveBossOnVitalImpact(attacker,defender,impact.damage,list,b.round);
 const bossFormula=liveNumericBossArmFormula(attacker,defender,
  {vitalId,op,cards:list,damage:impact.damage});
 if(bossFormula)event(b,key+': mazzo boss · '+bossFormula.abilities.join(' + ')+
   ' · prossimo proiettile +'+bossFormula.percentage+'%',
   'boss_numeric_formula',{vitalId,percentage:bossFormula.percentage});
 liveNumericBossAfterVital(attacker,impact.damage,impact.destroyed,b.round,vitalId);
 liveEpicOnVitalFormula(b,key,op);
 liveEpicOnShieldDamage(b,other(key),impact.damage);
 if(rift)attacker.liveRift=false;
 b.sides[key].numeric.discard.push(...list);
 b.vitalBuilds[key][vitalId]=[];
 const syncBeforeVital=attacker.sync;
 liveLegacySyncGain(b,key,25);
 attacker.sync=Math.min(100,attacker.sync+
  liveNumericBossSyncBonus(attacker,attacker.sync-syncBeforeVital)+
  bossCharacterSyncExtra(attacker,b.round,true));
 liveLegacyOnVitalFormula(b,key,op,list);
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
function playSpecial(b,key,index,slot,choice={}){
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
  if(type==='tactical-cover'&&liveFusionBlocksEscort(side,b.turn))
   return {ok:false,reason:'cover_conflicts_with_fusion'};
  const match=/^trap-([01])$/.exec(slot||'');
  if(!match)return {ok:false,reason:'trap_slot_required'};
  const i=Number(match[1]);
  if(b.zones[key].traps[i])return {ok:false,reason:'trap_slot_busy'};
  if(b.zones[key].traps.some(t=>t?.type===type))return {ok:false,reason:'duplicate_trap_effect'};
  side.special.hand.splice(index,1);
  b.zones[key].traps[i]={...card,target:type==='tactic-counter'?choice.vitalId??null:null};
  event(b,key+': trappola coperta posizionata nello slot '+(i+1),'trap_placed');
  return {ok:true};
 }
 if(!/^open-[01]$/.test(slot||''))return {ok:false,reason:'open_slot_required'};
 const i=Number(slot.slice(-1));
 if(b.zones[key].open[i])return {ok:false,reason:'open_slot_busy'};
 if(type==='support-shield-repair'){
  if(side.defense.parts.shieldGenerator.hp===0||side.defense.shield.hp===side.defense.shield.max)
   return {ok:false,reason:'repair_unavailable'};
  const value=liveBossRepairValue(side,b.round,liveNumericBossRepairAmount(side,
    pvpTerrainRepairAmount(20,pvpTerrainEffects(b.activeTerrain,b.round))));
   const healed=restoreMotherShield(side.defense,value);
   side.defense=healed.defense;
   liveBossClearPoisonOnHeal(side,b.round,healed.repaired);
 }else if(type==='support-escort-repair'){
  const escort=side.escorts.find(e=>e.hp>0&&e.hp<e.max);
  if(!escort)return {ok:false,reason:'escort_repair_unavailable'};
  escort.hp=Math.min(escort.max,escort.hp+15);
 }else if(type==='tactic-scan'){
  side.seen=[...new Set([...side.seen,...VITAL_IDS.filter(id=>!side.seen.includes(id)).slice(0,2)])];
 }else if(type==='tactic-numeric-recycle'){
  const indices=choice.recycleIndices;
  if(!Array.isArray(indices)||indices.length<1||indices.length>2||
   new Set(indices).size!==indices.length||
   indices.some(n=>!Number.isInteger(n)||n<0||n>=side.numeric.hand.length))
   return {ok:false,reason:'recycle_selection_required'};
  const removed=[...indices].sort((a,z)=>z-a).map(i=>consume(side.numeric,i));
  liveLegacyOnNumericRecycle(b,key,removed);
  side.numeric.recycleEvents=(side.numeric.recycleEvents||0)+1;
  nextDraw(side.numeric,7);
 }else if(type==='support-status-purge'){
  side.ionized=false;side.corroded=false;side.heated=false;
 }else if(type===VULNERABILITY_RIFT_CARD_ID){
  if(side.riftUsed)return {ok:false,reason:'rift_already_used'};
  side.riftUsed=true;side.liveRift=true;
 }else if(LIVE_LEGACY_TYPES.has(type)){
  const result=playLiveLegacyCard(b,key,type,choice);
  if(!result.ok)return result;
 }else if(isModuleCard(type)){
  const result=playOfficialLiveModule(b,key,type,choice);
  if(!result.ok)return result;
  if(['pure_hit','execution','life_drain','singularity'].includes(result.effect))
   liveEpicOnShieldDamage(b,other(key),result.actual);
 }else if(isTacticalEpic(type)){
  const result=playLiveEpic(b,key,type);
  if(!result.ok)return result;
 }else if(type.startsWith('fusion-')){
  if(b.zones[key].traps.some(c=>c?.type==='tactical-cover'))
   return {ok:false,reason:'fusion_conflicts_with_cover'};
  const fusion=beginLiveFusion(side,type,b.turn);
  if(!fusion.ok)return fusion;
  if(fusion.fusion.assault>0)
   b.pendingShot[key]={...(b.pendingShot[key]||{}),fusion:fusion.fusion.assault};
 }else{
  const p=b.pendingShot[key]||{};
  if(type==='tactic-power-shift'||type==='tactic-kinetic')p.power=(p.power||0)+6;
  if(type==='tactic-power-shift')side.livePowerShiftDebt=(side.livePowerShiftDebt||0)+3;
  if(type==='shot-piercing')p.piercing=true;
  if(type==='tactic-suppress')p.suppress=true;
  if(type==='shot-ion')p.ion=true;
  if(type==='shot-corrosion')p.corrosion=true;
  p.offensiveTypes=[...(p.offensiveTypes||[]),type];
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
 if(action.type==='epic-choice'){
  const result=liveEpicChoose(b,key,action.index);
  return result.ok?{ok:true,battle:b}:reject(battle,result.reason);
 }
 if(action.type==='epic-recycle'){
  const result=liveEpicRecycle(b,key,action.index);
  return result.ok?{ok:true,battle:b}:reject(battle,result.reason);
 }
 if(action.type==='clearVital'){
  const id=action.vitalId;
  if(!VITAL_IDS.includes(id)||!b.vitalBuilds[key][id].length)return reject(battle,'vital_empty');
  liveLegacyOnNumericDiscard(b,key,b.vitalBuilds[key][id]);
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
   if(/^escort-[01]$/.test(shipId)&&liveFusionBlocksEscort(side,b.turn))
    return reject(battle,'escort_fused');
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
  const played=playSpecial(b,key,index,action.slot,action);
  if(!played.ok)return reject(battle,played.reason);
  b.actionUsed.special++;
  return {ok:true,battle:b};
 }
 return reject(battle,'invalid_action');
}
function aiSpecialTargets(type,side){
 if(type==='tactic-bomb')return {bombSlot:0}; // Nessuna lettura mano nemica.
 if(type==='tactic-golden')return side.numeric.hand.length?{goldenIndex:0}:{};
 if(type==='tactic-malus')return {malusChoice:'lock_weapon'};
 if(type==='tactic-signature-mutation'||type==='tactic-counter'){
  const vitalId=VITAL_IDS.find(id=>side.defense.parts[id].hp>0&&side.defense.parts[id].exposed);
  return vitalId?{vitalId}:{};
 }
 const effect=isModuleCard(type)?TACTICAL_MODULE_CARDS[type].effect:null;
 if(type==='tactic-numeric-recycle'||effect==='free_swap'||effect==='refill'){
  const count=effect==='free_swap'?1:2;
  const ranked=side.numeric.hand.map((card,i)=>({i,usable:!!weaponForCard(side,card),
   value:card.value})).sort((a,z)=>Number(a.usable)-Number(z.usable)||a.value-z.value);
  return {recycleIndices:ranked.slice(0,count).map(x=>x.i)};
 }
 return {};
}
export function chooseOfficialLiveAiAction(battle){
 if(!battle?.live||battle.phase!=='playing'||battle.activeSide!=='B')return null;
 const me=battle.sides.B,enemy=battle.sides.A;
 if(['epic_item_1','epic_item_3'].includes(me.epic?.active?.id)&&
   !me.epic.liveChoiceCommitted&&me.epic.peek?.length)
  return {type:'epic-choice',index:0};
 if(me.epic?.exchangeCredits>0&&battle.round<=me.epic.exchangeUntilRound&&me.numeric.hand.length)
  return {type:'epic-recycle',index:0};
 if(battle.actionUsed.numeric<LIVE_NUMERIC_LIMIT){
  // Prima completa un bersaglio GIA' ESPOSTO con una combinazione
  // verificabile. Non riempie slot vitali a caso, ne' consulta mutazioni segrete.
  for(const id of VITAL_IDS){
   const target=enemy.defense.parts[id];
   if(!target||target.hp<=0||!target.exposed)continue;
   const stored=battle.vitalBuilds.B[id];
   const knownSignature=battle.liveLegacy?.mutations.A?.vitalId===id?
    battle.liveLegacy.mutations.A.originalSignature:target.signature;
   const plan=findOfficialLiveVitalCompletion(knownSignature,stored,me.numeric.hand);
   if(plan?.length)return {type:'numeric',index:plan[0],target:'vital',vitalId:id};
   if(stored.length>=tacticalSignatureSlotCount(knownSignature))
    return {type:'clearVital',vitalId:id};
  }
  // Una nuova esposizione non interrompe una combinazione completabile.
  for(const id of VITAL_IDS){
   const target=enemy.defense.parts[id];
   if(target&&target.hp>0&&!target.exposed&&remainingExposureSlots(enemy.defense)>0)
    return {type:'expose',vitalId:id};
  }
  const found=me.numeric.hand.findIndex(c=>weaponForCard(me,c));
  if(found>=0)return {type:'numeric',index:found,target:'ship',shipId:'mother'};
  // La scudiera possiede propri semi ed armi: l'IA puo usarli come
  // alternativa quando la madre non puo sparare, senza carte gratuite.
  if(!liveFusionBlocksEscort(me,battle.turn)){
   for(const [index,card] of me.numeric.hand.entries()){
    const escortIndex=me.escorts.findIndex((e,i)=>weaponForCard(me,card,i));
    if(escortIndex>=0)return {type:'numeric',index,target:'ship',shipId:'escort-'+escortIndex};
   }
  }
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
   const action={type:'special',index,slot,...aiSpecialTargets(type,me)};
   const probe=applyOfficialLiveAction(battle,'B',action,battle.deadlineMs-1);
   if(probe.ok)return action;
  }
 }
 return {type:'end'};
}
