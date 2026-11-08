// Eclissi Stellare — Carte Terreno PvP: un unico ambiente pubblico per entrambi.
// I numeri sono provvisori per playtest, non prezzi o premi definitivi.
// I Terreni NON sono abilita boss e non sostituiscono la campagna.
export const PVP_TERRAIN_DURATION_CYCLES=2;
const definitions=[
 ['terrain-debris','Campo di Detriti','DETRITI','debris',
  'Pro: barriera madre −12% danni. Contro: fuoco nativo −10%. Vale per entrambi.',{nativeFactor:.90,shieldFactor:.88,escortFactor:1,repairFactor:1,syncPerCalculation:0}],
 ['terrain-plasma','Faglia di Plasma','PLASMA','plasma',
  'Pro: fuoco nativo +10%. Contro: i colpi alla barriera +8% e riparazioni −10%. Per entrambi.',{nativeFactor:1.10,shieldFactor:1.08,escortFactor:1,repairFactor:.90,syncPerCalculation:0}],
 ['terrain-ionic','Tempesta Ionica','IONICA','ionic',
  'Pro: fuoco nativo +8%. Contro: intercettazione scudiere −20%. Per entrambi.',{nativeFactor:1.08,shieldFactor:1,escortFactor:.80,repairFactor:1,syncPerCalculation:0}],
 ['terrain-resonance','Camera Astrale','RISONANZA','resonance',
  'Pro: +4 Sincronia per calcolo valido. Contro: fuoco nativo −8%. Per entrambi.',{nativeFactor:.92,shieldFactor:1,escortFactor:1,repairFactor:1,syncPerCalculation:4}]
];
export const PVP_TERRAIN_CATALOG=Object.freeze(Object.fromEntries(definitions.map(
 ([id,name,short,arenaId,description,effects])=>[id,Object.freeze({
  id,name,short,arenaId,description,
  durationCycles:PVP_TERRAIN_DURATION_CYCLES,
  imagePath:'/assets/terrain-pvp/'+id+'.svg',
  effects:Object.freeze(effects)
 })]
)));
export const PVP_TERRAIN_TYPES=Object.freeze(Object.keys(PVP_TERRAIN_CATALOG));
export const isPvpTerrain=type=>Object.hasOwn(PVP_TERRAIN_CATALOG,type);
export const pvpTerrainDefinition=type=>PVP_TERRAIN_CATALOG[type]??null;
export const pvpTerrainAtRound=(active,round)=>
 active&&isPvpTerrain(active.id)&&round>=active.startedRound&&round<=active.untilRound?active:null;
export const neutralPvpTerrainEffects=Object.freeze({
 nativeFactor:1,shieldFactor:1,escortFactor:1,repairFactor:1,syncPerCalculation:0
});
export const pvpTerrainEffects=(active,round)=>
 pvpTerrainAtRound(active,round)?PVP_TERRAIN_CATALOG[active.id].effects:neutralPvpTerrainEffects;
// Tutte le Carte Speciali che RIPARANO lo scudo subiscono lo stesso
// modificatore ambientale; la penalità del Generatore si applica dopo,
// attraverso restoreMotherShield. Nei boss non viene applicato terreno PvP.
export const pvpTerrainRepairAmount=(raw,effects=neutralPvpTerrainEffects)=>
 Math.max(0,Math.floor(Math.max(0,raw)*(effects?.repairFactor??1)));
// Nessun vantaggio di ordine: se entrambi giocano un Terreno nello stesso
// ciclo, i due effetti si annullano e le carte sono comunque consumate.
export function resolvePvpTerrain(previous,orders,round,mode='pvp',bossPlanetB=null){
 if(mode!=='pvp'||bossPlanetB!=null)return {active:null,event:null};
 const a=orders.A??null,b=orders.B??null;
 if(a&&!isPvpTerrain(a)||b&&!isPvpTerrain(b))
  throw new Error('Carta Terreno non valida');
 if(a&&b)return {active:null,event:'Terreni simultanei: interferenza, entrambi annullati'};
 if(a||b){
  const id=a||b,definition=pvpTerrainDefinition(id);
  return {active:{id,startedRound:round,untilRound:round+definition.durationCycles-1},
   event:'Terreno '+definition.name+' attivato per '+definition.durationCycles+' cicli; pro e contro per entrambe le flotte'};
 }
 const active=pvpTerrainAtRound(previous,round);
 return {active,event:previous&&!active?'Terreno scaduto: ripristino arena neutra':null};
}
