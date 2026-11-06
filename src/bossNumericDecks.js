// Punto 31: 12 mazzi numerici boss, da 1 a 3 abilità con tre gradi ciascuna.
// Restano separati dal mazzo di 24 carte speciali. Nessuna abilità crea carte,
// supera firme matematiche o applica danno senza un colpo valido.
const design=[
 ['planet_char_1','Gaia',3,[['Baluardo terrestre','Scudo iniziale e massimo +%',[4,6,8]]]],
 ['planet_char_2','Tharsis',3,[['Pressione marziana','Danni +% sui vitali colpiti consecutivamente',[3,5,7]]]],
 ['planet_char_3','Afrodite',6,[['Ricambio armonico','Ricarica del ricambio numerico in secondi',[13,11,9]],['Sintesi curativa','Riparazione Scudo (carta reale) +%',[5,8,11]]]],
 ['planet_char_6','Anelli di Crono',3,[['Primo anello','Danno del primo impatto alla madre −%',[8,12,16]]]],
 ['planet_char_7','Sentinella Ionica',3,[['Isolamento ionico','Durata della ionizzazione subita −%',[15,25,35]]]],
 ['planet_char_8','Leviatano',6,[['Marea del riciclo','Primo colpo dopo riciclo numerico +%',[4,6,8]],['Profondità tattica','Calcoli validi da tre carte: danno +%',[3,5,7]]]],
 ['planet_char_9','Ombre',6,[['Potenza disperata','Danno +% quando lo scudo è ≤35%',[5,8,11]],['Oscurità terminale','Danno ai vitali +% con due propri vitali KO',[4,6,8]]]],
 ['planet_char_11','Idra',6,[['Precisione criogenica','Danno con divisione valida +%',[3,5,7]],['Teste alternate','Danno +% alternando vitali avversari',[4,6,8]]]],
 ['planet_char_14','Generatore',6,[['Schermatura instabile','Durata Ionizzazione e Corrosione subite −%',[15,25,35]],['Accumulo energetico','Sincronia acquisita da eventi reali +%',[10,20,30]]]],
 ['planet_char_17','Risonanza',9,[['Armi armoniche','Danno +% alternando armi che sparano',[4,6,8]],['Frequenza multipla','Danno +% con almeno due semi diversi',[3,5,7]],['Sinfonia di flotta','Danno +% se madre e scudiera sparano insieme',[3,5,7]]]],
 ['planet_char_19','Nucleo Magmatico',9,[['Risonanza termica','Ogni terzo colpo efficace allo scudo +%',[6,9,12]],['Corrosione ardente','Colpo con vera carta Corrosione +%',[3,5,7]],['Forgia moltiplicatrice','Colpo valido con moltiplicazione +%',[4,6,8]]]],
 ['planet_char_20','Sovrano',9,[['Ultimo presidio','Danni subiti con un solo vitale vivo −%',[8,12,16]],['Vuoto difensivo','Danni alla madre con scudo ≤25% −%',[4,6,8]],['Supremazia','Colpo successivo a un vitale nemico KO +%',[4,6,8]]]]
];
export const BOSS_NUMERIC_DECKS=Object.freeze(Object.fromEntries(design.map(([id,name,maxLevel,raw])=>[
 id,Object.freeze({id,name,maxLevel,abilities:Object.freeze(raw.map(([name,description,grades])=>
  Object.freeze({name,description,grades:Object.freeze(grades)})))})
])));
export const BOSS_NUMERIC_DECK_IDS=Object.freeze(Object.keys(BOSS_NUMERIC_DECKS));
export const numericBossDeck= id=>BOSS_NUMERIC_DECKS[id]||null;
export function numericBossAbilityGrade(level,index){
 const lv=Math.max(1,Math.min(9,Math.floor(Number(level)||1)));
 return Math.max(0,Math.min(3,lv-index*3));
}
export function activeNumericBossAbilities(id,level=1){
 const deck=numericBossDeck(id);
 if(!deck)return [];
 const lv=Math.max(1,Math.min(deck.maxLevel,Math.floor(Number(level)||1)));
 return deck.abilities.map((ability,index)=>{
  const grade=numericBossAbilityGrade(lv,index);
  return {...ability,grade,value:grade?ability.grades[grade-1]:null,unlocked:grade>0,
   unlockAt:1+index*3};
 });
}
export const bossValue=(side,index)=>{
 const b=side?.bossNumericDeck;
 return b?activeNumericBossAbilities(b.id,b.level)[index]?.value??0:0;
};
const mother=side=>side?.fleet?.[0]?.defense?.kind==='mother'?side.fleet[0].defense:null;
const pct=(n)=>Math.max(0,Number(n)||0)/100;
const koCount=defense=>defense?Object.values(defense.parts).filter(p=>p.hp<=0).length:0;
export function equipBossNumericDeck(side,id='neutral_starter',level=1){
 const deck=numericBossDeck(id);
 if(!deck||!mother(side))return side; // compatibilità legacy / mazzo neutro
 const lv=Math.max(1,Math.min(deck.maxLevel,Math.floor(Number(level)||1)));
 const state={id,level:lv,firstHitUsed:false,lastVital:null,shieldHits:0,
  lastWeapon:null,seenRecycle:0,powerAfterKo:false};
 let fleet=side.fleet;
 if(id==='planet_char_1'){
  const old=mother(side),bonus=Math.floor(old.shield.max*pct(deck.abilities[0].grades[lv-1]));
  if(bonus>0){
   const next={...old,shield:{hp:old.shield.hp+bonus,max:old.shield.max+bonus}};
   fleet=side.fleet.map((v,i)=>i===0?{...v,defense:next}:v);
  }
 }
 return {...side,fleet,bossNumericDeck:state};
}
export function bossNumericRecoveryMs(side,standardMs=15000){
 return side?.bossNumericDeck?.id==='planet_char_3'?
  bossValue(side,0)*1000:standardMs;
}
export function bossNumericRepairAmount(side,normal=20){
 return side?.bossNumericDeck?.id==='planet_char_3'?
  Math.max(0,Math.floor(normal*(1+pct(bossValue(side,1)))+1e-9)):normal;
}
export function bossNumericSyncBonus(side,earned){
 const value=side?.bossNumericDeck?.id==='planet_char_14'?bossValue(side,1):0;
 return value&&earned>0?Math.floor(earned*pct(value)):0;
}
export function applyBossNumericSync(side,earned){
 const extra=bossNumericSyncBonus(side,earned);
 const m=side?.maneuvers;
 return extra&&m?{...side,maneuvers:{...m,sync:Math.min(100,m.sync+extra)}}:side;
}
export function reduceBossNumericStatuses(side,applied=[],nowMs=Date.now()){
 const id=side?.bossNumericDeck?.id,percent=id==='planet_char_7'?bossValue(side,0):
  id==='planet_char_14'?bossValue(side,0):0;
 if(!percent||!Array.isArray(applied)||!applied.length)return side;
 const s={...(side.strategicStatuses||{})};
 if(applied.includes('shot-ion')&&s.ionizedUntil>nowMs)
  s.ionizedUntil=nowMs+Math.ceil((s.ionizedUntil-nowMs)*(1-pct(percent)));
 if(id==='planet_char_14'&&applied.includes('shot-corrosion')&&s.corrodedUntil>nowMs)
  s.corrodedUntil=nowMs+Math.ceil((s.corrodedUntil-nowMs)*(1-pct(percent)));
 return {...side,strategicStatuses:s};
}
export function bossNumericDamageFactor(attacker,defender,context={}){
 const b=attacker?.bossNumericDeck;if(!b)return 1;
 const id=b.id,a=mother(attacker),e=mother(defender);
 if(!a||!e)return 1;
 const {vitalId=null,escortIndex=null,op=null,cards=[],weaponKey=null,escortShot=false,strikeEffects=[]}=context;
 let bonus=0;
 switch(id){
  case 'planet_char_2':
   if(vitalId&&b.lastVital===vitalId)bonus+=bossValue(attacker,0);
   break;
  case 'planet_char_8':
   if(attacker.reshuffles>b.seenRecycle)bonus+=bossValue(attacker,0);
   if(cards.length===3)bonus+=bossValue(attacker,1);
   break;
  case 'planet_char_9':
   if(a.shield.hp<=a.shield.max*.35)bonus+=bossValue(attacker,0);
   if(vitalId&&koCount(a)>=2)bonus+=bossValue(attacker,1);
   break;
  case 'planet_char_11':
   if(op==='divide')bonus+=bossValue(attacker,0);
   if(vitalId&&b.lastVital&&vitalId!==b.lastVital)bonus+=bossValue(attacker,1);
   break;
  case 'planet_char_17':
   if(weaponKey&&b.lastWeapon&&weaponKey!==b.lastWeapon)bonus+=bossValue(attacker,0);
   if(new Set(cards.map(c=>c?.suit).filter(Boolean)).size>=2)bonus+=bossValue(attacker,1);
   if(escortShot)bonus+=bossValue(attacker,2);
   break;
  case 'planet_char_19':
   if(escortIndex==null&&!vitalId&&e.shield.hp>0&&b.shieldHits%3===2)
    bonus+=bossValue(attacker,0);
   if(strikeEffects.includes('shot-corrosion'))bonus+=bossValue(attacker,1);
   if(op==='times')bonus+=bossValue(attacker,2);
   break;
  case 'planet_char_20':
   if(b.powerAfterKo)bonus+=bossValue(attacker,2);
   break;
 }
 return 1+pct(Math.min(30,bonus)); // ceiling across combined passives
}
export function bossNumericDefenseFactor(defender,context={}){
 const b=defender?.bossNumericDeck;if(!b||!mother(defender))return 1;
 if(context.escortIndex!=null)return 1;
 const a=mother(defender);let reduce=0;
 if(b.id==='planet_char_6'&&!b.firstHitUsed)reduce+=bossValue(defender,0);
 if(b.id==='planet_char_20'){
  if(koCount(a)===3)reduce+=bossValue(defender,0);
  if(a.shield.hp<=a.shield.max*.25)reduce+=bossValue(defender,1);
 }
 return 1-pct(Math.min(35,reduce));
}
export function rememberBossNumericImpact(attacker,defender,context={},hit={}){
 let nextAttacker=attacker,nextDefender=defender;
 const a=attacker?.bossNumericDeck,d=defender?.bossNumericDeck;
 if(a&&hit.damage>0){
  const toMother=hit.motherDamage>0;
  const next={...a};
  if(toMother&&context.vitalId)next.lastVital=context.vitalId;
  if(toMother&&!context.vitalId&&context.escortIndex==null)next.shieldHits++;
  if(context.weaponKey)next.lastWeapon=context.weaponKey;
  if(attacker.reshuffles>next.seenRecycle)next.seenRecycle=attacker.reshuffles;
  if(next.powerAfterKo)next.powerAfterKo=false; // spend on actual effective strike
  if(hit.systemDisabled)next.powerAfterKo=true; // next attack after actual KO
  nextAttacker={...attacker,bossNumericDeck:next};
 }
 if(d&&hit.motherDamage>0&&!d.firstHitUsed)
  nextDefender={...defender,bossNumericDeck:{...d,firstHitUsed:true}};
 return {attacker:nextAttacker,defender:nextDefender};
}
