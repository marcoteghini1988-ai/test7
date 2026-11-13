// Le dodici passive ufficiali adattate al duello a carte di flotta.
// Le identità e gli ID dei boss derivano dal catalogo esistente 16D.
// Regole piccole e pubbliche: ogni passiva modifica un evento reale del round,
// senza creare carte, vita extra permanente o requisiti matematici.
import {PHASE16D_BOSS_PROFILES} from './newCombat/phase16DBosses.js';
import {escortAlive,repairFleetUnit} from './fleetEscortSupports.js';

export const BOSS_ARENA_ELEMENTS=Object.freeze({
 1:'mineral',2:'plasma',3:'ionic',6:'ionic',7:'ionic',8:'refrigerant',
 9:'mineral',11:'refrigerant',14:'ionic',17:'mineral',19:'plasma',20:'ionic'
});
export const BOSS_PASSIVE_DESCRIPTIONS=Object.freeze({
 1:'Corazza tellurica: il primo attacco contro il boss perde 1 potenza.',
 2:'Assalto progressivo: i colpi efficaci consecutivi aumentano l attacco nemico, fino a +2.',
 3:'Neurotossina: dopo un colpo efficace, danneggia una scudiera oppure frattura i Motori della madre.' ,
 6:'Controtempo: due speciali nello stesso round danno al boss +1 difesa e +1 attacco.',
 7:'Sifone quantico: il primo Impulso Ionico avversario viene convertito in +1 attacco boss.',
 8:'Pressione degli abissi: +1 attacco se una parte della madre avversaria e gia fratturata.',
 9:'Patto di sangue: sacrifica la resistenza di una scudiera per +1 attacco, ogni 2 round.',
 11:'Rigenerazione criogenica: ripara una frattura o una scudiera dopo un colpo, salvo contro Plasma.',
 14:'Reattore crescente: ogni terzo round la flotta boss ottiene +2 attacco.',
 17:'Memoria degli scarti: le tue carte consumate alimentano progressivamente la potenza nemica.',
 19:'Ciclo magmatico: carica, eruzione (+2 attacco), raffreddamento (attacco indebolito).',
 20:'Dominio degli elementi: ogni round cambia elemento dominante; schierarlo neutralizza la sua difesa.'
});
const IDS=Object.keys(PHASE16D_BOSS_PROFILES);
if(IDS.length!==12||IDS.some(id=>!BOSS_PASSIVE_DESCRIPTIONS[id]||!BOSS_ARENA_ELEMENTS[id]))
 throw Error('Manca una passiva elementale di uno dei dodici boss ufficiali');

const activeShips=side=>side.ships.filter(ship=>ship.parts.filter(p=>p.destroyed).length<2);
const component=(ship,id)=>ship.parts.find(part=>part.id===id);
const hasGenerator=ship=>component(ship,'generator')?.damage<2;
const elementCycle=['mineral','plasma','refrigerant','ionic'];

export function createFleetBossState(planetId){
 const p=PHASE16D_BOSS_PROFILES[Number(planetId)];
 if(!p)return null;
 return {
  id:p.planet,name:p.name,originalAbility:p.ability,
  description:BOSS_PASSIVE_DESCRIPTIONS[p.planet],
  terrainElement:BOSS_ARENA_ELEMENTS[p.planet],
  armorSpent:false,streak:0,poisonTarget:null,regenPending:false,charge:0,
  ionSiphonUsed:false,dominantElement:null,cycle:'carica',status:''
 };
}
export function fleetBossBrief(battle){
 const m=battle?.bossState;if(!m)return null;
 const p=PHASE16D_BOSS_PROFILES[m.id];
 const extra=m.id===2?' · Serie: '+m.streak:
  m.id===14?' · Reattore: '+m.charge+'/3':
  m.id===19?' · Fase: '+m.cycle:
  m.id===20&&m.dominantElement?' · Dominio: '+m.dominantElement:
  m.id===1?(m.armorSpent?' · Corazza consumata':' · Corazza integra'):'';
 return {id:m.id,name:p.name,ability:p.ability,description:m.description,
  status:(m.status||p.ability)+extra,terrainElement:m.terrainElement};
}
export function applyFleetBossBeforeRound(battle,effects,orders){
 const m=battle.bossState;
 if(!m||battle.phase!=='playing')return [];
 const a=effects.A,b=effects.B;
 const messages=[];
 const note=text=>{messages.push('BOSS '+m.name+': '+text);m.status=text;};
 const enemy=activeShips(battle.sides.B);
 const player=activeShips(battle.sides.A);
 // La nave madre è sempre il primo membro della flotta (solo se ancora viva).
 const mother=enemy[0];
 const playerTarget=battle.sides.A.ships[orders.B.shipIndex];
 switch(m.id){
  case 1:
   if(!m.armorSpent){b.guard++;note('Corazza tellurica pronta contro il primo attacco');}
   break;
  case 2:
   if(m.streak>0){b.power+=Math.min(2,m.streak);note('Assalto progressivo, serie '+m.streak);}
   break;
  case 3:
   if(m.poisonTarget!=null){
    const escort=battle.sides.A.escorts.find(escortAlive);
    if(escort){
     escort.hp=Math.max(0,escort.hp-1);
     escort.destroyed=escort.hp===0;
     note('Neurotossina: -1 resistenza a '+escort.name);
    }else{
     const ship=battle.sides.A.ships[0];
     const motor=ship?.parts?.find(p=>p.id==='engine');
     if(motor&&motor.damage===0){motor.damage=1;note('Neurotossina: Motori fratturati');}
    }
    m.poisonTarget=null;
   }
   break;
  case 6:
   if(a.cards.length===2){b.guard++;b.power++;note('Controtempo: intercetta due carte speciali');}
   break;
  case 7:
   if(a.ion&&!m.ionSiphonUsed){
    a.ion=false;b.power++;m.ionSiphonUsed=true;
    note('Sifone quantico assorbe l Impulso Ionico');
   }
   break;
  case 8:
   if(playerTarget&&playerTarget.parts.some(p=>p.damage>0)){b.power++;note('Pressione degli abissi sul sistema esposto');}
   break;
  case 9:
   if(battle.round%2===0&&mother&&hasGenerator(mother)){
    const offering=battle.sides.B.escorts.find(escortAlive);
    if(offering){
     offering.hp=Math.max(0,offering.hp-1);offering.destroyed=offering.hp===0;
     b.power++;note('Patto di sangue: sacrificata resistenza della scudiera');
    }
   }
   break;
  case 11:
   if(m.regenPending){
    if(player.some(s=>s.element==='plasma'))note('Rigenerazione bloccata dal Plasma');
    else{
     const repaired=repairFleetUnit(battle.sides.B);
     if(repaired)note('Rigenerazione criogenica: '+repaired);
    }
    m.regenPending=false;
   }
   break;
  case 14:
   m.charge=(m.charge%3)+1;
   if(m.charge===3){b.power+=2;note('Reattore carico: scarica +2 attacco');m.charge=0;}
   else note('Reattore in carica '+m.charge+'/3');
   break;
  case 17: {
   const discards=battle.sides.A.discard.length;
   if(discards>=4){b.power+=1;note('Memoria degli scarti: '+discards+' carte consumate');}
   if(discards>=8)b.guard+=1;
   break;
  }
  case 19: {
   const phase=(battle.round-1)%3;
   m.cycle=['carica','eruzione','raffreddamento'][phase];
   if(phase===1){b.power+=2;note('Eruzione magmatica: +2 attacco');}
   else if(phase===2){b.power=Math.max(-1,b.power-1);note('Raffreddamento: attacco ridotto');}
   else note('Magma in carica: eruzione al prossimo round');
   break;
  }
  case 20: {
   const dominant=elementCycle[(battle.round-1)%elementCycle.length];
   m.dominantElement=dominant;
   if(player.some(s=>s.element===dominant)){a.power+=1;note('Dominio '+dominant+' neutralizzato dalla tua flotta');}
   else {b.guard+=1;note('Dominio '+dominant+': +1 protezione boss');}
   break;
  }
  default:break;
 }
 return messages;
}
// Solo eventi derivati dagli attacchi simultanei; nessun colpo postumo se boss distrutto.
export function applyFleetBossAfterRound(battle,hitPlayer,hitBoss){
 const m=battle.bossState;
 if(!m||battle.sides.B.ships.every(s=>s.parts.filter(p=>p.destroyed).length>=2))return [];
 const bossHit=hitPlayer.shieldsHit>0||hitPlayer.damage>0;
 const enemyHit=hitBoss.shieldsHit>0||hitBoss.damage>0;
 const events=[];
 if(m.id===1&&!m.armorSpent&&hitPlayer.fireCount>0){
  m.armorSpent=true;events.push('Corazza tellurica consumata');
 }
 if(m.id===2){m.streak=enemyHit?Math.min(2,m.streak+1):0;}
 if(m.id===3&&enemyHit){
  m.poisonTarget=hitBoss.shipIndex;
  events.push('Neurotossina applicata a '+hitBoss.shipName);
 }
 if(m.id===11&&bossHit)m.regenPending=true;
 return events.map(text=>'BOSS '+m.name+': '+text);
}
