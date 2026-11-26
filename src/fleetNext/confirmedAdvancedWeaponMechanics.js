// Only previously confirmed mechanical rules. No unapproved damage, cost or rarity.
const RECORDS=[{"id":"weapon-designed-plasma-mortaio-magmatico","elementId":"plasma","mechanism":"magma-mortar","confirmed":{"turns":3,"baseShots":1,"maxExtraShots":2,"energy":"plasma"},"missing":["baseDamage","extraDamage","ammoMode"]},{"id":"weapon-designed-plasma-inceneritore-rotante","elementId":"plasma","mechanism":"incinerator","confirmed":{"turns":2,"burnTurns":5,"damageLockedAtApplication":true},"missing":["firstDamage","secondDamage","burnPerDiscard"]},{"id":"weapon-designed-plasma-sistema-binario","elementId":"plasma","mechanism":"binary-overload","confirmed":{"turns":5,"canKillOwnShips":true,"finalHitAllEnemies":true},"missing":["damageStages","allyHpCosts"]},{"id":"weapon-designed-plasma-accoppiatore-termofagico","elementId":"plasma","mechanism":"thermal-coupler","confirmed":{"requires":"plasma-sistema-binario","usesEnemyHpForRecharge":true},"missing":["damage","rechargeCost","slotChoice"]},{"id":"weapon-designed-cryogenic-ago-inverno-nero","elementId":"cryogenic","mechanism":"ice-needle","confirmed":{"hitsBothSupports":true,"iceTerrainPiercesMother":true,"motherDamageEqualsSupportSum":true,"evolves":["Comune","Rara","Epica","Leggendaria"]},"missing":["normalDamageByRarity","iceDamageByRarity","duration"]},{"id":"weapon-designed-cryogenic-acceleratore-boreale","elementId":"cryogenic","mechanism":"binary-boreal","confirmed":{"combinedShot":true},"missing":["shots","damage"]},{"id":"weapon-designed-refrigerant-torretta-crioguidata","elementId":"refrigerant","mechanism":"character-turret","confirmed":{"secondHitIfCharacter":true,"differentTargets":true},"missing":["damage","secondDamage","character"]},{"id":"weapon-designed-refrigerant-bassa-marea","elementId":"refrigerant","mechanism":"low-tide","confirmed":{"nextOwnTurn":"refrigerant-alta-marea","bothDiscards":true},"missing":["damagePerDiscard"]},{"id":"weapon-designed-refrigerant-alta-marea","elementId":"refrigerant","mechanism":"high-tide","confirmed":{"previousOwnTurn":"refrigerant-bassa-marea","maxMultiplier":4},"missing":["damagePerDiscard","defenseInteractions"]},{"id":"weapon-designed-metallic-artiglieria-schegge","elementId":"metallic","mechanism":"shrapnel","confirmed":{"turns":2,"separateFrom":"metallic-recuperatore-termobalistico"},"missing":["perHitDamage"]},{"id":"weapon-designed-metallic-recuperatore-termobalistico","elementId":"metallic","mechanism":"reclaimer","confirmed":{"source":"realOwnFleetHpLoss","separateFrom":"metallic-artiglieria-schegge"},"missing":["conversionRatio","duration"]},{"id":"weapon-designed-metallic-obice-pioggia-schegge","elementId":"metallic","mechanism":"base-shot","confirmed":{"turns":1,"independentImpact":true},"missing":["damage","rarita"]},{"id":"weapon-designed-metallic-ganasce-magnetiche","elementId":"metallic","mechanism":"grapple","confirmed":{"turns":3,"oneJaw":true,"autonomous":true,"finalTearBonusPercent":50,"comboWith":"metallic-collassatore-lega","comboOnce":true},"missing":[]},{"id":"weapon-designed-metallic-collassatore-lega","elementId":"metallic","mechanism":"collision","confirmed":{"turns":3,"oneJaw":true,"autonomous":true,"comboWith":"metallic-ganasce-magnetiche","comboOnce":true,"singleShipFloorImpact":true},"missing":[]},{"id":"weapon-designed-metallic-perforatore-cascata","elementId":"metallic","mechanism":"cascade","confirmed":{"turns":3,"excessToNextTarget":true,"energy":"metallic","defensePerTarget":true},"missing":["baseDamage","energyTransferCost","rarita"]},{"id":"weapon-designed-ionic-nucleo-folgore","elementId":"ionic","mechanism":"charging-core","confirmed":{"turns":3,"freshEnergyEachTurn":true,"chargeBreakIsPermanent":true},"missing":["damageStages","energyCost"]},{"id":"weapon-designed-ionic-sonda-ionica","elementId":"ionic","mechanism":"probe","confirmed":{"combineWith":"ionic-martello-tuono"},"missing":["baseDamage","comboDamage","timing"]},{"id":"weapon-designed-ionic-martello-tuono","elementId":"ionic","mechanism":"hammer","confirmed":{"combineWith":"ionic-sonda-ionica"},"missing":["baseDamage","comboDamage","timing"]},{"id":"weapon-designed-ionic-lancia-comando-ionico","elementId":"ionic","mechanism":"commander-lance","confirmed":{"needsCharacter":true},"missing":["damage","characterBonus"]},{"id":"weapon-designed-ionic-condensatore-tempesta","elementId":"ionic","mechanism":"storm-capacitor","confirmed":{"turns":3,"newEnergyEachTurn":true,"livingAlliesAmplify":true,"noAllyHpCost":true},"missing":["baseDamage","energyCost","allyBonus"]},{"id":"weapon-transferred-aerial-cicloreattore","elementId":"aerial","mechanism":"cycloreactor","confirmed":{"turns":3,"hitsWholeEnemyFleet":true,"handTimerContinues":true},"missing":["perTargetDamage","freezeSeconds","rarita"]}];
export const PENDING_ADVANCED_WEAPON_RULES=Object.freeze(Object.fromEntries(RECORDS.map(r=>[
 r.id,Object.freeze({...r,confirmed:Object.freeze(r.confirmed),missing:Object.freeze(r.missing)})
])));
export const PENDING_ADVANCED_WEAPON_COUNT=Object.keys(PENDING_ADVANCED_WEAPON_RULES).length;
if(PENDING_ADVANCED_WEAPON_COUNT!==21)throw Error('Missing advanced weapon decisions');
export const pendingAdvancedWeaponRule=id=>PENDING_ADVANCED_WEAPON_RULES[id]||null;
export function pendingWeaponReason(id,values={}){
 const rule=pendingAdvancedWeaponRule(id);
 if(!rule)return 'Carta Arma sconosciuta';
 for(const field of rule.missing)
  if(values[field]==null||typeof values[field]==='number'&&!Number.isFinite(values[field]))
   return 'Parametro non ancora deciso: '+field;
 return null;
}
export function weaponFiresOnOwnTurn(deployedPly,ply,turns){
 const delta=ply-deployedPly;
 return Number.isInteger(delta)&&delta>=0&&delta%2===0&&delta/2<turns;
}
export function planIceNeedle(supports,mother,ice,normalDamage,boostedDamage){
 if(!Number.isInteger(normalDamage)||normalDamage<=0||
  !Number.isInteger(boostedDamage)||boostedDamage<=normalDamage)
  throw Error('Ago: valori HP non ancora determinati');
 const live=(supports||[]).filter(s=>s?.hp>0&&!s.destroyed).slice(0,2);
 const value=ice?boostedDamage:normalDamage;
 const attacks=live.map(unit=>({target:{kind:'escort',unit},base:value}));
 if(ice&&live.length===2&&mother?.hp>0&&!mother.destroyed)
  attacks.push({target:{kind:'part',unit:mother},base:2*value,
   ignoreCover:true,ignoreOrdinaryDefenses:true});
 return attacks;
}
function firePile(side){
 return (side?.energyPile||[]).filter(e=>{
  const id=typeof e==='string'?e:e?.id;
  return id==='energy-plasma'||['energy-plasma-r','energy-plasma-e','energy-plasma-l'].includes(id);
 });
}
export function mortarAmmunition(side,mode){
 if(!['per-card','per-charge'].includes(mode))
  throw Error('Mortaio: modalità consumo Energia non deliberata');
 const cards=firePile(side);
 return mode==='per-card'?cards.length:cards.reduce((n,e)=>n+
  (typeof e==='string'?1:Math.max(0,Math.floor(Number(e.remaining)||0))),0);
}
export function consumeMortarEnergy(side,mode){
 if(!['per-card','per-charge'].includes(mode))return null;
 const pile=side?.energyPile||[];
 const index=pile.findIndex(e=>firePile({energyPile:[e]}).length===1);
 if(index<0)return null;
 const entry=pile[index],id=typeof entry==='string'?entry:entry.id;
 const available=typeof entry==='string'?1:Math.max(0,Math.floor(Number(entry.remaining)||0));
 const used=mode==='per-card'?available:1;
 if(!used||Number(side.elementalCharges?.plasma||0)<used)return null;
 side.elementalCharges.plasma-=used;
 if(!side.elementalCharges.plasma)delete side.elementalCharges.plasma;
 if(used===available){pile.splice(index,1);(side.discard??=[]).push(id);}
 else entry.remaining=available-used;
 return Object.freeze({id,used,discarded:used===available});
}
export function planMagmaMortar(side,p){
 if(!Number.isInteger(p?.baseDamage)||p.baseDamage<=0||
  !Number.isInteger(p?.extraDamage)||p.extraDamage<=0||
  p.maxExtraShots!==2||!['per-card','per-charge'].includes(p.ammoMode))
  throw Error('Mortaio: danni e modalità consumo da approvare');
 return [{base:p.baseDamage},...Array.from({length:Math.min(2,mortarAmmunition(side,p.ammoMode))},
  ()=>({base:p.extraDamage,usesMagmaEnergy:true}))];
}
