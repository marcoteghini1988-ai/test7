import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {shuffleFleetCards,recycleFleetDiscard} from './fleetNext/deckCycle.js';
import {createFleetNextBattle,resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {card,cardRole,cardDisplayFacePath as cardFacePath} from './fleetNext/rules.js';
import {FLEET_ELEMENTS} from './fleetNext/elementalAffinities.js';
import {FLEET_DECK_SHUFFLE_MS,fleetPileDepth,fleetPileView} from './fleetDeckPiles.js';
import {approvedWeaponSalvo} from './fleetNext/approvedWeaponSalvos.js';

const multiset=ids=>[...ids].sort();
test('Il rimescolamento conserva copie, input e sequenza casuale del motore',()=>{
 const cards=['gen-216','gen-216','sys-command-minus-c','energy-ionic'];
 const before=[...cards],expected=[...cards],rng={rng:1988},reference={rng:1988};
 for(let i=expected.length-1;i>0;i--){
  reference.rng=(1664525*(reference.rng>>>0)+1013904223)>>>0;
  const j=reference.rng%(i+1);[expected[i],expected[j]]=[expected[j],expected[i]];
 }
 const actual=shuffleFleetCards(cards,rng);
 assert.deepEqual(actual,expected);assert.equal(rng.rng,reference.rng);
 assert.deepEqual(cards,before);assert.deepEqual(multiset(actual),multiset(cards));
});

test('Ricicla soltanto un mazzo vuoto con scarti, una sola volta e senza perdere carte',()=>{
 const battle={rng:31,ply:7,round:4};
 const side={deck:['gen-216'],hand:[],discard:['sys-command-minus-c','sys-command-minus-c']};
 const before=structuredClone({battle,side});
 assert.equal(recycleFleetDiscard(battle,side),false);
 assert.deepEqual({battle,side},before);
 side.deck=[];
 const oldDiscard=side.discard;
 assert.equal(recycleFleetDiscard(battle,side),true);
 assert.equal(side.discard.length,0);
 assert.deepEqual(multiset(side.deck),multiset(oldDiscard));
 assert.deepEqual(side.deckShuffle,{serial:1,cards:oldDiscard,ply:7,round:4});
 assert.notEqual(side.deckShuffle.cards,oldDiscard);
 const once=structuredClone({battle,side});
 assert.equal(recycleFleetDiscard(battle,side),false);
 assert.deepEqual({battle,side},once);
 side.deck=[];side.discard=['gen-216'];
 assert.equal(recycleFleetDiscard(battle,side),true);
 assert.equal(side.deckShuffle.serial,2);
 assert.deepEqual(side.deckShuffle.cards,['gen-216']);
 side.deck=[];
 assert.equal(recycleFleetDiscard(battle,side),false);
});

test('La vera chiusura ESEGUI pesca, rimescola e riempie la mano senza duplicare carte',()=>{
 const battle=createFleetNextBattle({shipA:'N00',shipB:'N00',deckA:[],deckB:[],
  ruleset:HP_SYNC_RULESET,mode:'pvp',seed:51});
 const side=battle.sides.A;
 side.hand=['energy-ionic','energy-ionic','energy-ionic'];
 side.deck=['gen-216'];
 side.discard=['sys-command-minus-c','sys-weapons-minus-c','sys-generator-minus-c',
  'sys-bridge-minus-c','sys-command-minus-c'];
 const available=multiset([...side.hand,...side.deck,...side.discard]);
 const result=resolvePreparedFleetTurn(battle,'A',{cards:[],pass:true},100);
 assert.equal(result.ok,true,result.reason);
 const actual=result.battle.sides.A;
 assert.equal(actual.hand.length,7);
 assert.equal(actual.deck.length,2);
 assert.equal(actual.discard.length,0);
 assert.equal(actual.deckShuffle.serial,1);
 assert.deepEqual(actual.deckShuffle.cards,side.discard);
 assert.deepEqual(multiset([...actual.hand,...actual.deck,...actual.discard]),available);
 assert.equal(battle.sides.A.deckShuffle,undefined,'La simulazione non modifica il turno in ingresso');
});

test('Poche carte e ultimo scarto: mano parziale valida, nessuna carta fantasma nella pila',()=>{
 const battle=createFleetNextBattle({shipA:'N00',shipB:'N00',deckA:[],deckB:[],
  ruleset:HP_SYNC_RULESET,mode:'pvp'});
 battle.sides.A.hand=[];battle.sides.A.deck=[];battle.sides.A.discard=['gen-216'];
 const result=resolvePreparedFleetTurn(battle,'A',{cards:[],pass:true},0);
 assert.equal(result.ok,true,result.reason);
 const side=result.battle.sides.A;
 assert.deepEqual(side.hand,['gen-216']);assert.equal(side.deck.length,0);
 assert.equal(side.discard.length,0);assert.equal(side.deckShuffle.serial,1);
 assert.equal(fleetPileView(side).deckCount,0);
 const animation=fleetPileView(side,side.deckShuffle);
 assert.equal(animation.recycling,true);assert.deepEqual(animation.flyingCards,['gen-216']);
 assert.equal(animation.deckCount,0,'Il rimescolamento non inventa carte rimaste dopo la pesca');
});

test('La presentazione segue spessore e ultima carta reale, poi svuota gli scarti al termine',()=>{
 const side={deck:Array(20).fill('gen-216'),discard:['sys-weapons-minus-c','gen-216']};
 assert.ok(fleetPileDepth(20)>fleetPileDepth(10));assert.equal(fleetPileDepth(0),0);
 assert.deepEqual(fleetPileView(side).discardCards,side.discard);
 side.deckShuffle={serial:1,cards:[...side.discard]};side.discard=[];
 const moving=fleetPileView(side,side.deckShuffle);
 assert.equal(moving.recycling,true);assert.equal(moving.discardCards.at(-1),'gen-216');
 assert.equal(fleetPileView(side).discardCards.length,0);
 assert.equal(fleetPileView(side,{serial:0,cards:['gen-216']}).recycling,false);
});

const marksSource=readFileSync(new URL('./WeaponSalvoCardMarks.jsx',import.meta.url),'utf8');
const marksAst=ts.createSourceFile('WeaponSalvoCardMarks.jsx',marksSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);
const marksBody=marksAst.statements.filter(s=>!ts.isImportDeclaration(s)).map(s=>
 s.getText(marksAst).replace(/^export default /,'').replace(/^export /,'')).join('\n');
const marksCompiled=ts.transpileModule(marksBody,{compilerOptions:{target:ts.ScriptTarget.ES2022,
 jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
const integratedFronts=JSON.parse(readFileSync(new URL('./fleetNext/approvedWeaponIntegration.json',import.meta.url),'utf8'));
const WeaponSalvoCardMarks=new Function('React','useId','approvedWeaponSalvo','integratedFronts',marksCompiled+
 '\nreturn WeaponSalvoCardMarks;')(React,React.useId,approvedWeaponSalvo,integratedFronts);
const source=readFileSync(new URL('./FleetDeckPiles.jsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('FleetDeckPiles.jsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);
const body=ast.statements.filter(s=>!ts.isImportDeclaration(s)).map(s=>
 s.getText(ast).replace(/^export default /,'').replace(/^export /,'')).join('\n');
const compiled=ts.transpileModule(body,{compilerOptions:{target:ts.ScriptTarget.ES2022,
 jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
const scope={React,...Object.fromEntries(['useEffect','useLayoutEffect','useRef','useState'].map(k=>[k,React[k]])),
 card,cardRole,cardFacePath,FLEET_ELEMENTS,OFFICIAL_FLEET_DRAW_BACK:null,
 FLEET_DECK_SHUFFLE_MS,fleetPileDepth,fleetPileView,WeaponSalvoCardMarks};
const {FleetDeckPiles,FleetCardPile}=new Function(...Object.keys(scope),compiled+
 '\nreturn {FleetDeckPiles,FleetCardPile};')(...Object.values(scope));

test('Il renderer mostra il dorso configurato e le facce vere degli ultimi scarti',()=>{
 const side={deck:['gen-216','gen-216'],discard:['sys-weapons-minus-c','gen-216']};
 const html=renderToStaticMarkup(React.createElement(FleetDeckPiles,{side,backSrc:'/assets/dorso-futuro.webp'}));
 assert.match(html,/src="\/assets\/dorso-futuro.webp"/);
 assert.match(html,/data-custom-back="true"/);
 assert.match(html,/Scarti: 2 carte/);assert.match(html,/Mazzo: 2 carte rimaste/);
 assert.match(html,/data-family="attack"/);
 assert.match(html,/Meccanico di Bordo/);
 assert.match(html,/src="\/assets\/fleet-next-cards\/gen-216.svg"/);
 const empty=renderToStaticMarkup(React.createElement(FleetCardPile,{kind:'discard',count:0}));
 assert.doesNotMatch(empty,/<img/);assert.doesNotMatch(empty,/fleet-pile-stack/);
 const fallback=renderToStaticMarkup(React.createElement(FleetDeckPiles,{side}));
 assert.match(fallback,/data-custom-back="false"/);
 assert.doesNotMatch(fallback,/src="null"|src="undefined"/);
});
test('The discard uses the complete approved red Slitta face without obsolete salvo overlays',()=>{
 const html=renderToStaticMarkup(React.createElement(FleetDeckPiles,{side:{deck:[],discard:['weapon-confirmed-metallic-slitta']}}));
 assert.doesNotMatch(html,/data-salvo-count|3 SHOTS|TOTAL DAMAGE/);
 assert.match(html,/fleet-weapon-fronts-red\/weapon-confirmed-metallic-slitta\.png/);
});
