// Sblocchi delle dieci carte esclusive lungo la progressione reale delle 17 madri.
// Le descrizioni e gli effetti del catalogo 120 restano invariati.
// Quattro carte di avvio (Personaggio, attacco, difesa e identità di flotta),
// altre sei distribuite in tappe fino al livello massimo della famiglia.
// Nessun livello sblocca carte di un'altra nave.
import {shipMaxLevel} from './progression.js';

export const EXCLUSIVE_STARTER_CARDS=Object.freeze({
 "N00": [
  "ex-n00-01",
  "nx-n00-01",
  "nx-n00-02",
  "nx-n00-04"
 ],
 "C01": [
  "ex-c01-01",
  "nx-c01-01",
  "nx-c01-02",
  "nx-c01-04"
 ],
 "C02": [
  "ex-c02-01",
  "nx-c02-01",
  "nx-c02-02",
  "nx-c02-03"
 ],
 "C03": [
  "ex-c03-01",
  "nx-c03-01",
  "nx-c03-02",
  "nx-c03-03"
 ],
 "C04": [
  "ex-c04-01",
  "nx-c04-02",
  "nx-c04-04",
  "nx-c04-05"
 ],
 "R01": [
  "ex-r01-01",
  "nx-r01-01",
  "nx-r01-02",
  "nx-r01-04"
 ],
 "R02": [
  "ex-r02-01",
  "nx-r02-01",
  "nx-r02-02",
  "nx-r02-03"
 ],
 "R03": [
  "ex-r03-01",
  "nx-r03-02",
  "nx-r03-03",
  "nx-r03-04"
 ],
 "R04": [
  "ex-r04-01",
  "nx-r04-01",
  "nx-r04-02",
  "nx-r04-03"
 ],
 "E01": [
  "ex-e01-01",
  "nx-e01-01",
  "nx-e01-02",
  "nx-e01-03"
 ],
 "E02": [
  "ex-e02-01",
  "nx-e02-01",
  "nx-e02-02",
  "nx-e02-04"
 ],
 "E03": [
  "ex-e03-01",
  "nx-e03-02",
  "nx-e03-03",
  "nx-e03-05"
 ],
 "E04": [
  "ex-e04-01",
  "nx-e04-02",
  "nx-e04-04",
  "nx-e04-06"
 ],
 "L01": [
  "ex-l01-01",
  "nx-l01-01",
  "nx-l01-02",
  "nx-l01-03"
 ],
 "L02": [
  "ex-l02-01",
  "nx-l02-02",
  "nx-l02-03",
  "nx-l02-04"
 ],
 "L03": [
  "ex-l03-01",
  "nx-l03-01",
  "nx-l03-02",
  "nx-l03-04"
 ],
 "L04": [
  "ex-l04-01",
  "nx-l04-02",
  "nx-l04-03",
  "nx-l04-05"
 ]
});
export const EXCLUSIVE_UNLOCK_MILESTONES=Object.freeze({
 "N00": [
  4,
  7,
  10,
  13,
  18,
  20
 ],
 "C01": [
  4,
  7,
  9,
  13,
  17,
  19
 ],
 "C02": [
  3,
  5,
  8,
  11,
  15,
  18
 ],
 "C03": [
  3,
  5,
  8,
  11,
  14,
  17
 ],
 "C04": [
  3,
  5,
  8,
  11,
  14,
  16
 ],
 "R01": [
  3,
  5,
  7,
  10,
  13,
  15
 ],
 "R02": [
  3,
  5,
  7,
  10,
  12,
  14
 ],
 "R03": [
  3,
  5,
  7,
  9,
  11,
  13
 ],
 "R04": [
  3,
  5,
  7,
  9,
  11,
  12
 ],
 "E01": [
  2,
  4,
  6,
  8,
  10,
  11
 ],
 "E02": [
  2,
  4,
  6,
  8,
  9,
  10
 ],
 "E03": [
  2,
  3,
  5,
  6,
  8,
  9
 ],
 "E04": [
  2,
  3,
  4,
  6,
  7,
  8
 ],
 "L01": [
  2,
  3,
  4,
  5,
  6,
  7
 ],
 "L02": [
  2,
  3,
  4,
  5,
  5,
  6
 ],
 "L03": [
  2,
  2,
  3,
  3,
  4,
  5
 ],
 "L04": [
  2,
  2,
  3,
  3,
  4,
  5
 ]
});
const LOCKED_FUSION_MILESTONES=Object.freeze({
 "nx-l01-10": 5,
 "nx-l03-08": 3,
 "nx-l04-05": 1
});

export function buildExclusiveUnlockLevels(definitions){
 const levels={};
 const ids=new Set();
 for(const [shipId,starting] of Object.entries(EXCLUSIVE_STARTER_CARDS)){
  const max=shipMaxLevel(shipId),milestones=EXCLUSIVE_UNLOCK_MILESTONES[shipId];
  const cards=definitions.filter(c=>c.shipId===shipId);
  if(!max||cards.length!==10||starting.length!==4||new Set(starting).size!==4||
    milestones?.length!==6||milestones[5]!==max||
    milestones.some((level,i)=>!Number.isInteger(level)||level<2||level>max||
      i>0&&level<milestones[i-1]))
   throw Error('Progressione delle dieci esclusive non valida: '+shipId);
  const byId=new Map(cards.map(c=>[c.id,c]));
  if(byId.size!==10||starting.some(id=>!byId.has(id))||
   starting.filter(id=>byId.get(id).kind==='character'||byId.get(id).category==='Personaggio').length!==1)
   throw Error('Carte iniziali incomplete o Personaggio mancante: '+shipId);
  for(const id of starting){levels[id]=1;ids.add(id);}
  const others=cards.filter(c=>!starting.includes(c.id)).sort((a,b)=>
   (a.minShipLevelDraft||1)-(b.minShipLevelDraft||1)||a.id.localeCompare(b.id));
  const available=[...milestones];
  for(const card of others){
   const fixed=LOCKED_FUSION_MILESTONES[card.id];
   if(fixed==null)continue;
   const slot=available.indexOf(fixed);
   if(slot<0)throw Error('Sblocco fusione non rispettato: '+card.id);
   available.splice(slot,1);
   levels[card.id]=fixed;
   ids.add(card.id);
  }
  const remaining=others.filter(c=>LOCKED_FUSION_MILESTONES[c.id]==null);
  if(remaining.length!==available.length)throw Error('Sei sblocchi incompleti: '+shipId);
  for(let i=0;i<remaining.length;i++){
   const card=remaining[i],level=available[i];
   if(level<(card.minShipLevelDraft||1))
    throw Error('Prerequisito storico anticipato: '+card.id+' L'+level);
   levels[card.id]=level;ids.add(card.id);
  }
 }
 if(ids.size!==170||definitions.length!==170)
  throw Error('Progressione incompleta: '+ids.size+' esclusive su '+definitions.length);
 for(const [id,required] of Object.entries(LOCKED_FUSION_MILESTONES))
  if(levels[id]!==required)throw Error('Fusione spostata: '+id);
 return Object.freeze(levels);
}
