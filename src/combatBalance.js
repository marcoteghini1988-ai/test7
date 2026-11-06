// Eclissi Stellare — punto 45: bilanciamento unico degli impatti reali.
// Non genera colpi, non sceglie bersagli, non modifica mani o collezioni.
// Le manovre di flotta modificano la salva prima delle passive. Il cappello
// complessivo impedisce che Fusione Assalto + boss + pilota + Plasma eccedano
// la curva prevista. Le passive mantengono il loro tetto precedente.
export const COMBAT_BALANCE_LIMITS=Object.freeze({
 maxPassiveAttackFactor:1.35,
 minMotherDefenseFactor:.65,
 maxFusionStackFactor:1.45,
 maxCombinedIonResistance:.50
});
const positive=(value,fallback=1)=>{
 const n=Number(value);
 return Number.isFinite(n)&&n>0?n:fallback;
};
const packet=value=>Number.isFinite(value)&&value>0?Math.floor(value):0;
export function balancedCombatImpact(rawDamage,{
 bossAttack=1,commanderAttack=1,arenaAttack=1,
 bossDefense=1,commanderDefense=1,arenaDefense=1,
 unmodifiedVolleyDamage=null
}={}){
 const raw=packet(rawDamage);
 const base=Number.isFinite(unmodifiedVolleyDamage)&&unmodifiedVolleyDamage>=0
  ?packet(unmodifiedVolleyDamage):raw;
 const offensiveProduct=positive(bossAttack)*positive(commanderAttack)*positive(arenaAttack);
 const defensiveProduct=positive(bossDefense)*positive(commanderDefense)*positive(arenaDefense);
 const passiveFactor=Math.min(COMBAT_BALANCE_LIMITS.maxPassiveAttackFactor,
  Math.max(1,offensiveProduct));
 const defenseFactor=Math.max(COMBAT_BALANCE_LIMITS.minMotherDefenseFactor,
  Math.min(1,defensiveProduct));
 const passiveDamage=Math.floor(raw*passiveFactor+1e-9);
 // Fusion/formation shot values were already computed from genuine ammo.
 // A total cap is applied only if a verified pre-maneuver baseline exists.
 const combinedLimit=base>0?
  Math.floor(base*COMBAT_BALANCE_LIMITS.maxFusionStackFactor+1e-9):passiveDamage;
 const damage=Math.min(passiveDamage,combinedLimit);
 return Object.freeze({
  damage,unmodifiedVolleyDamage:base,rawDamage:raw,
  passiveFactor,defenseFactor,
  passiveCapApplied:offensiveProduct>COMBAT_BALANCE_LIMITS.maxPassiveAttackFactor+1e-9,
  fusionStackCapApplied:damage<passiveDamage,
  motherDefenseCapApplied:defensiveProduct<COMBAT_BALANCE_LIMITS.minMotherDefenseFactor-1e-9
 });
}
