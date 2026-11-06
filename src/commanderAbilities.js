// Punto 41 — abilità tattiche dei comandanti per il duello CONTINUO.
// Una sola carta pilota per flotta. Nessun bonus del motore Poker precedente,
// nessuna carta creata e nessun effetto su calcoli non validi.
// Ogni abilità è un modificatore condizionato del danno di un vero proiettile.
const BASIC=[2,3,4,5,6];
const STANDARD=[3,4,5,6,7];
const ELITE=[4,5,6,7,8];
const FINAL=[4,6,8,10,12];
const definitions=[
 ['pilot_com_1','Cadetto Additivo','Attacco','Calcolo valido con addizione','plus',BASIC],
 ['pilot_com_2','Calibratore Sottrattivo','Attacco','Calcolo valido con sottrazione','minus',BASIC],
 ['pilot_com_3','Cannoniere Balistico','Attacco','Calcolo valido con moltiplicazione','times',BASIC],
 ['pilot_com_4','Cecchino Quantico','Attacco','Calcolo valido con divisione esatta','divide',BASIC],
 ['pilot_boss_1','Guardiano di Gaia','Difesa','Primo impatto efficace alla madre','first_mother_hit',STANDARD],
 ['pilot_boss_2','Colosso di Tharsis','Attacco','Due colpi efficaci di seguito allo stesso vitale','repeat_vital',STANDARD],
 ['pilot_boss_3','Matriarca Tossica','Attacco','Colpo a un avversario con scudo corroso','corroded_enemy',STANDARD],
 ['pilot_boss_4','Arconte Solare','Attacco','Formula con tre numeriche verso un vitale','three_vital',STANDARD],
 ['pilot_boss_5','Occhio del Vortice','Attacco','Colpo potenziato da vera carta Impulso Ionico','ion_shot',STANDARD],
 ['pilot_boss_6','Crono il Distruttore','Attacco','Primo colpo efficace dopo un riciclo numerico','recycled_shot',STANDARD],
 ['pilot_boss_7','Sentinella Ionica','Difesa','Madre colpita mentre è ionizzata','ionized_self',STANDARD],
 ['pilot_boss_8','Leviatano Abissale','Difesa','Scudo madre ancora sopra il 50%','high_shield',STANDARD],
 ['pilot_boss_9','Signore delle Ombre','Attacco','Scudo proprio al 35% o meno','critical_shield',STANDARD],
 ['pilot_boss_10','Colosso di Metano','Difesa','Almeno una scudiera distrutta','escort_lost',STANDARD],
 ['pilot_boss_11','Idra Criogenica','Attacco','Alternanza tra vitali nemici realmente colpiti','alternate_vital',STANDARD],
 ['pilot_boss_12',"Titano d'Acciaio",'Difesa','Un solo vitale alleato ancora operativo','last_vital',STANDARD],
 ['pilot_rare_1','Il Vendicatore','Attacco','Un vitale alleato in avaria o distrutto','damaged_vital',STANDARD],
 ['pilot_rare_2',"L'Adrenalinico",'Attacco','Scudo proprio al 60% o meno','strained_shield',STANDARD],
 ['pilot_rare_3','Il Baro','Attacco','Formula da tre numeriche con semi differenti','mixed_triple',STANDARD],
 ['pilot_rare_4','Il Collezionista di Specchi','Difesa','Almeno due vitali alleati in avaria','two_damaged_vitals',STANDARD],
 ['pilot_epic_1',"L'Artificiere di Bordo",'Attacco','Colpo preparato con Perforante o Corrosione','special_attack',ELITE],
 ['pilot_epic_2',"L'Alchimista Aurico",'Attacco','Due diverse carte speciali offensive sullo stesso colpo','double_special',ELITE],
 ['pilot_epic_3','Il Viaggiatore del Tempo','Attacco','Primo colpo efficace contro un vitale mai raggiunto','new_vital',ELITE],
 ['pilot_epic_4','Il Re del Ghiaccio','Difesa','Madre esposta con scudo a zero','no_shield',ELITE],
 ['pilot_leg_1','Il Gran Maestro','Attacco','Operazione diversa da quella dell’ultimo colpo efficace','alternate_operation',ELITE],
 ['pilot_leg_2','Il Veggente Supremo','Attacco','Cambio scudiera bersaglio dopo un colpo efficace','alternate_escort',ELITE],
 ['pilot_leg_3','Il Fissatore','Attacco','Terzo colpo consecutivo allo stesso vitale','third_vital',ELITE],
 ['pilot_leg_4','Il Lottatore di Sumo','Attacco','Tre numeriche con moltiplicazione o divisione','complex_triple',ELITE],
 ['pilot_leg_5',"L'Amante del Rosso",'Attacco','Calcolo valido con almeno due carte numeriche rosse','red_pair',ELITE],
 ['pilot_leg_6',"L'Amante del Nero",'Attacco','Calcolo valido con almeno due carte numeriche nere','black_pair',ELITE],
 ['pilot_boss_18','Entità della Discordia','Attacco','Nemico contemporaneamente ionizzato e corroso','double_status',FINAL],
 ['pilot_boss_19','Nucleo Magmatico','Attacco','Terzo impatto efficace consecutivo del comandante alla madre','third_mother_hit',FINAL],
 ['pilot_boss_20','Sovrano del Vuoto','Attacco','Nemico con tre vitali distrutti','enemy_last_vital',FINAL],
];
export const COMMANDER_ABILITIES=Object.freeze(Object.fromEntries(definitions.map(
 ([id,name,role,description,trigger,levels])=>[id,Object.freeze({
  id,name,role,description,trigger,levels:Object.freeze([...levels])
 })]
)));
export const COMMANDER_ABILITY_IDS=Object.freeze(Object.keys(COMMANDER_ABILITIES));
export const commanderAbility=id=>COMMANDER_ABILITIES[id]||null;
const mother=s=>s?.fleet?.[0]?.defense?.kind==='mother'?s.fleet[0].defense:null;
const ko=d=>d?Object.values(d.parts).filter(p=>p.hp<=0).length:0;
const damaged=d=>d?Object.values(d.parts).filter(p=>p.hp< p.max).length:0;
const ratio=d=>d?.shield?.max>0?d.shield.hp/d.shield.max:1;
const isLiveStatus=(side,key,now)=>Number(side?.strategicStatuses?.[key]||0)>now;
const isRed=c=>['♥','♦','hearts','diamonds','H','D'].includes(c?.suit);
const isBlack=c=>['♠','♣','spades','clubs','S','C'].includes(c?.suit);
const validCards=cards=>Array.isArray(cards)&&[2,3].includes(cards.length)&&cards.every(c=>c&&c.suit);
const knownLevel=l=>Number.isFinite(Number(l))?Math.max(1,Math.min(5,Math.floor(Number(l)))):1;
export function commanderAbilityStatus(side){
 const ability=commanderAbility(side?.commander?.id);
 if(!ability)return null;
 const level=knownLevel(side.commander.level);
 return {...ability,level,value:ability.levels[level-1],unit:'%'};
}
// Pure condition calculation: preview and actual impact use the SAME rules.
// Bonuses apply to outgoing damage only after a genuine valid calculation
// and real ammunition have been checked by the battle engine.
export function commanderAttackFactor(attacker,defender,context={}){
 const a=commanderAbilityStatus(attacker),m=mother(attacker),enemy=mother(defender);
 if(!a||a.role!=='Attacco'||!m||!enemy||!validCards(context.cards))return 1;
 const c=attacker.commander,now=Number(context.nowMs)||0,parts=context.cards;
 const vital=context.vitalId||null,escort=context.escortIndex;
 const changedSuits=new Set(parts.map(card=>card.suit)).size>1;
 let active=false;
 switch(a.trigger){
  case 'plus':case 'minus':case 'times':case 'divide': active=context.op===a.trigger;break;
  case 'repeat_vital': active=!!vital&&c.lastVitalHit===vital;break;
  case 'corroded_enemy':active=isLiveStatus(defender,'corrodedUntil',now);break;
  case 'three_vital':active=!!vital&&parts.length===3;break;
  case 'ion_shot':active=context.strikeEffects?.includes('shot-ion')===true;break;
  case 'recycled_shot':active=(Number(context.reshufflesAtLaunch)||0)>(c.seenRecycle||0);break;
  case 'critical_shield':active=ratio(m)<=.35;break;
  case 'alternate_vital':active=!!vital&&!!c.lastVitalHit&&vital!==c.lastVitalHit;break;
  case 'damaged_vital':active=damaged(m)>=1;break;
  case 'strained_shield':active=ratio(m)<=.60;break;
  case 'mixed_triple':active=parts.length===3&&changedSuits;break;
  case 'special_attack':active=['shot-piercing','shot-corrosion'].some(x=>context.strikeEffects?.includes(x));break;
  case 'double_special':active=new Set(context.strikeEffects||[]).size>=2;break;
  case 'new_vital':active=!!vital&&!(c.visitedVitals||[]).includes(vital);break;
  case 'alternate_operation':active=!!c.lastOp&&context.op!==c.lastOp;break;
  case 'alternate_escort':active=Number.isInteger(escort)&&Number.isInteger(c.lastEscortIndex)&&escort!==c.lastEscortIndex;break;
  case 'third_vital':active=!!vital&&c.lastVitalHit===vital&&(c.vitalStreak||0)>=2;break;
  case 'complex_triple':active=parts.length===3&&['times','divide'].includes(context.op);break;
  case 'red_pair':active=parts.filter(isRed).length>=2;break;
  case 'black_pair':active=parts.filter(isBlack).length>=2;break;
  case 'double_status':active=isLiveStatus(defender,'corrodedUntil',now)&&isLiveStatus(defender,'ionizedUntil',now);break;
  case 'third_mother_hit':active=(c.successfulMotherHits||0)>0&&(c.successfulMotherHits||0)%3===2;break;
  case 'enemy_last_vital':active=ko(enemy)===3;break;
 }
 return active?1+a.value/100:1;
}
export function commanderDefenseFactor(defender,attacker,context={}){
 const a=commanderAbilityStatus(defender),m=mother(defender);
 if(!a||a.role!=='Difesa'||!m||!mother(attacker)||context.escortIndex!=null)return 1;
 const c=defender.commander,now=Number(context.nowMs)||0;
 let active=false;
 switch(a.trigger){
  case 'first_mother_hit':active=(c.receivedMotherHits||0)===0;break;
  case 'ionized_self':active=isLiveStatus(defender,'ionizedUntil',now);break;
  case 'high_shield':active=ratio(m)>.5;break;
  case 'escort_lost':active=(defender.escorts||[]).some(e=>e.defense?.destroyed);break;
  case 'last_vital':active=ko(m)===3;break;
  case 'two_damaged_vitals':active=damaged(m)>=2;break;
  case 'no_shield':active=m.shield.hp<=0;break;
 }
 return active?(100-a.value)/100:1; // exact decimal factor for percentage defenses
}
// Update memory only on real resolved damage; avoid granting extra turns,
// ammo, HP or status effects. Both human and AI use this event.
export function rememberCommanderImpact(attacker,defender,context={},hit={}){
 let nextAttacker=attacker,nextDefender=defender;
 const am=commanderAbilityStatus(attacker),dm=commanderAbilityStatus(defender);
 if(am&&hit.damage>0){
  const c={...attacker.commander};
  if(hit.motherDamage>0){
   c.successfulMotherHits=(c.successfulMotherHits||0)+1;
   c.lastOp=context.op||c.lastOp;
   if(context.vitalId){
    c.vitalStreak=c.lastVitalHit===context.vitalId?(c.vitalStreak||0)+1:1;
    c.lastVitalHit=context.vitalId;
    c.visitedVitals=[...new Set([...(c.visitedVitals||[]),context.vitalId])].slice(-4);
   }else c.vitalStreak=0;
  }
  if(Number.isInteger(context.escortIndex))c.lastEscortIndex=context.escortIndex;
  if(Number(context.reshufflesAtLaunch)>Number(c.seenRecycle||0))
   c.seenRecycle=Number(context.reshufflesAtLaunch);
  nextAttacker={...attacker,commander:c};
 }
 if(dm&&hit.motherDamage>0){
  nextDefender={...defender,commander:{...defender.commander,
   receivedMotherHits:(defender.commander.receivedMotherHits||0)+1}};
 }
 return {attacker:nextAttacker,defender:nextDefender};
}
