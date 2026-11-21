
import {calibratedWeaponCard} from './weaponBalanceCalibration.js';// Armi di supporto approvate per progettazione: Cannone Acceleratore Trifase in tre stadi.
// L'Amplificatore di Scorta non appartiene al catalogo ufficiale.
export const SEQUENCE_WEAPON_IDS=Object.freeze(['weapon-sequence-1','weapon-sequence-2','weapon-sequence-3']);
export const TEMP_SUPPORT_WEAPON_RARITIES=Object.freeze({
 'weapon-sequence-1':'Comune','weapon-sequence-2':'Rara',
 'weapon-sequence-3':'Epica'
});
const named=(id,name,spec,effectProposed)=>calibratedWeaponCard(Object.freeze({
 id,name,nome:name,category:'Arma di supporto',categoria:'Supporto',sottotipo:'Arma temporanea',
 kind:'support',playable:true,nativeFace:true,
 rarita:TEMP_SUPPORT_WEAPON_RARITIES[id],rarityPending:false,acquisitionPending:true,
 maxCopiesPerDeck:1,copyLimitPending:false,
 elementId:'ionic',elementPending:false,visualKey:'element-lightning',visualSymbol:'⚡',
 effectSpec:Object.freeze({type:'deployMachine',hp:1,power:0,elementId:'ionic',...spec}),
 effectProposed,visualBrief:'Elemento Fulmine confermato; illustrazione definitiva ancora da approvare.'
}));
const first=named(SEQUENCE_WEAPON_IDS[0],'Cannone Acceleratore Trifase I (nome provvisorio)',
 {damageMode:'sequence',sequenceStage:1,durationTurns:2,soloDamage:10,chainDamage:10},
 "Sequenza I (Fulmine): aggiunge 10 HP all'attacco per due tuoi turni. Solo nel turno successivo puoi sovrapporre Sequenza II; senza evoluzione, si scarta dopo il secondo attacco.");
const second=named(SEQUENCE_WEAPON_IDS[1],'Cannone Acceleratore Trifase II (nome provvisorio)',
 {damageMode:'sequence',sequenceStage:2,durationTurns:2,soloDamage:10,chainDamage:30},
 'Sequenza II (Fulmine): giocata da sola aggiunge 10 HP per un turno e si scarta. Se sovrapposta a Sequenza I nel turno successivo, aggiunge 30 HP e rimane per un turno in attesa di Sequenza III.');
const third=named(SEQUENCE_WEAPON_IDS[2],'Cannone Acceleratore Trifase III (nome provvisorio)',
 {damageMode:'sequence',sequenceStage:3,durationTurns:1,soloDamage:20,chainDamage:70},
 'Sequenza III (Fulmine): giocata da sola aggiunge 20 HP per un turno. Se sovrapposta a Sequenza II concatenata nel turno successivo, aggiunge 70 HP e poi si scarta.');
export const TEMP_SUPPORT_WEAPONS=Object.freeze([first,second,third]);
export const TEMP_SUPPORT_WEAPON_BY_ID=Object.freeze(Object.fromEntries(TEMP_SUPPORT_WEAPONS.map(d=>[d.id,d])));
