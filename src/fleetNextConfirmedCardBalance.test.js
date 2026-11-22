// Regressione dei soli cataloghi e delle carte confermate (senza bilanciare Personaggi).
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,NEXT_COMMON_CARDS,DISMANTLE_CARDS,EXCLUSIVE_CARDS,
 ENERGY_CARDS,FUSION_SHIP_CARDS,FUSION_DENIAL_TRAP,DISCARD_WEAPON,
 TEMP_SUPPORT_WEAPONS} from './fleetNext/rules.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {TERRAIN_CATALOG} from './fleetNext/terrains.js';
import {CONFIRMED_CARD_BALANCE,supportRegenerationPerSecond,supportPoisonPerSecond,
 supportLastShieldHeal,supportCapacitorDamage,arsenalTierRate} from './fleetNext/confirmedCardBalance.js';
import {createFleetNextBattle,advanceFleetCombatTime,resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {settleIndependentSupportDamage,advanceIndependentSupportTime,
 resolveIndependentSupportOwnTurn} from './fleetNext/supportAbilities.js';
import {arsenalBonus,applySystemCard,supportWeaponCharge} from './fleetNext/newCardEffects.js';
import {projectMachineBerths} from './fleetNext/battlePresentation.js';

const roster=(skill,side='A')=>{
 const model=SUPPORT_CATALOG.find(c=>c.skillId===skill);
 assert.ok(model,skill);
 return [{id:model.id,supportId:model.id,instanceId:'balance:'+side+':'+skill,slot:0,rarita:'Leggendaria'}];
};
const battle=(skillA=null,skillB=null)=>{
 const b=createFleetNextBattle({shipA:'L04',shipB:'L04',
  raritaA:'Leggendaria',raritaB:'Leggendaria',
  ruleset:HP_SYNC_RULESET,mode:'pvp',seed:20261119,nowMs:0,
  supportRosterA:skillA?roster(skillA):[],
  supportRosterB:skillB?roster(skillB):[],
  deckA:[],deckB:[]});
 for(const side of Object.values(b.sides)){side.hand=[];side.deck=[];}
 return b;
};

test('Audit: solo 12 madri, 13 supporti, Attacchi Sistemi, Smontaggio, Energie, Trappola, Armi e Fusione',()=>{
 assert.equal(NEXT_COMMON_CARDS.length,33);
 assert.equal(NEXT_COMMON_CARDS.filter(c=>c.effectSpec.type==='systemModifier').length,32);
 assert.equal(DISMANTLE_CARDS.length,4);
 assert.equal(ENERGY_CARDS.length,40);
 assert.equal(FUSION_SHIP_CARDS.length,13);
 assert.equal(SUPPORT_CATALOG.length,13);
 assert.equal(Object.keys(TERRAIN_CATALOG).length,130);
 assert.equal(TEMP_SUPPORT_WEAPONS.length,3);
 assert.equal(DISCARD_WEAPON.id,'weapon-memory-plasma');
 assert.equal(FUSION_DENIAL_TRAP.id,'trap-fusion-denial');
 assert.equal(Object.values(EXCLUSIVE_CARDS).length,120);
 const withoutCharacters=Object.values(EXCLUSIVE_CARDS).filter(c=>c.kind!=='character');
 assert.equal(withoutCharacters.length,108);
 for(const entry of [...NEXT_COMMON_CARDS,...DISMANTLE_CARDS,...ENERGY_CARDS,
  ...FUSION_SHIP_CARDS,...TEMP_SUPPORT_WEAPONS,DISCARD_WEAPON,FUSION_DENIAL_TRAP,
  ...withoutCharacters]){
  assert.equal(card(entry.id)?.id,entry.id);
 }
});

test('Percentuali e limiti delle 13 passive: calibrazione senza alterare la versione storica',()=>{
 const modern={maxHp:1000,hp:500,defensePercent:10};
 const old={maxHp:42,hp:30};
 const escort={maxHp:200,hp:200};
 assert.equal(supportRegenerationPerSecond(old),.1);
 assert.equal(supportPoisonPerSecond(old,old),.1);
 assert.equal(supportLastShieldHeal(old),25);
 assert.equal(supportCapacitorDamage(old,old),1);
 assert.equal(supportRegenerationPerSecond(modern),.6);
 assert.equal(supportPoisonPerSecond(modern,modern),.7);
 assert.equal(supportPoisonPerSecond(escort,modern),.2);
 assert.equal(supportLastShieldHeal(modern),55);
 assert.equal(supportCapacitorDamage(modern,modern),25);
 assert.equal(supportCapacitorDamage(escort,modern),9);
 assert.deepEqual(CONFIRMED_CARD_BALANCE.arsenalTierPercent,[8,12,17,23]);
 assert.ok(arsenalTierRate(4)>arsenalTierRate(1));
});

test('Rigenerazione percentuale su una nave Leggendaria, senza superare HP massimi',()=>{
 const b=battle(null,'regeneration');
 b.sides.B.ships[0].hp=900;
 const r=advanceIndependentSupportTime(b,10000);
 assert.equal(r.changed,true);
 assert.equal(r.battle.sides.B.ships[0].hp,906);
 assert.equal(advanceIndependentSupportTime(r.battle,10000).changed,false);
 assert.equal(b.sides.B.ships[0].hp,900);
});

test('Veleno e Capacitore crescono con gli HP, ma funzionano una volta per attivazione',()=>{
 const b=battle('capacitor','reactive-poison');
 const victim=b.sides.A.ships[0];
 b.sides.B.escorts[0].hp-=10;
 b.turn='A';b.ply=0;
 const notice=settleIndependentSupportDamage(b,'A');
 assert.ok(notice.some(x=>x.kind==='support-poison'));
 b.turn='A';b.ply=2;b.turnStartedAtMs=0;b.deadlineMs=30000;b.supportSecondsProcessed=0;
 const original=victim.hp;
 const poison=advanceIndependentSupportTime(b,10000);
 assert.ok(poison.battle.sides.A.ships[0].hp<=original-6,
  'il veleno della rarita Leggendaria non vale piu un solo HP');
 const capacitor=battle('capacitor');
 const before=capacitor.sides.B.ships[0].hp;
 resolveIndependentSupportOwnTurn(capacitor,'A');
 capacitor.ply=2;resolveIndependentSupportOwnTurn(capacitor,'A');
 capacitor.ply=4;
 const events=resolveIndependentSupportOwnTurn(capacitor,'A');
 assert.ok(events.some(x=>x.kind==='support-lightning'));
 const after=capacitor.sides.B.ships[0].hp;
 assert.ok(before-after>=20&&before-after<=25,
  'la scarica segue gli HP della madre e la riduzione difensiva');
});

test('Last Shield a Leggendaria cura circa il 5,5% della madre, senza duplicazione',()=>{
 const b=battle('last-shield');
 const side=b.sides.A,mother=side.ships[0],unit=side.escorts[0];
 mother.hp=500;
 unit.hp=0;unit.destroyed=true;
 const event=settleIndependentSupportDamage(b,'B');
 assert.equal(event.filter(x=>x.kind==='support-death').length,1);
 assert.equal(mother.hp,555);
 assert.equal(settleIndependentSupportDamage(b,'B').length,0);
});

test('Arsenale ora modifica in percentuale armi con danni elevati e supporto Armeria raddoppia',()=>{
 const b=battle('weapon-double'),side=b.sides.A;
 const weapon={id:'memory',sourceCardId:'weapon-memory-plasma',slot:0,hp:1,power:1,
  damageMode:'discard-attacks',baseDamage:10,perDiscardAttack:10,
  energyMultiplier:2,weaponElementId:'plasma',untilPly:10};
 side.machines=[weapon];side.systemCardEffects=[];
 assert.equal(arsenalBonus(side,weapon,0,100),200);
 const amplified=applySystemCard(side,card('sys-weapons-plus-c'),0,'A');
 assert.equal(amplified.replaced,true);
 assert.equal(arsenalBonus(side,weapon,0,100),216);
 side.systemCardEffects=[];
 applySystemCard(side,card('sys-weapons-minus-c'),0,'B');
 assert.equal(arsenalBonus(side,weapon,0,100),184);
 const projected=projectMachineBerths(side,[],0);
 assert.equal(projected.length,2);
 assert.equal(projected[0].sourceCardId,'weapon-memory-plasma');
 assert.equal(projected[0].nominalDamage,18);
 assert.ok(CONFIRMED_CARD_BALANCE.escortWeapon.maxActiveSupports===2);
});


test('Rigenerazione: un incremento per secondo durante preparazione e mai duplicato',()=>{
 const b=battle(null,'regeneration');
 const mother=b.sides.B.ships[0];
 mother.hp=900;
 const rate=supportRegenerationPerSecond(mother);
 const one=advanceIndependentSupportTime(b,1000);
 assert.equal(one.changed,true);
 assert.equal(one.battle.sides.B.ships[0].hp,Math.round((900+rate)*10)/10);
 assert.equal(b.sides.B.ships[0].hp,900,'nessuna mutazione del turno originale');
 const duplicate=advanceIndependentSupportTime(one.battle,1500);
 assert.equal(duplicate.changed,false,'il mezzo secondo aggiuntivo non vale un secondo intero');
 const two=advanceIndependentSupportTime(one.battle,2000);
 assert.equal(two.battle.sides.B.ships[0].hp,Math.round((900+2*rate)*10)/10);
 const full=advanceIndependentSupportTime(two.battle,30000);
 assert.equal(full.battle.supportSecondsProcessed,30);
 assert.equal(full.battle.sides.B.ships[0].hp,Math.round((900+30*rate)*10)/10);
 const after=advanceIndependentSupportTime(full.battle,34000);
 assert.equal(after.changed,false,'non applicare effetti oltre i 30 secondi');
});

test('Veleno reattivo: toglie HP ogni secondo di preparazione, anche senza carte giocate',()=>{
 const b=battle(null,'reactive-poison');
 const support=b.sides.B.escorts[0];
 support.poisonReadyPly=b.ply;
 const target=b.sides.A.ships[0],initial=target.hp;
 const rate=supportPoisonPerSecond(target,target);
 const one=advanceIndependentSupportTime(b,1000);
 assert.equal(one.changed,true);
 assert.equal(one.battle.sides.A.ships[0].hp,Math.round((initial-rate)*10)/10);
 const sameSecond=advanceIndependentSupportTime(one.battle,1999);
 assert.equal(sameSecond.changed,false);
 const two=advanceIndependentSupportTime(one.battle,2000);
 assert.equal(two.battle.sides.A.ships[0].hp,Math.round((initial-2*rate)*10)/10);
 const full=advanceIndependentSupportTime(two.battle,30000);
 assert.equal(full.battle.sides.A.ships[0].hp,Math.round((initial-30*rate)*10)/10);
 assert.equal(full.battle.supportSecondsProcessed,30);
 assert.equal(b.sides.A.ships[0].hp,initial,'il modello di preparazione non modifica la partita iniziale');
});


test('TEMPO_REALE_20261122: nella partita strategica Rigenerazione segue i secondi, non i 20s dei componenti',()=>{
 const create=()=>createFleetNextBattle({shipA:'L04',shipB:'L04',
  raritaA:'Leggendaria',raritaB:'Leggendaria',deckA:[],deckB:[],
  supportRosterA:[],supportRosterB:roster('regeneration','B'),
  ruleset:HP_SYNC_RULESET,mode:'pvp',seed:221122,nowMs:0,
  newGeneratorCombat:true,strategicNoDeterioration:true});
 const b=create();b.sides.B.ships[0].hp=900;
 const rate=supportRegenerationPerSecond(b.sides.B.ships[0]);
 const tick=advanceFleetCombatTime(b,3000);
 assert.equal(tick.changed,true,'La rigenerazione deve partire DURANTE preparazione');
 assert.equal(tick.battle.sides.B.ships[0].hp,Math.round((900+3*rate)*10)/10);
 assert.equal(tick.battle.sides.A.componentElapsedSeconds,0,
  'Il timer dei componenti non avanza durante preparazione');
 const repeated=advanceFleetCombatTime(tick.battle,3900);
 assert.equal(repeated.changed,false,'Non contare due volte lo stesso secondo');
 const resolved=resolvePreparedFleetTurn(tick.battle,'A',{cards:[],pass:true},6000);
 assert.equal(resolved.ok,true,resolved.reason);
 assert.equal(resolved.battle.sides.B.ships[0].hp,Math.round((900+6*rate)*10)/10,
  'Conferma al sesto secondo: non sostituire con 20 secondi fissi');
 assert.equal(resolved.battle.sides.A.componentElapsedSeconds,20);
 assert.equal(resolved.battle.sides.B.componentElapsedSeconds,0);
 const slow=create();slow.sides.B.ships[0].hp=900;
 const long=resolvePreparedFleetTurn(slow,'A',{cards:[],pass:true},26000);
 assert.equal(long.ok,true,long.reason);
 assert.equal(long.battle.sides.B.ships[0].hp,Math.round((900+26*rate)*10)/10);
 assert.equal(long.battle.sides.A.componentElapsedSeconds,20,
  '6s o 26s reali consumano stessa quota dei componenti');
});

test('TEMPO_REALE_20261122: Veleno avanza al secondo, non duplica tick e rispetta max 30s',()=>{
 const create=()=>createFleetNextBattle({shipA:'L04',shipB:'L04',
  raritaA:'Leggendaria',raritaB:'Leggendaria',deckA:[],deckB:[],
  supportRosterA:[],supportRosterB:roster('reactive-poison','B'),
  ruleset:HP_SYNC_RULESET,mode:'pvp',seed:221123,nowMs:0,
  newGeneratorCombat:true,strategicNoDeterioration:true});
 const b=create();b.sides.B.escorts[0].poisonReadyPly=0;
 const mother=b.sides.A.ships[0],initial=mother.hp;
 const rate=supportPoisonPerSecond(mother,mother);
 const tick=advanceFleetCombatTime(b,4000);
 assert.equal(tick.battle.sides.A.ships[0].hp,Math.round((initial-4*rate)*10)/10);
 const duplicate=advanceFleetCombatTime(tick.battle,4200);
 assert.equal(duplicate.changed,false);
 const resolution=resolvePreparedFleetTurn(tick.battle,'A',{cards:[],pass:true},9000);
 assert.equal(resolution.ok,true,resolution.reason);
 assert.equal(resolution.battle.sides.A.ships[0].hp,Math.round((initial-9*rate)*10)/10);
 assert.equal(resolution.battle.sides.A.componentElapsedSeconds,20);
 const capped=create();capped.sides.B.escorts[0].poisonReadyPly=0;
 const result=advanceFleetCombatTime(capped,36000);
 assert.equal(result.battle.supportSecondsProcessed,30);
 assert.equal(result.battle.sides.A.ships[0].hp,Math.round((initial-30*rate)*10)/10,
  'Non aggiungere danno oltre il limite di preparazione');
});
