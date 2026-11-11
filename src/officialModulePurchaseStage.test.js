import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {officialModulePurchaseStage} from './officialModulePurchaseStage.js';
import {PHASE16F_MODULES} from './newCombat/phase16FModules.js';
import {F17D_UPGRADES,F17D_UPGRADE_LEVELS} from './newCombat/phase17DEconomy.js';

test('35 Moduli: nessun doppio acquisto, nessun upgrade senza sblocco',()=>{
 const modules=Object.keys(PHASE16F_MODULES);
 assert.equal(modules.length,35);
 for(const id of modules){
  const maxLevel=9;
  assert.equal(officialModulePurchaseStage(undefined,'unlock',maxLevel),'ok',id);
  assert.equal(officialModulePurchaseStage({unlocked:false,level:1},'upgrade',maxLevel),'not_owned',id);
  assert.equal(officialModulePurchaseStage({unlocked:true,level:1},'unlock',maxLevel),'already_owned',id);
  for(let level=1;level<maxLevel;level++){
   assert.equal(officialModulePurchaseStage({unlocked:true,level},'upgrade',maxLevel),'ok',id+' L'+level);
  }
  assert.equal(officialModulePurchaseStage({unlocked:true,level:9},'upgrade',maxLevel),'max_level',id);
 }
});

test('Un livello di acquisto storico corrotto non apre potenziamenti',()=>{
 for(const level of [undefined,null,0,-1,1.5,10,Infinity,NaN]){
  assert.equal(officialModulePurchaseStage({unlocked:true,level},'upgrade',9),'invalid_level',String(level));
 }
 assert.equal(officialModulePurchaseStage({unlocked:false,level:9},'upgrade',9),'not_owned');
 assert.equal(officialModulePurchaseStage({unlocked:true,level:3},'upgrade',3),'max_level');
 assert.equal(officialModulePurchaseStage({unlocked:true,level:2},'upgrade',3),'ok');
 assert.equal(officialModulePurchaseStage({unlocked:true,level:1},'upgrade',0),'invalid_max_level');
 assert.equal(officialModulePurchaseStage({unlocked:true,level:1},'unknown',9),'invalid_action');
});

test('Prezzi già approvati: il Bazar e il simulatore economico coincidono a tutti i livelli',()=>{
 const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
 const shop=readFileSync(new URL('./ShopModal.jsx',import.meta.url),'utf8');
 const sources=[{name:'App',src:app},{name:'Bazar',src:shop}];
 for(const {name,src} of sources){
  const costBlock=src.match(/const UNIFIED_UPGRADE_COSTS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/);
  assert.ok(costBlock,name+' deve usare la matrice esistente');
  for(const [level,cost] of Object.entries(F17D_UPGRADES)){
   const regex=new RegExp('\\b'+level+':\\s*\\{\\s*dust:\\s*'+cost.dust+
    ',\\s*voidCrystals:\\s*'+cost.voidCrystals+
    ',\\s*primordialMatter:\\s*'+cost.primordialMatter+'\\s*\\}');
   assert.match(costBlock[1],regex,name+' costo L'+level);
  }
 }
 assert.deepEqual(F17D_UPGRADE_LEVELS,
  {2:12,3:25,4:35,5:48,6:60,7:70,8:82,9:95});
});

test('Acquisto L2→L9: risorse e soglie pilota esistenti, senza debito o scorciatoie',()=>{
 let owner={unlocked:true,level:1};
 let wallet={dust:150000,voidCrystals:90,primordialMatter:25};
 for(let next=2;next<=9;next++){
  assert.equal(officialModulePurchaseStage(owner,'upgrade',9),'ok');
  const cost=F17D_UPGRADES[next];
  assert.ok(F17D_UPGRADE_LEVELS[next]>1,'gating effettivo');
  for(const key of ['dust','voidCrystals','primordialMatter']){
   assert.ok(wallet[key]>=cost[key],next+' '+key);
   wallet[key]-=cost[key];
   assert.ok(wallet[key]>=0);
  }
  owner={...owner,level:next};
 }
 assert.equal(owner.level,9);
 assert.equal(officialModulePurchaseStage(owner,'upgrade',9),'max_level');
 assert.ok(wallet.dust<150000);
});

test('Il Bazar chiama il controllo antiripetizione e non celebra un upgrade rifiutato',()=>{
 const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
 const shop=readFileSync(new URL('./ShopModal.jsx',import.meta.url),'utf8');
 assert.match(app,/officialModulePurchaseStage\(abilities\[id\],'unlock'/);
 assert.match(app,/officialModulePurchaseStage\(current,'upgrade'/);
 assert.match(app,/modulePurchaseLocks\.current\.add\(id\)/);
 assert.match(app,/modulePurchaseLocks\.current\.clear\(\)/);
 assert.match(app,/modulePurchaseLocks\\.current\\.size>0/,
  'blocca transazioni di Moduli diversi prima di aggiornare il saldo');
 assert.match(shop,/onUpgradeAbility\(id\) === true/);
 assert.match(shop,/if \(started\) triggerDopamineCelebration/);
});
