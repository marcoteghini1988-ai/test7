// Profili puramente VISIVI degli armamenti ufficiali: non cambiano il
// danno, i colpi o i salvataggi. Ogni nome e' letto dal catalogo 42 armi.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';

const styles=Object.freeze([
 {key:'rift',pattern:/portale|raggio nero|gravità|gravita|vuoto|spirali/i},
 {key:'arc',pattern:/saett|lampo|arco elettric|fulmine|scintill|impulso ionico/i},
 {key:'beam',pattern:/laser|raggio|fotoni|quattro raggi/i},
 {key:'prism',pattern:/cristall|prismatic|geometric|esagon|frammenti|schegge/i},
 {key:'plasma',pattern:/plasma|fuoco|ardente|incandescente|bolide|esplosiv/i},
 {key:'missile',pattern:/proiettil|dardi|lanc|obice|capsul|lame|aghi|shuriken|frecc/i},
 {key:'wave',pattern:/onde|onda|shockwave|orbita|vortice|gravita|turbine/i},
]);
const colors=Object.freeze({
 red:'#ff6f75',green:'#62f1a0',violet:'#ca8bff',
 gold:'#ffe199',cyan:'#83e9ff',neutral:'#d1e8ff'
});
const byShip=new Map(PHASE1_CATALOG.ships.map(s=>[
 s.id,PHASE1_CATALOG.weapons.filter(w=>w.nave_id===s.id)
]));
const visualForWeapon=weapon=>{
 const desc=weapon.effetto_visivo||'';
 const style=styles.find(v=>v.pattern.test(desc))?.key||'pulse';
 const c=/ross|cremisi|scarlatt|corallo/.test(desc)?colors.red:
  /verd/.test(desc)?colors.green:/viol|ombra|ner/.test(desc)?colors.violet:
  /oro|dorat|giall/.test(desc)?colors.gold:
  /azzurr|bianco|argenta|celest/.test(desc)?colors.cyan:colors.neutral;
 return Object.freeze({
  id:weapon.id,name:weapon.nome,style,color:c,
  description:desc,shipId:weapon.nave_id
 });
};
const profiles=new Map(PHASE1_CATALOG.weapons.map(w=>[w.id,visualForWeapon(w)]));
export function fleetWeaponVisuals(){
 return Object.freeze([...profiles.values()]);
}
export function fleetWeaponOfRound(shipId,round=1){
 const owned=byShip.get(shipId)||[];
 if(!owned.length)return null;
 const turn=Math.max(0,Math.floor(Number(round)||1)-1);
 const weapon=owned[turn%owned.length];
 return profiles.get(weapon.id);
}
export function fleetVolleyVisuals(ships,hit,round){
 if(!hit||hit.fireCount<=0||!hit.strength||!Array.isArray(ships))return [];
 return ships.flatMap((ship,i)=>{
  if(ship.parts.filter(p=>p.destroyed).length>=2||
    ship.parts.find(p=>p.id==='weapons')?.damage>=2)return [];
  const weapon=fleetWeaponOfRound(ship.id,round);
  if(!weapon)return [];
  // L'engine ha gia' deciso chi puo' sparare: qui mostriamo solo quel colpo,
  // alternando le armi autentiche che la navicella ha integrate.
  return [{shipIndex:i,shipName:ship.name,...weapon}];
 });
}
export function fleetImpactVisual(hit){
 if(!hit||hit.fireCount<=0||hit.strength<=0)return null;
 if(hit.damage>0){
  const known=['engine','weapons','generator','command'];
  if(!known.includes(hit.partId))return null;
  return Object.freeze({
   kind:hit.destroyed?'destroyed':'fracture',
   image:'/assets/battle-fx/vital-'+hit.partId+'.png',
   label:(hit.destroyed?'Distrutto: ':'Frattura: ')+hit.partName
  });
 }
 if(hit.shieldsHit>0)return Object.freeze({
  kind:hit.shieldsHit>1?'shield-fracture':'shield-contact',
  image:'/assets/battle-fx/'+(hit.shieldsHit>1?'shield-fracture':'shield-contact')+'.png',
  label:'Scudo colpito'
 });
 return null;
}
