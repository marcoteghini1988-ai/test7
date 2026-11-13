// Evoluzioni della nave madre: 17 famiglie x 2 scudiere, ai livelli 3 e 5.
// Non sono carte collezionabili, non hanno armi indipendenti e non occupano slot madre.
// Nomi, ruoli e identita' visiva provengono dall'armamento scudiere gia' presente.
import {ESCORT_ARMORY} from './escortArmory.js';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';

export const FLEET_ESCORT_UNLOCKS=Object.freeze([3,5]);
export const fleetEscortCount=level=>Number(level)>=5?2:Number(level)>=3?1:0;

// [azione, nome passiva, componente madre 1+2, eventuale bersaglio, intervallo]
// Le due evoluzioni di ciascuna madre sono distinte e hanno comportamenti diversi.
const TRAITS=Object.freeze({
 N00:[['phase','Velo di salvataggio','generator,command','',2],
      ['draw','Calcolo Aurora','command,engine','',3]],
 C01:[['cover','Sentinella in prima linea','generator,engine','',1],
      ['focus','Lama sul propulsore','weapons,engine','engine',2]],
 C02:[['partCover','Prisma di difesa','generator,command','generator',1],
      ['pierce','Fenditura di vetro','weapons,engine','weapons',3]],
 C03:[['jam','Richiamo degli impulsi','command,generator','',2],
      ['ion','Scarica coordinata','weapons,generator','',3]],
 C04:[['phase','Velo di disturbo','engine,generator','',2],
      ['strike','Dardo di risposta','weapons,command','',2]],
 R01:[['cover','Falco guardiano','generator,engine','',1],
      ['siege','Accelerazione binaria','weapons,generator','generator',2]],
 R02:[['guard','Campo Manta','generator,engine','',2],
      ['ion','Sting di risonanza','command,generator','',2]],
 R03:[['repair','Luce di recupero','generator,command','',2],
      ['focus','Prisma di precisione','weapons,command','command',3]],
 R04:[['bulwark','Scudo totale del Vuoto','generator,engine','',1],
      ['revenge','Contrattacco Squalo','weapons,command','',2]],
 E01:[['bulwark','Nebulosa corazzata','generator,engine','',1],
      ['jam','Pulsar di soppressione','command,generator','',2]],
 E02:[['partCover','Fronte di tempesta','generator,engine','weapons',1],
      ['ion','Tuono risonante','weapons,command','',2]],
 E03:[['repair','Rinascita della Fenice','generator,command','',2],
      ['surge','Ritorno di fiamma','weapons,engine','',2]],
 E04:[['bulwark','Orizzonte inespugnabile','generator,engine','',1],
      ['precision','Lancia di Orizzonte','weapons,command','',3]],
 L01:[['bulwark','Corona impenetrabile','generator,engine','',1],
      ['corrode','Verdetto solare','weapons,generator','',3]],
 L02:[['guard','Distorsione della Singolarita','generator,command','',2],
      ['ion','Ascia di antimateria','weapons,engine','',2]],
 L03:[['bulwark','Ala titanica','generator,engine','',1],
      ['siege','Lancia del Giudizio','weapons,command','weapons',2]],
 L04:[['repair','Rigenerazione dell Arca','generator,command','',2],
      ['mend','Eco dell Arca eterna','generator,engine','',2]]
});
const SHIPS=new Map(PHASE1_CATALOG.ships.map(s=>[s.id,s]));
if(SHIPS.size!==17||Object.keys(TRAITS).length!==17||
 [...SHIPS.keys()].some(id=>TRAITS[id]?.length!==2||ESCORT_ARMORY[id]?.length!==2))
 throw new Error('Catalogo scudiere: mancano delle evoluzioni ufficiali');

export const FLEET_ESCORT_TRAITS=Object.freeze(Object.fromEntries(
 Object.entries(TRAITS).map(([id,pair])=>[id,Object.freeze(pair.map((t,slot)=>
  Object.freeze({slot,action:t[0],name:t[1],requires:t[2].split(','),
   targetPart:t[3]||null,interval:t[4],model:ESCORT_ARMORY[id][slot].name,
   role:ESCORT_ARMORY[id][slot].role})))])
));
const linked=(mother,requires)=>requires.every(id=>mother?.parts?.find(p=>p.id===id)?.damage<2);
export const escortAlive=e=>!!e&&!e.destroyed&&e.hp>0;
export const motherAlive=m=>!!m&&m.parts.filter(p=>p.damage>=2).length<2;
export const motherWounded=m=>!!m&&m.parts.some(p=>p.damage===1);
export const readyFleetEscorts=side=>(side?.escorts||[]).filter(e=>escortAlive(e)&&
 motherAlive(side.ships[0])&&linked(side.ships[0],e.skill.requires));

export function buildFleetEscorts(mother){
 const count=fleetEscortCount(mother.level);
 const model=SHIPS.get(mother.id);
 return FLEET_ESCORT_TRAITS[mother.id].slice(0,count).map((skill,slot)=>{
  const original=ESCORT_ARMORY[mother.id][slot];
  const base=(model.hp_motore_L1+(model.hp_motore_L5-model.hp_motore_L1)*(mother.level-1)/4);
  const tough=['cover','bulwark','partCover','phase'].includes(skill.action);
  // I baluardi possono avere piu' punti di resistenza dei 4 necessari
  // per neutralizzare due componenti della madre; non esiste scudo generico.
  const hp=Math.max(2,Math.min(12,Math.round(2+base/65+
   (skill.action==='bulwark'?4:tough?2:0)+original.shield*3)));
  return {id:mother.id+':escort:'+(slot+1),parentShipId:mother.id,
   slot,unlockLevel:FLEET_ESCORT_UNLOCKS[slot],name:original.name,role:original.role,
   skill,hp,maxHp:hp,destroyed:false,visual:'/assets/escorts/'+mother.id+'_escort_'+(slot+1)+'.svg'};
 });
}
export function repairFleetUnit(side){
 const mother=side?.ships?.[0];
 if(motherAlive(mother)){
  const wound=mother.parts.find(p=>p.damage===1);
  if(wound){wound.damage=0;wound.destroyed=false;return 'Madre · '+wound.id;}
 }
 const escort=(side?.escorts||[]).find(e=>escortAlive(e)&&e.hp<e.maxHp);
 if(escort){escort.hp++;return escort.name+' · +1 resistenza';}
 return null;
}
export function mendFleetEscort(side){
 const target=[...(side?.escorts||[])].filter(escortAlive)
  .filter(e=>e.hp<e.maxHp).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
 if(!target)return null;
 target.hp++;return target.name;
}
export function activeFleetSupportLinks(side){
 const mother=side?.ships?.[0];
 if(!motherAlive(mother))return [];
 return readyFleetEscorts(side).map(e=>({
  name:e.skill.name,ships:[mother.name,e.name],slot:e.slot,required:e.skill.requires,
  description:e.skill.name+' · '+e.role
 }));
}
export function applyFleetEscortPassives(side,enemy,order,enemyOrder,round,effects){
 const notes=[];
 const mother=side?.ships?.[0],target=enemy?.ships?.[0];
 if(!motherAlive(mother))return notes;
 for(const e of readyFleetEscorts(side)){
  const s=e.skill;
  if(round%s.interval!==0)continue;
  const label=e.name+' · '+s.name;
  let triggered=false;
  switch(s.action){
   case 'cover':case 'bulwark':case 'phase':
    // Non copre uno scudo astratto: la scudiera riceve fisicamente
    // l'intera salva diretta alla madre, finche' viene distrutta.
    if(e.hp>0&&enemyOrder.shipIndex===0){
     const current=side.escorts[effects.coverEscortSlot];
     if(effects.coverEscortSlot==null||e.hp>current.hp)
      effects.coverEscortSlot=e.slot;
     triggered=true;
    }
    break;
   case 'partCover':
    if(enemyOrder.partId===s.targetPart&&enemyOrder.shipIndex===0){
     effects.coverEscortSlot=e.slot;triggered=true;
    }
    break;
   case 'guard':effects.guard++;triggered=true;break;
   case 'jam':effects.jam=true;triggered=true;break;
   case 'ion':effects.ion=true;effects.power++;triggered=true;break;
   case 'draw':effects.draw++;triggered=true;break;
   case 'repair':triggered=!!repairFleetUnit(side);break;
   case 'mend':triggered=!!mendFleetEscort(side);break;
   case 'focus':
    if(order.partId===s.targetPart){effects.power++;triggered=true;}
    break;
   case 'siege':
    if(order.partId===s.targetPart){effects.power++;triggered=true;}
    break;
   case 'pierce':
    if(order.partId===s.targetPart){effects.pierce=true;effects.power++;triggered=true;}
    break;
   case 'precision':effects.pierce=true;effects.power++;triggered=true;break;
   case 'strike':effects.power++;triggered=true;break;
   case 'revenge':
    if(side.escorts.some(x=>escortAlive(x)&&x.hp<x.maxHp)){
     effects.power++;triggered=true;
    }
    break;
   case 'surge':
    if(motherWounded(mother)){effects.power++;triggered=true;}
    break;
   case 'corrode':effects.corrosion=true;triggered=true;break;
  }
  if(triggered)notes.push(label);
 }
 return notes;
}
export function absorbFleetAttack(side,eff,strength){
 const slot=eff?.coverEscortSlot;
 if(!Number.isInteger(slot))return null;
 const escort=side.escorts[slot],mother=side.ships[0];
 if(!escortAlive(escort)||!linked(mother,escort.skill.requires))return null;
 const damage=Math.min(escort.hp,Math.max(1,Math.min(5,strength)));
 escort.hp-=damage;
 if(escort.hp<=0){escort.hp=0;escort.destroyed=true;}
 return {escortSlot:slot,escortName:escort.name,escortDamage:damage,
  escortDestroyed:escort.destroyed};
}
