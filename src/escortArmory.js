// Eclissi Stellare — 17 famiglie, due armamenti per madre.
// Il seme è SOLO una chiave di caricamento. Nessun effetto automatico del seme.
// Nomi, danni, intercettazione e soglie sono parametri provvisori da bilanciare.
const p=(name,suits,role,damage,intercept,shield,mode='Immediata',threshold=0)=>
 Object.freeze({name,suits,role,damage,intercept,shield,mode,threshold});
export const ESCORT_ARMORY=Object.freeze({
 N00:[p('Velo Aurora','HD','Guardia',1,.20,.28),p('Lancia Aurora','CS','Incursore',2,.07,.24)],
 C01:[p('Sentinella Solare','HS','Guardia',2,.24,.30),p('Lama Rubino','DC','Assalto',3,.06,.20)],
 C02:[p('Prisma Custode','DH','Intercettore',2,.23,.29),p('Trapano di Vetro','SC','Assedio',4,.05,.22,'Accumulo',12)],
 C03:[p('Corvo Scudo','CS','Intercettore',2,.19,.26),p('Artiglio a Impulsi','HD','Incursore',3,.09,.21)],
 C04:[p('Velo Cremisi','SH','Guardia',2,.21,.28),p('Dardo d’Ombra','DC','Assalto',3,.07,.23)],
 R01:[p('Falco Sentinella','HD','Guardia',3,.25,.32),p('Cannone Binario','SC','Assedio',4,.06,.24,'Accumulo',14)],
 R02:[p('Manta Barriera','CS','Intercettore',3,.22,.28),p('Sting Ionico','DH','Incursore',4,.09,.22)],
 R03:[p('Iride Scudo','HDS','Guardia',3,.23,.31),p('Prisma Inverso','CD','Artiglieria',4,.06,.24,'Accumulo',12)],
 R04:[p('Scudo del Vuoto','DC','Guardia',3,.24,.32),p('Squalo Siluro','SH','Assedio',5,.05,.23,'Accumulo',13)],
 E01:[p('Baluardo Nebulosa','HDC','Baluardo',4,.28,.34),p('Pulsar Nebulosa','SDC','Artiglieria',5,.07,.26,'Accumulo',13)],
 E02:[p('Fronte Tempesta','SCH','Intercettore',4,.25,.32),p('Tuono Doppio','DHS','Assalto',5,.10,.25)],
 E03:[p('Scudo Fenice','HDS','Guardia',4,.26,.35),p('Rinascita Plasma','CSD','Artiglieria',5,.07,.26,'Accumulo',15)],
 E04:[p('Orizzonte Aegis','CDH','Baluardo',4,.27,.36),p('Orizzonte Lance','HDSC','Assalto',5,.11,.26)],
 L01:[p('Corona Reale','HDC','Baluardo',5,.29,.39),p('Verdetto Stellare','HDSC','Artiglieria',6,.10,.28,'Accumulo',15)],
 L02:[p('Sentinella Eclisse','SDC','Intercettore',5,.26,.38),p('Ascia del Vuoto','HDSC','Assalto',6,.12,.30)],
 L03:[p('Ala del Giudizio','HSD','Guardia',5,.30,.40),p('Lancia dell’Alba','HDSC','Assedio',7,.08,.29,'Accumulo',16)],
 L04:[p('Arca Eterna','HDSC','Baluardo',5,.30,.42),p('Sovrana del Crepuscolo','HDSC','Artiglieria',7,.12,.30,'Accumulo',17)]
});
export const ALL_SEMES=Object.freeze(['H','D','C','S']);
export const SEME_BY_CARD=Object.freeze({'♥':'H','♦':'D','♣':'C','♠':'S'});
export function escortArmamentFor(mother,slot){
 const list=ESCORT_ARMORY[mother?.id];
 if(!list||!Number.isInteger(slot)||slot<0||slot>1)throw new RangeError('Scudiera sconosciuta');
 const def=list[slot];
 return {id:`ESC-${mother.id}-${slot+1}`,name:def.name,role:def.role,
  suits:[...def.suits],damage:def.damage,interceptShare:def.intercept,shieldFactor:def.shield,
  tipo:def.mode,threshold:def.threshold,charge:0,
  // Usare un profilo VFX già esistente per mantenere proiettili e audio.
  sourceWeaponId:mother.weapons?.[slot%mother.weapons.length]?.id??'W01'};
}
export function activeArmaments(side){
 const mother=side.fleet.flatMap((v,index)=>v.weapons.map(w=>({
  kind:'mother',vesselIndex:index,id:w.id,name:w.nome,
  suits:w.tipo==='Combo a memoria'?(w.combo||'').split('@')[0].split('+'):w.seme_trigger==='*'?ALL_SEMES:[w.seme_trigger],
  sourceWeaponId:w.id
 })));
 const escorts=(side.escorts||[]).filter(e=>!e.defense.destroyed).map(e=>({
  kind:'escort',slot:e.slot,id:e.weapon.id,name:e.weapon.name,
  suits:e.weapon.suits,sourceWeaponId:e.weapon.sourceWeaponId
 }));
 return [...mother,...escorts];
}
// Due carte possono alimentare due armi, ma ogni carta viene assegnata UNA SOLA VOLTA.
// Il giocatore può scegliere un armamento preferito senza bloccare gli altri semi.
export function routedAmmo(side,cards,focus='auto'){
 const available=activeArmaments(side).filter(gun=>gun.suits.every(s=>ALL_SEMES.includes(s)));
 const routing=[],ammo=Object.create(null);
 for(const card of cards){
  const suit=SEME_BY_CARD[card?.suit],value=Number(card?.value);
  if(!suit||!Number.isInteger(value)||value<1||value>13)continue;
  const possible=available.filter(gun=>gun.suits.includes(suit));
  if(!possible.length){routing.push({suit,value,weaponId:null});continue;}
  const favorite=possible.find(gun=>gun.id===focus);
  const direct=possible.find(gun=>gun.kind==='mother'&&gun.suits.length===1);
  const choice=favorite??direct??possible.find(gun=>gun.kind==='escort')??possible[0];
  ammo[choice.id]=(ammo[choice.id]||0)+value;
  routing.push({suit,value,weaponId:choice.id});
 }
 return {ammo,routing};
}
