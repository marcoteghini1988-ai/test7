// Eclissi Stellare — punto 42: arena base neutra, ambienti planetari progressivi,
// un'arena esclusiva per ciascuno dei 12 boss. Gli sfondi comprati restano estetici.
// Gli effetti valgono per entrambi i lati e richiedono un'azione reale già valida.
import {PHASE16A_CAMPAIGN_PLANETS} from './newCombat/phase16ACatalog.js';

const EFFECT_FAMILIES=Object.freeze(['debris','plasma','ionic','resonance']);
const effectValues=(types=[],bossStep=null,bossVariant=0)=>{
 // Arene boss con stessa coppia di famiglie non devono avere gli stessi valori.
 // Lo scarto minimo conserva i valori del primo gruppo e cresce moderatamente.
 const effects={};
 for(const type of types){
  if(type==='debris')effects.shieldDamageFactor=bossStep==null?.92:.91-bossStep*.01-bossVariant*.004;
  if(type==='plasma')effects.tripleAttackFactor=bossStep==null?1.06:1.06+bossStep*.01+bossVariant*.004;
  if(type==='ionic')effects.ionDurationFactor=bossStep==null?.75:.74-bossStep*.05-bossVariant*.02;
  if(type==='resonance')effects.syncPerCalculation=1;
 }
 return effects;
};
const percent=change=>String(Math.round(change*1000)/10).replace('.',',');
const effectDescription=effects=>{
 const result=[];
 if(effects.shieldDamageFactor)result.push('danni allo scudo madre −'+percent(1-effects.shieldDamageFactor)+'%');
 if(effects.tripleAttackFactor)result.push('scarica valida con tre numeriche +'+percent(effects.tripleAttackFactor-1)+'%');
 if(effects.ionDurationFactor)result.push('durata ionizzazione da speciale −'+percent(1-effects.ionDurationFactor)+'%');
 if(effects.syncPerCalculation)result.push('+'+effects.syncPerCalculation+' Sincronia per calcolo valido');
 return result.length?result.join('; '):'Nessun modificatore';
};
function makeArena(id,name,shortLabel,effects={},kind='regular'){
 const rules=Object.freeze({...effects});
 return Object.freeze({id,name,shortLabel,description:effectDescription(rules),effects:rules,effectCount:Object.keys(rules).length,kind});
}
const base=[
 makeArena('titanium','Piattaforma di Titanio','TITANIO',{},'neutral'),
 makeArena('debris','Cintura dei Detriti','DETRITI',effectValues(['debris'])),
 makeArena('plasma','Corridoio di Plasma','PLASMA',effectValues(['plasma'])),
 makeArena('ionic','Nebulosa Ionica','IONICA',effectValues(['ionic'])),
 makeArena('resonance','Camera di Risonanza','RISONANZA',effectValues(['resonance']))
];
const bossNames=[
 'Bastione della Terra','Forgia di Marte','Corona di Venere','Anelli di Saturno',
 'Tempesta di Urano','Abisso di Nettuno','Ombra di Plutone','Ghiacci di Europa',
 'Orizzonte di Proxima b','Frattura di Haumea','Cuore di Io','Cripta di Encelado'
];
const planets=PHASE16A_CAMPAIGN_PLANETS.flatMap((planet,index)=>{
 const primary=EFFECT_FAMILIES[index%4];
 const ordinarySecond=EFFECT_FAMILIES[(index+1)%4];
 const bossSecond=EFFECT_FAMILIES[(index+2)%4];
 return [
  makeArena('planet_'+planet.id+'_advanced','Settore avanzato di '+planet.name,'AVANZATA',
   effectValues([primary,ordinarySecond]),'advanced'),
  makeArena('boss_'+planet.id,bossNames[index]||'Arena del boss di '+planet.name,'BOSS '+(index+1),
   effectValues([primary,bossSecond],index%3,Math.floor(index/3)),'boss')
 ];
});
export const BATTLE_ARENAS=Object.freeze(Object.fromEntries([...base,...planets].map(arena=>[arena.id,arena])));
export const BATTLE_ARENA_IDS=Object.freeze(Object.keys(BATTLE_ARENAS));
export function battleArena(id){return BATTLE_ARENAS[id]||BATTLE_ARENAS.titanium;}

// Adventure usa gli ID pianeta storici: (id-1)*10 + livello.
// Campaign usa la sequenza consecutiva 1..120. Il contesto esplicito prevale
// quando la schermata dell'avventura conosce già pianeta e settore.
export function arenaForBattle(level=1,mode='campaign',overrideId=null,context={}){
 if(typeof overrideId==='string'&&Object.hasOwn(BATTLE_ARENAS,overrideId))return battleArena(overrideId);
 if(!['campaign','adventure'].includes(mode))return battleArena('titanium');
 const n=Math.floor(Number(level));
 if(!Number.isFinite(n)||n<1)return battleArena('titanium');
 const explicitPlanet=PHASE16A_CAMPAIGN_PLANETS.findIndex(p=>p.id===Number(context?.planetId));
 const planetIndex=explicitPlanet>=0?explicitPlanet:
  mode==='adventure'?PHASE16A_CAMPAIGN_PLANETS.findIndex(p=>p.id===Math.floor((n-1)/10)+1):
  Math.floor((n-1)/10);
 if(planetIndex<0||planetIndex>=PHASE16A_CAMPAIGN_PLANETS.length)return battleArena('titanium');
 const explicitSector=Number(context?.sectorLevel);
 const localSector=Number.isInteger(explicitSector)&&explicitSector>=1&&explicitSector<=10?
  explicitSector:((n-1)%10)+1;
 if(localSector<=2)return battleArena('titanium');
 if(localSector<=6)return battleArena(EFFECT_FAMILIES[planetIndex%4]);
 const id=PHASE16A_CAMPAIGN_PLANETS[planetIndex].id;
 if(localSector<=9)return battleArena('planet_'+id+'_advanced');
 return battleArena('boss_'+id);
}
const mother=side=>side?.fleet?.[0]?.defense?.kind==='mother'?side.fleet[0].defense:null;
// Le numeriche devono essere state consumate e l'attacco validato nel motore.
export function arenaAttackFactor(arenaId,context={}){
 const factor=battleArena(arenaId).effects.tripleAttackFactor;
 if(!factor||context.legalAttack!==true||!Array.isArray(context.cards)||
  context.cards.length!==3||
  context.cards.some(c=>!c||!Number.isInteger(c.value)||c.value<1||c.value>13))return 1;
 return factor;
}
// Solo scudo madre, dopo l'intercettazione. Non modifica scudiere o firme vitali.
export function arenaMotherDefenseFactor(arenaId,defender,context={}){
 const factor=battleArena(arenaId).effects.shieldDamageFactor;
 if(!factor||context.vitalId!=null||context.escortIndex!=null||
  !(mother(defender)?.shield?.hp>0))return 1;
 return factor;
}
export function applyArenaIonResistance(side,arenaId,applied=[],nowMs=0){
 const factor=battleArena(arenaId).effects.ionDurationFactor;
 if(!factor||!Array.isArray(applied)||!applied.includes('shot-ion'))return side;
 const until=side?.strategicStatuses?.ionizedUntil;
 if(!(Number.isFinite(until)&&until>nowMs))return side;
 // Solo una ionizzazione realmente applicata dalla speciale.
 return {...side,strategicStatuses:{...side.strategicStatuses,
  ionizedUntil:nowMs+Math.ceil((until-nowMs)*factor)}};
}
export function applyArenaCalculationSync(side,arenaId,credited=0){
 const bonus=battleArena(arenaId).effects.syncPerCalculation||0;
 if(!bonus||!(Number(credited)>0)||!side?.maneuvers)return side;
 const current=Math.max(0,Math.min(100,Number(side.maneuvers.sync)||0));
 if(current>=100)return side;
 return {...side,maneuvers:{...side.maneuvers,sync:Math.min(100,current+bonus)}};
}

/**
 * Punto 43 — lettura tattica delle condizioni ambientali realmente attive.
 * Non introduce bonus, danni o eventi aggiuntivi: espone i requisiti degli
 * effetti già risolti da questo motore, simmetrici per giocatore e IA.
 * Lo stato contestuale è solo informativo e non modifica il combattimento.
 */
export function arenaTacticalBriefing(arenaId,context={}){
 const arena=battleArena(arenaId),effects=arena.effects,conditions=[];
 const add=(id,label,activation,strategy,status='')=>conditions.push(
  Object.freeze({id,label,activation,strategy,status})
 );
 if(effects.shieldDamageFactor){
  const reduction=percent(1-effects.shieldDamageFactor);
  const hp=context?.enemy?.fleet?.[0]?.defense?.shield?.hp;
  add('debris','Detriti e copertura',
   'Lo scudo della nave madre riceve '+reduction+'% di danni in meno quando intercetta un impatto reale.',
   'Prima di puntare ai vitali, indebolisci lo scudo; la riduzione non protegge direttamente scudiere o vitali.',
   Number.isFinite(hp)?hp>0?'Scudo madre avversario attivo.':'Scudo madre avversario esaurito.':'');
 }
 if(effects.tripleAttackFactor){
  const increase=percent(effects.tripleAttackFactor-1);
  const count=context?.selectedCount;
  add('plasma','Plasma e raffiche',
   'Un attacco valido che consuma esattamente tre numeriche ottiene +'+increase+'% di danni.',
   'Valuta la combinazione di tre carte quando il risultato è valido; non rinunciare a un attacco certo con due carte solo per cercare il bonus.',
   count===3?'Tre carte selezionate: il bonus richiede comunque un calcolo valido.':
   Number.isInteger(count)?'Carte numeriche selezionate: '+count+' su 3 per la scarica potenziata.':'');
 }
 if(effects.ionDurationFactor){
  const reduction=percent(1-effects.ionDurationFactor);
  add('ionic','Disturbo ionico',
   'Le ionizzazioni già applicate da una carta speciale reale durano il '+reduction+'% in meno.',
   'Non basare la difesa su un blocco ionico prolungato; conserva alternative di attacco e copertura.');
 }
 if(effects.syncPerCalculation){
  const gain=effects.syncPerCalculation;
  const sync=context?.player?.maneuvers?.sync;
  add('resonance','Risonanza di Sincronia',
   'Ogni calcolo valido accreditato aggiunge '+gain+' Sincronia, fino al massimo di 100.',
   'Sfrutta calcoli affidabili per preparare le manovre; la risonanza non attiva da sola carte fusione.',
   Number.isFinite(sync)?'Sincronia attuale: '+Math.max(0,Math.min(100,sync))+'/100.':'');
 }
 return Object.freeze({
  id:arena.id,name:arena.name,kind:arena.kind,effectCount:arena.effectCount,
  neutral:conditions.length===0,
  introduction:conditions.length===0?
   'Arena base neutra: nessun bonus o penalità ambientale. Conta soltanto il combattimento.':
   (arena.kind==='boss'?'Arena esclusiva del boss. ':'')+
    'Le condizioni si applicano a entrambe le flotte soltanto quando si verifica l’evento richiesto.',
  conditions:Object.freeze(conditions)
 });
}
