// Carte Navicella Fusione: la carta identifica il modello che si aggiunge
// a UN supporto già schierato. Non rappresenta una fusione universale.
// Ogni Carta Fusione e' Leggendaria e rappresenta il modello gia' al livello MAX.
// Le immagini e i prezzi saranno definiti nella fase dedicata.
// Le 13 schede provengono dai supporti indipendenti; le madri ufficiali
// sono 12 e hanno un catalogo separato di 120 carte esclusive.
import {SUPPORT_CATALOG} from './supportCatalog.js';
import {SUPPORT_MAX_LEVEL} from './supportProgression.js';

export const FUSION_SHIP_CARDS=Object.freeze(SUPPORT_CATALOG.map(ship=>{
 const nome='Navicella Fusione — '+ship.name;
 return Object.freeze({
  id:'fusion-ship-'+ship.shipModelId.toLowerCase(),
  nome,name:nome,category:'Navicella Fusione',categoria:'Fusione',
  sottotipo:'Navicella Fusione',kind:'support',rarita:'Leggendaria',
  raritySource:'fusion-max',nativeFace:true,playable:true,
  requiresMaxSupportLevel:true,fusionShipLevel:SUPPORT_MAX_LEVEL,
  maxCopiesPerDeck:2,acquisitionPending:true,
  fusionShipId:ship.shipModelId,fusionShipName:ship.name,
  fusionElementId:ship.elementId,
  fusionSkillId:ship.skillId,
  fusionTemplateShipId:ship.templateMotherId,
  fusionTemplateSlot:ship.originSlot,
  effectProposed:'Fondi '+ship.name+' (livello MAX) con un tuo supporto a livello MAX non ancora fuso. Conserva HP e ferite del supporto; unisce elementi e abilità. Massimo due fusioni per battaglia.',
  effectSpec:Object.freeze({type:'shipFusion',shipId:ship.shipModelId})
 });
}));
export const FUSION_SHIP_CARD_BY_ID=Object.freeze(Object.fromEntries(
 FUSION_SHIP_CARDS.map(def=>[def.id,def])
));
export const FUSION_SHIP_CARD_COUNT=FUSION_SHIP_CARDS.length;
export const fusionShipCard=id=>FUSION_SHIP_CARD_BY_ID[id]||null;
