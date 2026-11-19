// Eclissi Stellare: prima calibrazione delle carte gia' confermate.
// Non ridefinisce Personaggi, rarita', costi, energia o fusioni.
// La scala storica resta valida nei test/duelli senza schede madre con rarita'.
export const CONFIRMED_CARD_BALANCE=Object.freeze({
 support:Object.freeze({
  regenerationMotherPercentPerSecond:.06,
  poisonMotherPercentPerSecond:.07,
  poisonSupportPercentPerSecond:.10,
  lastShieldMotherHealPercent:5.5,
  capacitorMotherDamagePercent:2.5,
  capacitorSupportDamagePercent:4.5
 }),
 arsenalTierPercent:Object.freeze([8,12,17,23]),
 escortWeapon:Object.freeze({baseDamage:15,perEscort:20,maxActiveSupports:2}),
 exclusiveAttackByImpact:Object.freeze([.55,.85,1.18,1.50])
});
const numeric=n=>Number.isFinite(Number(n))?Number(n):0;
const roundTenth=n=>Math.round(n*10)/10;
export const hasBalancedMother=mother=>!!mother&&Number.isFinite(mother.defensePercent)&&
 Number.isFinite(mother.maxHp)&&mother.maxHp>0;

export function supportRegenerationPerSecond(mother){
 if(!hasBalancedMother(mother))return .1;
 return Math.max(.1,roundTenth(mother.maxHp*
  CONFIRMED_CARD_BALANCE.support.regenerationMotherPercentPerSecond/100));
}
export function supportPoisonPerSecond(target,mother){
 if(!hasBalancedMother(mother))return .1;
 const rate=target===mother?
  CONFIRMED_CARD_BALANCE.support.poisonMotherPercentPerSecond:
  CONFIRMED_CARD_BALANCE.support.poisonSupportPercentPerSecond;
 return Math.max(.1,roundTenth(Math.max(0,numeric(target?.maxHp))*rate/100));
}
export function supportLastShieldHeal(mother){
 if(!hasBalancedMother(mother))return 25;
 return Math.min(80,Math.max(1,
  Math.round(mother.maxHp*CONFIRMED_CARD_BALANCE.support.lastShieldMotherHealPercent/100)));
}
export function supportCapacitorDamage(target,mother){
 if(!hasBalancedMother(mother))return 1;
 const rate=target===mother?
  CONFIRMED_CARD_BALANCE.support.capacitorMotherDamagePercent:
  CONFIRMED_CARD_BALANCE.support.capacitorSupportDamagePercent;
 return Math.max(1,Math.round(Math.max(0,numeric(target?.maxHp))*rate/100));
}
export function arsenalTierRate(tier){
 const n=Math.floor(Number(tier)||0);
 return n>=1&&n<=4?CONFIRMED_CARD_BALANCE.arsenalTierPercent[n-1]/100:0;
}

// Le esclusive offensive che usavano 1–4 HP tecnici devono incidere sulla
// scala di madri e supporti da centinaia di HP. Non aggiunge colpi e non
// cambia danni gia' superiori a 4, costi, difese o carte Personaggio.
export function exclusiveAttackCardDamage(amount,mother,isExclusiveAttack=false){
 const value=Math.max(0,Math.floor(Number(amount)||0));
 if(!isExclusiveAttack||!hasBalancedMother(mother)||value<1||value>4)return value;
 const factor=CONFIRMED_CARD_BALANCE.exclusiveAttackByImpact[value-1];
 return Math.max(1,Math.round(mother.attackPower*factor));
}
