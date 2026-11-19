// Prima griglia di bilanciamento 19/11/2026: forza equivalente, ruoli distinti.
// Nessun livello visibile: le quattro rarita' modulano le statistiche finali.
// Gli elementi e le abilita' restano specifici e vengono valutati separatamente.
export const LEGENDARY_MOTHER_PROFILES=Object.freeze({
 N00:Object.freeze({maxHp:1050,attackPower:114,defensePercent:11,role:'versatile'}),
 C01:Object.freeze({maxHp:820,attackPower:155,defensePercent:5,role:'assalto'}),
 C02:Object.freeze({maxHp:900,attackPower:142,defensePercent:4,role:'precisione'}),
 C03:Object.freeze({maxHp:950,attackPower:130,defensePercent:7,role:'disturbo'}),
 R01:Object.freeze({maxHp:850,attackPower:150,defensePercent:4,role:'pressione'}),
 R02:Object.freeze({maxHp:1100,attackPower:108,defensePercent:11,role:'resistenza'}),
 R04:Object.freeze({maxHp:1150,attackPower:100,defensePercent:14,role:'contrattacco'}),
 E01:Object.freeze({maxHp:1080,attackPower:105,defensePercent:15,role:'controllo'}),
 E02:Object.freeze({maxHp:870,attackPower:148,defensePercent:3,role:'assalto'}),
 L01:Object.freeze({maxHp:990,attackPower:125,defensePercent:7,role:'tattica'}),
 L03:Object.freeze({maxHp:1200,attackPower:95,defensePercent:15,role:'corazza'}),
 L04:Object.freeze({maxHp:1000,attackPower:120,defensePercent:10,role:'equilibrio'})
});
export const MOTHER_BALANCE_LIMITS=Object.freeze({
 minLegendaryHp:800,maxLegendaryHp:1250,
 minLegendaryAttack:90,maxLegendaryAttack:160,
 maxDefensePercent:18,
 // Il danno nominale delle carte resta intatto: il limite agisce solo sugli HP reali
 // sottratti alla madre per impedire KO a piena vita con un colpo o una combo.
 maxSingleMotherHitPercent:40,
 maxMotherDamagePerPlyPercent:55
});
export const MOTHER_RARITY_SCALING=Object.freeze([
 Object.freeze({hp:.36,attack:.42,defense:.45}),
 Object.freeze({hp:.55,attack:.61,defense:.65}),
 Object.freeze({hp:.77,attack:.82,defense:.82}),
 Object.freeze({hp:1,attack:1,defense:1})
]);
const clamp=(n,low,high)=>Math.min(high,Math.max(low,n));
// "Parita' di potenziale": metrica semplice per controllare la prima griglia.
// La vittoria reale dipende anche da supporti, carte, elementi e decisioni.
export const motherBaselinePotential=profile=>
 Math.round(profile.maxHp*profile.attackPower/(1-profile.defensePercent/100));

export function scaledMotherStats(shipId,rarityIndex){
 const p=LEGENDARY_MOTHER_PROFILES[shipId],scale=MOTHER_RARITY_SCALING[rarityIndex];
 if(!p||!scale)return null;
 const cap=MOTHER_BALANCE_LIMITS;
 const hp=clamp(Math.round(p.maxHp*scale.hp),
  Math.ceil(cap.minLegendaryHp*scale.hp),
  Math.ceil(cap.maxLegendaryHp*scale.hp));
 const attack=clamp(Math.round(p.attackPower*scale.attack),
  Math.ceil(cap.minLegendaryAttack*scale.attack),
  Math.ceil(cap.maxLegendaryAttack*scale.attack));
 const defensePercent=clamp(Math.round(p.defensePercent*scale.defense),
  0,cap.maxDefensePercent);
 return Object.freeze({maxHp:hp,attackPower:attack,
  defensePower:Math.min(2,Math.round(defensePercent/8)),
  defensePercent});
}
// Un singolo colpo non deve abbattere istantaneamente una madre integra.
// Il vincolo del turno si applica alla somma dei danni diretti e degli
// eventuali passaggi di danno dalle navicelle di supporto.
export function limitedMotherDamage(mother,rawDamage,ply=0){
 const incoming=Math.max(0,Math.floor(Number(rawDamage)||0));
 if(!incoming||!mother||mother.hp<=0)return 0;
 // Le partite storiche senza rarita' e difesa percentuale conservano la
 // matematica precedente. La nuova scala entra solo per le carte-rarita'.
 if(!Number.isFinite(mother.defensePercent))
  return Math.min(mother.hp,incoming);
 const cap=MOTHER_BALANCE_LIMITS;
 const perHit=Math.max(1,Math.ceil(mother.maxHp*cap.maxSingleMotherHitPercent/100));
 const perPly=Math.max(1,Math.ceil(mother.maxHp*cap.maxMotherDamagePerPlyPercent/100));
 const already=mother.damageReceivedPly===ply?
  Math.max(0,Math.floor(mother.damageReceivedOnPly||0)):0;
 const available=Math.max(0,perPly-already);
 if(!available)return 0;
 const capped=Math.min(incoming,perHit,available);
 const defense=clamp(mother.defensePercent,0,cap.maxDefensePercent);
 const reduced=capped>0?Math.max(1,Math.round(capped*(100-defense)/100)):0;
 // I boss hanno un'ulteriore resistenza, senza superare gli HP mostrati.
 const bossReduction=clamp(mother.bossGuardPercent||0,0,30);
 const finalDamage=bossReduction?Math.max(1,Math.round(reduced*(100-bossReduction)/100)):reduced;
 const dealt=Math.min(mother.hp,available,finalDamage);
 mother.damageReceivedPly=ply;
 mother.damageReceivedOnPly=already+dealt;
 return dealt;
}

const values=Object.values(LEGENDARY_MOTHER_PROFILES);
const potentials=values.map(motherBaselinePotential);
if(values.length!==12||!values.every(p=>
 Number.isInteger(p.maxHp)&&p.maxHp>=MOTHER_BALANCE_LIMITS.minLegendaryHp&&
 p.maxHp<=MOTHER_BALANCE_LIMITS.maxLegendaryHp&&
 Number.isInteger(p.attackPower)&&p.attackPower>=MOTHER_BALANCE_LIMITS.minLegendaryAttack&&
 p.attackPower<=MOTHER_BALANCE_LIMITS.maxLegendaryAttack&&
 Number.isInteger(p.defensePercent)&&p.defensePercent>=0&&
 p.defensePercent<=MOTHER_BALANCE_LIMITS.maxDefensePercent)||
 LEGENDARY_MOTHER_PROFILES.L04.maxHp!==1000||
 Math.max(...potentials)/Math.min(...potentials)>1.03)
 throw Error('Griglia madri: limiti o equivalenza del potenziale non rispettati');
