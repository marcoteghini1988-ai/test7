// Due traguardi permanenti della campagna, provvisori finché non si
// bilanciano gli XP e la curva dei dodici pianeti. Non si azzerano mai in partita.
import {supportDefinition,supportModelIdFor} from './supportCatalog.js';

export const SUPPORT_SLOT_CAMPAIGN_UNLOCKS=Object.freeze([
 Object.freeze({sector:20,slot:0,milestone:'campaign:sector:20',
  supportId:supportModelIdFor('N00')}),
 Object.freeze({sector:60,slot:1,milestone:'campaign:sector:60',
  supportId:supportModelIdFor('C03')})
]);
export function supportMilestoneForSector(mode,sector){
 if(!['campaign','adventure'].includes(mode)||!Number.isInteger(sector))return null;
 return SUPPORT_SLOT_CAMPAIGN_UNLOCKS.find(m=>m.sector===sector)||null;
}
export function unlockedNpcSupportSlots(mode,sector,playerSlots=0){
 if(mode==='pvp')return Math.max(0,Math.min(2,Math.floor(playerSlots)||0));
 if(!['campaign','adventure'].includes(mode))return 0;
 if(!Number.isInteger(sector)||sector<1)return 0;
 return SUPPORT_SLOT_CAMPAIGN_UNLOCKS.filter(m=>sector>=m.sector).length;
}
// L'avversario usa due carte-unità reali, non copie schierate dal livello
// della propria nave. Le sue scelte potranno diventare build tattiche.
export function npcSupportRoster(shipId,mode,sector,playerSlots=0){
 const count=unlockedNpcSupportSlots(mode,sector,playerSlots);
 return Array.from({length:count},(_,slot)=>{
  const def=supportDefinition(supportModelIdFor(shipId));
  if(!def)throw Error('Supporto nemico inesistente: '+shipId+' '+slot);
  return {...def,slot,instanceId:'npc:'+shipId+':'+slot,level:1};
 });
}
