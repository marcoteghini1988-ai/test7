// Secondo gruppo Metallo approvato. Solo presentazione: nessuna scrittura nel motore.
export const GRAPPLE_ID='weapon-designed-metallic-ganasce-magnetiche';
export const COLLISION_ID='weapon-designed-metallic-collassatore-lega';
export const INDUCTION_ID='weapon-designed-metallic-frantumatore-induzione';
export const CHAIN_WEAPON_VARIANTS=Object.freeze([
 {id:GRAPPLE_ID,rarity:'Rara',tier:1,kind:'magnetic-grapple'},
 {id:GRAPPLE_ID+'-rarity-e',rarity:'Epica',tier:2,kind:'magnetic-grapple'},
 {id:GRAPPLE_ID+'-rarity-l',rarity:'Leggendaria',tier:3,kind:'magnetic-grapple'},
 {id:COLLISION_ID,rarity:'Epica',tier:2,kind:'alloy-collision'},
 {id:COLLISION_ID+'-rarity-l',rarity:'Leggendaria',tier:3,kind:'alloy-collision'},
 {id:INDUCTION_ID,rarity:'Epica',tier:2,kind:'induction'}
].map(Object.freeze));
export const chainWeaponVariant=id=>CHAIN_WEAPON_VARIANTS.find(v=>v.id===id)||null;
export function chainWeaponEffectProfile(id){
 const v=chainWeaponVariant(id);if(!v)return null;
 const {tier:t,kind}=v,collision=kind==='alloy-collision';
 const sequence=kind==='magnetic-grapple'?
  ['','bronze-jaw-latch','silver-arch-lock','prismatic-cage-lock'][t]:
  collision?t===2?'opposed-pole-convergence':'prismatic-yoke-convergence':'three-plate-induction';
 const family=kind==='magnetic-grapple'?'grapple':collision?'collision':'induction';
 const rarity=['common','rare','epic','legendary'][t];
 return {kind,approved:true,tier:t,sequence,
  chargeMs:collision?650:kind==='induction'?720:380+t*70,
  flightMs:collision?1800:kind==='induction'?1350:1450,
  impactMs:collision?1650:kind==='induction'?1050:1050+t*90,
  core:t===3?'#ecf8ff':'#fff1ce',glow:t===3?'#b9b8ff':'#ffc178',
  secondary:t===3?'#9deaff':t===2?'#d4e5f0':'#c99156',
  sound:{charge:family+'_charge_'+rarity,fire:family+'_fire_'+rarity,
   impact:family+'_impact_'+rarity,release:family+'_release_'+rarity,
   defense:'induction_defense_epic',block:'induction_block_epic'}
 };
}

// Le due contabilizzazioni HP del Collassatore appartengono a UN solo urto.
// Manteniamo anche l'impatto mitigato a zero se l'altro bersaglio è colpito.
export function collisionGroups(shots=[]){
 const groups=new Map();
 for(const s of shots){
  if(chainWeaponVariant(s.cardId)?.kind!=='alloy-collision')continue;
  const key=s.visualGroupId||`${s.who}:${s.machineId}:${s.cardId}`;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(s);
 }
 return [...groups.values()].filter(g=>g.length===2&&g.some(s=>s.fires)&&
  new Set(g.map(s=>s.targetKind+':'+s.targetId)).size===2);
}
export function collisionMotionPlan(a,b,{forward=0}={}){
 const dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);
 if(distance<1)return {contact:{x:a.x,y:a.y},offsets:[{x:0,y:0},{x:0,y:0}]};
 const separation=Math.min(distance*.42,(a.radius||20)+(b.radius||20));
 const travel=(distance-separation)/2,ux=dx/distance,uy=dy/distance;
 return {contact:{x:(a.x+b.x)/2,y:(a.y+b.y)/2+forward},
  offsets:[{x:ux*travel,y:uy*travel+forward},{x:-ux*travel,y:-uy*travel+forward}]};
}
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
export function collisionFrame(elapsed,profile){
 const touch=profile.flightMs,end=touch+profile.impactMs;
 if(elapsed<0)return {phase:'waiting',pull:0,flash:0};
 if(elapsed<touch)return {phase:'tension',pull:smooth(elapsed/touch),flash:0};
 if(elapsed<touch+230)return {phase:'contact',pull:1,flash:1-(elapsed-touch)/230};
 if(elapsed<end)return {phase:'release',pull:1-smooth((elapsed-touch-230)/(profile.impactMs-230)),flash:0};
 return {phase:'restored',pull:0,flash:0};
}

// Legge soltanto gli ID realmente registrati dal resolver dopo danni > 0.
// La scadenza è il turno proprio successivo; il Collassatore consuma lo stato.
export function activeGrappleLinks(battle){
 const links=[];if(!battle?.sides)return links;
 for(const who of ['A','B']){
  const side=battle.sides[who],enemy=battle.sides[who==='A'?'B':'A'];
  const g=side.provisionalWeaponStatus?.grapple;
  if(!g||battle.ply>g.ply+2)continue;
  const machine=side.machines?.find(m=>m.deployedPly===g.ply&&
   chainWeaponVariant(m.sourceCardId)?.kind==='magnetic-grapple');
  if(!machine)continue;
  for(const id of g.ids||[]){
   const escort=enemy.escorts?.find(e=>e.id===id);
   const part=enemy.ships?.[0]?.parts?.find(p=>p.id===id);
   const target=escort||part;
   if(!target||target.hp<=0||target.destroyed||part&&enemy.ships[0].hp<=0)continue;
   links.push({who,cardId:machine.sourceCardId,grapplePly:g.ply,
    targetKind:escort?'escort':'part',targetId:id});
  }
 }
 return links;
}
