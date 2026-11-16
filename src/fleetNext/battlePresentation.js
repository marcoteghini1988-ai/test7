import {card,cardRole} from './rules.js';
import {isTrapCard} from './simpleEffects.js';
import {CAMPAIGN_SHIP_ORDER} from './progression.js';

// Una carta coperta avversaria non consegna identità o rarità al renderer.
export function projectFleetSlots(side,chosenCards=[],owner='A',viewer='A'){
 const slots=Array(6).fill(null);
 const visible=(id,hidden=false,pending=false)=>hidden&&owner!==viewer?
  {hidden:true,pending:false}:{id,hidden,pending};
 if(side.commander?.id)slots[0]=visible(side.commander.id);
 const defenses=side.defenses?.length?side.defenses:
  (side.defenseSlots||[]).map(id=>({id,hidden:isTrapCard(card(id))}));
 defenses.filter(entry=>entry?.id).forEach(entry=>{
  const index=entry.hidden||isTrapCard(card(entry.id))?2:1;
  if(!slots[index])slots[index]=visible(entry.id,index===2);
 });
 (side.attackSlots||[]).slice(0,3).forEach((id,i)=>{if(id)slots[i+3]=visible(id);});
 for(const id of chosenCards){
  const role=cardRole(id);
  const positions=role==='character'?[0]:role==='defense'?[isTrapCard(card(id))?2:1]:
   role==='terrain'||card(id)?.effectSpec?.type==='deployMachine'?[]:[3,4,5];
  const index=positions.find(i=>!slots[i]);
  if(index!==undefined)slots[index]=visible(id,isTrapCard(card(id)),true);
 }
 return slots;
}

export function fleetEventText(event,viewer='A'){
 if(event.kind==='trap-set')return event.who===viewer?
  'Trappola preparata coperta.':'L’avversario prepara una trappola coperta.';
 return event.text||'';
}

export function fleetTurnNotice(events,viewer='A'){
 const cancelled=events.find(event=>event.kind==='terrain-cancelled');
 if(cancelled)return fleetEventText(cancelled,viewer);
 const prepared=events.filter(event=>event.kind==='trap-set');
 if(prepared.length)return prepared.length>1?
  (prepared[0].who===viewer?'Due trappole preparate coperte.':'L’avversario prepara due trappole coperte.'):
  fleetEventText(prepared[0],viewer);
 return events.slice(-2).map(event=>fleetEventText(event,viewer)).join(' · ');
}


// I sistemi nuovi conservano le coordinate fisiche delle quattro parti originali.
// La Plancia usa il punto del vecchio motore; i sistemi assenti non sono bersagli.
export const FLEET_PHYSICAL_VITALS=Object.freeze({engine:'bridge',weapons:'weapons',shieldGenerator:'generator',command:'command'});
export const FLEET_VITAL_NAMES=Object.freeze({bridge:'Plancia',weapons:'Arsenale',generator:'Generatore',command:'Centralina'});
export function projectFleetDefense(mother){
 const parts=Object.fromEntries(Object.entries(FLEET_PHYSICAL_VITALS).map(([physical,id])=>{
  const part=mother.parts.find(p=>p.id===id);
  const hp=part?Math.max(0,Math.ceil(2*part.hp/part.maxHp)):2;
  return [physical,{hp,max:2,unlocked:!!part,exposed:!!part,signature:null}];
 }));
 return {kind:'mother',shipId:mother.id,parts,shield:{hp:0,max:1},exposureOrder:[]};
}
export function projectMachineBerths(side,chosenCards=[]){
 const slots=Array(2).fill(null);
 for(const unit of side.machines||[])if(unit.hp>0&&!unit.destroyed&&unit.slot>=0&&unit.slot<2)
  slots[unit.slot]={...unit,pending:false};
 for(const id of chosenCards){
  const def=card(id);
  if(def?.effectSpec?.type!=='deployMachine')continue;
  const index=slots.findIndex(slot=>!slot);
  if(index<0)break;
  slots[index]={id,slot:index,name:def.nome||def.name,pending:true,hp:def.effectSpec.hp,maxHp:def.effectSpec.hp};
 }
 return slots;
}


const CAMPAIGN_PLANET_IDS=Object.freeze([1,2,3,6,7,8,9,11,14,17,19,20]);
// Le dodici flotte principali seguono i dodici capitoli. I cinque modelli
// alternativi già posseduti restano disponibili nell'Hangar.
export function campaignFleetShipId({planetId=null,sectorNumber=null}={}){
 const bySector=Number.isInteger(sectorNumber)&&sectorNumber>=1&&sectorNumber<=120?
  Math.floor((sectorNumber-1)/10):-1;
 const index=planetId==null?bySector:CAMPAIGN_PLANET_IDS.indexOf(Number(planetId));
 return CAMPAIGN_SHIP_ORDER[index]||null;
}
