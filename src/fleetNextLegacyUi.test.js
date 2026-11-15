import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {PHASE16A_EPIC_IDS} from './newCombat/phase16ACatalog.js';

const require=createRequire(import.meta.url);
const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
const appAst=ts.createSourceFile('App.tsx',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const functionText=name=>appAst.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name)?.getText(appAst);
const declarationText=name=>appAst.statements.find(n=>ts.isVariableStatement(n)&&n.declarationList.declarations.some(d=>d.name.getText(appAst)===name))?.getText(appAst);
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;
const visual=props=>React.createElement('span',{'data-art':props.id||props.relicId||props.name},'immagine');
const itemIds=PHASE16A_EPIC_IDS;
const items=new Function('PHASE16A_EPIC_IDS','LEGACY_EPIC_ITEMS_DATABASE',declarationText('EPIC_16C_DESCRIPTIONS')+'\n'+declarationText('EPIC_ITEMS_DATABASE')+'\nreturn EPIC_ITEMS_DATABASE;')(itemIds,itemIds.map(id=>({id,color:'#fff',codeName:id})));
const tanks=new Function(declarationText('SUBSPACE_TANK_LEVELS')+'\nreturn SUBSPACE_TANK_LEVELS;')();
const rift={id:'rift_1',itemId:itemIds[0],relicsRequired:['relic_1','relic_2'],bossPlanets:[1,2],roman:'I',color:'#fff',name:'Varco I',glow:'#fff',desc:'Varco aperto'};
const relics={1:{id:'relic_1',planetName:'Terra',color:'#fff'},2:{id:'relic_2',planetName:'Marte',color:'#fff'}};
function renderHub(tab,props={},selectedRift=null){
 let stateIndex=0;
 const useState=initial=>[stateIndex++===0?tab:stateIndex===2?selectedRift:initial,()=>{}];
 const Hub=new Function('React','useState','useEffect','SUBSPACE_TANK_LEVELS','EPIC_ITEMS_DATABASE','GRAVITATIONAL_RIFTS','PLANET_BOSS_RELICS','playSound','TacticalVisual','RelicVisual','SciFiIcon','RiftCollapseModal',
  compile(functionText('EpicItemsHubScreen'))+'\nreturn EpicItemsHubScreen;')(
   React,useState,()=>{},tanks,items,[rift],relics,()=>{},visual,visual,visual,props=>React.createElement('button',{onClick:props.onComplete},'Completa varco'));
 return Hub({triggerPopup:()=>{},onBack:()=>{},...props});
}
function elements(tree){
 if(Array.isArray(tree))return tree.flatMap(elements);
 if(!React.isValidElement(tree))return [];
 return [tree,...elements(tree.props.children)];
}
function loadShop(){
 const module={exports:{}};
 new Function('require','module','exports',compile(readFileSync(new URL('./ShopModal.jsx',import.meta.url),'utf8')))(id=>{
  if(id==='./FleetCollectionWorkshop.jsx')return {__esModule:true,default:()=>React.createElement('section',{'data-view':'fleet-cards'},'Carte della flotta')};
  if(id==='./ShipCollectionPanels.jsx')return {ShipShopPanel:()=>React.createElement('section',{'data-view':'fleet-ships'},'Navi')};
  if(id==='./audio')return {playSound:()=>{}};
  return require(id);
 },module,module.exports);
 return module.exports.default;
}

test('Il vecchio collegamento Moduli apre le carte realmente usate dalla flotta',()=>{
 const Shop=loadShop();
 let purchases=0;
 const html=renderToStaticMarkup(React.createElement(Shop,{initialTab:'abilities',allAbilities:[{id:'unsupported',name:'Modulo inattivo'}],onUnlockAbility:()=>purchases++,onUpgradeAbility:()=>purchases++}));
 assert.match(html,/data-view="fleet-cards"/);
 assert.doesNotMatch(html,/Modulo inattivo|>Moduli<|Sblocca \(/);
 assert.equal(purchases,0);
});

test('I sei manufatti mostrano proprietà e immagini senza promettere poteri o vendere livelli',()=>{
 const inventory={epic_item_1:{unlocked:true,level:3}};
 const original=JSON.stringify(inventory);
 let charges=0;
 const html=renderToStaticMarkup(renderHub('inventory',{epicItemsInventory:inventory,onUpgradeItem:()=>charges++,onEquipItem:()=>charges++}));
 assert.equal(items.length,6);
 assert.match(html,/Anello Bifasico di Möbius/);
 assert.match(html,/data-art="epic_item_1"/);
 assert.match(html,/COLLEZIONATO/);
 assert.match(html,/Manufatto segreto/);
 assert.doesNotMatch(html,/Equipaggia|Rimuovi da Plancia|Potenzia a Liv|Potere nuovo|mano e mazzo|surriscaldamento|Dado Quantico/);
 assert.equal(charges,0);
 assert.equal(JSON.stringify(inventory),original);
});

test('La collezione mantiene apertura dei varchi e miglioramento reale del serbatoio',()=>{
 const calls=[];
 const tree=renderHub('tank',{hasStabilizedRift1:true,tankLevel:1,stardust:2000,level:31,onUpgradeTank:(...args)=>calls.push(args)});
 const upgrade=elements(tree).find(e=>e.type==='button'&&renderToStaticMarkup(e).includes('Potenzia Serbatoio'));
 assert.ok(upgrade);
 assert.equal(upgrade.props.disabled,false);
 upgrade.props.onClick();
 assert.deepEqual(calls,[[2000,2]]);
 const collapsed=[];
 const collapseTree=renderHub('rifts',{onCollapseRift:(...args)=>collapsed.push(args)}, {rift,r1:relics[1],r2:relics[2],item:items[0]});
 const modal=elements(collapseTree).find(e=>typeof e.type==='function'&&e.props.epicItem);
 assert.ok(modal);
 modal.props.onComplete();
 assert.deepEqual(collapsed,[['rift_1',itemIds[0]]]);
});

test('Le vecchie lavorazioni continuano senza offrire o addebitare accelerazioni prive di effetti attivi',()=>{
 let arrow;
 const find=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(appAst)==='handleRushForge')arrow=n.initializer.arguments[0].getText(appAst);ts.forEachChild(n,find);};
 find(appAst);
 assert.ok(arrow);
 const wallet={current:30};
 let charges=0,completions=0;
 const rush=new Function('triggerPopup','forgeEtherRef','setEther','finishOfficialForgeJob','return ('+arrow+');')(()=>{},wallet,()=>charges++,()=>completions++);
 const Widget=new Function('React','useState','useEffect',compile(functionText('ActiveForgeWidget'))+'\nreturn ActiveForgeWidget;')(React,initial=>[initial,()=>{}],()=>{});
 for(const type of ['ability','epic','deck','terrain']){
  const job={id:'historical',type,name:'Oggetto già posseduto',targetLevel:2,finishTime:Date.now()+3600000,etherRush:3};
  const before=JSON.stringify(job);
  assert.equal(rush(job),false,type);
  const html=renderToStaticMarkup(Widget({queue:[job],ether:30,onRush:rush}));
  assert.match(html,/Completamento in corso/);
  assert.doesNotMatch(html,/Salta tempo|<button/);
  assert.equal(JSON.stringify(job),before);
 }
 assert.equal(wallet.current,30);
 assert.equal(charges,0);
 assert.equal(completions,0,'la guardia non cancella o completa anticipatamente i lavori');
});
