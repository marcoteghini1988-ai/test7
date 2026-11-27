import cards from './weaponBatchCards20261127.json' with {type:'json'};
const byId=Object.fromEntries(cards.map(c=>[c.id,c]));
export function approvedBatchNominal(machine,{extra=false,stage=1}={}){
 const c=byId[machine.sourceCardId];if(!c||c.kind==='judgment')return null;
 return c.kind==='mortar'?(extra?c.extra:c.damage):stage===1?c.damage:c.second;
}
export const withFinalBatchNominal=machine=>({...machine,weaponProfile:{...machine.weaponProfile,finalNominal:true}});
