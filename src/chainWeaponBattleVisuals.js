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
 {id:INDUCTION_ID,rarity:'Epica',tier:2,kind:'induction'},
 {id:INDUCTION_ID+'-rarity-l',rarity:'Leggendaria',tier:3,kind:'induction'}
].map(Object.freeze));
export const chainWeaponVariant=id=>CHAIN_WEAPON_VARIANTS.find(v=>v.id===id)||null;
export function chainWeaponEffectProfile(id){
 const v=chainWeaponVariant(id);if(!v)return null;
 const {tier:t,kind}=v,collision=kind==='alloy-collision';
 const sequence=kind==='magnetic-grapple'?
  ['','bronze-jaw-latch','silver-arch-lock','prismatic-cage-lock'][t]:
  collision?t===2?'opposed-pole-convergence':'prismatic-yoke-convergence':
   t===3?'prismatic-brace-induction':'three-plate-induction';
 const family=kind==='magnetic-grapple'?'grapple':collision?'collision':'induction';
 const rarity=['common','rare','epic','legendary'][t];
 return {kind,approved:true,tier:t,sequence,
  chargeMs:collision?450:kind==='induction'?720:380+t*70,
  flightMs:collision?1000:kind==='induction'?1350:1450,
  impactMs:collision?1350:kind==='induction'?1050:1050+t*90,
  core:t===3?'#ecf8ff':'#fff1ce',glow:t===3?'#b9b8ff':'#ffc178',
  secondary:t===3?'#9deaff':t===2?'#d4e5f0':'#c99156',
  sound:{charge:family+'_charge_'+rarity,fire:family+'_fire_'+rarity,
   impact:family+'_impact_'+rarity,release:family+'_release_'+rarity,
   defense:'induction_defense_'+rarity,block:'induction_block_'+rarity}
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
 if(distance<1)return {forward:0,contact:{x:a.x,y:a.y},offsets:[{x:0,y:0},{x:0,y:0}]};
 const separation=Math.min(distance*.42,(a.radius||20)+(b.radius||20));
 const travel=(distance-separation)/2,ux=dx/distance,uy=dy/distance;
 return {forward,contact:{x:(a.x+b.x)/2,y:(a.y+b.y)/2+forward},
  offsets:[{x:ux*travel,y:uy*travel+forward},{x:-ux*travel,y:-uy*travel+forward}]};
}
const clamp=n=>Math.max(0,Math.min(1,n));
export const COLLISION_RELEASE_AFTER_MS=75;
const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
export function collisionFrame(elapsed,profile){
 const touch=profile.flightMs,end=touch+profile.impactMs;
 if(elapsed<0)return {phase:'waiting',pull:0,advance:0,flash:0,rush:0};
 if(elapsed<touch){
  const t=elapsed/touch,snap=clamp((t-.62)/.38);
  // Prima libera il corridoio davanti alla madre; poi STRAPPA verso l'urto.
  // Nessuna frenata prima del contatto: l'ultimo tratto è il più veloce.
  return {phase:t<.62?'tension':'snap',pull:.07*smooth(t/.62)+.93*snap**2.7,
   advance:smooth(t/.62),flash:0,rush:snap**1.7};
 }
 const age=elapsed-touch;
 if(age<COLLISION_RELEASE_AFTER_MS)return {phase:'contact',pull:1,advance:1,flash:Math.exp(-age/95),rush:0};
 if(elapsed<end){
  const returning=1-smooth((age-COLLISION_RELEASE_AFTER_MS)/(profile.impactMs-COLLISION_RELEASE_AFTER_MS));
  return {phase:'release',pull:returning,advance:returning,flash:Math.exp(-age/95),rush:0};
 }
 return {phase:'restored',pull:0,advance:0,flash:0,rush:0};
}

// Posa dello scafo, distinta dalla traslazione del suo alloggiamento. Non
// tocca regole o HP e torna esattamente neutra anche con movimento ridotto.
export function collisionHullFrame(elapsed,profile,{direction=1,reduced=false}={}){
 const f=collisionFrame(elapsed,profile),age=elapsed-profile.flightMs;
 if(reduced||f.phase==='waiting'||f.phase==='restored')
  return {roll:0,pitch:0,lift:0,recoil:0,shake:0,light:0,thrust:0};
 if(age<0)return {roll:direction*(-3*Math.sin(f.advance*Math.PI)+16*f.rush),
  pitch:-7*f.rush,lift:-5*f.rush,recoil:0,shake:0,
  light:.18*f.rush,thrust:.2*f.advance+.8*f.rush};
 const decay=Math.exp(-age/310),kick=(1-Math.exp(-age/15))*Math.exp(-age/200);
 return {roll:direction*(16*Math.exp(-age/35)-19*Math.sin(age/70)*decay),
  pitch:13*Math.sin(age/60)*decay,lift:-9*Math.sin(age/85)*decay,
  recoil:(profile.tier===3?29:24)*kick,
  shake:Math.sin(age*.115)*6*Math.exp(-age/105),
  light:1.65*Math.exp(-age/125),thrust:.85*decay};
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
   links.push({who,cardId:machine.sourceCardId,grapplePly:g.ply,ply:g.ply,
    machineId:machine.id,machineSlot:machine.slot,stage:1,impactIndex:g.ports?.[id]??g.ids.indexOf(id),
    targetKind:escort?'escort':'part',targetId:id});
  }
 }
 return links;
}
