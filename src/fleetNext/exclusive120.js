// 120 schede esclusive del nuovo catalogo: la fonte è la specifica approvata.
// Le carte Personaggio riutilizzano i loro ID eseguibili esistenti: niente doppioni.
// Le altre 108 schede sono riconosciute dal gioco ma bloccate finché non esiste
// un'azione eseguibile completa. È vietato simulare gli effetti con bonus generici.
import definition from '../../docs/NUOVO_CATALOGO_ESCLUSIVE_120_2026-11-16.json' with {type:'json'};
import oldExclusive from './catalogExclusive.json' with {type:'json'};
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

export const EXCLUSIVE_SHIP_IDS=Object.freeze(["N00","C01","C02","C03","R01","R02","R04","E01","E02","L01","L03","L04"]);
const characterIds=Object.freeze({
  "nx-n00-06": "ex-n00-01",
  "nx-c01-05": "ex-c01-01",
  "nx-c02-05": "ex-c02-01",
  "nx-c03-05": "ex-c03-01",
  "nx-r01-05": "ex-r01-01",
  "nx-r02-05": "ex-r02-01",
  "nx-r04-05": "ex-r04-01",
  "nx-e01-05": "ex-e01-01",
  "nx-e02-05": "ex-e02-01",
  "nx-l01-05": "ex-l01-01",
  "nx-l03-05": "ex-l03-01",
  "nx-l04-04": "ex-l04-01"
});
const shipNames=new Map(oldExclusive.shipConfigurations.map(c=>[c.id,c.name]));
const shipRarity=new Map(oldExclusive.shipConfigurations.map(c=>[c.id,c.rarity]));
const kindFor=type=>type==='Personaggio'?'character':
 type==='Attacco'?'attack':type==='Difesa'||type==='Trappola'?'defense':'support';

export const EXCLUSIVE_DESIGNS_120=Object.freeze(definition.cards.map(raw=>Object.freeze({
 ...raw,id:characterIds[raw.id]||raw.id,
 designId:raw.id,
 shipName:shipNames.get(raw.shipId),
 rarityDraft:shipRarity.get(raw.shipId),
 isPreservedCharacter:raw.type==='Personaggio',
 // La versione del Personaggio già esistente resta giocabile, non ancora il suo effetto riprogettato.
 currentCharacterPlayable:raw.type==='Personaggio',
 executable:!!(AURORA_ACTIONS[characterIds[raw.id]||raw.id]||LINCE_ACTIONS[characterIds[raw.id]||raw.id]||
  PRISMA_ACTIONS[characterIds[raw.id]||raw.id]||CORVO_ACTIONS[characterIds[raw.id]||raw.id]||FALCO_ACTIONS[characterIds[raw.id]||raw.id]||MANTA_ACTIONS[characterIds[raw.id]||raw.id]||SHARK_ACTIONS[characterIds[raw.id]||raw.id]||NEBULA_ACTIONS[characterIds[raw.id]||raw.id]||STORM_ACTIONS[characterIds[raw.id]||raw.id]||ROYAL_ACTIONS[characterIds[raw.id]||raw.id]||OBSIDIAN_ACTIONS[characterIds[raw.id]||raw.id])
})));
export const EXCLUSIVE_DESIGN_BY_ID=Object.freeze(
 Object.fromEntries(EXCLUSIVE_DESIGNS_120.map(c=>[c.id,c]))
);
export const NEW_EXCLUSIVE_BLUEPRINTS=Object.freeze(Object.fromEntries(
 EXCLUSIVE_DESIGNS_120.filter(c=>!c.isPreservedCharacter).map(c=>[
 c.id,Object.freeze({
  id:c.id,shipId:c.shipId,shipName:c.shipName,name:c.name,nome:c.name,
  category:c.type,kind:kindFor(c.type),rarityDraft:c.rarityDraft,
  effectProposed:c.effectText,
  effectSpec:Object.freeze(AURORA_ACTIONS[c.id]?{type:'aurora',action:AURORA_ACTIONS[c.id]}:
   LINCE_ACTIONS[c.id]?{type:'lince',action:LINCE_ACTIONS[c.id]}:
   PRISMA_ACTIONS[c.id]?{type:'prisma',action:PRISMA_ACTIONS[c.id]}:
   CORVO_ACTIONS[c.id]?{type:'corvo',action:CORVO_ACTIONS[c.id]}:
   FALCO_ACTIONS[c.id]?{type:'falco',action:FALCO_ACTIONS[c.id]}:
   MANTA_ACTIONS[c.id]?{type:'manta',action:MANTA_ACTIONS[c.id]}:
   SHARK_ACTIONS[c.id]?{type:'shark',action:SHARK_ACTIONS[c.id]}:
   NEBULA_ACTIONS[c.id]?{type:'nebula',action:NEBULA_ACTIONS[c.id]}:
   STORM_ACTIONS[c.id]?{type:'storm',action:STORM_ACTIONS[c.id]}:
   ROYAL_ACTIONS[c.id]?{type:'royal',action:ROYAL_ACTIONS[c.id]}:
   OBSIDIAN_ACTIONS[c.id]?{type:'obsidian',action:OBSIDIAN_ACTIONS[c.id]}:{type:'blueprint',code:c.designId}),
  minShipLevelDraft:c.minShipLevel,
  requiredOwnParts:Object.freeze([]),requiredEscortCount:0,
  maxCopiesInAutoPackageDraft:1,
  upgradeType:'not-available-until-executable',
  counterplay:c.counterplay,
  designRules:c.rules,designRequirements:c.requirements,
  visualBrief:c.visualBrief,
  nativeFace:true,playable:!!(AURORA_ACTIONS[c.id]||LINCE_ACTIONS[c.id]||PRISMA_ACTIONS[c.id]||CORVO_ACTIONS[c.id]||FALCO_ACTIONS[c.id]||MANTA_ACTIONS[c.id]||SHARK_ACTIONS[c.id]||NEBULA_ACTIONS[c.id]||STORM_ACTIONS[c.id]||ROYAL_ACTIONS[c.id]||OBSIDIAN_ACTIONS[c.id]),exclusiveToShip:true,
  status:AURORA_ACTIONS[c.id]?'aurora-executable-v1':
   LINCE_ACTIONS[c.id]?'lince-executable-v1':
   PRISMA_ACTIONS[c.id]?'prisma-executable-v1':
   CORVO_ACTIONS[c.id]?'corvo-executable-v1':
   FALCO_ACTIONS[c.id]?'falco-executable-v1':
   MANTA_ACTIONS[c.id]?'manta-executable-v1':
   SHARK_ACTIONS[c.id]?'shark-executable-v1':
   NEBULA_ACTIONS[c.id]?'nebula-executable-v1':
   STORM_ACTIONS[c.id]?'storm-executable-v1':
   ROYAL_ACTIONS[c.id]?'royal-executable-v1':
   OBSIDIAN_ACTIONS[c.id]?'obsidian-executable-v1':'awaiting-executable-combat-action'
 })
 ])
));

if(EXCLUSIVE_DESIGNS_120.length!==120||
 new Set(EXCLUSIVE_DESIGNS_120.map(c=>c.id)).size!==120||
 Object.keys(NEW_EXCLUSIVE_BLUEPRINTS).length!==108||
 EXCLUSIVE_SHIP_IDS.some(id=>EXCLUSIVE_DESIGNS_120.filter(c=>c.shipId===id).length!==10))
 throw Error('120 esclusive non coerenti: 10 definizioni univoche per ciascuna delle 12 madri');
