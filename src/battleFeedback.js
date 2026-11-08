// Punto 47 — segnali del duello: puramente presentazionali.
// Nessuna carta, munizione, stato, danno o status viene creato da queste
// funzioni. L'evento reale rimane la sola fonte del feedback.
import {shotCombinationName,STRATEGIC_EFFECT_LABELS} from './strategicShots.js';

const SAFE_SUITS=Object.freeze(['♥','♦','♣','♠']);
const sideLabel=side=>side==='enemy'?'AVVERSARIO':'TU';
const validDamage=n=>Number.isFinite(n)&&n>0?Math.floor(n):0;
const summary=(label,detail,kind,side,id)=>Object.freeze({
 id:String(id),kind,side:side==='enemy'?'enemy':'player',
 label:String(label),detail:String(detail)
});
export function spentCardTrail(cards=[],indices=[],side='player'){
 if(side!=='player'||!Array.isArray(cards)||!Array.isArray(indices)||
  cards.length!==indices.length||![2,3].includes(cards.length))return Object.freeze([]);
 const result=cards.map((card,n)=>{
  const index=indices[n];
  if(!card||!Number.isInteger(index)||index<0||index>6||
   !Number.isInteger(card.value)||card.value<1||card.value>13||
   !SAFE_SUITS.includes(card.suit))return null;
  return Object.freeze({id:String(card.id??index),value:card.value,suit:card.suit,index});
 });
 if(result.some(c=>!c)||new Set(result.map(c=>c.index)).size!==result.length)
  return Object.freeze([]);
 return Object.freeze(result);
}
export function launchBattleCue({id,side='player',cards=[],rawDamage=0,shots=[],effects=[]}={}){
 if(!Number.isInteger(id)||id<1||![2,3].includes(cards?.length)||!Array.isArray(shots))
  return null;
 const fired=shots.filter(shot=>Number(shot?.damage)>0);
 const damage=validDamage(rawDamage);
 if(!damage||fired.length===0){
  return summary('ARMI IN CARICA','Calcolo valido · nessuna salva partita','charge',side,'launch:'+id);
 }
 const combo=shotCombinationName(effects);
 const detail=cards.length+' carte numeriche · '+fired.length+
  (fired.length===1?' arma attiva':' armi attive')+(combo?' · '+combo:'');
 return summary(cards.length===3?'SCARICA TRIPLA':'ARMI IN FUOCO',
  detail,'launch',side,'launch:'+id);
}
export function impactBattleCue({id,side='player',result,effect={}}={}){
 if(!Number.isInteger(id)||id<1||!result)return null;
 const dealt=validDamage(result.damage);
 const applied=Array.isArray(result.strategicApplied)?result.strategicApplied:[];
 const combo=shotCombinationName(applied);
 const unique=applied.filter((x,i)=>applied.indexOf(x)===i);
 const specials=combo||unique.map(x=>STRATEGIC_EFFECT_LABELS[x]).filter(Boolean).join(' + ');
 if(!dealt){
  return summary('COLPO RESPINTO','Nessun danno applicato al bersaglio',
   'blocked',side,'impact:'+id);
 }
 let label='IMPATTO CONFERMATO',kind='impact';
 if(result.systemDisabled){label='SISTEMA DISTRUTTO';kind='critical';}
 else if(result.destroyed){label='BERSAGLIO DISTRUTTO';kind='critical';}
 else if(result.systemDamaged){label='SISTEMA DANNEGGIATO';kind='critical';}
 else if(specials){label=specials;kind='special';}
 else if(result.shieldCollapsed>0){label='SCUDO COLLASSATO';kind='critical';}
 const target=effect.escortIndex!=null?'SCUDIERA':effect.vitalId?'PARTE VITALE':'SCUDO';
 const detail=dealt+' HP · '+target+(specials&&label!==specials?' · '+specials:'');
 return summary(label,detail,kind,side,'impact:'+id);
}
export function specialBattleCue({id,side='player',played=false,definition,amount=0}={}){
 if(!played||!definition||!Number.isInteger(id)||id<1)return null;
 const family=definition.family;
 const kind=['fusion','volley','support','defense','boss-character','terrain','mutation','epic','sabotage','transmute','quantum','equipment','rift'].includes(family)?family:'special';
 const label=definition.name||'CARTA SPECIALE';
 const detail=(family==='volley'?'COLPO ARMATO · ':family==='fusion'?'FUSIONE AVVIATA · ':
  family==='support'?'SUPPORTO ATTIVATO · ':family==='boss-character'?'PERSONAGGIO SCHIERATO · ':
  family==='rift'?'FAGLIA DI VULNERABILITÀ · ':family==='equipment'?'CARTA MODULO ATTIVATA · ':family==='quantum'?'CARTA DADO ATTIVATA · ':family==='sabotage'?'SABOTAGGIO PREPARATO · ':family==='transmute'?'CARTA NUMERICA TRASFORMATA · ':
  family==='epic'?'OGGETTO EPICO ATTIVATO · ':family==='mutation'?'FIRMA DIFENSIVA MUTATA · ':family==='terrain'?'AMBIENTE ATTIVATO · ':'COPERTURA ATTIVATA · ')+
  (validDamage(amount)?'+'+validDamage(amount)+' HP':'carta consumata');
 return summary(label,detail,kind,side,'special:'+id);
}
export function bossBattleIdentity(side,active=true){
 const id=active?side?.bossNumericDeck?.id:null;
 const name=id&&typeof id==='string'?side.bossNumericDeck?.name:null;
 return Object.freeze({isBoss:!!id,id:id||null,name:name||null,
  shieldPercent:side?.fleet?.[0]?.defense?.shield?.max>0?
   Math.round(100*side.fleet[0].defense.shield.hp/side.fleet[0].defense.shield.max):null});
}
