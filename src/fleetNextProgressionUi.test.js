import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {card,cardRole,cardFacePath,EXCLUSIVE_CARDS} from './fleetNext/rules.js';
import {exclusiveRarityAtLevel} from './fleetNext/exclusiveEvolution.js';
import {activeFleetElements,FLEET_ELEMENTS,fleetElementNames,secondaryElementUnlockLevel} from './fleetNext/elementalAffinities.js';
import {elementalAbility} from './fleetNext/elementalAbilities.js';
import {mantaEnergy,mantaCapacitorActive} from './fleetNext/mantaEngine.js';
import {liveModules} from './fleetNext/auroraEngine.js';
import {describeEffect,describeEscortEffect,describeBossPassive,effectNeedsOwnTarget,SIMPLE_RULES} from './fleetNext/simpleEffects.js';
import {projectFleetSlots,projectFleetDefense,projectMachineBerths,FLEET_PHYSICAL_VITALS,campaignFleetShipId,fleetTurnNotice} from './fleetNext/battlePresentation.js';
import {CAMPAIGN_SHIP_ORDER,getShipProgression,getShipProgressionLevels,shipProgressionProfile} from './fleetNext/progression.js';
import {createFleetSide,createFleetMother,createFleetNextBattle,resolveFleetNextTurn,effectUnavailableReason,defenseCapacityReason,protectingFleetUnits,availableFleetTargets} from './fleetNext/combat.js';
import {newVessel} from './mathDuelEngine.js';
import {officialBossEncounter} from './officialBossEncounter.js';
import {officialEarlyCampaignRivalShip} from './officialEarlyCampaignRivals.js';
import {officialCampaignRivalLevel} from './officialCampaignRivalScaling.js';
import {chooseCampaignMotherRival} from './motherDuelLoadout.js';
import {TERRAIN_CATALOG} from './fleetNext/terrains.js';
import {OFFICIAL_SPECIAL_FIXED_BACK} from './officialDeckBackArt.js';
import {readNextDeckSelection,buildNextBaseDeck} from './fleetNext/nextDeckLoadout.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createSupportCollection,equippedSupportRoster} from './fleetNext/supportCollection.js';
import {npcSupportRoster} from './fleetNext/supportCampaign.js';
import {officialSpecialArtPath} from './officialSpecialCardArt.js';
import {VITAL_IDS,VITAL_LABELS} from './vitalDefense.js';
import {VITAL_TO_ORIGINAL_MOTOR,VITAL_MOTOR_SHORT_NAMES,vesselWithPhysicalVitalDamage} from './officialVitalMotorAdapter.js';

function extract(file,name,scope={}){
 const source=readFileSync(new URL(file,import.meta.url),'utf8');
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JSX);
 const declaration=ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text===name);
 assert.ok(declaration,name+' must be the actual application component');
 const withoutExport=declaration.getText(ast).replace(/^export default /,'').replace(/^export /,'');
 const compiled=ts.transpileModule(withoutExport,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.React}}).outputText;
 return new Function('React',...Object.keys(scope),compiled+'\nreturn '+name+';')(React,...Object.values(scope));
}
function elements(tree){
 if(Array.isArray(tree))return tree.flatMap(elements);
 return React.isValidElement(tree)?[tree,...elements(tree.props.children)]:[];
}
const Labels={engine:'Plancia',weapons:'Arsenale',shieldGenerator:'Generatore',command:'Centralina'};
const Shorts={engine:'PLA',weapons:'ARS',shieldGenerator:'GEN',command:'CEN'};
const Slots=extract('./OfficialFleetBattle3D.jsx','OriginalSpecialSlots',{
 card,cardRole,cardFacePath,describeEffect,OFFICIAL_SPECIAL_FIXED_BACK,officialSpecialArtPath,exclusiveRarityAtLevel
});
const Fighter=extract('./OfficialFleetBattle3D.jsx','OriginalFleetFighter',{
 useMemo:fn=>fn(),newVessel,projectFleetDefense,projectMachineBerths,
 fleetImpactVisual:()=>null,ShipPhysicalVitals:()=>null,MountedWeapons:()=>null,
 FLEET_PHYSICAL_VITALS,PHYSICAL_LABELS:Labels,PHYSICAL_SHORT_LABELS:Shorts,
 ASSET_ROOT:'/assets',HP_SYNC_RULESET,describeEscortEffect,liveModules,pct:(n,d)=>Math.round(100*n/d),
 activeEscort:e=>e.hp>0&&!e.destroyed,FLEET_ELEMENTS,mantaEnergy,mantaCapacitorActive,card
});
const Physical=extract('./ShipPhysicalVitals.jsx','ShipPhysicalVitals',{
 vesselWithPhysicalVitalDamage,VITAL_IDS,VITAL_LABELS,VITAL_TO_ORIGINAL_MOTOR,VITAL_MOTOR_SHORT_NAMES,
 ShipSkin:()=>null,Engine:props=>React.createElement('button',{'aria-label':props.vitalName,'data-short-label':props.vitalLabel,disabled:!props.enabled},props.vitalLabel)
});
const ProgressionDetails=extract('./ShipCollectionPanels.jsx','ShipProgressionDetails',{
 getShipProgression,getShipProgressionLevels,shipProgressionProfile,
 activeFleetElements,FLEET_ELEMENTS,fleetElementNames,secondaryElementUnlockLevel,elementalAbility,EXCLUSIVE_CARDS
});

// Test su carte ritirate eliminati; restano i test delle funzioni ancora attive.

test('Aurora has exactly two visible physical targets at all levels, without ghost Centralina or Plancia',()=>{
 for(let level=1;level<=5;level++){
  const mother=createFleetMother('N00',level),defense=projectFleetDefense(mother);
  assert.deepEqual(Object.keys(defense.parts).filter(id=>defense.parts[id].unlocked),['weapons','shieldGenerator']);
  const html=renderToStaticMarkup(React.createElement(Physical,{side:'enemy',vessel:newVessel('N00',level),defense,
   canTarget:true,vitalLabels:Labels,vitalShortLabels:Shorts}));
  assert.equal((html.match(/<button/g)||[]).length,2);
  assert.match(html,/Arsenale/);assert.match(html,/Generatore/);
  assert.doesNotMatch(html,/Plancia|Centralina/);
 }
});


test('Later Plancia maps to the existing physical slot while keeping its new name and hit points',()=>{
 const mother=createFleetMother('C02',3),defense=projectFleetDefense(mother);
 assert.ok(defense.parts.engine.unlocked);
 assert.equal(Object.values(defense.parts).filter(p=>p.unlocked).length,4);
 const html=renderToStaticMarkup(React.createElement(Physical,{side:'enemy',vessel:newVessel('C02',3),defense,
  canTarget:true,vitalLabels:Labels,vitalShortLabels:Shorts}));
 assert.match(html,/Plancia/);assert.match(html,/Centralina/);
 assert.equal((html.match(/<button/g)||[]).length,4);
});


test('Fixed layout renders Character, Defense, Trap, three Attacks and two machine berths from first level',()=>{
 const side=createFleetSide('N00',1,[],42);
 const slots=projectFleetSlots(side);
 const slotHtml=renderToStaticMarkup(React.createElement(Slots,{side:'A',contents:slots}));
 assert.equal((slotHtml.match(/data-slot-role="personaggio"/g)||[]).length,1);
 assert.equal((slotHtml.match(/data-slot-role="difesa"/g)||[]).length,1);
 assert.equal((slotHtml.match(/data-slot-role="trappola"/g)||[]).length,1);
 assert.equal((slotHtml.match(/data-slot-role="attacco"/g)||[]).length,3);
 const fighterHtml=renderToStaticMarkup(Fighter({side:'player',unit:side,inspectEscort:()=>{}}));
 assert.equal((fighterHtml.match(/spazio libero/g)||[]).length,2);
 assert.match(fighterHtml,/0 supporti/);
 assert.doesNotMatch(fighterHtml,/f3d-escort-grade/);
});


test('Machine preview uses its own berth and does not occupy any Attack slot',()=>{
 const side={machines:[],attackSlots:[],defenses:[]};
 assert.deepEqual(projectFleetSlots(side,['prog-machine-striker']),Array(6).fill(null));
 const berths=projectMachineBerths(side,['prog-machine-striker','prog-machine-guard']);
 assert.equal(berths.length,2);
 assert.ok(berths.every(unit=>unit.pending));
 assert.deepEqual(berths.map(unit=>unit.hp),[3,5]);
});


test('Clicking an enemy support or machine emits its real kind, id and slot',()=>{
 const side=createFleetSide('L04',5,[],42),selected=[];
 side.machines=[{id:'machine:test',name:'Macchina d’assalto',slot:0,hp:3,maxHp:3,power:1}];
 const tree=Fighter({side:'enemy',unit:side,canTarget:true,ply:0,onSelectTarget:t=>selected.push(t),inspectEscort:()=>{}});
 const buttons=elements(tree).filter(e=>e.type==='button');
 const support=buttons.find(e=>e.props.className==='f3d-unit-target');
 assert.equal(support.props.disabled,false);support.props.onClick();
 const machine=buttons.find(e=>e.props['aria-label']?.startsWith('Attacca Macchina d’assalto'));
 assert.equal(machine.props.disabled,false);machine.props.onClick();
 assert.deepEqual(selected,[{kind:'escort',id:side.escorts[0].id,slot:0},{kind:'machine',id:'machine:test',slot:0}]);
 const html=renderToStaticMarkup(tree);
 assert.match(html,/2 in riserva/);
 assert.match(html,/G2/);
});


test('Hangar mostra le progressioni estese, con Aurora L20 e Arca L5',()=>{
 const aurora=renderToStaticMarkup(React.createElement(ProgressionDetails,{shipId:'N00',level:5}));
 assert.match(aurora,/2 sistemi della madre/);assert.match(aurora,/slot supporto sono permanenti/);
 for(let level=1;level<=20;level++)assert.match(aurora,new RegExp('Livello '+level+'(?:<| )'));
 const evolved=renderToStaticMarkup(React.createElement(ProgressionDetails,{shipId:'N00',level:20}));
 assert.match(evolved,/slot supporto sono permanenti/);
 assert.match(evolved,/100%/);
 const arca=renderToStaticMarkup(React.createElement(ProgressionDetails,{shipId:'L04',level:5}));
 assert.match(arca,/4 sistemi della madre/);
 assert.match(arca,/slot supporto sono permanenti/);
});


test('Twelve official campaign planets use the twelve main fleet steps, ending in Arca Astrale',()=>{
 const planets=[1,2,3,6,7,8,9,11,14,17,19,20];
 assert.deepEqual(planets.map(planetId=>campaignFleetShipId({planetId})),CAMPAIGN_SHIP_ORDER);
 assert.deepEqual(planets.map((_,i)=>campaignFleetShipId({sectorNumber:i*10+10})),CAMPAIGN_SHIP_ORDER);
 assert.equal(campaignFleetShipId({sectorNumber:1}),'N00');
 assert.equal(campaignFleetShipId({sectorNumber:120}),'L04');
 assert.equal(campaignFleetShipId({planetId:999}),null);
 assert.equal(campaignFleetShipId({sectorNumber:121}),null);
});



test('La battaglia ufficiale usa due supporti equipaggiati, zero riserve automatiche e una fusione compatibile',()=>{
 const owned={shipId:'N00',level:1};
 const start=extract('./OfficialFleetBattle3D.jsx','startSession',{
  readShipCollection:()=>({cards:[owned],loadout:[]}),readFleetInventory:()=>({owned:{'gen-216':1},exclusiveUpgrades:{}}),
  readSupportCollection:()=>createSupportCollection(),equippedSupportRoster,npcSupportRoster,
  findMother:()=>owned,officialBossEncounter,officialEarlyCampaignRivalShip,officialCampaignRivalLevel,
  chooseCampaignMotherRival,campaignFleetShipId,createFleetNextBattle,
  readNextDeckSelection:()=>null,buildNextBaseDeck,HP_SYNC_RULESET
 });
 const session=start({mode:'campaign',sectorNumber:120,bossPlanetId:20,bossSectorLevel:10});
 assert.equal(session.error,'');
 assert.equal(session.battle.ruleset,HP_SYNC_RULESET);
 const boss=session.battle.sides.B;
 assert.equal(boss.ships[0].id,'L04');assert.equal(boss.ships[0].level,5);
 assert.equal(boss.escorts.length,2);assert.equal(boss.reserveEscorts.length,0,
  'nessuna riserva viene regalata dal livello della madre');
 assert.equal(boss.fusionLimit,2,
  'tutte le madri possono fondere entrambi i supporti, se sono a L5');
 assert.equal(session.battle.sides.A.escorts.length,0,
  'il giocatore senza traguardi entra solo con la madre');
 assert.equal([...boss.deck,...boss.hand].filter(id=>id==='nx-l04-05').length,1,
  'la carta dell’Arca non rappresenta più una fusione automatica');
 assert.ok(boss.escorts.every(e=>e.level===1),
  'i supporti avversari partono da L1 e non sono abilitati alla fusione immediata');
});

function battleUi(seed){
 let cursor=0;
 const states=[];
 const useState=initial=>{
  const index=cursor++;
  if(!(index in states))states[index]=typeof initial==='function'?initial():initial;
  return [states[index],value=>{states[index]=typeof value==='function'?value(states[index]):value;}];
 };
 const Hand=()=>null,FighterStub=()=>null;
 const Component=extract('./OfficialFleetBattle3D.jsx','OfficialFleetBattle3D',{
  useState,useRef:initial=>useState({current:initial})[0],useEffect:()=>{},
  startSession:()=>({battle:seed,error:''}),
  card,cardRole,effectUnavailableReason,defenseCapacityReason,resolveFleetNextTurn,
  protectingFleetUnits,availableFleetTargets,effectNeedsOwnTarget,describeEffect,describeBossPassive,
  projectFleetSlots,fleetTurnNotice,TERRAIN_CATALOG,SIMPLE_RULES,
  OriginalFleetBar:()=>null,OriginalFleetFighter:FighterStub,OriginalSpecialSlots:()=>null,
  OriginalSpecialHandCard:Hand,TrapReveal:()=>null,
  OFFICIAL_SPECIAL_FIXED_BACK,ASSET_ROOT:'/assets',HP_SYNC_RULESET,
  VITAL_LABELS:{weapons:'Arsenale',generator:'Generatore',bridge:'Plancia',command:'Centralina'}
 });
 return {
  states,Hand,Fighter:FighterStub,
  render(){cursor=0;return Component({gameMode:'pvp'});}
 };
}


test('Own-component selection maps the physical Plancia and Generatore to real target IDs',()=>{
 const side=createFleetSide('C02',3,[],42),selected=[];
 const fighter=Fighter({side:'player',unit:side,selectedVital:'bridge',canSelectOwn:true,onSelectVital:id=>selected.push(id),inspectEscort:()=>{}});
 assert.equal(fighter.props['data-own-target'],true);
 // The actual adapter emits physical keys; the actual fighter translates them.
 const physical=elements(fighter).find(e=>e.props.vitalLabels===Labels);
 physical.props.onSelectVital('engine');physical.props.onSelectVital('shieldGenerator');
 assert.deepEqual(selected,['bridge','generator']);
 const defense=projectFleetDefense(side.ships[0]);
 const body=Physical({side:'player',vessel:newVessel('C02',3),defense,canTarget:true,allowOwnTarget:true,
  vitalLabels:Labels,vitalShortLabels:Shorts,onSelectVital:id=>selected.push(id)});
 const ownButtons=elements(body).filter(e=>e.props.vitalName);
 assert.ok(ownButtons.every(button=>button.props.enabled));
 ownButtons.find(e=>e.props.vitalLabel==='GEN').props.onSelect();
 assert.equal(selected.at(-1),'shieldGenerator');
});


test('Native new card fronts expose complete names and effects without invalid image links',()=>{
 const Hand=extract('./OfficialFleetBattle3D.jsx','OriginalSpecialHandCard',{
  card,cardRole,cardFacePath,describeEffect,officialSpecialArtPath,
  exclusiveRarityAtLevel,FLEET_ELEMENTS
 });
 for(const id of ['prog-bypass','prog-machine-striker','prog-machine-guard','prog-fusion-l04']){
  const html=renderToStaticMarkup(React.createElement(Hand,{type:id,index:0,offset:0,selected:true,onClick:()=>{}}));
  assert.ok(html.includes(card(id).nome||card(id).name),id);
  assert.doesNotMatch(html,/undefined|src="null"|src=""|<img/,id);
  const label=Hand({type:id,index:0,offset:0}).props['aria-label'];
  assert.ok(label.includes(describeEffect(card(id))),id);
 }
});
