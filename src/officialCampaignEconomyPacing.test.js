// Simulazione ECONOMICA, non una vincita garantita dei duelli.
// Mantiene tutti i prezzi e premi storici: segnala eventuali colli di
// bottiglia della progressione senza dare risorse gratuite al giocatore.
import test from 'node:test';
import assert from 'node:assert/strict';
import {simulateF17DEconomy,F17D_START_RESOURCES,F17D_UPGRADES,
 F17D_UPGRADE_LEVELS} from './newCombat/phase17DEconomy.js';

test('Economia 120 settori: 16 percorsi di acquisto con risorse mai negative',()=>{
 const reports=[];
 for(const profile of ['frugale','equilibrato','potenziato','tattico'])
  for(const starsPerSector of [1,3])
   for(const assumeFirstRift of [false,true]){
    const outcome=simulateF17DEconomy({profile,starsPerSector,assumeFirstRift});
    assert.equal(outcome.ledger.length,120);
    assert.equal(outcome.summary.sectorCount,120);
    assert.ok(outcome.summary.purchasedCount===outcome.purchases.length);
    assert.ok(outcome.summary.moduleLevel>=0&&outcome.summary.moduleLevel<=9);
    assert.ok(outcome.summary.creditsRequired>=F17D_START_RESOURCES.credits);
    for(const key of ['dust','diamonds','credits','voidCrystals','primordialMatter']){
     assert.ok(outcome.summary.finalResources[key]>=0,profile+'/'+key);
    }
    // Verifica che i prezzi di ogni vero potenziamento Modulo nel
    // simulatore coincidano con la matrice esposta nel Bazar.
    for(const purchase of outcome.purchases.filter(x=>x.item.startsWith('modulo Ariete lv'))){
     const next=Number(purchase.item.match(/lv(\d+)/)?.[1]);
     assert.deepEqual({dust:purchase.dust,voidCrystals:purchase.voidCrystals,
      primordialMatter:purchase.primordialMatter},F17D_UPGRADES[next]);
     assert.ok(F17D_UPGRADE_LEVELS[next]>0);
    }
    reports.push({profile,starsPerSector,assumeFirstRift,
     moduleLevel:outcome.summary.moduleLevel,
     deckLevel:outcome.summary.deckLevel,
     hasGaia:outcome.summary.hasGaia,
     spentDust:outcome.summary.dustSpent,
     lostDust:outcome.summary.dustLostToWalletCap,
     missingCredits:outcome.summary.creditsToRecoverWithoutBattleBonuses,
     firstCreditShortage:outcome.summary.firstCreditShortage,
     purchased:outcome.summary.purchasedCount});
   }
 assert.equal(reports.length,16);
 console.log('ECLISSI_120_SECTOR_ECONOMY_MATRIX '+JSON.stringify(reports));
});
