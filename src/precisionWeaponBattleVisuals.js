// Terzo gruppo Metallo approvato: i profili descrivono soltanto eventi reali.
import {salvoSpan} from './fleetNext/approvedWeaponSalvos.js';
export const CASCADE_ID='weapon-designed-metallic-perforatore-cascata';
export const SHARD_ARTILLERY_ID='weapon-designed-metallic-artiglieria-schegge';
export const CASCADE_FLIGHT_MS=1350;
export const CASCADE_TRANSFER_MS=650;
export const CASCADE_CONTACT_MS=90;
export const PRECISION_WEAPON_VARIANTS=Object.freeze([
 {id:CASCADE_ID,rarity:'Epica',tier:2,kind:'cascade-piercer'},
 {id:CASCADE_ID+'-rarity-l',rarity:'Leggendaria',tier:3,kind:'cascade-piercer'},
 {id:SHARD_ARTILLERY_ID,rarity:'Rara',tier:1,kind:'wandering-shrapnel'},
 {id:SHARD_ARTILLERY_ID+'-rarity-e',rarity:'Epica',tier:2,kind:'wandering-shrapnel'},
 {id:SHARD_ARTILLERY_ID+'-rarity-l',rarity:'Leggendaria',tier:3,kind:'wandering-shrapnel'}
].map(Object.freeze));
export const precisionWeaponVariant=id=>PRECISION_WEAPON_VARIANTS.find(v=>v.id===id)||null;
export function precisionWeaponEffectProfile(id,shot){
 const v=precisionWeaponVariant(id);if(!v)return null;
 const cascade=v.kind==='cascade-piercer',t=v.tier,transfer=!!shot?.cascadeTransfer;
 const family=cascade?'cascade':'shard',rarity=['common','rare','epic','legendary'][t];
 return {kind:v.kind,approved:true,tier:t,
  sequence:cascade?t===2?'silver-ring-penetrator':'prismatic-return-bridge':
   ['', 'bronze-indexed-carriage','silver-recoil-carriage','prismatic-fan-gantry'][t],
  chargeMs:transfer?0:cascade?650:380+t*70,
  flightMs:cascade?transfer?CASCADE_TRANSFER_MS:CASCADE_FLIGHT_MS:1250,
  impactMs:cascade?900:850+t*80,
  core:t===3?'#f3f5ff':'#fff2d6',glow:t===3?'#b9c9ff':'#ffc07b',
  secondary:t===3?'#a1eeff':t===2?'#d4e5ed':'#cb915c',
  sound:{charge:transfer?null:family+'_charge_'+rarity,
   fire:family+'_fire_'+rarity,impact:family+'_impact_'+rarity,
   transfer:family+'_transfer_'+rarity}
 };
}

// Ogni trasferimento parte dall'ultimo scafo colpito, DOPO il suo impatto.
// Il pagamento è letto dagli eventi weapon-cascade dello stesso apparecchio.
export function cascadeImpactPresentation(event,impactIndex,events,groupStart){
 if(event.pattern!=='cascade-piercer'||!precisionWeaponVariant(event.cardId))return null;
 const payments=events.filter(e=>e.kind==='weapon-cascade'&&e.who===event.who&&
  e.cardId===event.cardId&&e.machineId===event.machineId&&e.energySpent>0);
 const previous=event.impacts?.[impactIndex-1],payment=payments[impactIndex-1];
 const transfer=impactIndex>0&&!!payment&&!!previous?.targetId;
 return {cascadeIndex:impactIndex,cascadeTransfer:transfer,
  transferEnergySpent:transfer?payment.energySpent:0,
  sourceTargetKind:transfer?previous.targetKind:null,
  sourceTargetId:transfer?previous.targetId:null,
  delayMs:groupStart+(impactIndex?CASCADE_FLIGHT_MS+salvoSpan(event.cardId)+CASCADE_CONTACT_MS+
   (impactIndex-1)*(CASCADE_TRANSFER_MS+salvoSpan(event.cardId)+CASCADE_CONTACT_MS):0)};
}
