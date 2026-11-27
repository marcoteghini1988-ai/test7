// Match the independently rounded base and support bonus printed on the two
// approved Storm cards. A final nominal must not receive the rarity factor twice.
export function stormCapacitorNominal(side,machine,supportCount){
 const p=machine.weaponProfile,factor=Number(machine.holoSourceBalanceFactor??side.weaponBalanceFactor??side.__pacingAuditWeaponFactor);
 const scale=p.finalNominal?1:Number.isFinite(factor)&&factor>0?factor:1;
 return Math.round(p.baseDamage*scale)+supportCount*Math.round(p.perSupportDamage*scale);
}
export const withFinalStormNominal=machine=>({...machine,weaponProfile:{...machine.weaponProfile,finalNominal:true}});
