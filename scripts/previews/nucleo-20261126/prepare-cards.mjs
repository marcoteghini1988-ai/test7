// Solo anteprime: usa i cataloghi correnti e le cornici PNG originali.
import fs from 'node:fs';
import path from 'node:path';
import {WEAPON_NEAR_FINAL_VALUES} from '../../../src/fleetNext/weaponRarityEvolutions.js';
export const FAMILY='weapon-designed-ionic-nucleo-folgore';
const out=path.resolve(process.argv[2]);
const inputs=JSON.parse(fs.readFileSync(path.join(out,'art-inputs.json')));
const cards=WEAPON_NEAR_FINAL_VALUES.filter(c=>(c.weaponFamilyId||c.id)===FAMILY).map(c=>{
 const raritySlug={Rara:'rara',Epica:'epica',Leggendaria:'leggendaria'}[c.rarita];
 const p=c.effectSpec.weaponProfile;
 return {id:c.id,familyId:FAMILY,name:c.name,rarity:c.rarita,raritySlug,
  rarityLabel:{Rara:'RARE',Epica:'EPIC',Leggendaria:'LEGENDARY'}[c.rarita],
  titleLines:['CANNONE A NUCLEO','DI FOLGORE CRESCENTE'],
  elementId:'ionic',elementText:'LIGHTNING',elementIcon:'fulmine',
  duration:p.durationTurns,damage:p.baseDamage,damageStages:p.damageStages,
  freshEnergyCost:p.freshEnergyCost,artPath:inputs[raritySlug],neutralBackdrop:true,
  panel:{damageLabel:'TURN DAMAGE / HP',damageValue:p.damageStages.join(' / '),
   damageValueSize:80,damageValueX:1190,targets:'1 TARGET',action:'1 / TURN',
   rightLabel:'RECHARGE T2 / T3',rightLabelSize:64,
   rightLines:['PLAY + SPEND 1','NEW LIGHTNING','MISSED: STAYS MIN'],rightValueSize:64},
  effect:c.effectProposed,reviewOnly:true,inGame:false};
});
if(cards.length!==3||cards.some(c=>!c.artPath))throw Error('Servono le tre illustrazioni Rara, Epica e Leggendaria.');
fs.writeFileSync(path.join(out,'manifest-carte.json'),JSON.stringify({
 status:'anteprime complete in attesa di approvazione grafica',
 familyId:FAMILY,directionApproved:true,finalVisualApproval:false,inGame:false,
 canvas:[3072,4608],cards},null,2)+'\n');
console.log(JSON.stringify({cards:cards.length,values:cards.map(c=>({rarity:c.rarity,damage:c.damageStages}))}));
