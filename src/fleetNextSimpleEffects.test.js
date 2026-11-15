import test from 'node:test';
import assert from 'node:assert/strict';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,STARTER_DECK,deckFromCounts,card,cardRole} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,autoFleetTurn,validateFleetTurn,
 effectUnavailableReason,refreshEscortLinks,MAX_FLEET_ROUNDS} from './fleetNext/combat.js';
import {describeEffect,effectiveEffectSpec,validateEffectSpec,canUpgradeEffect} from './fleetNext/simpleEffects.js';
import {neutralTerrain,campaignTerrain} from './fleetNext/terrains.js';
import {PHASE16A_CAMPAIGN_PLANET_IDS} from './newCombat/phase16ACatalog.js';
import {createFleetInventory,upgradeFleetExclusive} from './fleetNext/collection.js';
const allCards=[...Object.values(GENERAL_CARDS),...Object.values(EXCLUSIVE_CARDS),...Object.values(BOSS_CARDS)];
const base=deckFromCounts(STARTER_DECK.carteGenerali);
const make=(options={})=>createFleetNextBattle({shipA:'C01',shipB:'C01',levelA:1,levelB:1,
 deckA:base,deckB:base,mode:'pvp',seed:25,...options});
const part=(b,who,id='engine')=>b.sides[who].ships[0].parts.find(p=>p.id===id);
function damageOwn(b,who,id,amount=1){const p=part(b,who,id);p.hp=Math.max(0,p.hp-amount);p.destroyed=p.hp===0;p.damage=p.destroyed?2:1;}
function turn(b,ids=[],extra={}){
 const who=b.turn;
 if(ids.length)b.sides[who].hand=[...ids,...Array(7-ids.length).fill('gen-002')];
 const target=b.sides[who==='A'?'B':'A'].ships[0].parts.find(p=>!p.destroyed);
 const result=resolveFleetNextTurn(b,who,{cards:ids.map((_,i)=>i),partId:target?.id,...extra},b.ply*1000+1);
 assert.equal(result.ok,true,result.reason);return result;
}
const pass=b=>turn(b,[],{pass:true,partId:null}).battle;
const bareFive=()=>{const b=make({levelA:5,levelB:5});b.sides.A.escorts=[];b.sides.B.escorts=[];return b;};

test('Tutte le 391 carte hanno un effetto esplicito e una descrizione condivisa',()=>{
 assert.equal(allCards.length,391);
 for(const c of allCards){
  assert.equal(validateEffectSpec(c.effectSpec),null,c.id);
  assert.equal(typeof describeEffect(c),'string',c.id);
  assert.ok(describeEffect(c).length<330,c.id);
  assert.equal(c.effetto||c.effectProposed,describeEffect(c),c.id+' testo divergente');
 }
});

test('La protezione riguarda solo il componente scelto e non si consuma su un altro',()=>{
 let b=turn(make(),['gen-092'],{ownPartId:'engine',pass:true}).battle;
 const weapons=part(b,'A','weapons').hp;
 b=turn(b,[],{partId:'weapons'}).battle;
 assert.equal(part(b,'A','weapons').hp,weapons-1);
 assert.equal(b.sides.A.protections[0].remaining,1);
 const engine=part(b,'A').hp;b=pass(b);b=turn(b,[],{partId:'engine'}).battle;
 assert.equal(part(b,'A').hp,engine);
 assert.equal(b.sides.A.protections.length,0);
});

test('Una protezione da due colpi si consuma su due attacchi e poi lascia passare',()=>{
 let b=turn(make(),['gen-106'],{ownPartId:'engine',pass:true}).battle;
 const hp=part(b,'A').hp;
 b=turn(b).battle;assert.equal(part(b,'A').hp,hp);assert.equal(b.sides.A.protections[0].remaining,1);
 b=pass(b);b=turn(b).battle;assert.equal(part(b,'A').hp,hp);assert.equal(b.sides.A.protections.length,0);
 b=pass(b);b=turn(b).battle;assert.equal(part(b,'A').hp,hp-1);
});

test('La protezione non usata scade all’inizio del prossimo turno del proprietario',()=>{
 let b=turn(make(),['gen-071'],{ownPartId:'engine',pass:true}).battle;
 assert.equal(b.sides.A.protections.length,1);
 b=pass(b);assert.equal(b.ply,2);assert.equal(b.sides.A.protections.length,0);
 assert.ok(b.sides.A.discard.includes('gen-071'));
 b=pass(b);const hp=part(b,'A').hp;b=turn(b).battle;assert.equal(part(b,'A').hp,hp-1);
});

test('La perforazione supera una protezione sul componente',()=>{
 let b=turn(make(),['gen-071'],{ownPartId:'engine',pass:true}).battle;
 const hp=part(b,'A').hp;b=turn(b,['gen-001']).battle;
 assert.equal(part(b,'A').hp,hp-1);
 assert.ok(b.lastEvents.some(e=>e.kind==='pierce'));
});

test('Le scudiere intercettano ancora i colpi perforanti e la protezione scudiera li blocca',()=>{
 let b=make({levelA:5});
 const mother=part(b,'A').hp,escort=b.sides.A.escorts[0].hp;
 b=turn(b,['gen-073'],{pass:true}).battle;
 const r=turn(b,['gen-001']);b=r.battle;
 assert.equal(r.shot.damage,0);assert.equal(r.shot.escortDamage,0);
 assert.equal(part(b,'A').hp,mother);assert.equal(b.sides.A.escorts[0].hp,escort);
 b=pass(b);const r2=turn(b,['gen-001']);
 assert.equal(r2.shot.damage,0);assert.ok(r2.shot.escortDamage>0);
});

test('Schivata richiede Motori attivi ed è annullata da Distesa Gelida',()=>{
 const broken=make();damageOwn(broken,'A','engine',99);
 assert.match(effectUnavailableReason(card('gen-072'),broken.sides.A,broken),/Motori/);
 let b=turn(make(),['gen-072'],{ownPartId:'engine',pass:true}).battle;
 const hp=part(b,'A').hp;b=turn(b,['gen-219']).battle;
 assert.equal(part(b,'A').hp,hp-1);
});

test('Riparazione: bersaglio scelto, limite massimo, nessuna ricostruzione',()=>{
 let b=make();damageOwn(b,'A','engine',2);damageOwn(b,'A','weapons',1);
 const engine=part(b,'A').hp,weapons=part(b,'A','weapons').hp;
 b=turn(b,['gen-171'],{ownPartId:'weapons',pass:true}).battle;
 assert.equal(part(b,'A').hp,engine);assert.equal(part(b,'A','weapons').hp,weapons+1);
 assert.match(effectUnavailableReason(card('gen-171'),b.sides.A,b,{ownPartId:'weapons'}),/Nessun danno/);
 const destroyed=make();damageOwn(destroyed,'A','engine',99);
 assert.match(effectUnavailableReason(card('gen-177'),destroyed.sides.A,destroyed),/Motori/);
});

test('Bersagli fissi e scudiere assenti vengono rifiutati prima di consumare la carta',()=>{
 const b=make();
 for(const id of ['gen-088','gen-073']){
  b.sides.A.hand[0]=id;
  assert.ok(validateFleetTurn(b,'A',{cards:[0],partId:'engine',ownPartId:'engine'}));
 }
 assert.match(effectUnavailableReason(card('gen-088'),b.sides.A,b),/Generatore/);
});

test('Rigenerazione su colpo: scatta su danno reale, anche intercettato, e non su colpo bloccato',()=>{
 let b=make({levelB:5});damageOwn(b,'A','engine',2);
 const hp=part(b,'A').hp;const r=turn(b,['gen-025']);
 assert.ok(r.shot.escortDamage>0);assert.equal(part(r.battle,'A').hp,hp+1);
 b=turn(make(),['gen-071'],{ownPartId:'engine',pass:true}).battle;
 damageOwn(b,'B','engine',2);const before=part(b,'B').hp;
 const blocked=turn(b,['gen-025']);assert.equal(blocked.shot.damage,0);assert.equal(part(blocked.battle,'B').hp,before);
});

test('Rigenerazione su danno si attiva una sola volta per turno anche con più componenti colpiti',()=>{
 let b=turn(bareFive(),['gen-085'],{pass:true}).battle;
 const sum=side=>side.ships[0].parts.reduce((n,p)=>n+p.hp,0);
 const hp=sum(b.sides.A);const r=turn(b,['gen-006']);
 assert.equal(r.shot.damage,2);assert.equal(sum(r.battle.sides.A),hp-1);
 assert.equal(r.events.filter(e=>e.kind==='repair'&&e.cardId==='gen-085').length,1);
});

test('Il contrattacco colpisce le Armi una volta e non innesca altri contrattacchi',()=>{
 let b=turn(bareFive(),['gen-091'],{pass:true}).battle;
 const aWeapons=part(b,'A','weapons').hp,bWeapons=part(b,'B','weapons').hp;
 const r=turn(b,['gen-091','gen-006']);b=r.battle;
 assert.equal(part(b,'B','weapons').hp,bWeapons-1);
 assert.equal(part(b,'A','weapons').hp,aWeapons-1); // secondo bersaglio della salva, nessuna ricorsione
 assert.equal(r.events.filter(e=>e.kind==='counter').length,1);
});

test('Il blocco delle Armi non può impedire due turni consecutivi ed è rimovibile',()=>{
 let b=turn(make(),['gen-141'],{pass:true}).battle;
 let r=turn(b);b=r.battle;assert.equal(r.shot.blocked,true);
 assert.match(effectUnavailableReason(card('gen-141'),b.sides.A,b),/consecutivi/);
 b=pass(b);r=turn(b);assert.equal(r.shot.damage,1);
 b=turn(make(),['gen-141'],{pass:true}).battle;
 const cleansed=turn(b,['gen-175']);assert.equal(cleansed.shot.damage,1);assert.equal(cleansed.battle.sides.B.fireBlocked,false);
});

test('Disturbi si consumano sul prossimo attacco; pulizia libera anche le scudiere bloccate',()=>{
 let b=turn(make(),['gen-121'],{pass:true}).battle;
 const first=turn(b);assert.equal(first.shot.power,1);assert.equal(first.battle.sides.B.buffs.filter(x=>x.kind==='jam').length,0);
 b=make({levelA:5});const escort=b.sides.A.escorts[0];escort.jammedUntilPly=8;
 refreshEscortLinks(b.sides.A,0);assert.equal(escort.linked,false);
 b=turn(b,['gen-175'],{pass:true}).battle;assert.equal(b.sides.A.escorts[0].linked,true);
});

test('La carica vale al prossimo proprio turno, non in quello corrente o successivi',()=>{
 let b=make();const basePower=1+b.sides.A.ships[0].weaponRating;
 let r=turn(b,['gen-008']);assert.equal(r.shot.power,basePower);b=pass(r.battle);
 r=turn(b);assert.equal(r.shot.power,basePower+1);b=pass(r.battle);
 r=turn(b);assert.equal(r.shot.power,basePower);
});

test('Personaggio applica esattamente ora e al prossimo proprio turno, poi scade',()=>{
 let b=make();damageOwn(b,'A','engine',3);
 b=turn(b,['gen-216'],{pass:true}).battle;assert.equal(part(b,'A').hp,2);
 b=pass(b);assert.equal(part(b,'A').hp,2);
 b=pass(b);assert.equal(part(b,'A').hp,3);b=pass(b);
 assert.equal(b.ply,4);assert.equal(b.sides.A.commander,null);
 b=pass(b);assert.equal(part(b,'A').hp,3);
 assert.ok(b.sides.A.discard.includes('gen-216'));
});

test('I gradi già salvati conservano quantità e descrizione anche quando non sono più acquistabili',()=>{
 const c=card('ex-r03-01');assert.equal(canUpgradeEffect(c,1),false);
 const b=make({shipA:'R03',upgradesA:{[c.id]:3}});const own=part(b,'A');damageOwn(b,'A',own.id,own.maxHp-1);
 const amount=effectiveEffectSpec(c,3).amount;assert.match(describeEffect(c,3),new RegExp(amount+' punti'));
 const r=turn(b,[c.id],{pass:true});assert.equal(part(r.battle,'A').hp,Math.min(own.maxHp,1+amount));
 const nonUpgradable=Object.values(EXCLUSIVE_CARDS).find(c=>c.effectSpec.type==='cleanse');
 assert.equal(canUpgradeEffect(nonUpgradable,1),false);
});

test('Nessun pagamento per riparazioni o rigenerazioni oltre la capacità reale della madre',()=>{
 const motherHeals=Object.values(EXCLUSIVE_CARDS).filter(c=>c.effectSpec.type==='regenerate'||
  c.effectSpec.type==='repair'&&c.effectSpec.target!=='escort');
 assert.equal(motherHeals.length,9);
 for(const c of motherHeals){
  assert.equal(canUpgradeEffect(c,1),false,c.id);assert.equal(canUpgradeEffect(c,2),false,c.id);
  const inventory=createFleetInventory();inventory.credits=1000;
  const result=upgradeFleetExclusive(inventory,c.id,c.shipId,5);
  assert.equal(result.ok,false,c.id);assert.equal(result.inventory.credits,1000,c.id);
  assert.deepEqual(result.inventory.exclusiveUpgrades,{},c.id);
 }
 const escortRepair=card('ex-r03-04');
 assert.equal(canUpgradeEffect(escortRepair,1),true);
 const inventory=createFleetInventory();inventory.credits=1000;
 const result=upgradeFleetExclusive(inventory,escortRepair.id,escortRepair.shipId,5);
 assert.equal(result.ok,true);assert.equal(result.inventory.credits,840);
 assert.equal(result.inventory.exclusiveUpgrades[escortRepair.id],2);
});

test('Protezioni fisse: nessun grado inutile, ma due turni consentono due colpi',()=>{
 assert.equal(canUpgradeEffect(card('ex-c01-01'),1),false,'Il personaggio rinnova una schivata per turno');
 assert.equal(canUpgradeEffect(card('ex-c01-04'),1),false,'Una scudiera riceve al massimo un attacco per turno');
 const twoTurns={...card('ex-c01-04'),effectSpec:{type:'protect',target:'escort',amount:1,turns:2}};
 assert.equal(canUpgradeEffect(twoTurns,1),true);assert.equal(canUpgradeEffect(twoTurns,2),false);
 for(const id of ['ex-l02-08','ex-l03-04','ex-l04-06'])assert.equal(canUpgradeEffect(card(id),1),false,id);
 for(const id of ['ex-n00-03','ex-e02-04','ex-r04-03']){
  assert.equal(canUpgradeEffect(card(id),1),true,id);assert.equal(canUpgradeEffect(card(id),2),true,id);
 }
});

test('Una protezione scelta migliorata blocca davvero più contrattacchi e il successivo attacco',()=>{
 let b=make({shipA:'N00',levelA:5,levelB:5,upgradesA:{'ex-n00-03':3}});
 b.sides.A.escorts=[];b.sides.B.escorts=[];
 b=pass(b);b=turn(b,['gen-091','gen-091'],{pass:true}).battle;
 const hp=part(b,'A','weapons').hp;
 b=turn(b,['ex-n00-03'],{ownPartId:'weapons',partId:'engine'}).battle;
 assert.equal(part(b,'A','weapons').hp,hp);assert.equal(b.sides.A.protections[0].remaining,1);
 b=turn(b,[],{partId:'weapons'}).battle;
 assert.equal(part(b,'A','weapons').hp,hp);assert.equal(b.sides.A.protections.length,0);
});

test('Ricambio non perde carte; recupero sceglie l’ultimo scarto adatto',()=>{
 let b=make();b.sides.A.discard=['gen-002','gen-071','gen-001'];
 const r=turn(b,['gen-198'],{pass:true});assert.equal(r.battle.sides.A.hand.length,7);
 assert.ok(r.battle.sides.A.hand.includes('gen-001'));
 b=make();const total=s=>s.hand.length+s.deck.length+s.discard.length+s.defenses.length+(s.commander?1:0);
 const before=total(b.sides.A);const swapped=turn(b,['gen-173'],{pass:true});
 assert.equal(total(swapped.battle.sides.A),before);assert.equal(swapped.battle.sides.A.hand.length,7);
});

test('Terreni: potenza pubblica per entrambe le flotte e durata esatta di tre round',()=>{
 let b=make();const basePower=1+b.sides.A.ships[0].weaponRating;
 let r=turn(b,['gen-238']);assert.equal(r.shot.power,basePower+1);b=r.battle;
 r=turn(b);assert.equal(r.shot.power,basePower+1);b=r.battle;
 while(b.ply<5)b=pass(b);assert.equal(b.terrain.id,'T02');
 b=pass(b);assert.equal(b.ply,6);assert.equal(b.terrain.id,null);
});

test('Campagna: ogni pianeta usa il proprio terreno anche senza un boss, con fallback dal settore globale',()=>{
 const expected=['T05','T02','T08','T10','T03','T01','T06','T01','T07','T09','T02','T10'];
 for(const [index,planetId] of PHASE16A_CAMPAIGN_PLANET_IDS.entries()){
  const sectorNumber=index*10+3;
  const inferred=make({mode:'campaign',sectorNumber});
  const explicit=make({mode:'campaign',sectorNumber,planetId});
  assert.equal(inferred.terrain.id,expected[index],'Settore '+sectorNumber);
  assert.equal(explicit.terrain.id,expected[index],'Pianeta '+planetId);
  assert.equal(inferred.planetId,planetId);
  assert.equal(explicit.bossId,null);
  assert.equal(campaignTerrain(index*10+1,planetId).id,null);
  assert.equal(campaignTerrain(index*10+2,planetId).id,null);
 }
 const localSector=make({mode:'campaign',sectorNumber:3,planetId:2});
 assert.equal(localSector.terrain.id,'T02');
 const boss=make({mode:'campaign',sectorNumber:40,planetId:6,bossId:6});
 assert.equal(boss.terrain.id,'T03');assert.equal(boss.terrain.source,'boss');
 assert.equal(make({mode:'pvp',sectorNumber:23,planetId:3}).terrain.id,null);
});

test('I danni del contrattacco non attivano rigenerazione su danno o altre reazioni',()=>{
 let b=turn(bareFive(),['gen-091'],{pass:true}).battle;
 const hp=part(b,'B','weapons').hp;
 const r=turn(b,['gen-085'],{partId:'engine'});
 assert.equal(part(r.battle,'B','weapons').hp,hp-1);
 assert.equal(r.events.filter(e=>e.kind==='repair'&&e.cardId==='gen-085').length,0);
});

test('Nebbia ferma la perforazione; Trono aggiunge un bersaglio; Palude impedisce riparazioni inutili',()=>{
 let b=turn(make(),['gen-071'],{pass:true,ownPartId:'engine'}).battle;
 let r=turn(b,['gen-221','gen-001']);assert.equal(r.shot.damage,0);
 r=turn(bareFive(),['gen-245']);assert.equal(r.shot.targets.length,2);
 b=make();b.terrain={id:'T08',expiresPly:null};damageOwn(b,'A','engine',2);const hp=part(b,'A').hp;
 assert.match(effectUnavailableReason(card('gen-171'),b.sides.A,b),/Palude/);
 b.sides.A.hand[0]='gen-171';
 const blocked=resolveFleetNextTurn(b,'A',{cards:[0],ownPartId:'engine',pass:true});
 assert.equal(blocked.ok,false);assert.equal(blocked.battle.sides.A.hand[0],'gen-171');
 // Il terreno entra prima, anche quando è stata selezionata prima la riparazione.
 r=turn(b,['gen-171','gen-238'],{ownPartId:'engine',pass:true});assert.equal(part(r.battle,'A').hp,hp+1);
 assert.equal(r.battle.terrain.id,'T02');
});

test('Tempesta aumenta i disturbi, Deserto i danni scudiera e Detriti riduce la potenza',()=>{
 let b=turn(make(),['gen-239','gen-121'],{pass:true}).battle;
 let r=turn(b);assert.equal(r.shot.power,0);assert.equal(r.shot.damage,0);
 b=make({levelB:5});r=turn(b,['gen-220']);
 assert.equal(r.shot.escortDamage,r.shot.power+1);
 b=make();const normal=1+b.sides.A.ships[0].weaponRating;
 r=turn(b,['gen-231']);assert.equal(r.shot.power,normal-1);
 r=turn(r.battle);assert.equal(r.shot.power,normal-1);
});

test('Scudiera locale protegge solo il suo componente; fase rispetta il turno di pausa',()=>{
 let b=make({shipB:'C02',levelB:5});
 let r=turn(b,[],{partId:'engine'});assert.equal(r.shot.damage,1);assert.equal(r.shot.escortDamage,undefined);
 b=pass(r.battle);r=turn(b,[],{partId:'generator'});assert.equal(r.shot.damage,0);assert.ok(r.shot.escortDamage>0);
 b=make({shipB:'N00',levelB:5});
 r=turn(b);assert.ok(r.shot.escortDamage>0);
 b=pass(r.battle);r=turn(b);assert.equal(r.shot.damage,1);
 b=pass(r.battle);r=turn(b);assert.ok(r.shot.escortDamage>0);assert.equal(r.shot.damage,0);
});

test('Guardia della scudiera riduce realmente la potenza ogni due propri turni',()=>{
 let b=make({shipB:'R02',levelB:5});
 let r=turn(b,[],{partId:'engine'});const normal=r.shot.power;
 b=pass(r.battle);r=turn(b,[],{partId:'weapons'});assert.equal(r.shot.power,normal);
 b=pass(r.battle);r=turn(b,[],{partId:'command'});assert.equal(r.shot.power,normal-1);
});

test('Foresta rigenera il componente più danneggiato; Quarzo aiuta solo la riparazione scudiera',()=>{
 let b=make();damageOwn(b,'A','engine',2);const hp=part(b,'A').hp;
 const r=turn(b,['gen-230']);assert.equal(part(r.battle,'A').hp,hp+1);
 b=make({levelA:5});b.terrain={id:'T09',expiresPly:null};b.sides.A.escorts[0].hp-=3;
 const escortHp=b.sides.A.escorts[0].hp;const repaired=turn(b,['gen-174'],{pass:true});
 assert.equal(repaired.battle.sides.A.escorts[0].hp,escortHp+2);
});

test('Difesa boss produce una riduzione effettiva, senza protezione solo nel log',()=>{
 let b=make({bossId:1});b.terrain=neutralTerrain();b=pass(b);
 b=turn(b,[],{pass:true}).battle;assert.ok(b.sides.B.buffs.some(x=>x.kind==='guard'));
 const r=turn(b);assert.equal(r.shot.power,1+b.sides.A.ships[0].weaponRating-1);
});

test('IA rispetta i limiti di ruolo e non gioca riparazioni o bersagli inutilizzabili',()=>{
 let b=make();b.sides.A.hand=['gen-071','gen-082','gen-092','gen-216','gen-217','gen-219','gen-238'];
 const o=autoFleetTurn(b,'A'),roles=o.cards.map(i=>cardRole(b.sides.A.hand[i]));
 assert.ok(roles.filter(x=>x==='defense').length<=2);assert.ok(roles.filter(x=>x==='character').length<=1);
 assert.ok(roles.filter(x=>x==='terrain').length<=1);assert.equal(validateFleetTurn(b,'A',o),null);
 b.sides.A.hand=['gen-171','gen-088','gen-073','gen-002','gen-002','gen-002','gen-002'];
 assert.ok(autoFleetTurn(b,'A').cards.every(i=>i>=3));
});

test('Ogni carta del catalogo può risolversi nel contesto compatibile senza eccezioni',()=>{
 for(const c of allCards){
  let b=make({shipA:c.shipId||'C01',levelA:5,levelB:5});
  for(const side of Object.values(b.sides)){
   for(const p of side.ships[0].parts){p.hp=Math.max(1,p.maxHp-1);p.damage=1;}
   for(const e of side.escorts)e.hp=Math.max(1,e.maxHp-2);
   side.discard=['gen-002','gen-071','gen-171'];
  }
  const own=b.sides.A.ships[0].parts[0].id;
  const result=turn(b,[c.id],{ownPartId:own});
  assert.equal(result.battle.sides.A.hand.length,7,c.id);
 }
});

test('Partite IA su tutte le 17 flotte terminano senza ordini illegali o cicli infiniti',()=>{
 const ships=[...new Set(Object.values(EXCLUSIVE_CARDS).map(c=>c.shipId))];
 for(const [index,shipA] of ships.entries()){
  let b=make({shipA,shipB:ships[(index+7)%ships.length],levelA:5,levelB:5,seed:700+index});
  for(let turnNumber=0;turnNumber<2*MAX_FLEET_ROUNDS&&b.phase==='playing';turnNumber++){
   const order=autoFleetTurn(b),result=resolveFleetNextTurn(b,b.turn,order,turnNumber*1000);
   assert.equal(result.ok,true,shipA+': '+result.reason);b=result.battle;
  }
  assert.equal(b.phase,'finished',shipA);assert.ok(b.finishReason);
 }
});

test('Cinquanta round di attesa producono un pareggio dichiarato',()=>{
 let b=make();for(let i=0;i<2*MAX_FLEET_ROUNDS;i++)b=pass(b);
 assert.equal(b.phase,'finished');assert.equal(b.winner,'draw');assert.match(b.finishReason,/50 round/);
});
