import {ALL_WEAPON_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
const families={
 'weapon-base-ionic-01':{kind:'ionic-comb',flightMs:770,chargeMs:170,sequence:'five-arcs-one-discharge'},
 'weapon-base-ionic-02':{kind:'ionic-dart',flightMs:1130,chargeMs:210,sequence:'double-helix-dart'},
 'weapon-base-ionic-03':{kind:'ionic-whip',flightMs:930,chargeMs:180,sequence:'single-zigzag-whip'},
 'weapon-base-ionic-04':{kind:'ionic-flash',flightMs:180,chargeMs:160,sequence:'straight-white-flash'}
};
const tiers={Comune:0,Rara:1,Epica:2,Leggendaria:3},suffix=['common','rare','epic','legendary'];
export function ionicWeaponEffectProfile(id){
 const c=ALL_WEAPON_BY_ID[id],family=c&&(c.weaponFamilyId||c.id),spec=families[family];if(!spec)return null;
 const tier=tiers[c.rarita],rarity=suffix[tier],flash=spec.kind==='ionic-flash';
 return {...spec,approved:true,tier,impactMs:900,scale:1,impactScale:1,
  core:'#eaf8ff',glow:spec.kind==='ionic-dart'?'#aa98ff':'#84cfff',secondary:'#b2a5ff',
  impactCore:'#f2fbff',impactGlow:'#91d2ff',impactSecondary:'#bdb2ff',
  sound:{charge:spec.kind+'_charge_'+rarity,fire:spec.kind+'_fire_'+rarity,
   impact:spec.kind+'_impact_'+rarity,block:spec.kind+'_block_'+rarity},
  trailBands:flash?1:2,impactRings:1};
}
