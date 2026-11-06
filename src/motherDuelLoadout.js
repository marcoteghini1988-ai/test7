// Eclissi Stellare — ripristino regolamento unico del duello.
// UNA carta-navicella madre per parte; le scudiere dipendono da modello/livello
// e vengono create dal motore. Il vecchio inventario con 2-3 carte equipaggiate
// rimane intatto, ma le navi aggiuntive non entrano come madri nel nuovo duello.
import {PHASE1_SHIPS,newVessel,fleetCompatibility,getShipDefinition} from './mathDuelEngine.js';
import {commanderAbility} from './commanderAbilities.js';
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

const BOSS_RIVAL_COMMANDERS=Object.freeze({
 1:'pilot_boss_1',2:'pilot_boss_2',3:'pilot_boss_3',
 6:'pilot_boss_6',7:'pilot_boss_7',8:'pilot_boss_8',
 9:'pilot_boss_9',11:'pilot_boss_11',
 14:'pilot_epic_2', // Generatore: sinergia con due speciali autentiche
 17:'pilot_leg_1', // Risonanza: alternanza reale delle operazioni
 19:'pilot_boss_19',20:'pilot_boss_20'
});
// I comandanti nemici non sono carte concesse al giocatore e non
// modificano la sua collezione. Solo le abilità del catalogo originale.
export function chooseCampaignRivalCommander({
 mode='adventure',globalSector=1,planetId=null,planetSector=null,
 shipId='N00',shipLevel=1,practice=false
}={}){
 if(practice||!['adventure','campaign'].includes(mode))
  return Object.freeze({id:'pilot_com_1',level:1,isBoss:false});
 const global=sector(globalSector),planetIndex=PHASE16A_CAMPAIGN_PLANETS.findIndex(
  p=>p.id===Number(planetId));
 const idx=planetIndex>=0?planetIndex:Math.floor((global-1)/10);
 const planet=PHASE16A_CAMPAIGN_PLANETS[idx];
 const local=Number.isInteger(Number(planetSector))&&Number(planetSector)>=1&&Number(planetSector)<=10?
  Number(planetSector):((global-1)%10+1);
 const isBoss=local===10;
 const enemyLevel=boundedLevel(shipLevel);
 const ops=Object.entries(newVessel(legalId(shipId),enemyLevel).engines)
  .filter(([,e])=>e.hp>0).map(([op])=>op);
 const basic={plus:'pilot_com_1',minus:'pilot_com_2',
  times:'pilot_com_3',divide:'pilot_com_4'};
 const secondary=ops.length?basic[ops[(idx+local-1)%ops.length]]:'pilot_com_1';
 const desired=isBoss?(BOSS_RIVAL_COMMANDERS[planet.id]||secondary):secondary;
 const id=commanderAbility(desired)?desired:'pilot_com_1';
 return Object.freeze({id,level:Math.min(5,1+Math.floor((global-1)/30)),
  isBoss,planetId:planet.id});
}
