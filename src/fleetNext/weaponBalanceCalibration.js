// Valori Carte Arma quasi definitivi, congelati il 22/11/2026.
// L'originale conserva i dati compatibili con il motore legacy.
// La stessa regola produce il numero SULLA carta e il numero nel combattimento.
// La scala differenzia progressioni con 0/1/2 supporti, non impone un timer.
import {FLEET_ELEMENTS} from './elementalAffinities.js';
import {PACING_BALANCE_CANDIDATE} from './pacingBalanceCandidate.js';
import {STRATEGIC_NO_DRAIN_BALANCE} from './strategicNoDrainBalance.js';
import {salvoCardDescription,withApprovedWeaponSalvo} from './approvedWeaponSalvos.js';
export const WEAPON_RARITY_POWER=PACING_BALANCE_CANDIDATE.weaponNominalMultiplier;
export const WEAPON_BALANCE_REVISION=PACING_BALANCE_CANDIDATE.id;
const DAMAGE_FIELDS=Object.freeze(new Set([
 'baseDamage','secondDamage','extraDamage','supportDamage','motherDamage',
 'terrainSupportDamage','bonusDamage','comboBonus','comboBonusDamage',
 'characterBonusDamage','perSupportDamage','maxExtraDamage',
 'damagePerDiscard','perDiscardAttack','soloDamage','chainDamage',
 'maxNominalDamage','maxDamage','burnMinimum','burnMaxDamage','burnPerDiscard'
]));
const DAMAGE_ARRAYS=Object.freeze(new Set(['damages','damageStages']));
const integer=n=>Math.max(1,Math.round(n));
const grow=(n,factor)=>n<=0?n:Math.max(Math.ceil(n)+1,integer(n*factor));
// I costi energetici, gli HP sacrificati, la durata, i numeri di colpi,
// le soglie, le protezioni ignorate e i massimali dei bersagli NON crescono
// automaticamente: fanno parte dell'identita' strategica della carta.
function scaleObject(spec,factor){
 const changed={...spec};
 for(const [key,value] of Object.entries(spec)){
  if(DAMAGE_FIELDS.has(key)&&Number.isFinite(value)&&value>0)
   changed[key]=grow(value,factor);
  else if(DAMAGE_ARRAYS.has(key)&&Array.isArray(value))
   changed[key]=value.map(n=>Number.isFinite(n)&&n>0?grow(n,factor):n);
 }
 if(spec.weaponProfile){
  changed.weaponProfile=Object.freeze(scaleObject(spec.weaponProfile,factor));
 }
 return changed;
}
const fmt=list=>list.join('/');
function description(source,s){
 const salvo=salvoCardDescription(source,s);if(salvo)return 'Arma Metallo · '+salvo;
 const e=FLEET_ELEMENTS[source.elementId]?.name||source.elementId;
 const prefix='Arma '+e+' · ';
 const base=s.baseDamage||0;
 const t=s.durationTurns||1;
 switch(s.damageMode){
  case 'base-shot':return prefix+base+' HP su un bersaglio, un colpo autonomo. Difese e Terreni applicabili.';
  case 'polarity-shot':return prefix+base+' HP diretti alla madre; lascia cristallo '+s.crystalPolarity+
   ' se ferisce. La polarita opposta entro il prossimo turno proprio aggiunge un impatto di '+
   s.comboBonus+' HP. Difese e resistenze applicabili.';
  case 'double-shot':return prefix+s.shotCount+' colpi indipendenti da '+base+
   ' HP; ogni impatto attraversa le Difese.';
  case 'repeat-shot':return prefix+base+' HP per ciascuno di '+t+
   ' turni propri; occupa uno slot finche attiva.';
  case 'sweep-shot':return prefix+base+
   ' HP su ciascuna nave nemica operativa; un colpo per bersaglio.';
  case 'energy-burst-shot':return prefix+base+' HP e fino a '+s.maxExtraShots+
   ' colpi supplementari da '+s.extraDamage+' HP con Energie '+e+
   ' in pila, non consumate.';
  case 'discard-attacks':return 'Arma '+e+' per un turno: '+base+
   ' HP di danno base, +'+s.perDiscardAttack+
   ' HP per ogni tua Carta Attacco negli scarti. Se nei tuoi scarti è presente almeno una Carta Energia '+
   e+', raddoppia il danno totale una sola volta. Gli scarti avversari non contano.'+
   (s.maxNominalDamage?' Danno base massimo '+s.maxNominalDamage+
    ' HP nominali prima dei modificatori di Arsenale, elementi e Terreno.':'');
  case 'sequence':{
   if(s.sequenceStage===1)return 'Sequenza I ('+e+'): aggiunge '+s.soloDamage+
    " HP all'attacco per due tuoi turni. Solo nel turno successivo puoi sovrapporre Sequenza II; senza evoluzione, si scarta dopo il secondo attacco.";
   if(s.sequenceStage===2)return 'Sequenza II ('+e+'): giocata da sola aggiunge '+s.soloDamage+
    ' HP per un turno e si scarta. Se sovrapposta a Sequenza I nel turno successivo, aggiunge '+
    s.chainDamage+' HP e rimane per un turno in attesa di Sequenza III.';
   return 'Sequenza III ('+e+'): giocata da sola aggiunge '+s.soloDamage+
    ' HP per un turno. Se sovrapposta a Sequenza II concatenata nel turno successivo, aggiunge '+
    s.chainDamage+' HP e poi si scarta.';
  }
 }
 const p=s.weaponProfile||{},b=p.baseDamage||0,n=p.shots||1;
 const active=p.durationTurns||t;
 switch(p.pattern){
  case 'single':case 'metal-base-shot':return prefix+b+' HP al bersaglio scelto; un colpo.';
  case 'target-dependent':return prefix+p.supportDamage+' HP a un supporto oppure '+p.motherDamage+' HP alla madre.';
  case 'multi':case 'spread':return prefix+n+' colpi separati da '+b+
   ' HP'+(p.pattern==='spread'?', distribuibili tra madre e supporti':'')+'.';
  case 'sweep':return prefix+b+' HP a ciascuna nave nemica operativa.';
  case 'repeat':case 'wandering-shrapnel':return prefix+b+
   ' HP per '+active+' turni propri'+(p.pattern==='wandering-shrapnel'?', cambiando bersaglio quando possibile':'')+'.';
  case 'character':return prefix+b+' HP, +'+p.bonusPercent+
   '% con il Personaggio '+p.characterName+' attivo.';
  case 'character-health':return prefix+fmt(p.damages)+' HP secondo gli HP persi dalla madre con Personaggio '+
   p.characterName+' (soglie '+fmt(p.thresholds)+'%).';
  case 'energy-tier':return prefix+fmt(p.damages)+' HP con 0/1/2 Energie '+e+' presenti.';
  case 'energy-charge-burst':return prefix+b+' HP e +'+p.bonusDamage+
   ' HP per carica Energia '+e+' disponibile, fino a '+p.maxBonus+' cariche.';
  case 'energy-fan':return prefix+'1/2/3 bersagli, '+fmt(p.damages)+
   ' HP ciascuno con 0/1/2 Energie '+e+' presenti.';
  case 'induction':return prefix+b+' HP; con una Energia '+e+
   ' attraversa una Difesa, con due ne distrugge una e colpisce.';
  case 'ice-needle':return prefix+p.supportDamage+' HP a ciascuno dei due supporti. Con Terreno Ghiaccio: '+
   p.terrainSupportDamage+' HP per supporto e '+(2*p.terrainSupportDamage)+
   ' HP perforanti alla madre, ignorando le Difese ordinarie.';
  case 'boreal-binary':return prefix+'due impulsi '+b+'+'+p.secondDamage+
   ' HP, un singolo impatto e una verifica difensiva.';
  case 'magma-mortar':return prefix+'per '+active+' turni: '+b+' HP per turno piu fino a '+
   p.maxExtraShots+' colpi da '+p.extraDamage+' HP ciascuno, consumando Energie Fuoco.';
  case 'incinerator':return prefix+b+' HP nel primo turno, '+p.secondDamage+
   ' HP nel secondo; bruciatura '+p.burnTurns+' attivazioni, '+p.burnPerDiscard+
   ' HP per propria Carta Attacco scartata, min '+p.burnMinimum+
   ', max '+p.burnMaxDamage+' HP per attivazione.';
  case 'thermal-coupler':return prefix+b+' HP per '+active+
   ' turni; richiede Cannone Binario, costa '+p.motherCostPercent+
   '% HP massimi madre e recupera fino al '+p.healOnHitPercent+
   '% se colpisce. Potenzia il colpo finale del Binario di '+p.binarioBonusDamage+' HP.';
  case 'binary-overload':return prefix+'cinque fasi; danni percentuali '+fmt(p.damageStages)+
   ' sugli HP nemici e sacrifici del '+p.motherCostPercent+'% madre / '+p.allyCostPercent+'% alleati.';
  case 'character-turret':return prefix+b+' HP e un secondo impatto da '+
   p.extraDamage+' HP su un altro bersaglio se un Personaggio e attivo.';
  case 'low-tide':return prefix+b+' HP +'+p.damagePerDiscard+
   ' per carta nei due scarti (massimo '+p.maxDiscardCards+
   ' carte); prepara Cannone di Alta Marea al prossimo turno proprio.';
  case 'high-tide':return prefix+'richiede Bassa Marea nel turno proprio precedente; colpo x'+
   p.comboMultiplier+' della carica, max '+p.maxDamage+
   ' HP, travolge Difese e Trappole.';
  case 'thermal-reclaimer':return prefix+b+' HP +'+p.damageConversionPercent+
   '% degli HP realmente persi dalla tua flotta dopo la posa (massimo +'+p.maxExtraDamage+
   ' HP), per '+active+' turni.';
  case 'magnetic-grapple':return prefix+'due arpioni da '+b+
   ' HP a due bersagli differenti; prepara la collisione di lega al turno proprio successivo.';
  case 'alloy-collision':return prefix+b+
   ' HP per bersaglio agganciato; richiede gli Arpioni del turno proprio precedente.';
  case 'cascade-piercer':return prefix+b+' HP per '+active+
   ' turni; il danno eccedente passa al prossimo bersaglio spendendo '+
   p.energyTransferCost+' Energia Metallo.';
  case 'growing-thunder-core':return prefix+fmt(p.damageStages)+
   ' HP nei tre turni se una nuova Energia Fulmine viene spesa in ogni carica; altrimenti ricade al minimo.';
  case 'ion-probe':return prefix+b+' HP; lascia un segnale combinabile con Martello del Tuono.';
  case 'thunder-hammer':return prefix+b+' HP e +'+p.comboBonusDamage+
   ' HP con il segnale della Sonda Ionica, che viene consumato.';
  case 'command-lance':return prefix+b+' HP piu '+p.characterBonusDamage+
   ' HP con un Personaggio attivo; il Personaggio e obbligatorio.';
  case 'storm-capacitor':return prefix+'per '+active+' turni, con nuova Energia Fulmine: '+
   b+' HP +'+p.perSupportDamage+' HP per ogni supporto operativo.';
  case 'wind-cycloreactor':return prefix+'per '+active+' turni colpisce tutte le navi nemiche per '+
   fmt(p.damageStages)+' HP; congela la mano per '+fmt(p.freezeSeconds)+
   ' secondi a ogni stadio.';
  case 'weapon-slot-freeze':return prefix+b+
   ' HP; se ferisce congela uno slot Arma avversario per '+p.freezeTurns+' turno proprio.';
  case 'percent':return prefix+p.damagePercent+'% degli HP massimi del bersaglio, Difese valide.';
  default:throw Error('Schema evolutivo assente per '+source.id+': '+p.pattern);
 }
}

export {scaleObject,description};
function balanceNativeSpec(spec,factor){
 const copy={...spec};
 for(const [key,value] of Object.entries(spec)){
  if(DAMAGE_FIELDS.has(key)&&Number.isFinite(value)&&value>0)
   copy[key]=Math.max(1,Math.round(value*factor));
  else if(DAMAGE_ARRAYS.has(key)&&Array.isArray(value)&&
   !(spec.weaponProfile?.pattern==='binary-overload'&&key==='damageStages')&&
   !(spec.pattern==='binary-overload'&&key==='damageStages'))
   copy[key]=value.map(n=>Number.isFinite(n)&&n>0?Math.max(1,Math.round(n*factor)):n);
 }
 if(spec.weaponProfile)
  copy.weaponProfile=Object.freeze(balanceNativeSpec(spec.weaponProfile,factor));
 return copy;
}
// La versione strategica gia' applica i coefficienti nel combattimento.
// Questi originali restano raw per i salvataggi storici; la vista strategica
// espone i valori nominali quasi definitivi, senza moltiplicarli due volte.
export function calibratedWeaponCard(raw){
 if(!raw||!Object.hasOwn(WEAPON_RARITY_POWER,raw.rarita))
  throw Error('Arma priva di rarita');
 return withApprovedWeaponSalvo({...raw,balancePending:false,weaponValuesNearFinal:true,
  weaponBalanceRevision:STRATEGIC_NO_DRAIN_BALANCE.id});
}

// Versione PRE-STAMPA: produce un clone, non modifica lo schema ufficiale.
// Le 73 carte di origine e le 162 evoluzioni rimangono eseguibili con gli
// effetti storici fino alla migrazione al nuovo motore senza sparo gratuito.
export function weaponPrintCandidate(raw){
 const factor=WEAPON_RARITY_POWER[raw?.rarita];
 if(!raw||!Number.isFinite(factor))throw Error('Carta Arma senza rarita');
 const spec=factor===1?raw.effectSpec:Object.freeze(balanceNativeSpec(raw.effectSpec,factor));
 return Object.freeze({...raw,effectSpec:spec,
  effectProposed:factor===1?raw.effectProposed:description(raw,spec),
  balanceRevision:WEAPON_BALANCE_REVISION,
  balanceStatus:'PRINT_PREVIEW_ONLY_NOT_LIVE'});
}

// Nominali nella NUOVA partita senza deterioramento. La descrizione usa
// esattamente il fattore della risoluzione, senza aggiornare i PNG approvati.
// NON sostituisce lo schema RAW conservato per salvataggi e prove storiche.
export function weaponStrategicPrintCandidate(raw){
 const factor=STRATEGIC_NO_DRAIN_BALANCE.weaponNominalMultiplier[raw?.rarita];
 if(!raw||!Number.isFinite(factor))throw Error('Arma priva di rarita');
 const spec=factor===1?raw.effectSpec:Object.freeze(balanceNativeSpec(raw.effectSpec,factor));
 return Object.freeze({...raw,effectSpec:spec,
  effectProposed:factor===1?raw.effectProposed:description(raw,spec),
  balanceRevision:STRATEGIC_NO_DRAIN_BALANCE.id,
  balancePending:false,weaponValuesNearFinal:true,
  balanceStatus:'NEAR_FINAL_235_WEAPONS_ART_PENDING'});
}
