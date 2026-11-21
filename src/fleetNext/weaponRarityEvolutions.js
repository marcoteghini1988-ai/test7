// Evoluzioni delle Carte Arma: stessa identita', stessa meccanica, rarita' crescente.
// Valori provvisori: bilanciamento proporzionato alla crescita degli HP delle navi.
// Non genera immagini, non modifica le armi originali e non allunga i turni.
// Trifase I/II/III sono tre carte in SEQUENZA di combattimento, ognuna con
// una sua evoluzione di rarita': i due concetti sono intenzionalmente distinti.
import {APPROVED_BASE_WEAPONS} from './approvedBaseWeapons.js';
import {CONFIRMED_WEAPON_CARDS} from './confirmedWeaponCards.js';
import {MULTI_WEAPON_CARDS} from './multiWeaponCards.js';
import {DESIGNED_WEAPON_CARDS} from './designedWeaponCards.js';
import {CONFIRMED_TRANSFER_WEAPONS} from './confirmedTransferredWeapons.js';
import {DISCARD_WEAPONS} from './discardWeapon.js';
import {TEMP_SUPPORT_WEAPONS} from './temporarySupportWeapons.js';
import {SHIP_RARITIES} from './shipRarity.js';
import {MOTHER_RARITY_SCALING} from './motherBalance.js';
import {FLEET_ELEMENTS} from './elementalAffinities.js';

// Per mantenere una simile durata negli scontri alla pari, la potenza nominale
// segue gli HP delle navi, NON il tempo del timer. Non e' un moltiplicatore
// automatico alla partita: crea valori distinti sulle singole carte.
const HP_SCALE=Object.freeze(Object.fromEntries(SHIP_RARITIES.map((r,i)=>
 [r,MOTHER_RARITY_SCALING[i].hp])));
const COPIES=Object.freeze({Comune:5,Rara:4,Epica:3,Leggendaria:2});
const SUFFIX=Object.freeze({Rara:'r',Epica:'e',Leggendaria:'l'});
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
export const WEAPON_BASE_CARDS=Object.freeze([
 ...APPROVED_BASE_WEAPONS,...CONFIRMED_WEAPON_CARDS,...MULTI_WEAPON_CARDS,
 ...DESIGNED_WEAPON_CARDS,...CONFIRMED_TRANSFER_WEAPONS,
 ...DISCARD_WEAPONS,...TEMP_SUPPORT_WEAPONS
]);
function evolveOne(base,rarita,previousId){
 const index=SHIP_RARITIES.indexOf(base.rarita),next=SHIP_RARITIES.indexOf(rarita);
 if(index<0||next<=index)throw Error('Evoluzione arma non valida '+base.id);
 const factor=HP_SCALE[rarita]/HP_SCALE[base.rarita];
 const spec=Object.freeze(scaleObject(base.effectSpec,factor));
 const id=base.id+'-rarity-'+SUFFIX[rarita];
 const maxCopies=base.maxCopiesPerDeck===1?1:COPIES[rarita];
 return Object.freeze({...base,id,name:base.name,nome:base.name,rarita,
  rarity:rarita,weaponFamilyId:base.id,originRarity:base.rarita,
  evolutionOf:previousId,evolutionStage:next-index,isWeaponEvolution:true,
  playable:true,nativeFace:true,acquisitionPending:false,balancePending:true,
  maxCopiesPerDeck:maxCopies,effectSpec:spec,
  effectProposed:description(base,spec),
  visualBrief:(base.visualBrief||'Arma '+base.name)+
   ' Evoluzione '+rarita+': armamento piu potente, stessa funzione e stesso elemento.'
 });
}
export const EVOLVED_WEAPON_CARDS=Object.freeze(WEAPON_BASE_CARDS.flatMap(base=>{
 const start=SHIP_RARITIES.indexOf(base.rarita);
 if(start<0)throw Error('Rarita di origine non valida: '+base.id);
 let previousId=base.id;
 return SHIP_RARITIES.slice(start+1).map(r=>{
  const evolved=evolveOne(base,r,previousId);previousId=evolved.id;return evolved;
 });
}));
export const ALL_WEAPON_CARDS=Object.freeze([...WEAPON_BASE_CARDS,...EVOLVED_WEAPON_CARDS]);
export const ALL_WEAPON_BY_ID=Object.freeze(Object.fromEntries(ALL_WEAPON_CARDS.map(c=>[c.id,c])));
export const WEAPON_EVOLUTION_FAMILIES=Object.freeze(Object.fromEntries(
 WEAPON_BASE_CARDS.map(base=>[base.id,Object.freeze([
  base,...EVOLVED_WEAPON_CARDS.filter(c=>c.weaponFamilyId===base.id)
 ])])
));
export const weaponFamily=id=>{
 const c=ALL_WEAPON_BY_ID[id];return c?WEAPON_EVOLUTION_FAMILIES[c.weaponFamilyId||c.id]:null;
};
export const weaponAtRarity=(id,rarita)=>weaponFamily(id)?.find(c=>c.rarita===rarita)||null;
export const weaponNextEvolution=id=>{
 const f=weaponFamily(id),c=ALL_WEAPON_BY_ID[id];if(!f||!c)return null;
 const next=SHIP_RARITIES[SHIP_RARITIES.indexOf(c.rarita)+1];
 return next?f.find(w=>w.rarita===next)||null:null;
};
if(WEAPON_BASE_CARDS.length!==73||EVOLVED_WEAPON_CARDS.length!==162||
 ALL_WEAPON_CARDS.length!==235||Object.keys(ALL_WEAPON_BY_ID).length!==235||
 Object.keys(WEAPON_EVOLUTION_FAMILIES).length!==73||
 WEAPON_BASE_CARDS.some(c=>!weaponAtRarity(c.id,'Leggendaria')))
 throw Error('Progressione delle 73 famiglie di Armi non completa');
