// Eclissi Stellare — combattimento alternato di flotte, regole v0.8.
// Nessuna animazione o audio qui: gli eventi sono emessi per il renderer ufficiale.
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {buildFleetEscorts} from '../fleetEscortSupports.js';
import {ESCORT_ARMORY} from '../escortArmory.js';
import {
 card,cardRole,shipConfig,
 unlockedParts,requiredEscortCount,effectiveDeck,exclusiveOperational,
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
const initIntegrity=n=>n<=2?[4,4]:n===3?[3,3,2]:[2,2,2,2];
export function createFleetMother(id,level=1){
 const config=shipConfig(id),model=SHIPS.get(id);
 if(!config||!model)throw new Error('Madre inesistente '+id);
 const n=clamp(Math.floor(level),1,5),ids=unlockedParts(id,n);
 const values=initIntegrity(ids.length);
 const parts=ids.map((id,i)=>({id,hp:values[i],maxHp:values[i],damage:0,destroyed:false}));
 const weapons=PHASE1_CATALOG.weapons.filter(w=>w.nave_id===model.id);
 return {id:model.id,name:model.nome,level:n,rarity:model.rarita,
  role:config.rarity,parts,element:({N00:'ionic',C01:'plasma',C02:'refrigerant',
  C03:'ionic',C04:'plasma',R01:'plasma',R02:'ionic',R03:'refrigerant',
  R04:'mineral',E01:'refrigerant',E02:'ionic',E03:'plasma',E04:'mineral',
  L01:'plasma',L02:'ionic',L03:'mineral',L04:'refrigerant'})[model.id],
  weaponRating:clamp(1+Math.floor((weapons.length+Math.max(0,n-1))/3),1,3)};
}
export const shipAlive=ship=>ship.parts.some(p=>!p.destroyed);
export const allVitalsDestroyed=ship=>ship.parts.every(p=>p.destroyed);
const motherPart=(mother,id)=>mother.parts.find(x=>x.id===id);
const operational=(mother,id)=>!!motherPart(mother,id)&&!motherPart(mother,id).destroyed;
export function createFleetSide(shipId,level,baseDeck,seed,upgrades={}){
 const mother=createFleetMother(shipId,level);
 const config=shipConfig(shipId);
 // Riutilizziamo esattamente i modelli e le passive delle scudiere ufficiali.
 const allEscorts=buildFleetEscorts({...mother,level:5}).slice(0,requiredEscortCount(shipId,level));
 const model=SHIPS.get(shipId);
 const base=model.hp_motore_L1+(model.hp_motore_L5-model.hp_motore_L1)*
  (clamp(level,1,5)-1)/4;
 const escorts=allEscorts.map((e,i)=>{
  const tough=['cover','bulwark','partCover','phase'].includes(e.skill.action);
  const arm=ESCORT_ARMORY[shipId][i];
  const hp=Math.max(2,Math.min(12,Math.round(2+base/65+
   (e.skill.action==='bulwark'?4:tough?2:0)+arm.shield*3)));
  return {...e,hp,maxHp:hp,
   unlockLevel:i===0?config.escort1UnlockLevel:config.escort2UnlockLevel,
   linked:true};
 });
 const rng={rng:seed>>>0};
 const fullDeck=effectiveDeck(baseDeck,shipId,level);
 const shuffledDeck=shuffled(fullDeck,rng);
 return {ships:[mother],escorts,deck:shuffledDeck.slice(FLEET_HAND_SIZE),
  hand:shuffledDeck.slice(0,FLEET_HAND_SIZE),discard:[],commander:null,
  buffs:[],defenses:[],stagedComboCards:[],exclusiveUpgrades:{...upgrades},
  lastPlayed:[],attackSlots:[null,null,null],defenseSlots:[null,null],
  turnCount:0,fireDisabledUntil:0,fireBlocked:false,lastDisarmedPly:null,
  protections:[],reactions:[],charges:[],pendingRepair:0,drawBlockedUntil:0,usedCardEvents:[]};
}
export function refreshEscortLinks(side,ply=0){
 const mother=side.ships[0];
 for(const e of side.escorts){
  e.linked=e.hp>0&&!e.destroyed&&(e.jammedUntilPly||0)<=ply&&
   e.skill.requires.every(id=>operational(mother,id));
 }
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
 const b={version:3,phase:'playing',winner:null,round:1,ply:0,turn:'A',
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
const activePart=(side,id)=>side.ships[0].parts.find(p=>p.id===id&&!p.destroyed);
const livingEscorts=side=>side.escorts.filter(e=>e.hp>0&&!e.destroyed);
const weakest=items=>[...items].sort((a,z)=>a.hp/a.maxHp-z.hp/z.maxHp)[0]||null;
const weakestPart=side=>weakest(side.ships[0].parts.filter(p=>!p.destroyed));
function normalizeSide(side){
 for(const key of ['protections','reactions','charges','buffs','defenses','discard'])side[key]??=[];
 side.fireBlocked??=false;side.lastDisarmedPly??=null;
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
 const invalid=validateEffectSpec(def.effectSpec);
 if(invalid)return invalid;
 const s=effectiveEffectSpec(def,side.exclusiveUpgrades?.[def.id]||1);
 const character=isCharacterCard(def);
 const terrain=terrainCode===undefined?battle?.terrain?.id:terrainCode;
 if(character&&side.commander&&side.commander.untilPly>(battle?.ply??0))return 'È già attivo un Personaggio';
 if(def.shipId&&!exclusiveOperational(def.id,side.ships[0],side.escorts))return 'Nave o componenti richiesti non disponibili';
 if(VITAL_KEYS.includes(s.target)&&!activePart(side,s.target))return VITAL_LABELS[s.target]+' non disponibili';
 if(s.target==='escort'&&!livingEscorts(side).length)return 'Nessuna scudiera disponibile';
 if(s.type==='dodge'&&!activePart(side,'engine'))return 'La schivata richiede i Motori attivi';
 if(s.type==='dodge'&&terrain==='T01')return 'La Distesa Gelida blocca le schivate';
 if(s.type==='repair'&&terrain==='T08')return 'La Palude di Silicio blocca le riparazioni';
 if(['power','pierce','multishot','charge'].includes(s.type)&&!activePart(side,'weapons'))return 'Le Armi sono distrutte';
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
 const terrainCode=chosen.find(c=>c.effectSpec?.type==='terrain')?.effectSpec.code??b.terrain?.id;
 for(const c of chosen){
  const reason=effectUnavailableReason(c,side,b,{ownPartId:order?.ownPartId,terrainCode});
  if(reason)return (c.nome||c.name)+': '+reason;
 }
 if(chosen.some(effectNeedsOwnTarget)&&order?.ownPartId&&!activePart(side,order.ownPartId))
  return 'Scegli un tuo componente ancora operativo';
 const enemy=b.sides[other(who)].ships[0],target=order?.partId;
 if(!order?.pass&&(!target||!motherPart(enemy,target)||motherPart(enemy,target).destroyed))
  return 'Seleziona un componente avversario ancora operativo';
 return null;
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
 for(const entry of [...side.defenses])if(entry.untilPly<=ply)discardDefense(side,entry.source);
 side.protections=side.protections.filter(s=>s.untilPly>ply&&s.remaining>0);
 side.reactions=side.reactions.filter(s=>s.untilPly>ply);
 side.buffs=side.buffs.filter(s=>s.untilPly==null||s.untilPly>ply);
 side.charges=side.charges.filter(s=>s.atPly>=ply);
 if(side.commander?.untilPly<=ply){
  side.discard.push(side.commander.id);removeSource(side,side.commander.source);side.commander=null;
 }
 refreshEscortLinks(side,ply);
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
function applyEffect(b,who,def,spec,ctx,events,{source,ownPartId}={}){
 const side=b.sides[who],enemy=b.sides[other(who)];
 const s=spec,token=source||def.id+'@'+b.ply+'-'+ctx.effectSerial++;
 const at=text=>events.push(emit(b,who,'card',(def.nome||def.name||'Effetto')+' · '+text,{cardId:def.id}));
 const expiry=b.ply+2*(s.turns||1);
 switch(s.type){
  case 'power':ctx.power+=s.amount;at('+'+s.amount+' potenza');break;
  case 'pierce':ctx.pierce+=s.amount;at('Ignora '+s.amount+' protezioni sui componenti');break;
  case 'multishot':ctx.multiTargets=Math.max(ctx.multiTargets,s.targets);at('Fino a '+s.targets+' componenti');break;
  case 'protect':case 'dodge':{
   const escort=s.target==='escort'?weakest(livingEscorts(side)):null;
   const part=s.target==='all'||escort?null:selectedOwnPart(side,s.target,ownPartId);
   if(s.target!=='all'&&!escort&&!part){at('Bersaglio non disponibile');break;}
   if(s.type==='dodge'&&!operational(side.ships[0],'engine')){at('Motori non disponibili');break;}
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
   for(const e of side.escorts)e.jammedUntilPly=0;
   refreshEscortLinks(side,b.ply);at('Disturbi e blocchi rimossi');break;
  case 'exchange':at('Ricambiate '+exchangeCards(b,side,s.amount)+' carte');break;
  case 'recover':{
   let index=-1;
   for(let i=side.discard.length-1;i>=0;i--)if(s.role==='any'||cardRole(side.discard[i])===s.role){index=i;break;}
   if(index>=0){const recovered=side.discard.splice(index,1)[0];side.deck.unshift(recovered);at('Recuperata '+(card(recovered)?.nome||card(recovered)?.name));}
   else at('Nessuna carta adatta negli scarti');break;
  }
  case 'charge':side.charges.push({amount:s.amount,atPly:b.ply+2,source:token});at('+'+s.amount+' potenza al prossimo turno');break;
  case 'terrain':{
   const terrainCard=TERRAIN_CATALOG[s.code]?.cardId;
   const result=activateTerrain(b.terrain,terrainCard,b.ply,who,{boss:!!b.bossId,bossOverride:true});
   if(result.ok){b.terrain=result.terrain;at(TERRAIN_CATALOG[s.code].description+' Vale per 3 round.');}
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
 if(role==='character'){
  side.commander={id,untilPly:b.ply+4,repeatAtPly:b.ply+2,repeatsRemaining:1,
   effectSpec:spec,source,ownPartId,kind:'simple',power:spec.amount||0};
 }
 if(role==='defense'){
  while(side.defenses.length>=2)discardDefense(side,side.defenses[0].source);
  side.defenses.push({id,source,untilPly:b.ply+2*(spec.turns||1)});
  side.defenseSlots=side.defenses.map(d=>d.id);
 }
 applyEffect(b,who,def,spec,ctx,events,{source,ownPartId});
}
function applyCharacterRepeat(b,who,ctx,events){
 const side=b.sides[who],c=side.commander;
 if(c&&c.repeatsRemaining>0&&c.repeatAtPly<=b.ply){
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
  const s=e.skill;if((side.turnCount+1)%Math.max(1,s.interval)!==0)continue;
  const note=text=>events.push(emit(b,ctx.who,'escort',e.name+' · '+text));
  if(['ion','strike','corrode'].includes(s.action)){ctx.power++;note('+1 potenza');}
  else if(['focus','siege'].includes(s.action)&&s.targetPart===order.partId){ctx.power++;note('+1 potenza sul componente scelto');}
  else if(s.action==='revenge'&&livingEscorts(side).some(x=>x.hp<x.maxHp)){ctx.power++;note('+1 potenza');}
  else if(s.action==='surge'&&side.ships[0].parts.some(p=>!p.destroyed&&p.hp<p.maxHp)){ctx.power++;note('+1 potenza');}
  else if(s.action==='precision'||s.action==='pierce'&&s.targetPart===order.partId){ctx.pierce++;note('Ignora 1 protezione');}
  else if(['repair','mend'].includes(s.action)){const h=heal(b,side,1,s.action==='mend'?'escort':'weakest');if(h)note('Ripara '+h.name+' +'+h.amount);}
  else if(s.action==='draw')note('Ricambia '+exchangeCards(b,side,1)+' carta');
  else if(s.action==='jam'){addWeaken(b,b.sides[other(ctx.who)],1,e.id);note('Prossimo attacco avversario −1 potenza');}
  else if(s.action==='guard'){addTemporaryGuard(side,b.ply);note('Prossimo turno avversario −1 potenza');}
 }
}
function blockHit(b,defender,targetKind,target,ctx,events){
 for(const p of [...defender.protections]){
  if(p.untilPly<=b.ply||p.remaining<=0)continue;
  const matches=targetKind==='escort'?p.target==='escort'&&p.escortSlot===target.slot:
   p.target==='all'||p.target==='part'&&p.partId===target.id;
  if(!matches)continue;
  if(p.kind==='dodge'&&(!activePart(defender,'engine')||b.terrain?.id==='T01'))continue;
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
function readyInterceptor(b,defender,targets){
 refreshEscortLinks(defender,b.ply);
 return defender.escorts.find(e=>{
  if(!e.linked)return false;
  const s=e.skill;
  if(s.action==='cover'||s.action==='bulwark')return true;
  if(s.action==='partCover')return targets.some(p=>p.id===s.targetPart);
  return s.action==='phase'&&(e.lastInterceptPly==null||b.ply-e.lastInterceptPly>=2*s.interval);
 })||null;
}
function triggerReactions(b,attackerWho,damage,events){
 if(damage<=0)return;
 const attacker=b.sides[attackerWho],defender=b.sides[other(attackerWho)];
 for(const [side,who,trigger] of [[attacker,attackerWho,'hit'],[defender,other(attackerWho),'hurt']]){
  for(const reaction of side.reactions){
   if(reaction.untilPly<=b.ply||reaction.trigger!==trigger||reaction.lastTriggeredPly===b.ply)continue;
   reaction.lastTriggeredPly=b.ply;
   if(reaction.type==='regenerate'){
    const h=heal(b,side,reaction.amount);
    if(h)events.push(emit(b,who,'repair','Rigenerazione: '+h.name+' +'+h.amount,{cardId:reaction.id}));
   }else if(reaction.type==='counter'){
    const target=activePart(attacker,'weapons');
    const blocked=target&&blockHit(b,attacker,'part',target,{who,pierceLeft:0},events);
    const actual=blocked?0:applyDamage(target,reaction.amount);
    if(actual){refreshEscortLinks(attacker,b.ply);events.push(emit(b,who,'counter','Contrattacco: Armi avversarie −'+actual,
     {cardId:reaction.id,partId:'weapons',damage:actual,destroyed:target.destroyed,noRecursion:true}));}
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
 const side=b.sides[ctx.who],defender=b.sides[other(ctx.who)],mother=side.ships[0],target=defender.ships[0];
 const mainPart=motherPart(target,order.partId);
 if(!mainPart||mainPart.destroyed||!operational(mother,'weapons')){
  events.push(emit(b,ctx.who,'no-shot','Armi indisponibili o bersaglio non valido'));return {damage:0};
 }
 if(side.fireBlocked||side.fireDisabledUntil>b.ply){
  side.fireBlocked=false;side.fireDisabledUntil=0;
  if(side.lastDisarmedPly!==b.ply-2){
   side.lastDisarmedPly=b.ply;events.push(emit(b,ctx.who,'no-shot','Questo attacco è bloccato'));return {damage:0,blocked:true};
  }
  events.push(emit(b,ctx.who,'card','Le Armi non possono essere bloccate per due turni consecutivi'));
 }
 const jam=side.buffs.filter(x=>x.kind==='jam').reduce((sum,x)=>sum+(x.power||0),0);
 side.buffs=side.buffs.filter(x=>x.kind!=='jam');
 const guard=defender.buffs.filter(x=>x.kind==='guard'&&(x.untilPly==null||x.untilPly>b.ply)).reduce((sum,x)=>sum+(x.power||0),0);
 const terrain=terrainSalvoModifier(b.terrain,mother.id);
 const power=Math.max(0,1+mother.weaponRating+ctx.power+terrain.value-jam-guard);
 if(power===0){events.push(emit(b,ctx.who,'block','Potenza zero: l’attacco fallisce'));return {damage:0,partId:order.partId,played:ctx.cards,power};}
 const count=Math.min(4,ctx.multiTargets+(b.terrain?.id==='T10'?1:0));
 const targets=[mainPart,...target.parts.filter(p=>!p.destroyed&&p.id!==mainPart.id).slice(0,count-1)];
 ctx.pierceLeft=b.terrain?.id==='T06'?0:ctx.pierce;
 const escort=readyInterceptor(b,defender,targets);
 if(escort){
  escort.lastInterceptPly=b.ply;
  if(blockHit(b,defender,'escort',escort,ctx,events)){
   events.push(emit(b,ctx.who,'impact','Scudiera protetta: nessun danno',{escortSlot:escort.slot,escortDamage:0,damage:0}));
   return {damage:0,escortDamage:0,escortSlot:escort.slot,partId:order.partId,played:ctx.cards,power};
  }
  const damage=Math.min(escort.hp,power+(b.terrain?.id==='T04'?1:0));
  escort.hp-=damage;escort.destroyed=escort.hp<=0;refreshEscortLinks(defender,b.ply);
  events.push(emit(b,ctx.who,'impact','Scudiera '+escort.name+' intercetta: −'+damage+' punti',
   {escortSlot:escort.slot,escortName:escort.name,escortDamage:damage,escortDestroyed:escort.destroyed,damage:0}));
  triggerReactions(b,ctx.who,damage,events);
  return {damage:0,escortDamage:damage,escortSlot:escort.slot,partId:order.partId,played:ctx.cards,power};
 }
 const hits=[];
 for(const p of targets){
  if(blockHit(b,defender,'part',p,ctx,events))continue;
  const damage=applyDamage(p,1);if(damage)hits.push({id:p.id,damage,destroyed:p.destroyed});
 }
 refreshEscortLinks(defender,b.ply);
 const damage=hits.reduce((sum,h)=>sum+h.damage,0);
 events.push(emit(b,ctx.who,'impact',damage?'Attacco: '+hits.map(h=>VITAL_LABELS[h.id]).join(', '):'Tutti i colpi sono stati bloccati',
  {shipIndex:0,shipName:target.name,partId:mainPart.id,damage,destroyed:mainPart.destroyed,played:ctx.cards,targets:hits,terrainBonus:terrain.value}));
 triggerReactions(b,ctx.who,damage,events);
 return {damage,partId:order.partId,played:ctx.cards,targets:hits,destroyed:mainPart.destroyed,power};
}
function finishTurn(b,ctx,events){
 const side=b.sides[ctx.who];side.turnCount++;refill(b,side);
 side.lastPlayed=[...ctx.cards];b.ply++;b.round=1+Math.floor(b.ply/2);b.turn=other(ctx.who);
 b.terrain=activeTerrain(b.terrain,b.ply);
 for(const s of Object.values(b.sides))expireSide(s,b.ply);
 const deadA=allVitalsDestroyed(b.sides.A.ships[0]),deadB=allVitalsDestroyed(b.sides.B.ships[0]);
 if(deadA||deadB){b.phase='finished';b.winner=deadA&&deadB?'draw':deadA?'B':'A';
  b.finishReason=deadA&&deadB?'Entrambe le navi hanno perso tutti i componenti.':'Una nave ha perso tutti i suoi componenti.';}
 else if(!activePart(b.sides.A,'weapons')&&!activePart(b.sides.B,'weapons')){
  b.phase='finished';b.winner='draw';b.finishReason='Entrambe le navi hanno le Armi distrutte.';
  events.push(emit(b,'system','finish','Pareggio: entrambe le Armi sono distrutte'));
 }else if(b.ply>=2*FLEET_MAX_ROUNDS){
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
 const ctx={who,nowMs,cards,power:0,pierce:0,multiTargets:1,pierceLeft:0,effectSerial:0};
 for(const charge of side.charges.filter(c=>c.atPly===b.ply))ctx.power+=charge.amount;
 side.charges=side.charges.filter(c=>c.atPly>b.ply);
 // Il terreno scelto entra prima delle altre carte e degli effetti del turno.
 for(const id of cards.filter(id=>cardRole(id)==='terrain'))applyCard(b,who,id,ctx,events,order);
 applyCharacterRepeat(b,who,ctx,events);
 for(const id of cards.filter(id=>cardRole(id)!=='terrain'))applyCard(b,who,id,ctx,events,order);
 applyBossPassive(b,ctx,events);escortPassive(b,side,ctx,events,order);
 side.stagedComboCards=[];side.attackSlots=cards.filter(id=>cardRole(id)==='attack').slice(0,3);
 const shot=order.pass?{damage:0,played:cards}:resolveSalvo(b,ctx,events,order);
 side.lastDamage=(shot.damage||0)+(shot.escortDamage||0);
 side.discard.push(...cards.filter(id=>!['character','defense'].includes(cardRole(id))));
 finishTurn(b,ctx,events);
 return {ok:true,battle:b,events,shot};
}
export function autoFleetTurn(b,who=b.turn){
 const side=b.sides[who],enemy=b.sides[other(who)],ownPartId=weakestPart(side)?.id;
 const target=enemy.ships[0].parts.filter(p=>!p.destroyed).sort((a,z)=>a.hp-z.hp)[0];
 const candidates=side.hand.map((id,i)=>({id,i,role:cardRole(id),def:card(id)}))
  .filter(x=>!effectUnavailableReason(x.def,side,b,{ownPartId}));
 const score=x=>x.def.effectSpec.type==='repair'?6:x.role==='attack'?5:x.role==='character'?4:x.role==='defense'?3:x.role==='terrain'?1:2;
 candidates.sort((a,z)=>score(z)-score(a)||a.i-z.i);
 const counts={character:0,defense:0,terrain:0},limits={character:1,defense:2,terrain:1},cards=[];
 for(const c of candidates){
  if(cards.length>=FLEET_MAX_PLAYED)break;
  if(c.role in limits&&counts[c.role]>=limits[c.role])continue;
  if(validateFleetTurn(b,who,{partId:target?.id||null,ownPartId,cards:[...cards,c.i],pass:!target}))continue;
  cards.push(c.i);if(c.role in counts)counts[c.role]++;
 }
 return {partId:target?.id||null,ownPartId,cards,pass:!target};
}
export function timeoutFleetTurn(battle,nowMs){
 if(battle.phase!=='playing'||nowMs<battle.deadlineMs)return {ok:false,battle,events:[]};
 return resolveFleetNextTurn(battle,battle.turn,{partId:null,cards:[],pass:true},nowMs);
}
