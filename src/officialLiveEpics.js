// Runtime degli Oggetti Epici sul duello LIVE. Le sei carte derivano
// dalle reliquie realmente fuse, non sono ricompense generate dalla battaglia.
// Matrice: Coppia/Tris autentica sul vitale attiva +2 sul successivo
// proiettile PESANTE Accumulo diretto alla barriera nello stesso ciclo.
// La combinazione distrugge il vitale come previsto, non riceve danni extra.
import {TACTICAL_EPIC_CARDS,isTacticalEpic,tacticalEpicCritical,tacticalEpicActive} from './tacticalEpicCards.js';
import {activateTacticalEpic,expireTacticalEpic} from './tacticalEpicRuntime.js';
import {replaceLiveModuleNumerics} from './officialLiveModules.js';
export const LIVE_EPIC_SUPPORTED=Object.freeze([
 'epic_item_1','epic_item_3','epic_item_6','epic_item_7','epic_item_8',
 'epic_item_9'
]);
export const supportedLiveEpic=type=>LIVE_EPIC_SUPPORTED.includes(type);
function report(b,key,message,kind='epic',details={}){
 b.lastEvents=[...b.lastEvents.slice(-24),key+': '+message];
 b.history.push({turn:b.turn,by:key,kind,message:key+': '+message,...details});
}
export function playLiveEpic(b,key,type){
 if(!supportedLiveEpic(type))return {ok:false,reason:'epic_pending_migration'};
 const side=b.sides[key],rule=TACTICAL_EPIC_CARDS[type];
 if(!side.epic?.entitlements?.includes(type))return {ok:false,reason:'epic_unowned'};
 if(side.epic.used.includes(type))return {ok:false,reason:'epic_already_used'};
 if(side.epic.active&&side.epic.active.untilRound>=b.round)
  return {ok:false,reason:'epic_already_active'};
 if(type==='epic_item_1'&&!tacticalEpicCritical(side))
  return {ok:false,reason:'mobius_not_critical'};
 if(type==='epic_item_9'&&!tacticalEpicCritical(side))
  return {ok:false,reason:'matrice_not_critical'};
 if(type==='epic_item_9'&&!side.weapons?.some(w=>w.kind==='Accumulo'))
  return {ok:false,reason:'epic_requires_heavy'};
 if(type==='epic_item_7'&&!side.heated)
  return {ok:false,reason:'monolith_not_needed'};
 const logs=[];
 activateTacticalEpic(side,type,b.round,0,logs);
 side.epic.liveChoice=null;
 side.epic.liveChoiceCommitted=false;
 side.epic.liveChoiceApplied=false;
 if(type==='epic_item_6')side.epic.lastPendulumTriggerRound=0;
 if(type==='epic_item_9'){
  side.epic.matriceArmed=false;
  side.epic.matriceSpent=false;
 }
 report(b,key,rule.name+' attivato dalla carta vera','epic_activated',{type});
 return {ok:true};
}
// La scelta viene fatta durante il turno di attivazione e applicata solo
// alla prossima pesca REALE; nessuna carta viene duplicata o inventata.
// Solo firme gia' verificate e risolte sul vitale reale: non crea carte,
// non concede spari e non aumenta i danni diretti al componente.
export function liveEpicOnVitalFormula(b,key,operation){
 const side=b.sides[key];
 if(!tacticalEpicActive(side,'epic_item_9',b.round)||
    !['pair','trips'].includes(operation)||side.epic.matriceSpent)return false;
 side.epic.matriceArmed=true;
 report(b,key,'Matrice pronta: prossimo vero colpo Accumulo +2 alla barriera',
  'epic_matrice_armed',{operation});
 return true;
}
export function liveEpicMatriceBonus(b,key,weaponKind){
 const side=b.sides[key];
 return weaponKind==='Accumulo'&&tacticalEpicActive(side,'epic_item_9',b.round)&&
   side.epic.matriceArmed&&!side.epic.matriceSpent?2:0;
}
export function liveEpicAfterMatriceShot(b,key,damage,bonus){
 const side=b.sides[key];
 if(!(damage>0)||bonus!==2||!side.epic.matriceArmed||side.epic.matriceSpent)
  return false;
 side.epic.matriceArmed=false;
 side.epic.matriceSpent=true;
 report(b,key,'Matrice: +2 al proiettile Accumulo autentico',
  'epic_matrice_hit',{damage,bonus});
 return true;
}
export function liveEpicChoose(b,key,index){
 const side=b.sides[key],active=side.epic?.active;
 const type=active?.id;
 if(!['epic_item_1','epic_item_3'].includes(type)||
  side.epic.liveChoiceCommitted||side.epic.liveChoiceApplied)return {ok:false,reason:'epic_choice_unavailable'};
 const capacity=type==='epic_item_1'?10:2;
 if(!Number.isInteger(index)||index<0||index>=Math.min(capacity,side.numeric.deck.length))
  return {ok:false,reason:'epic_choice_invalid'};
 side.epic.liveChoice=index;
 side.epic.liveChoiceCommitted=true;
 report(b,key,'Scelta '+TACTICAL_EPIC_CARDS[type].short+' · prossima numerica '+(index+1),
  'epic_choice',{type,index});
 return {ok:true};
}
export function liveEpicBeforeDraw(side,round){
 expireTacticalEpic(side,round);
 const active=side.epic?.active;
 if(!active)return;
 if(side.epic.liveChoiceCommitted&&!side.epic.liveChoiceApplied&&
  ['epic_item_1','epic_item_3'].includes(active.id)){
  const deck=side.numeric.deck,index=side.epic.liveChoice;
  if(Number.isInteger(index)&&index>0&&index<deck.length)
   deck.unshift(deck.splice(index,1)[0]);
  side.epic.liveChoiceApplied=true;
  side.epic.liveChoice=null;
 }
}
export function liveEpicOnShieldDamage(b,targetKey,damage){
 if(!(damage>0))return;
 const attackerKey=targetKey==='A'?'B':'A';
 for(const key of ['A','B']){
  const side=b.sides[key],active=side.epic?.active;
  if(!active||active.untilRound<b.round)continue;
  if(active.id==='epic_item_8'){
   const awarded=Math.min(10,Math.floor(damage/5));
   side.sync=Math.min(100,side.sync+awarded);
   // Solo anteprima, senza scrivere wallet o premi PvP.
   side.epic.dustPreview=(side.epic.dustPreview||0)+Math.floor(damage/10);
   report(b,key,'Calice: +'+awarded+' Sincronia su '+damage+
    ' danni reali, Polvere soltanto visiva','epic_calice',{damage,awarded});
  }
  if(key===targetKey&&active.id==='epic_item_6'&&
    side.epic.lastPendulumTriggerRound!==b.round){
   side.epic.lastPendulumTriggerRound=b.round;
   side.epic.exchangeCredits=1;
   side.epic.exchangeUntilRound=b.round+1;
   side.epic.peek=side.numeric.deck.slice(0,6).map(c=>({value:c.value,suit:c.suit}));
   report(b,key,'Pendolo: prossime 6 numeriche visibili, 1 ricambio disponibile',
    'epic_pendulum',{type:active.id});
  }
 }
}
export function liveEpicRecycle(b,key,index){
 const side=b.sides[key];
 if(!Number.isInteger(index)||index<0||index>=side.numeric.hand.length||
  !(side.epic?.exchangeCredits>0)||b.round>side.epic.exchangeUntilRound)
  return {ok:false,reason:'epic_exchange_unavailable'};
 side.epic.exchangeCredits--;
 replaceLiveModuleNumerics(b,key,[index]);
 report(b,key,'Pendolo: 1 ricambio extra autentico consumato','epic_recycle',{index});
 return {ok:true};
}
