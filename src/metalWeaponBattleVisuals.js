// Le sei carte approvate il 25/11: identità per famiglia e sequenza per rarità.
// Questi profili non applicano danni e non producono eventi di combattimento.
import {ALL_WEAPON_BY_ID} from './fleetNext/weaponRarityEvolutions.js';

export const SLITTA_CARD_ID='weapon-confirmed-metallic-slitta';
export const RECLAIMER_CARD_ID='weapon-designed-metallic-recuperatore-termobalistico';
export const METAL_WEAPON_VARIANTS=Object.freeze([
 {id:SLITTA_CARD_ID,rarity:'Comune',tier:0,kind:'steel-rail'},
 {id:SLITTA_CARD_ID+'-rarity-r',rarity:'Rara',tier:1,kind:'steel-rail'},
 {id:SLITTA_CARD_ID+'-rarity-e',rarity:'Epica',tier:2,kind:'steel-rail'},
 {id:SLITTA_CARD_ID+'-rarity-l',rarity:'Leggendaria',tier:3,kind:'steel-rail'},
 {id:RECLAIMER_CARD_ID,rarity:'Epica',tier:2,kind:'thermal-reclaimer'},
 {id:RECLAIMER_CARD_ID+'-rarity-l',rarity:'Leggendaria',tier:3,kind:'thermal-reclaimer'}
].map(Object.freeze));
const railSequences=['steel-tracer','bronze-double-helix','silver-compression','prismatic-rail'];
const names=['common','rare','epic','legendary'];
export const metalWeaponVariant=id=>METAL_WEAPON_VARIANTS.find(v=>v.id===id)||null;
export function metalWeaponEffectProfile(id){
 const v=metalWeaponVariant(id);if(!v)return null;
 const rail=v.kind==='steel-rail',t=v.tier;
 return {
  kind:v.kind,approved:true,tier:t,
  sequence:rail?railSequences[t]:t===2?'three-collector-conversion':'prismatic-condenser',
  flightMs:rail?1030:1250,impactMs:rail?850+t*70:1100,
  chargeMs:rail?180+t*90:600,
  core:t===3?'#f1f5ff':rail?'#e2edf5':'#fff1be',
  glow:t===3?'#b4b4ff':rail?'#ffb967':'#ff962f',
  secondary:t===3?'#81e5ff':rail?t===1?'#e2ad72':'#b3cadc':'#ffd87f',
  impactCore:t===3?'#f3f5ff':'#fff3d5',
  impactGlow:rail?t===3?'#a1bcff':'#ffc186':'#ff8e27',
  impactSecondary:t===3?'#e1aaff':rail?'#b9d9ef':'#ffd16c',
  trailBands:rail?1+t:3,impactRings:rail?1+t:3,
  scale:1,impactScale:rail?.80+t*.08:.95,
  sound:{charge:(rail?'slitta':'reclaimer')+'_charge_'+names[t],
   fire:(rail?'slitta':'reclaimer')+'_fire_'+names[t],
   impact:(rail?'slitta':'reclaimer')+'_impact_'+names[t]}
 };
}
// La luminosità legge la potenza nominale di questo impatto prima delle
// Difese: il danno effettivo da solo confonderebbe conversione e mitigazione.
export function thermalChargeForShot(shot){
 if(metalWeaponVariant(shot?.cardId)?.kind!=='thermal-reclaimer')
  return {extra:0,ratio:0};
 // nominalDamage è emesso nello spazio RAW del motore, prima del fattore
 // della modalità strategica e delle passive: confrontarlo con lo stesso
 // profilo RAW evita una carica falsa o azzerata dopo il bilanciamento.
 const p=ALL_WEAPON_BY_ID[shot.cardId]?.effectSpec?.weaponProfile;
 const nominal=Number(shot.nominalDamage);
 const extra=Number.isFinite(nominal)?Math.max(0,Math.min(p.maxExtraDamage,nominal-p.baseDamage)):0;
 return {extra,ratio:p.maxExtraDamage>0?extra/p.maxExtraDamage:0};
}
