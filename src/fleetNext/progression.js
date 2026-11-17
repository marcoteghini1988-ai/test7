// Progressione della campagna: dodici madri, cinque livelli ciascuna.
// Le cinque varianti del catalogo restano utilizzabili con la loro identità.
// Gli slot carte non dipendono dal livello. Le riserve entrano solo con Fusione.
export const CAMPAIGN_SHIP_ORDER = Object.freeze([
 'N00','C01','C02','C03','R01','R02','R04','E01','E02','L01','L03','L04'
]);

const vital = (weapons,generator,bridge,command) => Object.freeze({
 weapons,generator,...(bridge?{bridge}:{}),...(command?{command}:{})
});
const step = (attackPower,defensePower,integrityByPart,escortGrades=[],reserveGrades=[],fusionLimit=0,...unlocks) => Object.freeze({
 attackPower,defensePower,integrityByPart,
 vitalIds:Object.freeze(Object.keys(integrityByPart)),
 escortCount:escortGrades.length,escortGrades:Object.freeze(escortGrades),
 reserveCount:reserveGrades.length,reserveGrades:Object.freeze(reserveGrades),
 fusionLimit,unlocks:Object.freeze(unlocks)
});
const profile = (name,role,description,levels,variantOf=null) => Object.freeze({
 name,role,description,variantOf,levels:Object.freeze(levels)
});

const PROFILES = Object.freeze({
 N00:profile('Aurora-0','Versatile',
  'Due vitali e nessun supporto evolutivo. Cresce nelle armi e nelle protezioni della madre.',[
  step(2,0,vital(4,3),[],[],0,'Arsenale e Generatore; tutti gli slot carte disponibili.'),
  step(3,0,vital(4,3),[],[],0,'Arsenale potenziato: +1 potenza di attacco.'),
  step(3,0,vital(4,4),[],[],0,'Generatore rinforzato: +1 integrità. Velo di Salvataggio disponibile.'),
  step(3,1,vital(4,4),[],[],0,'Corazza della madre: riduce di 1 la potenza degli attacchi nemici.'),
  step(3,1,vital(5,4),[],[],0,'Arsenale rinforzato: +1 integrità. Sequenza Zero disponibile.')
 ]),
 C01:profile('Lince Solare','Assalto leggero',
  'Più potenza e meno resistenza di Aurora. La Plancia rende indipendente il Personaggio; nessun supporto evolutivo.',[
  step(3,0,vital(3,3),[],[],0,'Arsenale rapido e due vitali; nessun supporto evolutivo.'),
  step(4,0,vital(3,3),[],[],0,'Sovralimentazione solare: +1 potenza di attacco.'),
  step(4,0,vital(3,3,2),[],[],0,'Plancia di comando: il Personaggio ha un proprio componente vitale.'),
  step(4,0,vital(4,3,2),[],[],0,'Arsenale rinforzato: +1 integrità.'),
  step(4,1,vital(4,3,2),[],[],0,'Corazza leggera: riduce di 1 la potenza nemica.')
 ]),
 C02:profile('Vespa di Vetro','Flotta prismatica',
  'Introduce la Centralina e le prime due navicelle di supporto, mantenendo una madre fragile.',[
  step(2,0,vital(3,3,2),[],[],0,'Tre vitali: Arsenale, Generatore e Plancia.'),
  step(3,0,vital(3,3,2),[],[],0,'Arma prismatica: +1 potenza di attacco.'),
  step(3,0,vital(3,3,2,2),[1],[],0,'Prima navicella di supporto di grado 1 e Centralina di flotta.'),
  step(3,1,vital(3,3,2,2),[1],[],0,'Schermatura prismatica: riduce di 1 la potenza nemica.'),
  step(3,1,vital(3,3,2,2),[1,1],[],0,'Seconda navicella di supporto di grado 1.')
 ]),
 C03:profile('Corvo a Impulsi','Disturbo',
  'Parte con due supporti. Migliora prima il disturbo della prima unità, poi la seconda.',[
  step(2,0,vital(3,3,2,2),[1,1],[],0,'Due navicelle di supporto di grado 1 già in campo.'),
  step(3,0,vital(3,3,2,2),[1,1],[],0,'Scarica a impulsi: +1 potenza di attacco.'),
  step(3,0,vital(3,3,2,2),[2,1],[],0,'Il primo supporto raggiunge il grado 2.'),
  step(3,1,vital(3,3,2,2),[2,1],[],0,'Schermatura elettronica: riduce di 1 la potenza nemica.'),
  step(3,1,vital(3,3,2,2),[2,2],[],0,'Il secondo supporto raggiunge il grado 2.')
 ]),
 R01:profile('Falco Binario','Pressione offensiva',
  'Armi potenti e Generatore vulnerabile. I supporti sostengono la pressione sui bersagli scelti.',[
  step(4,0,vital(3,2,2,2),[1,1],[],0,'Flotta offensiva con due supporti di grado 1.'),
  step(4,0,vital(4,2,2,2),[1,1],[],0,'Arsenale rinforzato: +1 integrità.'),
  step(4,0,vital(4,2,2,2),[2,1],[],0,'Il supporto guardiano raggiunge il grado 2.'),
  step(5,0,vital(4,2,2,2),[2,1],[],0,'Accelerazione binaria: +1 potenza di attacco.'),
  step(5,0,vital(4,2,2,2),[2,2],[],0,'Il supporto d’assedio raggiunge il grado 2.')
 ]),
 R02:profile('Manta Ionica','Difesa ionica',
  'Protegge il Generatore e logora l’avversario. Meno potenza iniziale, maggiore resistenza.',[
  step(2,1,vital(2,4,2,2),[1,1],[],0,'Corazza ionica e due supporti di grado 1.'),
  step(2,1,vital(2,5,2,2),[1,1],[],0,'Generatore rinforzato: +1 integrità.'),
  step(2,1,vital(2,5,2,2),[2,1],[],0,'Il supporto difensivo raggiunge il grado 2.'),
  step(3,1,vital(2,5,2,2),[2,1],[],0,'Risonanza ionica: +1 potenza di attacco.'),
  step(3,1,vital(2,5,2,2),[2,2],[],0,'Il supporto ionico raggiunge il grado 2.')
 ]),
 R04:profile('Squalo del Vuoto','Baluardo e contrattacco',
  'Assorbe la pressione con la corazza e prepara la risposta. L’attacco base rimane contenuto.',[
  step(2,1,vital(3,4,2,3),[2,1],[],0,'Supporto baluardo di grado 2 e supporto offensivo di grado 1.'),
  step(2,1,vital(3,5,2,3),[2,1],[],0,'Generatore rinforzato: +1 integrità.'),
  step(2,2,vital(3,5,2,3),[2,1],[],0,'Corazza pesante: riduce di 2 la potenza nemica.'),
  step(2,2,vital(4,5,2,3),[2,1],[],0,'Arsenale rinforzato: +1 integrità.'),
  step(2,2,vital(4,5,2,3),[2,2],[],0,'Il supporto da contrattacco raggiunge il grado 2.')
 ]),
 E01:profile('Nebulosa','Controllo difensivo',
  'Mantiene il Personaggio operativo e sostiene i disturbi con una flotta resistente.',[
  step(2,1,vital(3,4,3,3),[2,1],[],0,'Supporto corazzato di grado 2 e supporto di disturbo di grado 1.'),
  step(2,1,vital(3,4,4,3),[2,1],[],0,'Plancia rinforzata: +1 integrità.'),
  step(2,1,vital(3,4,4,3),[2,2],[],0,'Il supporto di disturbo raggiunge il grado 2.'),
  step(2,2,vital(3,4,4,3),[2,2],[],0,'Corazza nebulosa: riduce di 2 la potenza nemica.'),
  step(2,2,vital(4,4,4,3),[2,2],[],0,'Arsenale rinforzato: +1 integrità.')
 ]),
 E02:profile('Tempesta','Assalto ionico',
  'Una flotta aggressiva che migliora la protezione solo dopo aver completato il proprio attacco.',[
  step(4,0,vital(4,3,3,3),[1,2],[],0,'Supporto difensivo di grado 1 e supporto ionico di grado 2.'),
  step(4,0,vital(4,4,3,3),[1,2],[],0,'Generatore rinforzato: +1 integrità.'),
  step(4,0,vital(4,4,3,3),[2,2],[],0,'Il supporto difensivo raggiunge il grado 2.'),
  step(5,0,vital(4,4,3,3),[2,2],[],0,'Tuono risonante: +1 potenza di attacco.'),
  step(5,1,vital(4,4,3,3),[2,2],[],0,'Schermatura finale: riduce di 1 la potenza nemica.')
 ]),
 L01:profile('Eclisse Reale','Prima fusione',
  'Mantiene una forte pressione e al quinto livello può fondere i propri due supporti.',[
  step(4,0,vital(4,3,3,3),[1,2],[],0,'Due supporti: difensivo di grado 1 e offensivo di grado 2.'),
  step(4,0,vital(4,4,3,3),[1,2],[],0,'Generatore rinforzato: +1 integrità.'),
  step(4,0,vital(4,4,3,3),[2,2],[],0,'Il supporto difensivo raggiunge il grado 2.'),
  step(4,1,vital(4,4,3,3),[2,2],[],0,'Corazza reale: riduce di 1 la potenza nemica.'),
  step(4,1,vital(4,4,3,3),[2,2],[],1,'Carta Fusione: unisce i due supporti in una sola unità potenziata.')
 ]),
 L03:profile('Titano Ossidiana','Fusione corazzata',
  'Una madre resistente che accede presto alla fusione e completa poi corazza e armamento.',[
  step(3,1,vital(4,5,3,4),[2,1],[],0,'Baluardo di grado 2 e supporto d’assedio di grado 1.'),
  step(3,1,vital(4,5,3,4),[2,2],[],0,'Il supporto d’assedio raggiunge il grado 2.'),
  step(3,1,vital(4,5,3,4),[2,2],[],1,'Carta Fusione: unisce i due supporti senza aggiungere posti in campo.'),
  step(3,2,vital(4,5,3,4),[2,2],[],1,'Corazza di ossidiana: riduce di 2 la potenza nemica.'),
  step(4,2,vital(4,5,3,4),[2,2],[],1,'Armamento titanico: +1 potenza di attacco.')
 ]),
 L04:profile('Arca Astrale','Due fusioni e riserve',
  'Parte con due supporti e due carte Fusione. Le riserve sbloccate entrano soltanto attraverso le fusioni.',[
  step(3,1,vital(4,4,3,3),[2,2],[],2,'Due supporti di grado 2 e due carte Fusione; nessuna riserva ancora disponibile.'),
  step(4,1,vital(4,4,3,3),[2,2],[],2,'Armamento astrale: +1 potenza di attacco.'),
  step(4,1,vital(4,4,3,3),[2,2],[1],2,'Terzo supporto in riserva, di grado 1: entra dopo la prima fusione.'),
  step(4,1,vital(4,5,3,3),[2,2],[2],2,'La terza navicella raggiunge il grado 2; Generatore +1 integrità.'),
  step(4,2,vital(4,5,3,3),[2,2],[2,2],2,'Quarto supporto di grado 2 in riserva: la seconda fusione crea il secondo supporto fuso. Corazza +1.')
 ]),
 C04:profile('Dardo Cremisi','Assalto rapido',
  'Variante offensiva della prima flotta: cresce nell’attacco prima di migliorare i supporti.',[
  step(3,0,vital(3,2,2),[],[],0,'Tre vitali e armamento rapido.'),
  step(4,0,vital(3,2,2),[],[],0,'Arma cremisi: +1 potenza di attacco.'),
  step(4,0,vital(3,2,2,2),[1],[],0,'Prima navicella di supporto e Centralina.'),
  step(4,0,vital(3,3,2,2),[1],[],0,'Generatore rinforzato: +1 integrità.'),
  step(4,0,vital(3,3,2,2),[1,1],[],0,'Seconda navicella di supporto di grado 1.')
 ],'C02'),
 R03:profile('Iride','Recupero',
  'Variante che protegge il Generatore e affida il recupero ai propri supporti.',[
  step(2,1,vital(3,4,2,3),[1,1],[],0,'Due supporti di grado 1 dedicati a recupero e precisione.'),
  step(2,1,vital(3,5,2,3),[1,1],[],0,'Generatore rinforzato: +1 integrità.'),
  step(2,1,vital(3,5,2,3),[2,1],[],0,'Il supporto di recupero raggiunge il grado 2.'),
  step(3,1,vital(3,5,2,3),[2,1],[],0,'Arma prismatica: +1 potenza di attacco.'),
  step(3,1,vital(3,5,2,3),[2,2],[],0,'Il supporto di precisione raggiunge il grado 2.')
 ],'R02'),
 E03:profile('Fenice','Recupero offensivo',
  'Variante che alterna recupero e pressione con un Arsenale resistente.',[
  step(3,0,vital(4,3,3,3),[1,1],[],0,'Due supporti di grado 1: recupero e ritorno di fiamma.'),
  step(3,0,vital(4,4,3,3),[1,1],[],0,'Generatore rinforzato: +1 integrità.'),
  step(3,0,vital(4,4,3,3),[2,1],[],0,'Il supporto di recupero raggiunge il grado 2.'),
  step(4,0,vital(4,4,3,3),[2,1],[],0,'Ritorno di fiamma: +1 potenza di attacco.'),
  step(4,0,vital(4,4,3,3),[2,2],[],0,'Il supporto offensivo raggiunge il grado 2.')
 ],'E02'),
 E04:profile('Orizzonte','Fortezza',
  'Variante difensiva con una Centralina resistente e un supporto di precisione.',[
  step(2,1,vital(3,4,3,4),[2,1],[],0,'Baluardo di grado 2 e supporto di precisione di grado 1.'),
  step(2,1,vital(3,5,3,4),[2,1],[],0,'Generatore rinforzato: +1 integrità.'),
  step(2,1,vital(3,5,3,4),[2,2],[],0,'Il supporto di precisione raggiunge il grado 2.'),
  step(2,2,vital(3,5,3,4),[2,2],[],0,'Corazza da fortezza: riduce di 2 la potenza nemica.'),
  step(3,2,vital(3,5,3,4),[2,2],[],0,'Lancia di Orizzonte: +1 potenza di attacco.')
 ],'E01'),
 L02:profile('Singolarità','Controllo gravitazionale',
  'Variante leggendaria senza fusioni: mantiene due supporti distinti per difesa e pressione ionica.',[
  step(3,1,vital(3,4,4,3),[1,2],[],0,'Supporto difensivo di grado 1 e supporto ionico di grado 2.'),
  step(3,1,vital(3,5,4,3),[1,2],[],0,'Generatore rinforzato: +1 integrità.'),
  step(3,1,vital(3,5,4,3),[2,2],[],0,'Il supporto difensivo raggiunge il grado 2.'),
  step(4,1,vital(3,5,4,3),[2,2],[],0,'Ascia di antimateria: +1 potenza di attacco.'),
  step(4,1,vital(4,5,4,3),[2,2],[],0,'Arsenale rinforzato: +1 integrità.')
 ],'L01')
});

// Soglie provvisorie dei livelli massimi, dal primo modello all'ultimo.
// Le potenzialità finali sono normalizzate a 100, NON gli HP: i valori numerici
// di battaglia andranno bilanciati insieme alle carte e alle abilità dei supporti.
export const SHIP_MAX_LEVELS=Object.freeze({
 N00:20,C01:19,C02:18,C03:17,C04:16,
 R01:15,R02:14,R03:13,R04:12,
 E01:11,E02:10,E03:9,E04:8,
 L01:7,L02:6,L03:5,L04:5
});
export const SHIP_PROGRESSION_IDS=Object.freeze(Object.keys(PROFILES));
if(SHIP_PROGRESSION_IDS.length!==17||
 SHIP_PROGRESSION_IDS.some(id=>!Number.isInteger(SHIP_MAX_LEVELS[id])||
  SHIP_MAX_LEVELS[id]<5||SHIP_MAX_LEVELS[id]>20))
 throw Error('Livelli massimi della progressione incompleti');

export const shipMaxLevel=id=>SHIP_MAX_LEVELS[id]||null;
export const boundedShipLevel=(id,level=1)=>{
 const max=shipMaxLevel(id);
 if(!max)return null;
 const n=Number(level);
 return Number.isFinite(n)?Math.max(1,Math.min(max,Math.floor(n))):1;
};

// Solo le prime due famiglie non schieravano scudiere nella vecchia
// progressione L1-L5; le loro coppie tecniche e gli asset SVG già esistono.
// I supporti vengono ora effettivamente sbloccati durante la nuova progressione.
const EXTRA_SUPPORT_UNLOCKS=Object.freeze({
 N00:Object.freeze([10,18]),C01:Object.freeze([9,17])
});
export function shipEscortUnlockLevels(shipId){
 const p=PROFILES[shipId];
 if(!p)return null;
 if(EXTRA_SUPPORT_UNLOCKS[shipId])return EXTRA_SUPPORT_UNLOCKS[shipId];
 const thresholds=[0,1].map(index=>{
  const step=p.levels.findIndex(row=>row.escortCount>index);
  return step<0?null:step+1;
 });
 return Object.freeze(thresholds);
}

// Lo stesso indice di potenziale (0–100) è disponibile per tutte le famiglie:
// l'uguaglianza dei risultati in PvP sarà verificata soltanto dopo il bilanciamento.
const masteryFor=(level,max)=>Math.round((level-1)*100/(max-1));
const makeDerivedRow=(id,level,p,unlocks)=>{
 const max=SHIP_MAX_LEVELS[id],old=p.levels[4],span=max-5,late=level-5;
 const percent=late/span;
 const first=unlocks[0],second=unlocks[1];
 const count=Number(first!=null&&level>=first)+Number(second!=null&&level>=second);
 const grade=index=>{
  const start=unlocks[index];
  if(start==null||level<start)return 0;
  if(id==='N00'||id==='C01'){
   const next=index===0?first+Math.max(2,Math.floor((second-first)/2)):max;
   return level>=next?2:1;
  }
  const oldGrade=old.escortGrades[index]||0;
  return oldGrade>=2||level>=max?2:oldGrade||1;
 };
 const escortGrades=Object.freeze(Array.from({length:count},(_,i)=>grade(i)));
 // Gli HP dei sistemi già presenti restano quelli attuali: il loro
 // bilanciamento finale è volutamente rinviato. La Centralina aggiunta
 // usa l'integrità provvisoria 2, come per le navi che già la possiedono.
 const parts={...old.integrityByPart};
 if((id==='N00'||id==='C01')&&count>0)parts.command=2;
 const ids=Object.freeze(Object.keys(parts));
 const attackBoost=late>=Math.ceil(span*.65)?1:0;
 const defenseBoost=late>=Math.ceil(span*.85)?1:0;
 const attackPower=Math.min(5,old.attackPower+attackBoost);
 const defensePower=Math.min(2,old.defensePower+defenseBoost);
 const markers=['Padronanza flotta: '+masteryFor(level,max)+'%'];
 if(level===first)markers.push('Prima scudiera sbloccata; Centralina attiva');
 if(level===second)markers.push('Seconda scudiera sbloccata');
 if(level===first+Math.max(2,Math.floor(((second||max)-first)/2))&&(id==='N00'||id==='C01'))
  markers.push('Prima scudiera: grado 2');
 if(level===max&&count>0)markers.push('Potenziale finale; gradi dei supporti completati');
 if(late===Math.ceil(span*.65))markers.push('Arsenale: nuova soglia di potenza');
 if(late===Math.ceil(span*.85))markers.push('Corazza: nuova soglia di resistenza');
 return Object.freeze({...old,attackPower,defensePower,
  integrityByPart:Object.freeze(parts),vitalIds:ids,escortCount:count,escortGrades,
  unlocks:Object.freeze(markers)});
};
export function shipProgressionProfile(shipId){
 const p=PROFILES[shipId];
 if(!p)return null;
 const special=shipId==='N00'?'Sblocca Velo Aurora e Lancia Aurora ai livelli 10 e 18.':
  shipId==='C01'?'Sblocca Sentinella Solare e Lama Rubino ai livelli 9 e 17.':'';
 return Object.freeze({shipId,name:p.name,role:p.role,
  description:special?special+' '+p.description.replace(/senza supporti[^.]*/gi,'inizialmente senza supporti').replace(/nessun supporto evolutivo/gi,'supporti da sbloccare'):p.description,
  campaignStage:CAMPAIGN_SHIP_ORDER.includes(shipId)?CAMPAIGN_SHIP_ORDER.indexOf(shipId)+1:null,
  variantOf:p.variantOf,levelCount:SHIP_MAX_LEVELS[shipId],
  maxLevel:SHIP_MAX_LEVELS[shipId],targetPotential:100});
}
export function getShipProgression(shipId,level=1){
 const p=PROFILES[shipId];
 if(!p)return null;
 const n=boundedShipLevel(shipId,level),max=SHIP_MAX_LEVELS[shipId];
 const unlocks=shipEscortUnlockLevels(shipId);
 const row=n<=5?p.levels[n-1]:makeDerivedRow(shipId,n,p,unlocks);
 return Object.freeze({...shipProgressionProfile(shipId),...row,level:n,
  // potenziale parametrico comune: NON equivale ancora a HP/danno uguali
  potential:masteryFor(n,max),masteryPoints:masteryFor(n,max),
  escortUnlockLevels:unlocks});
}
export function getShipProgressionLevels(shipId){
 const max=SHIP_MAX_LEVELS[shipId];
 return max?Object.freeze(Array.from({length:max},(_,i)=>getShipProgression(shipId,i+1))):Object.freeze([]);
}
