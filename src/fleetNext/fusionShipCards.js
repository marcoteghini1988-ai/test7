// Carte Navicella Fusione: la carta identifica il modello che si aggiunge
// a UN supporto già schierato. Non rappresenta una fusione universale.
// Le immagini, i prezzi e la rarità definitiva verranno definiti in seguito.
// Il registro storico contiene 17 ID: i quattro da escludere quando sarà
// riconciliato il catalogo ufficiale da 13 non sono ancora identificati.
import {PHASE1_CATALOG} from '../phase1FleetCatalog.js';
import {fleetElements} from './elementalAffinities.js';
import {nativeSupportSkillFor} from './supportAbilities.js';

export const FUSION_SHIP_CARDS=Object.freeze(PHASE1_CATALOG.ships.map(ship=>{
 const nome='Navicella Fusione — '+ship.nome;
 return Object.freeze({
  id:'fusion-ship-'+ship.id.toLowerCase(),
  nome,name:nome,category:'Navicella Fusione',categoria:'Fusione',
  sottotipo:'Navicella Fusione',kind:'support',rarita:'Epica',
  rarityProvisional:true,nativeFace:true,playable:true,
  maxCopiesPerDeck:2,acquisitionPending:true,
  fusionShipId:ship.id,fusionShipName:ship.nome,
  fusionElementId:fleetElements(ship.id)[0],
  fusionSkillId:nativeSupportSkillFor(ship.id),
  effectProposed:'Fondi '+ship.nome+' con un tuo supporto operativo non ancora fuso. Conserva gli HP e le ferite del supporto; unisce elementi e abilità. Un massimo di due fusioni per battaglia.',
  effectSpec:Object.freeze({type:'shipFusion',shipId:ship.id})
 });
}));
export const FUSION_SHIP_CARD_BY_ID=Object.freeze(Object.fromEntries(
 FUSION_SHIP_CARDS.map(def=>[def.id,def])
));
export const FUSION_SHIP_CARD_COUNT=FUSION_SHIP_CARDS.length;
export const fusionShipCard=id=>FUSION_SHIP_CARD_BY_ID[id]||null;
