import {PROBE_HAMMER_CARD_IDS} from './probeHammerSpec.js';
import {CORE_FAMILY} from './coreThunderSpec.js';
export const LOCALIZED_WEAPON_CARD_IDS=Object.freeze([CORE_FAMILY,CORE_FAMILY+'-rarity-e',CORE_FAMILY+'-rarity-l',...PROBE_HAMMER_CARD_IDS]);
export const hasCardTextLayer=id=>LOCALIZED_WEAPON_CARD_IDS.includes(id);
const ASSET_ROOT=(import.meta.env?.VITE_ASSET_ROOT||'/assets').replace(/\/+$/,'');
export const cardTextBasePath=id=>hasCardTextLayer(id)?(PROBE_HAMMER_CARD_IDS.includes(id)?'/assets':ASSET_ROOT)+'/fleet-weapon-fronts/'+id+'-text-base.png':null;
export const CARD_TEXT_REGIONS=Object.freeze([{left:680,top:350,width:1710,height:210},{left:1090,top:2855,width:892,height:140},
 {left:440,top:3140,width:2195,height:930},{left:1110,top:4180,width:852,height:140}]);
