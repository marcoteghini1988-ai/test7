// Eclissi Stellare — dieci Terreni PvP, sei turni individuali e affinità delle 17 madri.
import {GENERAL_CARDS} from './rules.js';

const rows=[
 ['T01','gen-219','Distesa Gelida','gelo','mobility',-1],
 ['T02','gen-238','Faglia di Plasma','plasma','salvo',1],
 ['T03','gen-239','Tempesta Ionica','ionico','jam',1],
 ['T04','gen-220','Deserto Magnetico','magnetico','intercept',1],
 ['T05','gen-231','Cintura di Detriti','detriti','salvo',-1],
 ['T06','gen-221','Nebbia di Elio','elio','scan',-1],
 ['T07','gen-230','Foresta Ionizzata','ionizzato','ionic-hit',1],
 ['T08','gen-229','Palude di Silicio','silicio','heal-delay',1],
 ['T09','gen-237','Mare di Quarzo','quarzo','escort-heal',1],
 ['T10','gen-245','Trono di Antimateria','antimateria','multi-intercept',1]
];
const affinity=[
 ['N00','T03,T06','T04,T10'],['C01','T02,T10','T01,T08'],
 ['C02','T01,T09','T02,T04'],['C03','T03,T07','T05,T09'],
 ['C04','T02,T04','T01,T06'],['R01','T04,T10','T01,T06'],
 ['R02','T03,T07','T04,T08'],['R03','T01,T08','T02,T10'],
 ['R04','T04,T05','T03,T07'],['E01','T01,T06','T02,T10'],
 ['E02','T03,T07','T05,T08'],['E03','T02,T10','T01,T08'],
 ['E04','T05,T09','T03,T07'],['L01','T02,T10','T01,T06'],
 ['L02','T03,T10','T04,T09'],['L03','T04,T05','T07,T06'],
 ['L04','T01,T08','T02,T10']
];
export const TERRAIN_AFFINITY=Object.freeze(Object.fromEntries(affinity.map(([id,favored,weakened])=>
 [id,{favored:favored.split(','),weakened:weakened.split(',')}]
)));
export const TERRAIN_CATALOG=Object.freeze(Object.fromEntries(rows.map(([code,cardId,name,theme,trigger,amount])=>
 [code,{code,cardId,name,theme,trigger,amount,durationTurns:6}]
)));
export const TERRAIN_BY_CARD=Object.freeze(Object.fromEntries(rows.map(x=>[x[1],TERRAIN_CATALOG[x[0]]])));
if(rows.length!==10||affinity.length!==17||rows.some(x=>!GENERAL_CARDS[x[1]]))
 throw Error('Catalogo dei terreni non coerente');
export function terrainAffinity(shipId,terrainCode){
 const a=TERRAIN_AFFINITY[shipId];
 if(!a)return 0;
 return a.favored.includes(terrainCode)?1:a.weakened.includes(terrainCode)?-1:0;
}
export function terrainForCard(cardId){return TERRAIN_BY_CARD[cardId]||null;}
export function newTerrain(cardId,ply,owner,boss=false,underlying=null){
 const d=terrainForCard(cardId);
 if(!d)return null;
 return {id:d.code,cardId,owner,startedPly:ply,expiresPly:ply+(boss?4:6),
  underlying:underlying||null,source:boss?'boss_override':'player'};
}
export function terrainExpired(terrain,ply){
 return !!terrain&&terrain.expiresPly!=null&&ply>=terrain.expiresPly;
}
export function neutralTerrain(){return {id:null,cardId:null,source:'neutral',expiresPly:null};}
export function activeTerrain(terrain,ply){
 if(!terrain||!terrain.id)return neutralTerrain();
 if(terrainExpired(terrain,ply))return terrain.underlying||neutralTerrain();
 return terrain;
}
export function activateTerrain(terrain,cardId,ply,owner,{boss=false,bossOverride=true}={}){
 const definition=terrainForCard(cardId);
 if(!definition)return {ok:false,reason:'Non è una Carta Terreno'};
 if(boss&&!bossOverride)return {ok:false,reason:'Il boss impedisce la sostituzione del terreno'};
 const original=boss?terrain?.source==='boss_override'?terrain.underlying:terrain:null;
 return {ok:true,terrain:newTerrain(cardId,ply,owner,boss,original)};
}
// Valido solo per una vera salva, dopo controllo armi e difese.
// L'affinità è locale alla madre. Il terreno pubblico vale per entrambe le parti.
export function terrainSalvoModifier(terrain,shipId,{realShot=true,firstSalvo=true}={}){
 if(!realShot||!terrain?.id||!firstSalvo)return {value:0,description:''};
 const d=TERRAIN_CATALOG[terrain.id];
 if(!d)return {value:0,description:''};
 const affinity=terrainAffinity(shipId,terrain.id);
 const environment=d.trigger==='salvo'?d.amount:0;
 return {value:environment+affinity,environment,affinity,
  description:d.name+' · '+(affinity>0?'affinità favorevole':affinity<0?'affinità sfavorevole':'neutrale')};
}
export function terrainTriggerModifier(terrain,trigger,shipId){
 if(!terrain?.id)return 0;
 const d=TERRAIN_CATALOG[terrain.id];
 return d?.trigger===trigger?d.amount:0;
}
export const BOSS_TERRAIN_CODES=Object.freeze({
 1:'T05',2:'T02',3:'T08',6:'T03',7:'T03',8:'T01',
 9:'T06',11:'T01',14:'T10',17:'T09',19:'T02',20:'T10'
});
export function bossTerrain(planetId){
 const code=BOSS_TERRAIN_CODES[Number(planetId)];
 if(!code)return neutralTerrain();
 return {id:code,cardId:TERRAIN_CATALOG[code].cardId,
  source:'boss',owner:'B',expiresPly:null,bossId:Number(planetId)};
}
export function campaignTerrain(sector,planetId){
 if(sector%10===1||sector%10===2)return neutralTerrain();
 const planet=Number(planetId);
 const assigned=['T05','T02','T08','T10','T03','T01','T06','T01','T07','T09','T02','T10'];
 const index=[1,2,3,6,7,8,9,11,14,17,19,20].indexOf(planet);
 const code=index>=0?assigned[index]:'T05';
 return {id:code,cardId:TERRAIN_CATALOG[code].cardId,source:'campaign',owner:null,expiresPly:null};
}
