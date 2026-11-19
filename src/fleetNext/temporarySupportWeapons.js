// Nuove armi temporanee: nomi, elemento e valori tecnici ancora provvisori.
export const SEQUENCE_WEAPON_IDS=Object.freeze(['weapon-sequence-1','weapon-sequence-2','weapon-sequence-3']);
export const ESCORT_WEAPON_ID='weapon-escort-charge';
const named=(id,name,spec,effectProposed)=>Object.freeze({
 id,name,nome:name,category:'Arma di supporto',categoria:'Supporto',sottotipo:'Arma temporanea',
 kind:'support',playable:true,nativeFace:true,
 rarita:'Da definire',rarityPending:true,acquisitionPending:true,
 maxCopiesPerDeck:1,copyLimitPending:true,
 elementId:'ionic',elementPending:true,visualKey:'element-lightning',visualSymbol:'⚡',
 effectSpec:Object.freeze({type:'deployMachine',hp:1,power:0,elementId:'ionic',...spec}),
 effectProposed,visualBrief:'Nome, elemento e grafica ancora da definire.'
});
const first=named(SEQUENCE_WEAPON_IDS[0],'Sequenza Stellare I (provvisorio)',
 {damageMode:'sequence',sequenceStage:1,durationTurns:2,soloDamage:10,chainDamage:10},
 "Sequenza I (Fulmine): aggiunge 10 HP all'attacco per due tuoi turni. Solo nel turno successivo puoi sovrapporre Sequenza II; senza evoluzione, si scarta dopo il secondo attacco.");
const second=named(SEQUENCE_WEAPON_IDS[1],'Sequenza Stellare II (provvisorio)',
 {damageMode:'sequence',sequenceStage:2,durationTurns:2,soloDamage:10,chainDamage:30},
 'Sequenza II (Fulmine): giocata da sola aggiunge 10 HP per un turno e si scarta. Se sovrapposta a Sequenza I nel turno successivo, aggiunge 30 HP e rimane per un turno in attesa di Sequenza III.');
const third=named(SEQUENCE_WEAPON_IDS[2],'Sequenza Stellare III (provvisorio)',
 {damageMode:'sequence',sequenceStage:3,durationTurns:1,soloDamage:20,chainDamage:70},
 'Sequenza III (Fulmine): giocata da sola aggiunge 20 HP per un turno. Se sovrapposta a Sequenza II concatenata nel turno successivo, aggiunge 70 HP e poi si scarta.');
const escort=named(ESCORT_WEAPON_ID,'Amplificatore di Scorta (provvisorio)',
 {damageMode:'escort-count',durationTurns:2,baseDamage:15,perEscort:20},
 'Arma Fulmine per due tuoi turni: 15 HP di base +20 HP per ogni tua navicella di supporto ancora attiva in uno dei due slot. Le Fusioni contano come una sola navicella nello stesso slot.');
export const TEMP_SUPPORT_WEAPONS=Object.freeze([first,second,third,escort]);
export const TEMP_SUPPORT_WEAPON_BY_ID=Object.freeze(Object.fromEntries(TEMP_SUPPORT_WEAPONS.map(d=>[d.id,d])));
