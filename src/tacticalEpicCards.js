// Oggetti Epici della progressione originale, adattati al nuovo mazzo speciale.
// Gli ID epic_item_* e le coppie di reliquie rimangono quelli della Fase 16A.
// La sandbox NON concede ricompense reali e NON modifica gli inventari.
import {PHASE16A_RIFTS} from './newCombat/phase16ACatalog.js';
import {PHASE16C_EPICS} from './newCombat/phase16CEpics.js';

const PROFILES=Object.freeze({
 epic_item_8:{cycles:2,short:'CALICE',help:'Per 2 scontri converte i danni in Sincronia. Polvere Stellare: solo anteprima, mai premi PvP.',effect:'damage_to_dust'},
 epic_item_6:{cycles:2,short:'PENDOLO',help:'Per 2 scontri, quando subisci danno rivela le prossime 6 numeriche e consente 1 ricambio extra nel ciclo seguente.',effect:'future_cards'},
 epic_item_7:{cycles:2,short:'MONOLITE',help:'Per 2 scontri neutralizza il surriscaldamento da plasma delle tue armi.',effect:'anti_heat'},
 epic_item_9:{cycles:1,short:'MATRICE',help:'Con i quattro vitali al 30% totale o meno, una vera Coppia o un Tris valida arma +2 sul prossimo colpo Accumulo reale alla barriera nello stesso ciclo. Non bypassa firme.',effect:'critical_heavy'},
 epic_item_1:{cycles:2,short:'MÖBIUS',help:'Con i vitali al 30% totale o meno, guarda le prossime 10 numeriche e scegline una da anticipare nella pesca.',effect:'future_choice'},
 epic_item_3:{cycles:2,short:'ASTROLABIO',help:'Attivalo, scopri le prossime 2 numeriche e nel ciclo successivo scegli quale pescare per prima.',effect:'dual_draw'}
});
export const TACTICAL_EPIC_CARDS=Object.freeze(Object.fromEntries(PHASE16A_RIFTS.map(r=>{
 const profile=PROFILES[r.itemId];
 if(!profile||!PHASE16C_EPICS[r.itemId])throw new Error('Oggetto Epico mancante dal vecchio catalogo: '+r.itemId);
 return [r.itemId,Object.freeze({id:r.itemId,name:PHASE16C_EPICS[r.itemId],
  ...profile,riftId:r.id,relicsRequired:Object.freeze([...r.relicsRequired]),
  bossPlanets:Object.freeze([...r.bossPlanets])})];
})));
if(Object.keys(TACTICAL_EPIC_CARDS).length!==6)throw new Error('Le reliquie della campagna devono creare sei Epici');
export function isTacticalEpic(type){return Object.hasOwn(TACTICAL_EPIC_CARDS,type);}
export function tacticalEpicForgeReady(relics={},itemId){
 const epic=TACTICAL_EPIC_CARDS[itemId];
 return !!epic&&epic.relicsRequired.every(r=>relics?.[r]===true);
}
export function unlockedTacticalEpics(progress={}){
 // Solo fusioni realmente riscattate; avere le due reliquie è un prerequisito
 // ma NON equivale a possedere l'oggetto senza la fusione.
 const fused=progress.fused??{};
 const legacyOwned=progress.ownedEpics??{};
 const equipped=Array.isArray(progress.legacyPassives?.loadout?.epics)
  ?progress.legacyPassives.loadout.epics.map(x=>x.id):[];
 return Object.values(TACTICAL_EPIC_CARDS).filter(item=>
  fused[item.riftId]===true||legacyOwned[item.id]===true||equipped.includes(item.id))
  .map(item=>item.id);
}
export function tacticalEpicCritical(side){
 const parts=side?.defense?.parts;
 if(!parts)return false;
 const hps=['engine','weapons','shieldGenerator','command'].map(id=>parts[id]?.hp);
 const max=['engine','weapons','shieldGenerator','command'].map(id=>parts[id]?.max);
 if(hps.some(x=>!Number.isFinite(x))||max.some(x=>!Number.isFinite(x)||x<=0))return false;
 return hps.reduce((a,b)=>a+b,0)<=max.reduce((a,b)=>a+b,0)*.30;
}
export function tacticalEpicActive(side,itemId,round){
 return side?.epic?.active?.id===itemId&&side.epic.active.untilRound>=round;
}
