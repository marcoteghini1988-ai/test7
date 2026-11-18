// Collaudo della nuova Trappola anti-Fusione nel motore ufficiale HP.
// Nessun acquisto, immagine o rarità definitiva vengono aggiunti.
import test from 'node:test';
import assert from 'node:assert/strict';
import {FUSION_DENIAL_TRAP,card,cardRole,cardCopyLimit,cardFacePath}
 from './fleetNext/rules.js';
import {isTrapCard,describeEffect,validateEffectSpec}
 from './fleetNext/simpleEffects.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn}
 from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {supportModelIdFor} from './fleetNext/supportCatalog.js';
import {projectFleetSlots,fleetEventText} from './fleetNext/battlePresentation.js';
import {createFleetInventory,normalizeFleetInventory} from './fleetNext/collection.js';
import {buildNextBaseDeck,canSelectNewGeneric,buyNextCommonCard}
 from './fleetNext/nextDeckLoadout.js';

const TRAP='trap-fusion-denial';
const roster=(ids=['N00','C03'],rarita='Leggendaria')=>
 ids.map((model,slot)=>({id:supportModelIdFor(model),
  instanceId:'integration:'+slot,slot,rarita,level:1}));
function fresh(ids=['N00','C03'],rarita='Leggendaria'){
 const battle=createFleetNextBattle({
  shipA:'N00',shipB:'C03',raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:roster(ids,rarita),supportRosterB:[],
  deckA:[],deckB:[],ruleset:HP_SYNC_RULESET,
  mode:'pvp',seed:9001,nowMs:0
 });
 for(const side of Object.values(battle.sides)){
  side.hand=[];side.deck=[];side.discard=[];
 }
 return battle;
}
function play(b,who,ids=[],order={}){
 const side=b.sides[who];
 side.hand=[...ids];
 const result=resolveFleetNextTurn(b,who,
  {cards:ids.map((_,i)=>i),pass:true,...order},b.ply*1000+100);
 assert.equal(result.ok,true,result.reason);
 return result;
}
function armed(){
 let b=fresh();
 b=play(b,'A').battle;
 const placement=play(b,'B',[TRAP]);
 assert.equal(placement.battle.sides.B.defenses.length,1);
 return placement;
}

test('Trappola registrata come Difesa coperta, rarità e acquisizione ancora da decidere',()=>{
 assert.equal(card(TRAP),FUSION_DENIAL_TRAP);
 assert.equal(cardRole(TRAP),'defense');
 assert.equal(isTrapCard(card(TRAP)),true);
 assert.equal(validateEffectSpec(card(TRAP).effectSpec),null);
 assert.equal(describeEffect(card(TRAP)),card(TRAP).effectProposed);
 assert.equal(cardFacePath(TRAP),null);
 assert.equal(cardCopyLimit(TRAP),1);
 assert.equal(FUSION_DENIAL_TRAP.acquisitionPending,true);
 assert.equal(FUSION_DENIAL_TRAP.rarityPending,true);
 assert.equal(canSelectNewGeneric(TRAP),true);
 const inv=createFleetInventory();
 assert.equal(buyNextCommonCard(inv,TRAP).ok,false,
  'nessun prezzo o acquisto introdotto prima della fase commerciale');
 inv.owned[TRAP]=1; // copia di collaudo assegnata in memoria, non nel gioco
 const saved=normalizeFleetInventory(inv);
 assert.equal(saved.owned[TRAP],1);
 const deck=buildNextBaseDeck(saved,'N00',20,[TRAP]);
 assert.deepEqual(deck.baseDeck,[TRAP]);
 assert.equal(deck.discarded.length,0);
});

test('Copertura della Trappola: il nemico non ne vede nome, ID o effetto',()=>{
 const result=armed(),b=result.battle;
 const entry=b.sides.B.defenses[0];
 assert.equal(entry.hidden,true);
 assert.equal(entry.trigger,'shipFusion');
 assert.equal(entry.action,'cancel');
 assert.equal(entry.untilPly,null);
 assert.deepEqual(projectFleetSlots(b.sides.B,[],'B','A')[2],
  {hidden:true,pending:false});
 assert.equal(projectFleetSlots(b.sides.B,[],'B','B')[2].id,TRAP);
 assert.ok(!fleetEventText(result.events.find(e=>e.kind==='trap-set'),'A')
  .includes('Interdizione'));
 assert.equal(result.events.some(e=>e.kind==='trap-reveal'),false);
});

test('Fusione bloccata: la Trappola si gira, carta Fusione scartata, HP e supporti intatti',()=>{
 const ready=armed();
 const b=ready.battle,original=structuredClone(b.sides.A.escorts);
 const before=JSON.stringify(b);
 const blocked=play(b,'A',['fusion-ship-r01'],{fusionSlot:0});
 assert.equal(JSON.stringify(b),before,'la funzione non modifica il parametro originale');
 assert.deepEqual(blocked.battle.sides.A.escorts,original);
 assert.equal(blocked.battle.sides.A.fusionsUsed,0);
 assert.equal(blocked.battle.sides.A.fusionLimit,2);
 assert.equal(blocked.battle.sides.A.discard.includes('fusion-ship-r01'),true);
 assert.equal(blocked.battle.sides.B.discard.filter(id=>id===TRAP).length,1);
 assert.equal(blocked.battle.sides.B.defenses.length,0);
 assert.equal(blocked.events.filter(e=>e.kind==='trap-reveal'&&e.cardId===TRAP).length,1);
 assert.ok(blocked.events.some(e=>e.kind==='fusion-cancelled'&&e.cardId==='fusion-ship-r01'));
 assert.ok(!blocked.events.some(e=>e.kind==='fusion'));
});

test('Dopo un annullamento la Fusione è di nuovo possibile con una seconda carta',()=>{
 let b=armed().battle;
 b=play(b,'A',['fusion-ship-r01'],{fusionSlot:0}).battle;
 b=play(b,'B').battle;
 const result=play(b,'A',['fusion-ship-l04'],{fusionSlot:1});
 assert.equal(result.battle.sides.A.fusionsUsed,1);
 assert.equal(result.battle.sides.A.escorts[0].fused,false);
 assert.equal(result.battle.sides.A.escorts[1].fused,true);
 assert.equal(result.events.filter(e=>e.kind==='fusion').length,1);
 assert.equal(result.events.filter(e=>e.kind==='trap-reveal').length,0);
});

test('La Trappola non si consuma se la carta Fusione non viene giocata',()=>{
 let b=armed().battle;
 const quiet=play(b,'A',[]);
 assert.equal(quiet.battle.sides.B.defenses[0].hidden,true);
 assert.equal(quiet.battle.sides.B.discard.includes(TRAP),false);
 assert.equal(quiet.events.filter(e=>e.kind==='trap-reveal').length,0);
});

test('Fusione non valida: la verifica si ferma prima di rivelare la Trappola',()=>{
 let b=fresh(['N00','C03'],'Comune');
 b=play(b,'A').battle;
 b=play(b,'B',[TRAP]).battle;
 b.sides.A.hand=['fusion-ship-r01'];
 const before=JSON.stringify(b);
 const outcome=resolveFleetNextTurn(b,'A',{cards:[0],fusionSlot:0,pass:true},2100);
 assert.equal(outcome.ok,false);
 assert.match(outcome.reason,/Leggendario/);
 assert.equal(JSON.stringify(b),before);
 assert.equal(b.sides.B.defenses[0].hidden,true);
});

test('Soppressione Trappole attiva: Interdizione resta coperta e Fusione riesce',()=>{
 let b=fresh(['C02','N00']);
 b=play(b,'A').battle;
 b=play(b,'B',[TRAP]).battle;
 const result=play(b,'A',['fusion-ship-r01'],{fusionSlot:0});
 assert.equal(result.battle.sides.A.fusionsUsed,1);
 assert.equal(result.battle.sides.A.escorts[0].fused,true);
 assert.equal(result.battle.sides.B.defenses[0].hidden,true);
 assert.ok(!result.events.some(e=>e.kind==='trap-reveal'));
});

test('Trappola nemica rivelata anche quando il giocatore che tenta la Fusione è B',()=>{
 const original=fresh();
 original.sides.A.hand=[TRAP];
 const first=play(original,'A',[TRAP]);
 assert.equal(first.battle.sides.A.defenses.length,1);
 const b=first.battle;
 // Equipaggiamento B tecnico ai soli fini del test; nessun dato reale alterato.
 const technical=fresh();
 b.sides.B.escorts=structuredClone(technical.sides.A.escorts);
 b.sides.B.fusionLimit=2;
 b.sides.B.independentSupportRoster=true;
 const blocked=play(b,'B',['fusion-ship-r01'],{fusionSlot:1});
 assert.equal(blocked.battle.sides.B.fusionsUsed,0);
 assert.equal(blocked.battle.sides.B.discard.includes('fusion-ship-r01'),true);
 assert.equal(blocked.battle.sides.A.discard.includes(TRAP),true);
 assert.ok(blocked.events.some(e=>e.kind==='trap-reveal'&&e.who==='A'));
});
