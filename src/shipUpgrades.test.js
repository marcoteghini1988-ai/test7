import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PHASE1_SHIPS} from './mathDuelEngine.js';
import {readShipCollection,grantShipCard,upgradeShipCard,
 updateShipCollection,equipShipCards} from './shipCollection.js';
import {SHIP_UPGRADE_DUST,shipUpgradeDustCost,validateShipUpgradePurchase} from './shipUpgrades.js';

function storage(){
 const entries=new Map();
 return {getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
}

test('piani di potenziamento disponibili per 17 navi in quattro rarità, L2–L5',()=>{
 assert.equal(PHASE1_SHIPS.length,17);
 for(const ship of PHASE1_SHIPS){
  for(let target=2;target<=5;target++){
   const price=shipUpgradeDustCost(ship.id,target);
   assert.ok(Number.isSafeInteger(price)&&price>0,ship.id+' L'+target);
   if(target>2)assert.ok(price>shipUpgradeDustCost(ship.id,target-1));
  }
  assert.equal(shipUpgradeDustCost(ship.id,6),null);
  assert.equal(shipUpgradeDustCost(ship.id,1),null);
 }
 assert.equal(shipUpgradeDustCost('NO_SHIP',2),null);
 assert.equal(Object.keys(SHIP_UPGRADE_DUST).length,4);
});

test('le navicelle si potenziano soltanto se possedute, una crescita alla volta, e con risorse sufficienti',async()=>{
 const store=storage();
 const initial=readShipCollection(store);
 const b=validateShipUpgradePurchase(initial,'ship:N00',2,99);
 assert.equal(b.allowed,false);
 assert.equal(b.reason,'insufficient_dust');
 assert.equal(b.cost,100);
 assert.equal(validateShipUpgradePurchase(initial,'ship:XX',2,500).reason,'not_owned');
 assert.equal(validateShipUpgradePurchase(initial,'ship:N00',4,5000).reason,'invalid_upgrade');
 const okay=validateShipUpgradePurchase(initial,'ship:N00',2,100);
 assert.equal(okay.allowed,true);
 const level2=await updateShipCollection(c=>upgradeShipCard(c,'ship:N00',2),store);
 assert.equal(level2.cards[0].level,2);
 assert.equal(readShipCollection(store).cards[0].level,2);
 assert.equal(validateShipUpgradePurchase(level2,'ship:N00',2,5000).allowed,false);
 const level3=await updateShipCollection(c=>upgradeShipCard(c,'ship:N00',3),store);
 assert.equal(level3.cards[0].level,3);
 assert.equal(validateShipUpgradePurchase(level3,'ship:N00',4,0).reason,'insufficient_dust');
});

test('upgrade e cambio madre conservano carte, carico e dati esterni',async()=>{
 const store=storage();
 const collection=grantShipCard(readShipCollection(store),'L01');
 const equipped=equipShipCards(collection,['ship:L01']);
 await updateShipCollection(()=>equipped,store);
 const price=shipUpgradeDustCost('L01',2);
 assert.equal(price,350);
 const level2=await updateShipCollection(current=>
  upgradeShipCard(current,'ship:L01',2),store);
 assert.deepEqual(level2.loadout,['ship:L01']);
 assert.equal(level2.cards.find(c=>c.shipId==='N00').level,1);
 assert.equal(level2.cards.find(c=>c.shipId==='L01').level,2);
 assert.equal(level2.cards.length,2);
});

test('il Bazar usa costi verificati prima di chiamare il salvataggio',()=>{
 const app=readFileSync(new URL('./App.tsx',import.meta.url),'utf8');
 const shop=readFileSync(new URL('./ShopModal.jsx',import.meta.url),'utf8');
 const panel=readFileSync(new URL('./ShipCollectionPanels.jsx',import.meta.url),'utf8');
 assert.match(app,/validateShipUpgradePurchase\(before,instanceId,targetLevel,stardust\)/);
 assert.match(app,/upgradeShipCard\(current,instanceId,targetLevel\)/);
 assert.match(shop,/onUpgradeShip=\{onUpgradeShip\}/);
 assert.match(panel,/shipUpgradeDustCost\(ship.id,nextLevel\)/);
 assert.match(panel,/setCollection\(readCollection\(\)\)/);
});
