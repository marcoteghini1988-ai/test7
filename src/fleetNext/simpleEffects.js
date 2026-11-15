// Regole leggibili e dati eseguibili condividono la stessa definizione.
// Questo modulo non interpreta nomi, famiglie o descrizioni delle carte.
import exclusiveData from './catalogExclusive.json' with {type:'json'};
export const EFFECT_TYPES=Object.freeze([
 'power','pierce','multishot','protect','dodge','repair','regenerate','counter',
 'weaken','disarm','cleanse','exchange','recover','charge','terrain'
]);
const PARTS=['engine','weapons','command','generator'];
const LABELS={engine:'i Motori',weapons:'le Armi',command:'la Centralina',generator:'il Generatore'};
const PLAIN_LABELS={engine:'Motori',weapons:'Armi',command:'Centralina',generator:'Generatore'};
export const TERRAIN_EFFECT_TEXT=Object.freeze({
 T01:'Le schivate non funzionano.',
 T02:'Gli attacchi hanno +1 potenza.',
 T03:'I disturbi tolgono 1 potenza in più.',
 T04:'Le scudiere subiscono 1 danno in più.',
 T05:'Gli attacchi hanno −1 potenza.',
 T06:'Gli attacchi non possono ignorare le protezioni.',
 T07:'Il primo colpo riuscito per turno ripara 1 punto al tuo componente più danneggiato.',
 T08:'Le riparazioni non funzionano.',
 T09:'Le riparazioni delle scudiere recuperano 1 punto in più.',
 T10:'Ogni attacco colpisce un componente in più, fino a 4.'
});
export const SIMPLE_RULES=Object.freeze([
 'Un colpo riuscito toglie punti a un componente o a una scudiera. Un colpo bloccato non attiva gli effetti.',
 'La potenza determina i danni alle scudiere e viene ridotta dai disturbi. A potenza zero l’attacco fallisce. Un attacco normale toglie 1 punto a ogni componente raggiunto; i contrattacchi infliggono il valore scritto.',
 'Una protezione blocca un colpo sul bersaglio indicato e si consuma. Solo le scudiere con una capacità di intercettazione possono fermare gli attacchi.',
 'Un turno avversario termina quando inizia il tuo prossimo turno. Un round comprende un turno per giocatore.',
 'Le riparazioni non superano i punti massimi e non ricostruiscono componenti o scudiere distrutti.',
 'I personaggi applicano il proprio effetto quando entrano e al tuo turno successivo. Poi lasciano il campo.',
 'Il Terreno scelto entra prima delle altre carte del turno.',
 'Le reazioni si attivano solo con i danni degli attacchi normali. Costi delle abilità e contrattacchi non attivano altre reazioni.',
 'Dopo 50 round la partita termina in pareggio. Anche due navi con le Armi distrutte pareggiano.'
]);
export const isCharacterCard=card=>card?.kind==='character'||card?.sottotipo==='Personaggio'||/Personaggio/i.test(card?.category||'');
const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
export function validateEffectSpec(spec){
 if(!spec||typeof spec!=='object'||Array.isArray(spec))return 'Effetto mancante';
 if(!EFFECT_TYPES.includes(spec.type))return 'Effetto non supportato: '+spec.type;
 const ranges={power:[1,3],pierce:[1,2],protect:[1,2],dodge:[1,2],repair:[1,2],
  regenerate:[1,1],counter:[1,1],weaken:[1,2],exchange:[1,2],charge:[1,2]};
 if(ranges[spec.type]&&!integer(spec.amount,...ranges[spec.type]))return 'Quantità non valida: '+spec.type;
 if(spec.type==='multishot'&&!integer(spec.targets,2,4))return 'Numero di bersagli non valido';
 if(['protect','dodge'].includes(spec.type)&&!['selected',...PARTS,'escort','all'].includes(spec.target))return 'Bersaglio di protezione non valido';
 if(spec.type==='repair'&&!['selected','weakest',...PARTS,'escort'].includes(spec.target))return 'Bersaglio di riparazione non valido';
 if(['protect','dodge','regenerate'].includes(spec.type)&&!integer(spec.turns,1,2))return 'Durata non valida';
 if(spec.type==='counter'&&spec.turns!==1)return 'Il contrattacco dura un turno avversario';
 if(spec.type==='regenerate'&&!['hit','hurt'].includes(spec.trigger))return 'Evento di rigenerazione non valido';
 if(spec.type==='recover'&&!['attack','defense','support','any'].includes(spec.role))return 'Tipo di recupero non valido';
 if(spec.type==='terrain'&&!Object.hasOwn(TERRAIN_EFFECT_TEXT,spec.code))return 'Terreno non valido';
 return null;
}
const UPGRADE_CAPS=Object.freeze({power:5,pierce:3,protect:3,dodge:3,repair:3,
 regenerate:2,counter:2,weaken:3,exchange:3,charge:4});
const SHIP_CONFIGS=Object.freeze(Object.fromEntries(exclusiveData.shipConfigurations.map(c=>[c.id,c])));
export function effectiveEffectSpec(card,level=1){
 const error=validateEffectSpec(card?.effectSpec);
 if(error)throw new Error((card?.id||'Carta')+': '+error);
 const spec={...card.effectSpec};
 const grade=card.shipId?Math.max(1,Math.min(3,Math.floor(Number(level)||1))):1;
 if(UPGRADE_CAPS[spec.type])spec.amount=Math.min(UPGRADE_CAPS[spec.type],spec.amount+grade-1);
 if(spec.type==='multishot')spec.targets=Math.min(4,spec.targets+grade-1);
 // Le protezioni e le reazioni del personaggio vengono rinnovate una volta.
 if(isCharacterCard(card)&&'turns' in spec)spec.turns=1;
 return spec;
}
export function canUpgradeEffect(card,currentLevel=1){
 const grade=Math.max(1,Math.min(3,Math.floor(Number(currentLevel)||1)));
 if(!card?.shipId||grade>=3)return false;
 const current=effectiveEffectSpec(card,grade),next=effectiveEffectSpec(card,grade+1);
 if(JSON.stringify(current)===JSON.stringify(next))return false;
 if(current.type==='regenerate'||current.type==='repair'&&current.target!=='escort'){
  // I gradi 2/3 richiedono una madre L3/L5: un punto oltre la capacità
  // dei componenti non è un miglioramento acquistabile. I gradi già
  // salvati conservano comunque il loro valore e la loro descrizione.
  const shipLevel=grade===1?3:5,config=SHIP_CONFIGS[card.shipId];
  if(!config)return false;
  const parts=PARTS.filter(id=>shipLevel>=(config.partUnlockLevels[id]||99)).length;
  const capacity=parts<=2?3:parts===3?2:1;
  if(Math.min(current.amount,capacity)===Math.min(next.amount,capacity))return false;
 }
 if(['protect','dodge'].includes(current.type)&&['engine','command','generator','escort'].includes(current.target)){
  // Questi bersagli ricevono al massimo un colpo per turno avversario.
  // Armi, bersaglio scelto e copertura totale possono assorbire anche
  // più contrattacchi nel turno del proprietario e non hanno questo limite.
  const capacity=isCharacterCard(card)?1:current.turns;
  if(Math.min(current.amount,capacity)===Math.min(next.amount,capacity))return false;
 }
 return true;
}
export function effectNeedsOwnTarget(card){return card?.effectSpec?.target==='selected';}
const points=n=>n===1?'1 punto':n+' punti';
const hits=n=>n===1?'1 colpo':n+' colpi';
const turns=n=>n===1?'1 turno avversario':n+' turni avversari';
function protectTarget(target){
 if(target==='selected')return 'il componente scelto';
 if(target==='escort')return 'la scudiera più danneggiata';
 if(target==='all')return 'i tuoi componenti';
 return LABELS[target];
}
function repairTarget(target){
 if(target==='selected')return 'al componente scelto';
 if(target==='weakest')return 'al tuo componente più danneggiato';
 if(target==='escort')return 'alla tua scudiera più danneggiata';
 return {engine:'ai Motori',weapons:'alle Armi',command:'alla Centralina',generator:'al Generatore'}[target];
}
export function describeEffect(card,level=1){
 const s=effectiveEffectSpec(card,level),character=isCharacterCard(card);
 const repeat=character?'Per 2 tuoi turni: ':'';
 const duration=character?'2 turni avversari':turns(s.turns);
 switch(s.type){
  case 'power':return repeat+'Aggiunge '+s.amount+' potenza al tuo attacco.';
  case 'pierce':return repeat+'Il tuo attacco ignora '+s.amount+' '+(s.amount===1?'protezione':'protezioni')+' sui componenti.';
  case 'multishot':return repeat+'Il tuo attacco colpisce fino a '+s.targets+' componenti diversi.';
  case 'protect':return character?'Per 2 turni avversari, blocca '+hits(s.amount)+' per turno contro '+protectTarget(s.target)+'.':
   'Blocca '+hits(s.amount)+' contro '+protectTarget(s.target)+'. Dura '+duration+'.';
  case 'dodge':return (character?'Per 2 turni avversari, evita '+hits(s.amount)+' per turno':'Evita '+hits(s.amount)+' per '+duration)+
   ' contro '+protectTarget(s.target)+', se i Motori funzionano.';
  case 'repair':return 'Ripara '+points(s.amount)+' '+repairTarget(s.target)+(character?', ora e al tuo prossimo turno.':'.');
  case 'regenerate':return (s.trigger==='hit'?'Il primo colpo riuscito per turno':'Il primo danno subito per turno')+
   ' ripara '+points(s.amount)+' al tuo componente più danneggiato. Dura '+duration+'.';
  case 'counter':return 'Al primo danno subito per turno, infligge '+s.amount+' '+(s.amount===1?'danno':'danni')+' alle Armi avversarie. Dura '+duration+'.';
  case 'weaken':return repeat+'Il prossimo attacco avversario ha '+s.amount+' potenza in meno.';
  case 'disarm':return repeat+'Blocca il prossimo attacco avversario. Non può bloccare due turni avversari consecutivi.';
  case 'cleanse':return repeat+'Rimuove i disturbi e i blocchi dalle tue Armi e scudiere.';
  case 'exchange':return repeat+'Scarta '+s.amount+' '+(s.amount===1?'carta casuale':'carte casuali')+' dalla mano e ne pesca altrettante.';
  case 'recover':{
   const label={attack:'Attacco',defense:'Difesa',support:'Supporto o Controllo',any:''}[s.role];
   return repeat+"Rimette in cima al mazzo l’ultima carta "+(label?label+' ':'')+'scartata.';
  }
  case 'charge':return repeat+'Prepara +'+s.amount+' potenza per il tuo attacco del turno successivo.';
  case 'terrain':return TERRAIN_EFFECT_TEXT[s.code]+' Vale per entrambi i giocatori per 3 round.';
  default:throw new Error('Effetto privo di descrizione: '+s.type);
 }
}
export function describeEscortEffect(escort){
 const s=escort?.skill;
 if(!s)return 'Scudiera non disponibile.';
 const every=s.interval===1?'Ogni tuo turno':'Ogni '+s.interval+' tuoi turni';
 const part=PLAIN_LABELS[s.targetPart]||'componente';
 const descriptions={
  cover:'Intercetta gli attacchi diretti alla nave madre.',
  bulwark:'Intercetta gli attacchi diretti alla nave madre.',
  partCover:'Intercetta gli attacchi che colpiscono '+part+'.',
  phase:'Intercetta un attacco ogni '+s.interval+' turni avversari.',
  guard:every+', riduce di 1 la potenza nel prossimo turno avversario.',
  jam:every+', toglie 1 potenza al prossimo attacco avversario.',
  ion:every+', aggiunge 1 potenza al tuo attacco.',
  draw:every+', scarta una carta casuale e ne pesca una.',
  repair:every+', ripara 1 punto al tuo componente più danneggiato.',
  mend:every+', ripara 1 punto alla tua scudiera più danneggiata.',
  focus:every+', aggiunge 1 potenza se attacchi '+part+'.',
  siege:every+', aggiunge 1 potenza se attacchi '+part+'.',
  pierce:every+', ignora 1 protezione se attacchi '+part+'.',
  precision:every+', ignora 1 protezione sui componenti.',
  strike:every+', aggiunge 1 potenza al tuo attacco.',
  revenge:every+', aggiunge 1 potenza se una tua scudiera è danneggiata.',
  surge:every+', aggiunge 1 potenza se un tuo componente è danneggiato.',
  corrode:every+', aggiunge 1 potenza al tuo attacco.'
 };
 return (descriptions[s.action]||'Nessuna capacità attiva.')+' Richiede '+
  (s.requires||[]).map(id=>PLAIN_LABELS[id]).join(' e ')+'.';
}
export function describeBossPassive(id){
 return ({
  1:'Dopo il suo primo turno, nel tuo turno successivo il tuo attacco ha −1 potenza.',
  2:'Se il suo attacco precedente ha inflitto danni, attacca con +1 potenza.',
  3:'Se il suo attacco precedente ha inflitto danni, il tuo prossimo attacco ha −1 potenza.',
  6:'Quando gioca almeno 2 carte, nel tuo turno successivo il tuo attacco ha −1 potenza.',
  7:'Se la tua flotta ha un Disturbo attivo, il suo attacco ha +1 potenza.',
  8:'Il suo attacco ha +1 potenza se un tuo componente è danneggiato.',
  9:'Se una sua scudiera ha almeno 2 punti, ne consuma 1 e guadagna +1 potenza.',
  11:'Con il Generatore attivo, ogni suo turno ripara 1 punto al proprio componente più danneggiato.',
  14:'Ogni 3 suoi turni, il suo attacco ha +2 potenza.',
  17:'Se hai almeno 4 carte negli scarti, il suo attacco ha +1 potenza.',
  19:'Segue un ciclo di 3 turni: potenza normale, +2 potenza, poi −1 potenza.',
  20:'Ogni 2 suoi turni, nel tuo turno successivo il tuo attacco ha −1 potenza.'
 })[Number(id)]||'Nessuna abilità passiva.';
}
