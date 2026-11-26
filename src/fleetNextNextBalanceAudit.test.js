// Audit deterministico sul motore HP ufficiale; i secondi non sono tempi misurati su telefono.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,autoFleetTurn,resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {NEXT_BALANCED_WEAPON_CARDS} from './fleetNext/nextBalancedWeapons.js';
import {ALL_WEAPON_CARDS} from './fleetNext/weaponRarityEvolutions.js';
import {NEXT_COMMON_CARDS} from './fleetNext/newCardRegistry.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {energyIdForRarity} from './fleetNext/energyCards.js';
import {card,cardCopyLimit} from './fleetNext/rules.js';
const tiers=['Comune','Rara','Epica','Leggendaria'];
const rotate=(a,n)=>a.length?[...a.slice(n%a.length),...a.slice(0,n%a.length)]:[];
const pickDeck=(rarity,seed,includeNew)=>{
 const weapons=ALL_WEAPON_CARDS.filter(c=>c.rarita===rarity);
 const newer=NEXT_BALANCED_WEAPON_CARDS.filter(c=>c.rarita===rarity);
 const energy=['refrigerant','mineral','aerial','radiant','void','gravity'].flatMap(e=>
  [energyIdForRarity(e,rarity),energyIdForRarity(e,'Comune')]);
 const support=NEXT_COMMON_CARDS.filter(c=>tiers.indexOf(c.rarita)<=tiers.indexOf(rarity)&&c.playable!==false);
 const deck=[];
 const add=(id,n=1)=>{if(!card(id))return;for(let i=0;i<n&&deck.length<40;i++)
  if(deck.filter(x=>x===id).length<cardCopyLimit(id))deck.push(id);};
 if(includeNew)for(const c of rotate(newer,seed).slice(0,12))add(c.id);
 for(const c of rotate(weapons,seed).slice(0,includeNew?8:20))add(c.id);
 for(const id of rotate(energy,seed))add(id);
 for(const c of rotate(support,seed))add(c.id);
 return deck;
};
const roster=(rarity,seed)=>{
 const list=SUPPORT_CATALOG.filter(s=>tiers.indexOf(s.rarita)<=tiers.indexOf(rarity));
 return Array.from({length:rarity==='Rara'?1:2},(_,slot)=>{
  const c=list[(seed+slot*4)%list.length];
  return {supportId:c.id,instanceId:'audit-'+seed+'-'+slot,slot,rarita:rarity};
 });
};
const median=x=>{const a=[...x].sort((u,v)=>u-v);return a.length?(a[(a.length-1)>>1]+a[a.length>>1])/2:null;};
test('Audit nuova coorte 26/11: mazzi misti contro registro storico, semi e lati alternati',()=>{
 const results=[],seen=new Set();
 for(const rarity of tiers.slice(1))for(let seed=1;seed<=8;seed++){
  const newSide=seed%2?'A':'B',shipA=seed%2?'N00':'C01',shipB=seed%2?'C01':'N00';
  let b=createFleetNextBattle({shipA,shipB,raritaA:rarity,raritaB:rarity,mode:'pvp',
   ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,strategicNoDeterioration:true,
   deckA:pickDeck(rarity,seed,newSide==='A'),deckB:pickDeck(rarity,seed+3,newSide==='B'),
   supportRosterA:roster(rarity,seed),supportRosterB:roster(rarity,seed+3),seed:20261126+seed*91,nowMs:0});
  let turnCount=0,dropped=0,nominal=0;
  while(b.phase==='playing'&&turnCount<100){
   const who=b.turn,order=autoFleetTurn(b,who),r=resolvePreparedFleetTurn(b,who,order,b.turnStartedAtMs+10000);
   assert.ok(r.ok,r.reason);assert.ok(r.battle.ply>b.ply||r.battle.phase==='finished');
   dropped+=r.droppedPreparedCards||0;
   for(const e of r.events){if(e.kind==='next-weapon-shot'){
    seen.add(e.cardId);nominal+=(e.impacts||[]).reduce((n,i)=>n+(i.nominalDamage||0),0);
   }}
   b=r.battle;turnCount++;
   for(const s of Object.values(b.sides))for(const u of [s.ships[0],...s.escorts])
    assert.ok(Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp,'HP fuori intervallo');
  }
  results.push({rarity,seed,newSide,winner:b.winner,ply:b.ply,estimatedSeconds:b.ply*15,dropped,nominal});
 }
 const rows=tiers.slice(1).map(rarity=>{
  const games=results.filter(x=>x.rarity===rarity);
  return {rarity,matches:games.length,newWins:games.filter(x=>x.winner===x.newSide).length,
   oldWins:games.filter(x=>x.winner&&x.winner!=='draw'&&x.winner!==x.newSide).length,
   draws:games.filter(x=>x.winner==='draw').length,unfinished:games.filter(x=>!x.winner).length,
   medianPly:median(games.map(x=>x.ply)),medianEstimatedSeconds:median(games.map(x=>x.estimatedSeconds)),
   dropped:games.reduce((n,x)=>n+x.dropped,0)};
 });
 console.log('NEXT_WEAPON_BALANCE_AUDIT='+JSON.stringify({rows,seen:[...seen],results}));
 assert.equal(results.length,24);assert.ok(seen.size>0,'Nessuna nuova arma effettivamente utilizzata');
 // Esito diagnostico, non una dichiarazione di equilibrio definitivo: la matrice
 // deve essere ampliata con combo deliberate, boss e Personaggi prima del lock.
});
