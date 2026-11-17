// Regole leggibili e dati eseguibili condividono la stessa definizione.
// Questo modulo non interpreta nomi, famiglie o descrizioni delle carte.
import {getShipProgression} from './progression.js';
import {AURORA_ACTIONS} from './auroraEngine.js';
import {LINCE_ACTIONS} from './linceEngine.js';
import {PRISMA_ACTIONS} from './prismaEngine.js';
import {CORVO_ACTIONS} from './corvoEngine.js';
import {FALCO_ACTIONS} from './falcoEngine.js';
import {MANTA_ACTIONS} from './mantaEngine.js';
import {SHARK_ACTIONS} from './sharkEngine.js';
import {NEBULA_ACTIONS} from './nebulaEngine.js';
import {STORM_ACTIONS} from './stormEngine.js';
import {ROYAL_ACTIONS} from './royalEngine.js';
import {OBSIDIAN_ACTIONS} from './obsidianEngine.js';
import {ARK_ACTIONS} from './arkEngine.js';
// Revisione dei testi dei fronti approvati; la progressione ha dati separati.
export const SIMPLE_RULES_REVISION='simple-effects-v2-traps';
export const EFFECT_TYPES=Object.freeze([
 'power','pierce','multishot','protect','dodge','repair','regenerate','counter',
 'weaken','disarm','cleanse','exchange','recover','charge','terrain','trap',
 'bypass','deployMachine','fusion','blueprint','systemModifier','fieldReset','dismantle','aurora','lince','prisma','corvo','falco','manta','shark','nebula','storm','royal','obsidian','ark'
]);
const PARTS=['engine','weapons','command','generator','bridge'];
const LABELS={engine:'i Motori',weapons:'le Armi',command:'la Centralina',generator:'il Generatore',bridge:'la Plancia'};
const PLAIN_LABELS={engine:'Generatore',weapons:'Arsenale',command:'Centralina',generator:'Generatore',bridge:'Plancia'};
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
 'Un colpo riuscito riduce gli HP della nave madre o di una navicella di supporto. Un colpo bloccato non attiva gli effetti.',
 'La potenza determina il danno alle navicelle; i sabotaggi e le protezioni possono modificarlo. A potenza zero l’attacco fallisce. Si vince portando a zero gli HP della nave madre.',
 'Le navicelle di supporto operative proteggono la madre. Le due Armi temporanee aumentano l’attacco ma non sono bersagliabili né intercettano colpi.',
 'Attacco diretto può aggirare le navicelle di supporto per un attacco alla barra HP della madre. Difese e Trappole continuano a funzionare.',
 'Un turno avversario termina quando inizia il tuo prossimo turno. Un round comprende un turno per giocatore.',
 'Le riparazioni non superano gli HP massimi e non ricostruiscono navicelle di supporto distrutte.',
 'I personaggi applicano il proprio effetto quando entrano e al tuo turno successivo. Poi lasciano il campo.',
 'Il Terreno scelto si risolve prima delle altre carte del turno. Se viene annullato, non entra in campo.',
 'Le reazioni si attivano solo con i danni degli attacchi normali. Costi delle abilità e contrattacchi non attivano altre reazioni.',
 'Dopo 50 round la partita termina in pareggio. Con l’Arsenale distrutto resta un tiro di emergenza da 1 potenza.',
 'Le Trappole sono carte Difesa: si preparano coperte nel proprio turno e si rivelano solo quando scattano. Altrimenti restano in campo.',
 'Puoi giocare fino a 3 carte per turno. Hai 3 slot Attacco, 1 Difesa scoperta, 1 Trappola coperta, 1 Personaggio e 2 alloggiamenti per Armi temporanee.',
 'Una Trappola contro i Terreni annulla il prossimo Terreno avversario prima che si attivi. Il Terreno precedente resta; entrambe le carte usate vanno negli scarti.',
 'Se hai più Trappole con lo stesso annullamento, ne scatta una sola. Le altre restano coperte.',
 'Dopo un Terreno annullato, le altre carte scelte che il Terreno rimasto impedisce tornano in mano.',
 'Aurora ha Arsenale e Generatore, senza supporti. La Plancia separa il Personaggio dal Generatore; la Centralina abilita i supporti. I Motori delle carte precedenti fanno parte del Generatore.',
 'I componenti interni non sono più bersagli distruttibili: carte Sabotaggio e Amplificazione ne modificano temporaneamente sincronizzazione, Armi, energia e comandi tattici.',
 'Smontaggio Forzato è una carta Attacco: rimuove temporaneamente componenti o potenziamenti della nave nemica senza cambiare gli HP. Alla scadenza ripristina esattamente lo stato precedente.',
 'Fusione unisce due supporti operativi. La prima può far entrare la terza unità sbloccata; la seconda unisce terza e quarta. Rimangono al massimo due supporti attivi.',
 'La fusione conserva i danni in proporzione, consuma i supporti usati e non ricostruisce navicelle distrutte. Gli alloggiamenti Arma sono separati dai supporti.'
]);
export const isCharacterCard=card=>card?.kind==='character'||card?.sottotipo==='Personaggio'||/Personaggio/i.test(card?.category||'');
export const isTrapCard=card=>card?.effectSpec?.type==='trap'||
 card?.effectSpec?.type==='lince'&&card.effectSpec.action==='false-trail'||
 card?.effectSpec?.type==='prisma'&&card.effectSpec.action==='false-reflection'||
 card?.effectSpec?.type==='corvo'&&card.effectSpec.action==='return-echo'||
 card?.effectSpec?.type==='manta'&&card.effectSpec.action==='ion-ground'||
 card?.effectSpec?.type==='shark'&&card.effectSpec.action==='returning-teeth'||
 card?.effectSpec?.type==='nebula'&&card.effectSpec.action==='false-target'||
 card?.effectSpec?.type==='storm'&&card.effectSpec.action==='lightning-net'||
 card?.effectSpec?.type==='royal'&&card.effectSpec.action==='interdiction-decree'||
 card?.effectSpec?.type==='obsidian'&&card.effectSpec.action==='position-chains'||
 card?.effectSpec?.type==='ark'&&card.effectSpec.action==='protected-entry';
const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
export function validateEffectSpec(spec){
 if(!spec||typeof spec!=='object'||Array.isArray(spec))return 'Effetto mancante';
 if(!EFFECT_TYPES.includes(spec.type))return 'Effetto non supportato: '+spec.type;
 if(spec.type==='systemModifier'&&(!['command','weapons','generator','bridge'].includes(spec.system)||!['disable','amplify'].includes(spec.operation)||!integer(spec.tier,1,4)||!integer(spec.turns,1,3)))return 'Effetto sistemi non valido';
 if(spec.type==='dismantle'&&(!integer(spec.turns,1,2)||
   ![1,2,99].includes(spec.count)||!['components','base'].includes(spec.mode)||
   (spec.mode==='base')!==(spec.count===99)))return 'Smontaggio non valido';
 if(spec.type==='fieldReset'&&(spec.scope!=='both'||spec.discardFieldCards!==true))return 'Reset campo non valido';
 if(spec.type==='blueprint'&&!/^nx-[a-z0-9]+-[0-9]{2}$/.test(spec.code||''))return 'Codice di scheda esclusiva non valido';
 if(spec.type==='aurora'&&!Object.values(AURORA_ACTIONS).includes(spec.action))return 'Azione Aurora non valida';
 if(spec.type==='lince'&&!Object.values(LINCE_ACTIONS).includes(spec.action))return 'Azione Lince non valida';
 if(spec.type==='prisma'&&!Object.values(PRISMA_ACTIONS).includes(spec.action))return 'Azione Vespa non valida';
 if(spec.type==='corvo'&&!Object.values(CORVO_ACTIONS).includes(spec.action))return 'Azione Corvo non valida';
 if(spec.type==='falco'&&!Object.values(FALCO_ACTIONS).includes(spec.action))return 'Azione Falco non valida';
 if(spec.type==='manta'&&!Object.values(MANTA_ACTIONS).includes(spec.action))return 'Azione Manta non valida';
 if(spec.type==='shark'&&!Object.values(SHARK_ACTIONS).includes(spec.action))return 'Azione Squalo non valida';
 if(spec.type==='nebula'&&!Object.values(NEBULA_ACTIONS).includes(spec.action))return 'Azione Nebulosa non valida';
 if(spec.type==='storm'&&!Object.values(STORM_ACTIONS).includes(spec.action))return 'Azione Tempesta non valida';
 if(spec.type==='royal'&&!Object.values(ROYAL_ACTIONS).includes(spec.action))return 'Azione Eclisse Reale non valida';
 if(spec.type==='obsidian'&&!Object.values(OBSIDIAN_ACTIONS).includes(spec.action))return 'Azione Titano Ossidiana non valida';
 if(spec.type==='ark'&&!Object.values(ARK_ACTIONS).includes(spec.action))return 'Azione Arca Astrale non valida';
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
 if(spec.type==='trap'&&(spec.trigger!=='terrain'||spec.action!=='cancel'))return 'Trappola non supportata';
 if(spec.type==='deployMachine'&&(!integer(spec.hp,1,12)||!integer(spec.power,0,3)))return 'Macchina d’assalto non valida';
 return null;
}
const UPGRADE_CAPS=Object.freeze({power:5,pierce:3,protect:3,dodge:3,repair:3,
 regenerate:2,counter:2,weaken:3,exchange:3,charge:4});
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
  const shipLevel=grade===1?3:5,profile=getShipProgression(card.shipId,shipLevel);
  if(!profile)return false;
  const target=current.target==='engine'?'generator':current.target;
  const maxima=target&&profile.integrityByPart[target]?[profile.integrityByPart[target]]:
   Object.values(profile.integrityByPart);
  const capacity=Math.max(...maxima)-1;
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
export function effectNeedsOwnTarget(card){return card?.effectSpec?.target==='selected'||
 (card?.effectSpec?.type==='aurora'&&['modular-armor','sacrificial-veil'].includes(card.effectSpec.action)||
  card?.effectSpec?.type==='lince'&&card.effectSpec.action==='false-trail');}
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
 return {engine:'ai Motori',weapons:'alle Armi',command:'alla Centralina',generator:'al Generatore',bridge:'alla Plancia'}[target];
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
  case 'trap':return 'Trappola coperta. Annulla il prossimo Terreno giocato dall’avversario.';
  case 'bypass':return 'Permette di superare supporti e macchine per colpire un solo componente della madre. Difese e Trappole restano valide.';
  case 'deployMachine':return 'Arma temporanea: aumenta di 1 la potenza del tuo attacco per '+(card.id==='prog-machine-guard'?'2 tuoi turni':'1 tuo turno')+'. Non protegge la madre e non è bersagliabile.';
  case 'prisma':return card.effectProposed;
  case 'lince':return card.effectProposed;
  case 'corvo':return card.effectProposed;
  case 'falco':return card.effectProposed;
case 'manta':return card.effectProposed;
case 'shark':return card.effectProposed;
case 'nebula':return card.effectProposed;
case 'storm':return card.effectProposed;
case 'royal':return card.effectProposed;
case 'obsidian':return card.effectProposed;
case 'ark':return card.effectProposed;
  case 'aurora':return card.effectProposed;
  case 'blueprint':return card.effectProposed;
  case 'systemModifier':case 'fieldReset':case 'dismantle':return card.effectProposed;
  case 'fusion':return 'Fonde due supporti operativi. Richiama la riserva sbloccata; la seconda fusione unisce terzo e quarto supporto. Massimo due unità in campo.';
  default:throw new Error('Effetto privo di descrizione: '+s.type);
 }
}
export function describeEscortEffect(escort){
 const skill=escort?.skill;
 if(!skill)return 'Supporto non disponibile.';
 const amount=Math.max(1,escort.grade||1);
 const describe=s=>{
  const every=s.interval===1?'Ogni tuo turno':'Ogni '+s.interval+' tuoi turni';
  const part=PLAIN_LABELS[s.targetPart]||'componente';
  const effects={
   cover:'',bulwark:'',partCover:'',phase:'',
   guard:every+', riduce di '+amount+' la potenza nel prossimo turno avversario.',
   jam:every+', toglie '+amount+' potenza al prossimo attacco avversario.',
   ion:every+', aggiunge '+amount+' potenza al tuo attacco.',
   draw:every+', ricambia '+amount+' carte casuali.',
   repair:every+', ripara '+points(amount)+' al tuo componente più danneggiato.',
   mend:every+', ripara '+points(amount)+' al tuo supporto più danneggiato.',
   focus:every+', aggiunge '+amount+' potenza se attacchi '+part+'.',
   siege:every+', aggiunge '+amount+' potenza se attacchi '+part+'.',
   pierce:every+', ignora '+amount+' protezioni se attacchi '+part+'.',
   precision:every+', ignora '+amount+' protezioni sui componenti.',
   strike:every+', aggiunge '+amount+' potenza al tuo attacco.',
   revenge:every+', aggiunge '+amount+' potenza se un tuo supporto è danneggiato.',
   surge:every+', aggiunge '+amount+' potenza se un tuo componente è danneggiato.',
   corrode:every+', aggiunge '+amount+' potenza al tuo attacco.'
  };
  return effects[s.action]||'';
 };
 const effects=(escort.fusionSkills||[skill]).map(describe).filter(Boolean).join(' ');
 return 'Protegge la madre finché è operativo. '+(effects?effects+' ':'')+'Richiede '+
  (skill.requires||[]).map(id=>PLAIN_LABELS[id]).join(' e ')+'.';
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
