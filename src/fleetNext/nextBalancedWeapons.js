// Famiglie 26/11: valori nominali espliciti per ciascuna rarità, non raddoppiati dal fattore legacy.
import designs from './confirmedNextWeaponDesigns.json' with {type:'json'};
import balance from './nextWeaponBalance20261126.json' with {type:'json'};
import {FLEET_ELEMENTS} from './elementalAffinities.js';
const copyLimit={Rara:4,Epica:3,Leggendaria:2},suffix={Rara:'r',Epica:'e',Leggendaria:'l'};
export const NEXT_WEAPON_BALANCE_REVISION=balance.revision;
export const NEXT_WEAPON_BALANCE_ROWS=Object.freeze(balance.profiles);
const textFor=(slug,p,t)=>{switch(slug){
 case 'marea-laterale':return p.baseDamage+' HP a un bersaglio.'+(p.commandRate?' Centralina nemica: consumo ×'+(p.commandRate+1)+' per 15 secondi effettivi dei suoi turni.':'');
 case 'pressione-isobarica':return 'Due turni: '+p.baseDamage+' HP, poi '+2*p.baseDamage+' sul medesimo bersaglio se vivo, oppure '+p.baseDamage+' su un altro. Sinergia Personaggio da collegare alla scheda compatibile.';
 case 'sismico-tettonico':return 'Tre turni: terremoto '+p.baseDamage+' HP a ogni nave avversaria (2 Energie Terra); due assestamenti da '+p.secondDamage+' HP (1 Energia Terra ciascuno), solo se il terremoto è riuscito.';
 case 'tempeste-silicee':return 'Tre turni, stadi '+[p.baseDamage,2*p.baseDamage,3*p.baseDamage].join('/')+' HP a ogni nave nemica, con 1/2/3 Energie Terra. Riprende dallo stadio non eseguito; scade comunque. Durante la tempesta protezione supporti sospesa.';
 case 'macigni-tettonici':return 'Due turni, '+p.baseDamage+' HP a un bersaglio; frammenti di ritorno '+p.recoilDamage+' HP totali divisi fra alleati vivi. Collettore di pari rarità li intercetta.';
 case 'collettore-frammenti':return 'Due turni, '+p.baseDamage+' HP a un bersaglio. Con Lanciatore di pari rarità: intercetta i frammenti, somma il loro danno e divide il totale fra tutte le navi nemiche vive.';
 case 'vortici-ciclonici':return 'Consuma '+p.energyCost+' Energie Vento; '+p.damagePerDiscard+' HP per ciascuna carta negli scarti nemici, valore pieno a ogni nave nemica viva. Scarti invariati.';
 case 'spinta-eolica':return 'Consuma '+p.energyCost+' Energia Vento; '+p.baseDamage+' HP per supporto avversario. Se almeno uno è colpito, i supporti vengono respinti e i successivi attacchi a bersaglio singolo del turno puntano alla madre.';
 case 'boato-cosmico':return 'Un turno: ogni nave alleata carica quella corrispondente, '+p.baseDamage+' HP di impatto, contraccolpo proprio del 25% anche se manca il bersaglio. La somma degli HP realmente persi alimenta il Convertitore.';
 case 'convertitore-cinetico':return 'Solo con Boato Cosmico di pari rarità nello stesso turno o nel proprio successivo. Converte il 100% del contraccolpo realmente subito in un colpo su un bersaglio valido. Nessuna cura.';
 case 'concentrazione-solare':return 'Un colpo: '+p.damages.join('/')+' HP se giochi rispettivamente 3/2/1 carte, quest’arma inclusa.';
 case 'fotoni-riflessi':return p.baseDamage+' HP a un bersaglio. Se una Carta Difesa blocca il colpo, genera '+p.energyGain+' cariche Luce, non nuove carte fisiche.';
 case 'replicatore-olografico':return 'Tre turni: replica l’ultima arma realmente giocata dall’avversario nello stesso slot, con le proprie risorse e condizioni. Danno 70%, oppure 100% con Proiettore attivo. Nessuna copia fisica né auto-replica.';
 case 'proiettore-olografico':return 'Tre turni: replica HP attuali di un supporto, rigenera e rimescola l’ologramma a ogni turno. Se colpito, contrattacco 70% degli HP copiati, 100% con Replicatore attivo; protezione rispettata.';
 case 'eclissi-quantistica':return 'Scelta segreta di uno dei prossimi tre turni propri. Se l’avversario indovina: '+p.baseDamage+' HP; altrimenti '+(p.baseDamage+p.bonusDamage)+' HP. Un solo colpo, lo slot si libera al lancio. Il bersaglio viene scelto alla riapparizione.';
 case 'inversione-vitale':return p.baseDamage+' HP + '+p.gapPercent+'% della differenza positiva fra HP attuali delle due madri (max bonus '+p.maxExtraDamage+' HP).';
 case 'drone-parassita':return 'Tre turni, '+p.baseDamage+' HP sul bersaglio agganciato. Accumula gli HP realmente sottratti; cessa se il bersaglio è distrutto.';
 case 'estrattore-materia-oscura':return 'Un turno: da solo '+p.baseDamage+' HP. Con Drone attivo di pari rarità, consuma invece la riserva del Drone per curare l’alleata viva più danneggiata in proporzione agli HP massimi.';
 case 'massa-inerziale':return 'Tre turni: '+p.perCardDamage+' HP per carta effettivamente giocata nel turno avversario, contro la navicella agganciata.';
 case 'implosore-singolarita':return 'Due turni: assorbe i colpi delle altre Armi alleate; al termine colpo singolo con danni raccolti +'+p.boostPercent+'%.';
 case 'oscurita-gravitazionale':return 'Tre turni: oscura 33/66/100% del campo. '+p.baseDamage+' HP per carta coperta, un solo bersaglio. Carte non consumate. Tenebre Infinite aggiunge i due scarti al terzo turno.';
 case 'tenebre-infinite':return 'Solo insieme a Generatore di Oscurità Gravitazionale al suo terzo turno; conta anche entrambi gli scarti, senza rimuoverli. Nessuno sparo autonomo.';
 default:throw Error('Arma nuova senza descrizione: '+slug);
}};
export const NEXT_BALANCED_ALL=Object.freeze(balance.profiles.flatMap(row=>{
 const design=designs.designs.find(d=>d.id.endsWith('-'+row.slug));if(!design)throw Error('Profilo senza progetto '+row.slug);
 return row.rarities.map((rarita,i)=>{
  const id=i?design.id+'-rarity-'+suffix[rarita]:design.id;
  const profile=Object.freeze({pattern:'next-'+row.slug,nextBalanced:true,finalNominal:true,
   familyId:design.id,durationTurns:row.turns,rarita,slug:row.slug,...row.values[i]});
  const e=FLEET_ELEMENTS[design.elementId];
  const effectProposed=textFor(row.slug,profile,row.turns);
  return Object.freeze({id,weaponFamilyId:design.id,originRarity:row.rarities[0],evolutionStage:i,
   isWeaponEvolution:i>0,evolutionOf:i?(i===1?design.id:design.id+'-rarity-'+suffix[row.rarities[i-1]]):undefined,
   name:design.name,nome:design.name,rarita,rarity:rarita,kind:'support',category:'Arma di supporto',
   categoria:'Supporto',sottotipo:'Arma temporanea',elementId:design.elementId,
   visualKey:e.vfx,visualSymbol:e.symbol,nativeFace:true,visualPending:true,
   playable:!row.blocked,acquisitionPending:!!row.blocked,reviewRequired:!!row.blocked,
   maxCopiesPerDeck:copyLimit[rarita],balancePending:true,weaponValuesNearFinal:false,
   balanceRevision:balance.revision,balanceStatus:'FIXED_NOMINALS_COMBAT_VALIDATION_PENDING',
   blockedReason:row.blocked,characterSynergyPending:row.slug==='pressione-isobarica',
   effectSpec:Object.freeze({type:'deployMachine',hp:1,power:0,damageMode:'designed-shot',
    elementId:design.elementId,durationTurns:row.turns,weaponProfile:profile}),effectProposed,
   visualBrief:design.name+' · Illustrazione ed effetti distintivi da approvare.'});
 });
}));
export const NEXT_BALANCED_WEAPON_CARDS=Object.freeze(NEXT_BALANCED_ALL.filter(c=>c.playable));
export const NEXT_BALANCED_LOCKED=Object.freeze(NEXT_BALANCED_ALL.filter(c=>!c.playable));
export const NEXT_BALANCED_BY_ID=Object.freeze(Object.fromEntries(NEXT_BALANCED_WEAPON_CARDS.map(c=>[c.id,c])));
export const NEXT_BALANCED_FAMILIES=Object.freeze(Object.fromEntries(NEXT_BALANCED_WEAPON_CARDS.filter(c=>!c.isWeaponEvolution).map(c=>
 [c.id,Object.freeze(NEXT_BALANCED_WEAPON_CARDS.filter(x=>x.weaponFamilyId===c.id))])));
if(new Set(NEXT_BALANCED_ALL.map(c=>c.id)).size!==NEXT_BALANCED_ALL.length||
 Object.keys(NEXT_BALANCED_FAMILIES).length!==22)throw Error('Catalogo 26/11 non valido');
