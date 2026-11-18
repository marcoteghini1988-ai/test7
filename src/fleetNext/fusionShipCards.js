// Carte Navicella Fusione: la carta identifica il modello che si aggiunge
// a UN supporto già schierato. Non rappresenta una fusione universale.
// Ogni Carta Fusione e' Leggendaria e rappresenta il modello gia' al livello MAX.
// Le immagini e i prezzi saranno definiti nella fase dedicata.
// Il registro storico contiene 17 ID: i quattro da escludere quando sarà
// riconciliato il catalogo ufficiale da 13 non sono ancora identificati.
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {fleetElements} from './elementalAffinities.js';
import {nativeSupportSkillFor} from './supportAbilities.js';
import {shipMaxLevel} from './progression.js';

export const FUSION_SHIP_CARDS=Object.freeze(PHASE1_CATALOG.ships.map(ship=>{
 const nome='Navicella Fusione — '+ship.nome;
 return Object.freeze({
  id:'fusion-ship-'+ship.id.toLowerCase(),
  nome,name:nome,category:'Navicella Fusione',categoria:'Fusione',
  sottotipo:'Navicella Fusione',kind:'support',rarita:'Leggendaria',
  raritySource:'fusion-max',nativeFace:true,playable:true,
  requiresMaxSupportLevel:true,fusionShipLevel:shipMaxLevel(ship.id),
  maxCopiesPerDeck:2,acquisitionPending:true,
  fusionShipId:ship.id,fusionShipName:ship.nome,
  fusionElementId:fleetElements(ship.id)[0],
  fusionSkillId:nativeSupportSkillFor(ship.id),
  effectProposed:'Fondi '+ship.nome+' (livello MAX) con un tuo supporto a livello MAX non ancora fuso. Conserva HP e ferite del supporto; unisce elementi e abilità. Massimo due fusioni per battaglia.',
  effectSpec:Object.freeze({type:'shipFusion',shipId:ship.id})
 });
}));
export const FUSION_SHIP_CARD_BY_ID=Object.freeze(Object.fromEntries(
 FUSION_SHIP_CARDS.map(def=>[def.id,def])
));
export const FUSION_SHIP_CARD_COUNT=FUSION_SHIP_CARDS.length;
export const fusionShipCard=id=>FUSION_SHIP_CARD_BY_ID[id]||null;
