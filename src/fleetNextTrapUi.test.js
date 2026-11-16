import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {card,cardRole,cardFacePath} from './fleetNext/rules.js';
import {describeEffect} from './fleetNext/simpleEffects.js';
import {projectFleetSlots,fleetEventText,fleetTurnNotice} from './fleetNext/battlePresentation.js';
import {OFFICIAL_SPECIAL_FIXED_BACK} from './officialDeckBackArt.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';

const source=readFileSync(new URL('./OfficialFleetBattle3D.jsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('OfficialFleetBattle3D.jsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);
function component(name){
 const declaration=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
 assert.ok(declaration,name+' deve essere un componente reale della plancia');
 const compiled=ts.transpileModule(declaration.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
 return new Function('React','card','cardRole','cardFacePath','describeEffect','OFFICIAL_SPECIAL_FIXED_BACK','officialSpecialArtPath',compiled+'\nreturn '+name+';')(
  React,card,cardRole,cardFacePath,describeEffect,OFFICIAL_SPECIAL_FIXED_BACK,officialSpecialArtPath);
}
const Slots=component('OriginalSpecialSlots'),Reveal=component('TrapReveal');
const side={defenses:[{id:'gen-077',source:'gen-077@0-1',hidden:true,untilPly:null}],defenseSlots:['gen-077'],attackSlots:['gen-001']};
function elements(tree){
 if(Array.isArray(tree))return tree.flatMap(elements);
 return React.isValidElement(tree)?[tree,...elements(tree.props.children)]:[];
}

test('La proiezione degli slot conserva le sei posizioni anche con una sola Difesa',()=>{
 const slots=projectFleetSlots(side,[],'A');
 assert.equal(slots.length,6);
 assert.equal(slots[0],null);
 assert.equal(slots[1],null);
 assert.equal(slots[2].id,'gen-077');
 assert.equal(slots[3].id,'gen-001');
 const selected=projectFleetSlots(side,['gen-071'],'A');
 assert.equal(selected[1].id,'gen-071');
 assert.equal(selected[3].id,'gen-001');
});

test('La proiezione avversaria non contiene identità, origine o rarità della trappola',()=>{
 const original=JSON.stringify(side);
 const slots=projectFleetSlots(side,[],'B');
 assert.deepEqual(slots[2],{hidden:true,pending:false});
 assert.doesNotMatch(JSON.stringify(slots),/gen-077|Ancora|Comune|source/);
 assert.equal(JSON.stringify(side),original);
 const alternate={...side,defenses:[{...side.defenses[0],id:'gen-120'}]};
 assert.deepEqual(projectFleetSlots(alternate,[],'B'),slots,'l’identità coperta non deve cambiare il modello pubblico');
});

test('Il vero renderer mostra solo il dorso unico per una trappola avversaria',()=>{
 const slots=projectFleetSlots({...side,attackSlots:[]},[],'B');
 const html=renderToStaticMarkup(React.createElement(Slots,{side:'B',contents:slots}));
 assert.ok(html.includes(OFFICIAL_SPECIAL_FIXED_BACK));
 assert.match(html,/Trappola avversaria coperta/);
 assert.match(html,/>COPERTA</);
 assert.doesNotMatch(html,/gen-077|Ancora di Campo|Comune|data-rarity|fleet-next-cards|<button/);
});

test('Il proprietario consulta la propria carta senza rivelare il fronte nello slot',()=>{
 let inspected=null;
 const tree=Slots({side:'A',contents:projectFleetSlots({...side,attackSlots:[]}),inspectTrap:entry=>{inspected=entry;}});
 const html=renderToStaticMarkup(tree);
 assert.ok(html.includes(OFFICIAL_SPECIAL_FIXED_BACK));
 assert.doesNotMatch(html,/gen-077|Ancora di Campo|data-rarity|fleet-next-cards/);
 const inspect=elements(tree).find(element=>element.type==='button');
 assert.ok(inspect);
 inspect.props.onClick();
 assert.deepEqual(inspected,{trapId:'gen-077',pending:false});
 const pending=projectFleetSlots({defenses:[],defenseSlots:[null,null],attackSlots:[null,null,null]},['gen-077']);
 assert.equal(pending[2].pending,true);
 assert.equal(pending[2].hidden,true);
});

test('La rivelazione mostra il fronte e il Terreno annullato soltanto dopo l’evento',()=>{
 const event={kind:'trap-reveal',who:'A',cardId:'gen-077',blockedCardId:'gen-238'};
 const html=renderToStaticMarkup(React.createElement(Reveal,{event}));
 assert.match(html,/TRAPPOLA ATTIVATA/);
 assert.ok(html.includes(card('gen-077').nome));
 assert.ok(html.includes(card('gen-238').nome));
 assert.ok(html.includes(cardFacePath('gen-077')));
 assert.match(html,/attivazione annullata/);
 assert.equal(renderToStaticMarkup(React.createElement(Reveal,{event:{kind:'trap-set',cardId:'gen-077'}})),'');
});

test('Messaggi e registro nascondono la preparazione e danno priorità all’annullamento',()=>{
 const prepared={kind:'trap-set',who:'B',text:'Ancora di Campo gen-077 Comune'};
 assert.equal(fleetEventText(prepared),'L’avversario prepara una trappola coperta.');
 assert.doesNotMatch(fleetTurnNotice([prepared]),/Ancora|gen-077|Comune/);
 const cancelled={kind:'terrain-cancelled',who:'B',text:'Cratere Ardente: attivazione annullata.'};
 assert.equal(fleetTurnNotice([cancelled,{kind:'card',text:'Un altro effetto'},{kind:'impact',text:'Attacco'}]),cancelled.text);
});
