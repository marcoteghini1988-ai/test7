import {ALL_WEAPON_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
import {CORE_FAMILY,CORE_KIND,CORE_TIMING} from './coreThunderSpec.js';
export function coreThunderEffectProfile(id,shot={}){
 const c=ALL_WEAPON_BY_ID[id];if(!c||(c.weaponFamilyId||c.id)!==CORE_FAMILY)return null;
 const tier={Rara:1,Epica:2,Leggendaria:3}[c.rarita];if(!tier)return null;
 const stage=shot.coreChargeStage||1,rarity=['common','rare','epic','legendary'][tier];
 const sound=phase=>'thunder-core_'+phase+'_'+rarity+'_'+stage;
 return {approved:true,kind:CORE_KIND,tier,rarity:c.rarita,
  chargeMs:CORE_TIMING.charge,flightMs:CORE_TIMING.flight,impactMs:CORE_TIMING.impact,
  sequence:'precessing-coronas-compression-electric-bloom',scale:1,impactScale:1,
  core:'#eafaff',glow:'#68cfff',secondary:'#d1b7ff',
  impactCore:'#ffffff',impactGlow:'#378cfa',impactSecondary:'#cbb0ff',
  sound:{charge:sound('charge'),fire:sound('fire'),compression:sound('compression'),
   impact:sound('impact'),block:sound('block'),lost:sound('lost'),release:sound('release')}};
}
