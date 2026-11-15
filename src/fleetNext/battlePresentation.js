import {card,cardRole} from './rules.js';
import {isTrapCard} from './simpleEffects.js';

// Una carta coperta avversaria non consegna identità o rarità al renderer.
export function projectFleetSlots(side,chosenCards=[],owner='A',viewer='A'){
 const slots=Array(6).fill(null);
 const visible=(id,hidden=false,pending=false)=>hidden&&owner!==viewer?
  {hidden:true,pending:false}:{id,hidden,pending};
 if(side.commander?.id)slots[0]=visible(side.commander.id);
 const defenses=side.defenses?.length?side.defenses:
  (side.defenseSlots||[]).map(id=>({id,hidden:isTrapCard(card(id))}));
 defenses.filter(entry=>entry?.id).slice(0,2).forEach((entry,i)=>{slots[i+1]=visible(entry.id,!!entry.hidden);});
 (side.attackSlots||[]).slice(0,3).forEach((id,i)=>{if(id)slots[i+3]=visible(id);});
 for(const id of chosenCards){
  const role=cardRole(id);
  const positions=role==='character'?[0]:role==='defense'?[1,2]:role==='terrain'?[]:[3,4,5];
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
