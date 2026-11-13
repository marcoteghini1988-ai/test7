// Eclissi Stellare - Identita' di carte speciali nel nuovo duello di flotta.
// Non modifica i salvataggi o le regole legacy: adatta 35 moduli, 12 comandanti
// e 6 epici tramite i loro veri ID gia' posseduti.
// Ogni effetto e' calcolato dal motore e mostrato direttamente sulla carta.
import {TACTICAL_MODULE_CARDS} from './tacticalEquipmentCards.js';
import {BOSS_CHARACTER_CATALOG} from './bossCharacterCards.js';
import {TACTICAL_EPIC_CARDS} from './tacticalEpicCards.js';

export const FLEET_MODULE_ACTIONS=Object.freeze({
 pure_hit:['impulse','Impulso diretto: +1 potenza al prossimo attacco di flotta.'],
 healing:['repair','Ripara una frattura della madre o 1 HP di una scudiera viva.'],
 free_swap:['swap1','Ricambia 1 carta speciale rimasta in mano.'],
 refill:['swap2','Ricambia fino a 2 carte speciali rimaste in mano.'],
 execution:['execute','Assedio: +1 potenza contro la madre già ferita o una scudiera danneggiata.'],
 guard:['guard','Manovra difensiva: riduce di 1 la potenza della salva nemica.'],
 module_lock:['jam','Blocca 1 punto di potenza di fuoco della flotta avversaria.'],
 life_drain:['drain','Sifone: +1 potenza; dopo il colpo ripara madre o scudiera.'],
 hand_jam:['interfere','Interferenza: -1 potenza nemica e ostacola la pesca avversaria.'],
 prevent_skip:['cleanse','Purificazione: annulla 1 sabotaggio contro la tua flotta.'],
 shield_and_ether:['fortify','Campo tattico: +1 difesa e ripara una frattura o un supporto.'],
 ether_gain:['formation','Energia di formazione: +1 potenza se almeno una scudiera è collegata.'],
 boost_focus:['focus','Concentrazione: +1 potenza al prossimo attacco.'],
 boost_siphon:['siphon','Sifone ionico: +1 potenza e -1 potenza alla flotta nemica.'],
 ammo_refill:['escort','Ricarica scudiere: +1 potenza se almeno una scudiera è collegata.'],
 clear_malus:['purge','Annulla gli effetti di sabotaggio sul fuoco della flotta.'],
 dice_charge:['quantum','Sovraccarico quantico: +1 potenza e attacco di tipo Ionico.'],
 burn:['burn','Plasma instabile: provoca una frattura rinforzata sul vitale colpito.'],
 singularity:['singularity','Singolarità: +1 potenza, Ionico e riparazione di madre o scudiera dopo un colpo.']
});
export const FLEET_CHARACTER_ACTIONS=Object.freeze({
 1:['armor','Riparo tellurico: riduce l'attacco avversario per 2 round.'],
 2:['assault','Furia controllata: +1 potenza per 2 round.'],
 3:['corrosion','Spora corrosiva: rafforza le fratture causate per 2 round.'],
 6:['counter','Controtempo: +1 difesa, e +1 attacco se il nemico usa speciali.'],
 7:['ionGuard','Gabbia dielettrica: +1 difesa contro madre Ionica.'],
 8:['escortGuard','Guardia degli abissi: +1 difesa con almeno una scudiera collegata.'],
 9:['shadow','Lama delle ombre: +1 potenza se un vitale della madre è fratturato.'],
 11:['regeneration','Riserva criogenica: ripara madre o scudiera ogni round per 2 round.'],
 14:['sync','Convertitore di flusso: +1 potenza se la nave madre sincronizza le scudiere.'],
 17:['harmonic','Coro delle scudiere: +1 potenza quando una evoluzione è collegata alla madre.'],
 19:['magma','Forgia instabile: +1 potenza su terreno Plasma o contro madre fratturata.'],
 20:['precision','Frattura del vuoto: potenzia il colpo mirato contro i vitali.']
});
export const FLEET_EPIC_ACTIONS=Object.freeze({
 epic_item_8:['calice','Calice stellare: +1 potenza e ripara madre o scudiera dopo un colpo, per 2 round.'],
 epic_item_6:['pendolo','Pendolo temporale: ricambia 1 carta ogni round, per 2 round.'],
 epic_item_7:['monolite','Monolite: +1 difesa contro madre Plasma, per 2 round.'],
 epic_item_9:['matrice','Matrice critica: +2 potenza quando la madre è fratturata.'],
 epic_item_1:['mobius','Nastro di Moebius: disturba gli attacchi avversari per 2 round.'],
 epic_item_3:['astrolabio','Astrolabio: ricambia subito fino a 2 carte speciali.']
});
export function fleetAdvancedCardProfile(type){
 const m=TACTICAL_MODULE_CARDS[type];
 if(m){
  const profile=FLEET_MODULE_ACTIONS[m.effect];
  if(!profile)throw new Error('Effetto modulo non convertito: '+m.effect);
  return {kind:'module',action:profile[0],description:profile[1],
    originalEffect:m.effect,short:m.short,duration:1};
 }
 const c=BOSS_CHARACTER_CATALOG[type];
 if(c){
  const profile=FLEET_CHARACTER_ACTIONS[c.planetId];
  if(!profile)throw new Error('Comandante non convertito: '+c.planetId);
  return {kind:'character',action:profile[0],description:profile[1],
    originalEffect:c.effect,short:c.short,duration:2};
 }
 const e=TACTICAL_EPIC_CARDS[type];
 if(e){
  const profile=FLEET_EPIC_ACTIONS[type];
  if(!profile)throw new Error('Epico non convertito: '+type);
  return {kind:'epic',action:profile[0],description:profile[1],
    originalEffect:e.effect,short:e.short,duration:e.cycles};
 }
 return null;
}
for(const type of Object.keys(TACTICAL_MODULE_CARDS)){
 if(!fleetAdvancedCardProfile(type))throw Error('Carta Modulo senza identita: '+type);
}
for(const type of Object.keys(BOSS_CHARACTER_CATALOG)){
 if(!fleetAdvancedCardProfile(type))throw Error('Carta Personaggio senza identita: '+type);
}
for(const type of Object.keys(TACTICAL_EPIC_CARDS)){
 if(!fleetAdvancedCardProfile(type))throw Error('Carta Epica senza identita: '+type);
}
