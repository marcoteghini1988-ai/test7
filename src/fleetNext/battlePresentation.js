import {card,cardRole} from './rules.js';
import {isTrapCard} from './simpleEffects.js';
import {supportWeaponCharge,arsenalBonus} from './newCardEffects.js';
import {hasBalancedMother} from './confirmedCardBalance.js';
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
 // Due slot Attacco e uno Energia; la pila effettiva resta illimitata.
 // Il terzo Attacco esistente si sovrappone al secondo slot senza cambiare le regole.
 const attacks=(side.attackSlots||[]).filter(Boolean);
 attacks.slice(0,2).forEach((id,i)=>{slots[i+3]=visible(id);});
 if(attacks.length>2&&slots[4])slots[4]={...slots[4],stackCount:attacks.length-1};
 const energyPile=side.energyPile||[];
 const lastEnergy=energyPile[energyPile.length-1];
 const energyId=typeof lastEnergy==='string'?lastEnergy:lastEnergy?.id;
 if(energyId)slots[5]={...visible(energyId),stackCount:energyPile.length};
 for(const id of chosenCards){
  const definition=card(id),role=cardRole(id);
  const energy=definition?.effectSpec?.type==='energy';
  const positions=energy?[5]:role==='character'?[0]:role==='defense'?[isTrapCard(definition)?2:1]:
   role==='terrain'||definition?.effectSpec?.type==='deployMachine'?[]:[3,4];
  const index=positions.find(i=>!slots[i]);
  if(index!==undefined)slots[index]=visible(id,isTrapCard(definition),true);
  else if(energy&&slots[5])slots[5]={...slots[5],stackCount:(slots[5].stackCount||1)+1};
 }
 return slots;
}

export function fleetEventText(event,viewer='A'){
 if(event.privateTo&&event.privateTo!==viewer)return 'L’avversario ha effettuato una scansione privata.';
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
  return [physical,{hp,max:2,unlocked:!!part&&!part.dismantled,
   exposed:!!part&&!part.dismantled,signature:null}];
 }));
 return {kind:'mother',shipId:mother.id,parts,shield:{hp:0,max:1},exposureOrder:[]};
}
export function projectMachineBerths(side,chosenCards=[],ply=0){
 const slots=Array(2).fill(null);
 for(const unit of side.machines||[])if(unit.hp>0&&!unit.destroyed&&unit.slot>=0&&unit.slot<2){
  const charge=supportWeaponCharge(side,unit,cardRole);
  const baseShot=['base-shot','polarity-shot'].includes(unit.damageMode)?
   arsenalBonus(side,unit,ply,unit.baseDamage):null;
  slots[unit.slot]={...unit,pending:false,
   ...(baseShot!==null?{nominalDamage:baseShot}:{}),
   ...(charge?{nominalDamage:hasBalancedMother(side?.ships?.[0])?
     arsenalBonus(side,unit,ply,charge.damage):charge.damage,
    discardAttackCount:charge.attackCards,
    matchingEnergy:charge.energyMatched,supportCount:charge.supportCount,
     sequenceStage:charge.stage,chained:charge.chained}: {})};
 }
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
