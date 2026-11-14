// Eclissi Stellare — combattimento alternato di flotte, regole v0.8.
// Nessuna animazione o audio qui: gli eventi sono emessi per il renderer ufficiale.
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {buildFleetEscorts} from '../fleetEscortSupports.js';
import {
 GENERAL_CARDS,EXCLUSIVE_CARDS,GENERAL_COUNT,card,cardRole,shipConfig,
 unlockedParts,requiredEscortCount,effectiveDeck,exclusiveOperational,
 COMBO_RECIPES,comboCardIds,isComboReady,FLEET_HAND_SIZE,
 FLEET_MAX_PLAYED,FLEET_TURN_SECONDS,VITAL_KEYS,VITAL_LABELS
} from './rules.js';
import {
 terrainForCard,activateTerrain,activeTerrain,terrainSalvoModifier,
 terrainTriggerModifier,neutralTerrain,bossTerrain,campaignTerrain,TERRAIN_CATALOG
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
 const escorts=allEscorts.map((e,i)=>({...e,
  unlockLevel:i===0?config.escort1UnlockLevel:config.escort2UnlockLevel,
  linked:true}));
 const rng={rng:seed>>>0};
 const fullDeck=effectiveDeck(baseDeck,shipId,level);
 const shuffledDeck=shuffled(fullDeck,rng);
 return {ships:[mother],escorts,deck:shuffledDeck.slice(FLEET_HAND_SIZE),
  hand:shuffledDeck.slice(0,FLEET_HAND_SIZE),discard:[],commander:null,
  buffs:[],defenses:[],stagedComboCards:[],exclusiveUpgrades:{...upgrades},
  lastPlayed:[],attackSlots:[null,null,null],defenseSlots:[null,null],
  turnCount:0,fireDisabledUntil:0,pendingRepair:0,drawBlockedUntil:0,usedCardEvents:[]};
}
export function refreshEscortLinks(side){
 const mother=side.ships[0];
 for(const e of side.escorts){
  e.linked=e.hp>0&&!e.destroyed&&e.skill.requires.every(id=>operational(mother,id));
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
 upgradesA={},upgradesB={},mode='campaign',bossId=null,sectorNumber=1,
 seed=1988,nowMs=0,bossName=null
}={}){
 const b={version:2,phase:'playing',winner:null,round:1,ply:0,turn:'A',
  deadlineMs:nowMs+FLEET_TURN_SECONDS*1000,mode,
  bossName,bossId:bossId||null,
  bossLockedTerrain:false,seed,rng:seed>>>0,startedAtMs:nowMs,finishedAtMs:null,
  terrain:bossId?bossTerrain(bossId):mode==='pvp'?neutralTerrain():
   campaignTerrain(sectorNumber,bossId),
  log:[],sides:{
   A:createFleetSide(shipA,levelA,deckA,seed+11,upgradesA),
   B:createFleetSide(shipB,levelB,deckB,seed+29,upgradesB)
  },lastEvents:[]};
 emit(b,'system','start','Le flotte sono schierate. Ogni turno dura 30 secondi.');
 return b;
}
function uniqueIndexList(list,hand){
 return Array.isArray(list)&&list.length<=FLEET_MAX_PLAYED&&
  list.every(x=>Number.isInteger(x)&&x>=0&&x<hand.length)&&
  new Set(list).size===list.length;
}
export function validateFleetTurn(b,who,order){
 if(!b||b.phase!=='playing')return 'Partita non in corso';
 if(!['A','B'].includes(who)||b.turn!==who)return 'Non è il tuo turno';
 const side=b.sides[who],mother=side.ships[0],indices=order?.cards||[];
 if(!uniqueIndexList(indices,side.hand))return 'Puoi usare fino a tre carte presenti nella mano';
 const cards=indices.map(i=>side.hand[i]);
 const roles=cards.map(cardRole);
 const count=x=>roles.filter(r=>r===x).length;
 if(count('character')>1)return 'Massimo un Personaggio per turno';
 if(count('defense')>2)return 'Massimo due carte Difesa per turno';
 if(count('attack')>3)return 'Massimo tre carte Attacco per turno';
 if(count('terrain')>1)return 'Massimo una Carta Terreno per turno';
 if(count('character')&&side.commander&&side.commander.untilPly>b.ply)
  return 'È già attivo un Personaggio';
 for(const id of cards){
  if(EXCLUSIVE_CARDS[id]&&!exclusiveOperational(id,mother,side.escorts))
   return 'Carta esclusiva non utilizzabile con questa navicella o componente: '+id;
 }
 const enemy=b.sides[who==='A'?'B':'A'].ships[0];
 const target=order?.partId;
 if(!order?.pass&&(!target||!motherPart(enemy,target)||motherPart(enemy,target).destroyed))
  return 'Seleziona un componente vitale avversario ancora operativo';
 return null;
}
function takeCards(side,indices){
 const sorted=[...indices].sort((a,b)=>b-a);
 const selected=indices.map(i=>side.hand[i]);
 for(const i of sorted)side.hand.splice(i,1);
 return selected;
}
function heal(side,amount=1,escortOnly=false){
 const mother=side.ships[0];
 const escorts=side.escorts.filter(e=>e.hp>0&&e.hp<e.maxHp);
 const parts=mother.parts.filter(p=>!p.destroyed&&p.hp<p.maxHp);
 if(!escortOnly&&parts.length){
  parts.sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
  const part=parts[0],old=part.hp;
  part.hp=Math.min(part.maxHp,part.hp+amount);part.damage=part.hp<part.maxHp?1:0;
  return {kind:'mother',name:VITAL_LABELS[part.id],amount:part.hp-old};
 }
 if(escorts.length){
  escorts.sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
  const e=escorts[0],old=e.hp;e.hp=Math.min(e.maxHp,e.hp+amount);
  return {kind:'escort',name:e.name,amount:e.hp-old};
 }
 return null;
}
function applyDamage(part,amount){
 if(!part||part.destroyed)return 0;
 const actual=Math.min(part.hp,Math.max(0,Math.floor(amount)));
 part.hp-=actual;part.destroyed=part.hp<=0;part.damage=part.destroyed?2:part.hp<part.maxHp?1:0;
 return actual;
}
function effectStrength(c,side,oneShot=true){
 const rarity=c.rarita||c.rarityDraft||'Comune';
 const upgrade=c.shipId?(side.exclusiveUpgrades?.[c.id]||1):1;
 return clamp((rarity==='Leggendaria'?2:rarity==='Epica'?1:1)+Math.max(0,upgrade-1),1,3);
}
const fams=c=>(c.families||[c.famiglia||'']).join(' ').toLowerCase();
function applyCard(b,side,opponent,id,ctx,events){
 const c=card(id),role=cardRole(id),mother=side.ships[0];
 if(!c)return;
 const families=fams(c),power=effectStrength(c,side);
 const at=txt=>events.push(emit(b,ctx.who,'card',c.nome||c.name+' · '+txt,{cardId:id}));
 if(role==='terrain'){
  const active=activateTerrain(b.terrain,id,b.ply,ctx.who,{boss:!!b.bossId,bossOverride:true});
  if(active.ok){b.terrain=active.terrain;ctx.terrainChanged=true;at('Terreno attivato: '+b.terrain.id);}
  return;
 }
 if(role==='character'){
  const duration=2*2;
  side.commander={id,untilPly:b.ply+duration,power,kind:families};
  side.attackSlots=side.attackSlots.map(x=>x);
  ctx.character=id;at('Personaggio attivo per due turni propri');
  return;
 }
 if(role==='defense'){
  const guard=1+(rarityToShield(c)>=2?1:0);
  side.defenses=[...side.defenses,{id,untilPly:b.ply+4,guard,used:false}].slice(-2);
  side.defenseSlots=side.defenses.map(e=>e.id).slice(-2);
  ctx.guard+=guard;at('Difesa pronta: '+guard+' protezione');
  return;
 }
 if(role==='attack'){
  ctx.attackCards++;
  ctx.power+=1+(families.includes('carica')&&operational(mother,'generator')?1:0);
  if(families.includes('precisione'))ctx.pierce=Math.max(ctx.pierce,1);
  if(families.includes('pressione')||families.includes('assalto'))ctx.power+=1;
  if(families.includes('corrosione'))ctx.corrosion=true;
  if(families.includes('mobilita')&&operational(mother,'engine'))ctx.evasion=true;
  if(families.includes('combo')||role==='combo')ctx.comboCards.push(id);
  at('Attacco predisposto dalla madre');
  return;
 }
 // Controllo e supporto producono effetti solo con le relative condizioni reali.
 if(families.includes('riparazione')||families.includes('recupero')||families.includes('scudiera')){
  if(b.terrain?.id==='T08'&&!ctx.repairDelayed){ctx.repairDelayed=true;side.pendingRepair+=power;at('Riparazione posticipata dal terreno');}
  else{
   const extra=terrainTriggerModifier(b.terrain,'escort-heal',mother.id);
   const result=heal(side,power+Math.max(0,extra),families.includes('scudiera'));
   if(result)at('Riparato '+result.name+' +'+result.amount);
  }
 }else if(families.includes('ricambio')||families.includes('selezione')){
  ctx.extraDraw=clamp(ctx.extraDraw+1,0,2);at('Ricambio carta preparato');
 }else if(families.includes('disturbo')||families.includes('ionizzazione')||families.includes('blocco')){
  opponent.fireDisabledUntil=Math.max(opponent.fireDisabledUntil,
   b.ply+(families.includes('blocco')?1:0));
  opponent.buffs.push({kind:'jam',untilPly:b.ply+2,power:1});
  at('Disturbo elettronico su avversario');
 }else if(families.includes('spionaggio')){
  ctx.scan=true;at('Scansione: prepara il prossimo bersaglio');
 }else if(families.includes('energia')||families.includes('sincronia')||families.includes('preparazione')){
  ctx.power+=1;at('Energia trasferita alla madre');
 }else if(families.includes('intercetto')||families.includes('guardia')){
  side.defenses.push({id,untilPly:b.ply+2,guard:1,used:false});
  side.defenseSlots=side.defenses.slice(-2).map(x=>x.id);
  at('Protocollo di intercettazione pronto');
 }else{
  ctx.power+=1;at('Supporto tattico preparato');
 }
}
function rarityToShield(c){return ({Comune:0,Rara:1,Epica:2,Leggendaria:3})[c.rarita||c.rarityDraft]||0;}
function applyBossPassive(b,ctx,events){
 if(!b.bossId||ctx.who!=='B')return;
 const side=b.sides.B,enemy=b.sides.A,n=Number(b.bossId),mother=side.ships[0];
 const note=t=>events.push(emit(b,'B','boss',t));
 if(n===1&&side.turnCount===0){ctx.guard++;note('Gaia: corazza tellurica +1 difesa');}
 if(n===2&&side.turnCount>0&&side.lastDamage>0){ctx.power++;note('Tharsis: assalto progressivo');}
 if(n===3&&side.lastDamage>0){enemy.buffs.push({kind:'jam',power:1,untilPly:b.ply+2});note('Venere: neurotossina');}
 if(n===6&&ctx.cards.length>=2){ctx.guard++;note('Crono: controtempo');}
 if(n===7&&enemy.buffs.some(x=>x.kind==='ion')){ctx.power++;note('Sentinella: sifone ionico');}
 if(n===8&&enemy.ships[0].parts.some(p=>p.hp<p.maxHp)){ctx.power++;note('Leviatano: pressione abissale');}
 if(n===9&&side.escorts.some(e=>e.hp>1)){const e=side.escorts.find(e=>e.hp>1);e.hp--;ctx.power++;note('Ombre: sacrificio scudiera');}
 if(n===11&&operational(mother,'generator')){const h=heal(side,1);if(h)note('Idra: rigenerazione '+h.name);}
 if(n===14&&side.turnCount%3===2){ctx.power+=2;note('Caos: reattore carico');}
 if(n===17&&enemy.discard.length>=4){ctx.power++;note('Cristallo: risonanza degli scarti');}
 if(n===19){const phase=side.turnCount%3;if(phase===1){ctx.power+=2;note('Io: eruzione');}else if(phase===2){ctx.power=Math.max(0,ctx.power-1);note('Io: raffreddamento');}}
 if(n===20){const elements=['mineral','plasma','refrigerant','ionic'];if(enemy.ships[0].element!==elements[side.turnCount%4]){ctx.guard++;note('Vuoto: dominio elementale');}}
}
function escortPassive(b,side,ctx,events){
 const mother=side.ships[0];
 refreshEscortLinks(side);
 for(const e of side.escorts.filter(x=>x.linked)){
  const skill=e.skill;
  if((side.turnCount+1)%Math.max(1,skill.interval)!==0)continue;
  if(['ion','focus','strike','siege','precision','surge','corrode','revenge'].includes(skill.action)){
   ctx.power++;events.push(emit(b,ctx.who,'escort',e.name+' · '+skill.name+' potenzia la madre'));
  }else if(['repair','mend'].includes(skill.action)){
   const h=heal(side,1,skill.action==='mend');
   if(h)events.push(emit(b,ctx.who,'escort',e.name+' ripara '+h.name));
  }else if(['draw'].includes(skill.action)){
   ctx.extraDraw++;events.push(emit(b,ctx.who,'escort',e.name+' prepara un ricambio'));
  }else if(['jam'].includes(skill.action)){
   const enemy=b.sides[ctx.who==='A'?'B':'A'];
   enemy.buffs.push({kind:'jam',untilPly:b.ply+2,power:1});
   events.push(emit(b,ctx.who,'escort',e.name+' disturba il fuoco avversario'));
  }
 }
}
function opponentProtection(b,defender,attackerCtx,strength,events){
 refreshEscortLinks(defender);
 const mother=defender.ships[0];
 const guards=defender.defenses.filter(x=>x.untilPly>b.ply);
 let shield=guards.reduce((n,x)=>n+x.guard,0);
 if(defender.commander?.untilPly>b.ply&&/protezione|guardia|scudo|resistenza/.test(defender.commander.kind))
  shield+=1;
 const jam=defender.buffs.filter(x=>x.kind==='jam'&&x.untilPly>b.ply).reduce((n,x)=>n+x.power,0);
 let power=clamp(strength-shield-jam+(attackerCtx.pierce?Math.min(shield,attackerCtx.pierce):0),0,7);
 if(power<=0)return {power:0,escort:null};
 const intercept=defender.escorts.find(e=>e.linked&&
  ['cover','bulwark','partCover','phase'].includes(e.skill.action));
 if(intercept){
  const damaged=Math.min(intercept.hp,clamp(power,1,5)+
   (b.terrain?.id==='T04'?1:0)+(b.terrain?.id==='T10'&&attackerCtx.multiTargets>1?1:0));
  intercept.hp-=damaged;intercept.destroyed=intercept.hp<=0;
  refreshEscortLinks(defender);
  events.push(emit(b,attackerCtx.who,'impact',
   'Scudiera '+intercept.name+' intercetta la salva: -'+damaged+' resistenza',
   {escortSlot:intercept.slot,escortName:intercept.name,escortDamage:damaged,damage:0}));
  return {power:0,escort:intercept,escortDamage:damaged};
 }
 return {power,escort:null};
}
function resolveCombo(b,ctx,mother,side,played,events){
 const previous=side.stagedComboCards.filter(x=>x.untilPly>=b.ply).flatMap(x=>x.cards);
 const ready=COMBO_RECIPES.filter(c=>c.navicella===mother.id&&
  isComboReady(c,mother,side.escorts,played,previous));
 if(!ready.length)return null;
 const pick=ready.sort((a,z)=>z.bersagli_massimi-a.bersagli_massimi)[0];
 ctx.multiTargets=clamp(pick.bersagli_massimi,1,4);
 events.push(emit(b,ctx.who,'combo',pick.ricetta+' attivata: fino a '+ctx.multiTargets+' componenti'));
 side.stagedComboCards=[];
 return pick;
}
function resolveSalvo(b,ctx,events,order){
 const side=b.sides[ctx.who],defender=b.sides[ctx.who==='A'?'B':'A'];
 const mother=side.ships[0],target=defender.ships[0];
 const mainPart=motherPart(target,order.partId);
 if(!mainPart||mainPart.destroyed||!operational(mother,'weapons')||side.fireDisabledUntil>b.ply){
  events.push(emit(b,ctx.who,'no-shot','Armi indisponibili o bersaglio non valido'));
  return {damage:0};
 }
 const base=1+mother.weaponRating+ctx.power+Math.min(1,ctx.attackCards);
 const terrain=terrainSalvoModifier(b.terrain,mother.id);
 const elemental=(mother.element==='plasma'&&target.element==='mineral')||
  (mother.element==='mineral'&&target.element==='ionic')||
  (mother.element==='ionic'&&target.element==='refrigerant')||
  (mother.element==='refrigerant'&&target.element==='plasma')?1:0;
 const strength=clamp(base+terrain.value+elemental,0,7);
 const protection=opponentProtection(b,defender,ctx,strength,events);
 if(protection.escort)return {damage:0,escortSlot:protection.escort.slot,
  escortDamage:protection.escortDamage,partId:order.partId,played:ctx.cards};
 if(protection.power<=0){
  events.push(emit(b,ctx.who,'block','La difesa annulla la salva'));
  return {damage:0,partId:order.partId,played:ctx.cards};
 }
 const valid=target.parts.filter(p=>!p.destroyed);
 const extra=valid.filter(p=>p.id!==mainPart.id).slice(0,Math.max(0,ctx.multiTargets-1));
 const targets=[mainPart,...extra];
 const hits=[];
 for(const p of targets){
  // Una raffica reale causa al massimo una frattura per vitale.
  const damage=applyDamage(p,1);
  if(damage)hits.push({id:p.id,damage,destroyed:p.destroyed});
 }
 refreshEscortLinks(defender);
 const total=hits.reduce((sum,h)=>sum+h.damage,0);
 events.push(emit(b,ctx.who,'impact','Salva '+mother.name+': '+hits.map(h=>VITAL_LABELS[h.id]).join(', '),
  {shipIndex:0,shipName:target.name,partId:mainPart.id,damage:total,
   destroyed:mainPart.destroyed,played:ctx.cards,targets:hits,terrainBonus:terrain.value}));
 side.lastDamage=total;
 return {damage:total,partId:mainPart.id,played:ctx.cards,targets:hits,destroyed:mainPart.destroyed};
}
function finishTurn(b,ctx,events){
 const side=b.sides[ctx.who];
 side.turnCount++;
 // I bonus e le riparazioni differite sono risolti al proprio turno seguente.
 if(ctx.extraDraw){
  const extra=Math.min(ctx.extraDraw,2);
  for(let i=0;i<extra&&side.deck.length;i++)side.hand.push(side.deck.shift());
  while(side.hand.length>FLEET_HAND_SIZE)side.discard.push(side.hand.pop());
 }
 if(ctx.cards.length&&side.drawBlockedUntil<=b.ply)refill(b,side);
 side.buffs=side.buffs.filter(x=>x.untilPly>b.ply);
 side.defenses=side.defenses.filter(x=>x.untilPly>b.ply);
 side.defenseSlots=side.defenses.map(x=>x.id).slice(-2);
 if(side.commander?.untilPly<=b.ply)side.commander=null;
 side.lastPlayed=[...ctx.cards];
 b.ply++;
 b.round=1+Math.floor(b.ply/2);
 b.turn=ctx.who==='A'?'B':'A';
 b.terrain=activeTerrain(b.terrain,b.ply);
 if(allVitalsDestroyed(b.sides.A.ships[0])||allVitalsDestroyed(b.sides.B.ships[0])){
  b.phase='finished';
  const deadA=allVitalsDestroyed(b.sides.A.ships[0]);
  const deadB=allVitalsDestroyed(b.sides.B.ships[0]);
  b.winner=deadA&&deadB?'draw':deadA?'B':'A';
  b.finishedAtMs=ctx.nowMs;
  events.push(emit(b,'system','finish','Partita terminata: '+b.winner));
 }else if(!operational(b.sides.A.ships[0],'weapons')&&!operational(b.sides.B.ships[0],'weapons')&&
  !b.sides.A.hand.some(x=>/riparazione|recupero/.test(GENERAL_CARDS[x]?.famiglia||''))&&
  !b.sides.B.hand.some(x=>/riparazione|recupero/.test(GENERAL_CARDS[x]?.famiglia||''))){
  b.phase='finished';b.winner='draw';b.finishedAtMs=ctx.nowMs;
  events.push(emit(b,'system','finish','Pareggio tecnico: nessuna flotta può attaccare'));
 }
 b.deadlineMs=ctx.nowMs+FLEET_TURN_SECONDS*1000;
 b.lastEvents=events;
}
export function resolveFleetNextTurn(battle,who,order={},nowMs=0){
 const error=validateFleetTurn(battle,who,order);
 if(error)return {ok:false,reason:error,battle,events:[]};
 const b=clone(battle),events=[],side=b.sides[who],enemy=b.sides[who==='A'?'B':'A'];
 const cards=takeCards(side,order.cards||[]);
 const ctx={who,nowMs,cards,power:0,guard:0,pierce:0,
  attackCards:0,comboCards:[],multiTargets:1,extraDraw:0,
  terrainChanged:false,repairDelayed:false,scan:false};
 for(const id of cards)applyCard(b,side,enemy,id,ctx,events);
 if(side.pendingRepair&&side.turnCount>0){
  const h=heal(side,side.pendingRepair);
  if(h)events.push(emit(b,who,'repair','Riparazione differita: '+h.name));
  side.pendingRepair=0;
 }
 applyBossPassive(b,ctx,events);
 escortPassive(b,side,ctx,events);
 const combo=resolveCombo(b,ctx,side.ships[0],side,cards,events);
 if(!combo&&cards.length){
  side.stagedComboCards=[{untilPly:b.ply+2,cards:cards.filter(id=>EXCLUSIVE_CARDS[id])}];
 }
 side.attackSlots=cards.filter(id=>cardRole(id)==='attack').slice(0,3);
 let shot={damage:0,played:cards};
 if(!order.pass)shot=resolveSalvo(b,ctx,events,order);
 side.discard.push(...cards.filter(id=>cardRole(id)!=='character'&&cardRole(id)!=='defense'));
 finishTurn(b,ctx,events);
 return {ok:true,battle:b,events,shot};
}
export function autoFleetTurn(b,who=b.turn){
 const side=b.sides[who],enemy=b.sides[who==='A'?'B':'A'];
 const candidates=side.hand.map((id,i)=>({id,i,role:cardRole(id)}))
  .filter(x=>!EXCLUSIVE_CARDS[x.id]||
   exclusiveOperational(x.id,side.ships[0],side.escorts));
 const playable=candidates.filter(c=>c.role!=='character'||!side.commander||side.commander.untilPly<=b.ply);
 const cards=playable.sort((a,z)=>{
  const score=x=>x.role==='attack'?5:x.role==='defense'?3:x.role==='support'?2:
   x.role==='character'?4:x.role==='terrain'?1:2;
  return score(z)-score(a);
 }).slice(0,FLEET_MAX_PLAYED).map(x=>x.i);
 const target=enemy.ships[0].parts.filter(p=>!p.destroyed).sort((a,z)=>a.hp-z.hp)[0];
 return {partId:target?.id||null,cards,pass:!target};
}
export function timeoutFleetTurn(battle,nowMs){
 if(battle.phase!=='playing'||nowMs<battle.deadlineMs)return {ok:false,battle,events:[]};
 const who=battle.turn;
 return resolveFleetNextTurn(battle,who,{partId:null,cards:[],pass:true},nowMs);
}
