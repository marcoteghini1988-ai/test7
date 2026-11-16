// 120 schede esclusive del nuovo catalogo: la fonte è la specifica approvata.
// Le carte Personaggio riutilizzano i loro ID eseguibili esistenti: niente doppioni.
// Le altre 108 schede sono riconosciute dal gioco ma bloccate finché non esiste
// un'azione eseguibile completa. È vietato simulare gli effetti con bonus generici.
import definition from '../../docs/NUOVO_CATALOGO_ESCLUSIVE_120_2026-11-16.json' with {type:'json'};
import oldExclusive from './catalogExclusive.json' with {type:'json'};

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
 executable:raw.type==='Personaggio'
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
  effectSpec:Object.freeze({type:'blueprint',code:c.designId}),
  minShipLevelDraft:c.minShipLevel,
  requiredOwnParts:Object.freeze([]),requiredEscortCount:0,
  maxCopiesInAutoPackageDraft:1,
  upgradeType:'not-available-until-executable',
  counterplay:c.counterplay,
  designRules:c.rules,designRequirements:c.requirements,
  visualBrief:c.visualBrief,
  nativeFace:true,playable:false,exclusiveToShip:true,
  status:'awaiting-executable-combat-action'
 })
 ])
));

if(EXCLUSIVE_DESIGNS_120.length!==120||
 new Set(EXCLUSIVE_DESIGNS_120.map(c=>c.id)).size!==120||
 Object.keys(NEW_EXCLUSIVE_BLUEPRINTS).length!==108||
 EXCLUSIVE_SHIP_IDS.some(id=>EXCLUSIVE_DESIGNS_120.filter(c=>c.shipId===id).length!==10))
 throw Error('120 esclusive non coerenti: 10 definizioni univoche per ciascuna delle 12 madri');
