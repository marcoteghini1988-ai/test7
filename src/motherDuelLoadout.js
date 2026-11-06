// Eclissi Stellare — ripristino regolamento unico del duello.
// UNA carta-navicella madre per parte; le scudiere dipendono da modello/livello
// e vengono create dal motore. Il vecchio inventario con 2-3 carte equipaggiate
// rimane intatto, ma le navi aggiuntive non entrano come madri nel nuovo duello.
import {PHASE1_SHIPS,newVessel,fleetCompatibility,getShipDefinition} from './mathDuelEngine.js';
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';

const boundedLevel=value=>Math.max(1,Math.min(5,Math.floor(Number(value)||1)));
const sector=value=>Math.max(1,Math.min(120,Math.floor(Number(value)||1)));
const legalId=id=>getShipDefinition(id)?id:'N00';
const canFight=(playerId,playerLevel,enemyId,enemyLevel)=>
 fleetCompatibility([playerId],[enemyId],1,
  {[playerId]:playerLevel},{[enemyId]:enemyLevel}).compatible;

export function chooseCampaignMotherRival(playerId,playerLevel,globalSector,planetId=null,planetSector=null){
 const level=boundedLevel(playerLevel),global=sector(globalSector);
 const found=PHASE16A_CAMPAIGN_PLANETS.findIndex(p=>p.id===Number(planetId));
 const planetIndex=found>=0?found:Math.min(11,Math.floor((global-1)/10));
 const local=Number.isInteger(Number(planetSector))&&Number(planetSector)>=1&&Number(planetSector)<=10?
  Number(planetSector):((global-1)%10+1);
 // La difficoltà qui non assegna livelli inventati: usa quello già reale
 // dell'avversario. Cambiano modello e armi, con gli stessi operatori
 // necessari al duello; la crescita HP della campagna resta da calibrare.
 const alternatives=PHASE1_SHIPS.map(s=>s.id)
  .filter(id=>id!==playerId&&canFight(playerId,level,id,level));
 const choices=alternatives.length?alternatives:[playerId];
 const index=(planetIndex*7+(local-1)*3+Math.floor((local-1)/3))%choices.length;
 return Object.freeze({shipId:choices[index],level,planetIndex,planetSector:local,
  rivalAvailable:alternatives.length>0});
}

export function prepareMotherDuelOptions(options={},{
 mode='campaign',globalSector=1,planetId=null,planetSector=null,practice=false
}={}){
 const ids=Array.isArray(options.fleetIds)?options.fleetIds:[];
 const motherId=legalId(ids.find(id=>getShipDefinition(id))||'N00');
 const level=boundedLevel(options.shipLevels?.[motherId]??options.shipLevel);
 let rivalId=motherId,rivalLevel=level;
 if(practice){
  const explicit=Array.isArray(options.enemyFleetIds)?options.enemyFleetIds:[];
  const candidate=explicit.find(id=>getShipDefinition(id));
  if(candidate){
   const candidateLevel=boundedLevel(options.enemyShipLevels?.[candidate]??options.shipLevel);
   if(canFight(motherId,level,candidate,candidateLevel)){
    rivalId=candidate;rivalLevel=candidateLevel;
   }
  }
 }else if(mode==='adventure'||mode==='campaign'){
  const rival=chooseCampaignMotherRival(motherId,level,globalSector,planetId,planetSector);
  rivalId=rival.shipId;rivalLevel=rival.level;
 }
 const prepared={
  ...options,fleetIds:[motherId],shipLevels:{[motherId]:level},
  enemyFleetIds:[rivalId],enemyShipLevels:{[rivalId]:rivalLevel},
  shipLevel:level,vitalPrototype:true
 };
 // Validate the effective one-mother encounter rather than the historical
 // multi-card saved loadout; no collection change is made here.
 if(!canFight(motherId,level,rivalId,rivalLevel))throw new Error('Madri incompatibili');
 return prepared;
}
