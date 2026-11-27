// Anteprima proposta: geometrie volumetriche, non una PNG del colpo ruotata.
import {reviewTimeline} from './timeline.mjs';
import {drawProbeHammerProjectile as projectile,drawProbeHammerReticle as reticle,drawProbeHammerContact as contact} from '../../../src/probeHammerRenderer.js';
export {crescentLeadingPoint} from '../../../src/probeHammerRenderer.js';
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
const tier=r=>['Comune','Rara','Epica','Leggendaria'].indexOf(r);
function line(ctx,points,color,width=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();}
function glow(ctx,p,r,color,alpha=1){if(r<=0)return;ctx.save();ctx.globalAlpha*=alpha;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,color);g.addColorStop(.22,color+'bb');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.restore();}
const label=(ctx,text,x,y,size=11,color='#e8f4ff',align='center')=>{ctx.fillStyle=color;ctx.font=`600 ${size}px "Eclissi Preview",sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);};
const motherPos=who=>({x:225,y:who==='B'?255:560});
function targetPos(s,h){const defender=h.who==='A'?'B':'A';if(h.targetKind==='escort'){const i=s.initial.sides[defender].escorts.findIndex(e=>e.id===h.targetId);return {x:i?322:128,y:defender==='B'?333:482};}return motherPos(defender);}
function recoil(s,plan,ms,who,id,part=false,reduced=false){
 let dx=0,dy=0,rot=0,light=0,alpha=1;
 for(const h of plan.hits){if(h.who===who||(!part&&h.targetId!==id)||part&&h.targetKind==='escort')continue;const age=ms-h.impactAt;if(age<0||h.blocked||h.actualDamage<=0)continue;
  const impulse=reduced?0:(1-Math.exp(-age/12))*Math.exp(-age/165),power=h.kind==='probe'?2.5:h.bonus?14:8;
  dx+=(h.bonus?-1:1)*impulse*power*.3;dy+=(who==='B'?-1:1)*impulse*power;rot+=(h.bonus?-.14:.07)*impulse;light+=Math.exp(-age/110)*(h.bonus?.65:.35);
  if(h.destroyed)alpha=Math.min(alpha,1-clamp((age-160)/450));
 }
 return {dx,dy,rot,light,alpha};
}
function drawShip(ctx,image,p,size,pose,ms,who){
 const q={x:p.x+pose.dx,y:p.y+pose.dy};ctx.save();ctx.globalAlpha=pose.alpha;
 ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(q.x,q.y+size*.24,size*.36,size*.09,0,0,TAU);ctx.fill();
 const rear=who==='B'?-1:1;glow(ctx,{x:q.x,y:q.y+rear*size*.29},9+Math.sin(ms*.014)*1.7,'#70bfff',.32);
 ctx.translate(q.x,q.y);ctx.rotate(pose.rot);ctx.filter=`brightness(${1+pose.light})`;ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();return q;
}
export function drawProbeHammer(ctx,s,ms,assets,{reducedMotion=false}={}){
 const plan=reviewTimeline(s),positions={},poses={};ctx.clearRect(0,0,450,800);ctx.drawImage(assets.arena,0,0,450,800);
 for(const who of ['B','A']){const side=s.initial.sides[who],m=side.ships[0],p=recoil(s,plan,ms,who,m.id,true,reducedMotion);positions[who+':mother']=drawShip(ctx,assets.hulls[who+':'+m.id],motherPos(who),130,p,reducedMotion?0:ms,who);poses[who+':mother']=p;
  for(const [i,e]of side.escorts.entries()){const q=recoil(s,plan,ms,who,e.id,false,reducedMotion);positions[e.id]=drawShip(ctx,assets.hulls[who+':'+e.shipModelId],{x:i?322:128,y:who==='B'?333:482},83,q,reducedMotion?0:ms,who);poses[e.id]=q;}}
 const pos=h=>{const defender=h.who==='A'?'B':'A';return h.targetKind==='escort'?positions[h.targetId]||targetPos(s,h):positions[defender+':mother'];};
 if(plan.mark&&ms>=plan.mark.at&&ms<plan.mark.until){const hit=plan.hits.find(h=>h.kind==='probe'&&h.targetId===plan.mark.targetId);reticle(ctx,pos(hit),reducedMotion?140:ms-plan.mark.at,s.rarity);}
 for(const h of plan.hits){if(!reducedMotion)projectile(ctx,h,ms-h.launchAt,targetPos(s,h));contact(ctx,h,reducedMotion&&ms>=h.impactAt?(ms-h.impactAt<250?85:1100):ms-h.impactAt,pos(h),reducedMotion);}
 ctx.fillStyle='#07111fef';ctx.fillRect(0,0,450,112);label(ctx,'ANTEPRIMA B · EFFETTI DA INSERIRE',225,19,10,'#ffdda1');label(ctx,'IONIC ASSAULT PROBE / THUNDER HAMMER',225,42,11.5);
 label(ctx,s.rarity.toUpperCase()+' · '+({'combo':'COMBO NELLO STESSO TURNO','next-turn':'COMBO NEL TURNO SUCCESSIVO','hammer-alone':'MARTELLO AUTONOMO','probe-only':'SONDA E SEGNALE','probe-blocked':'SONDA INTERCETTATA','hammer-blocked':'FENDENTI INTERCETTATI','target-dies':'BERSAGLIO GIA DISTRUTTO','first-hit-kills':'PRIMO FENDENTE LETALE','expired':'SEGNALE SCADUTO','reverse':'ORDINE INVERSO','weapon-blocked':'ARMA DISABILITATA'}[s.mode]||s.mode),225,64,10,'#afd3f1');
 const current=plan.hits.filter(h=>ms>=h.launchAt).at(-1),phase=current?(ms<current.impactAt?(current.kind==='probe'?'Impulso di precisione':current.bonus?'Secondo fendente':'Lama rotante'):current.blocked?'La Difesa intercetta il colpo':current.bonus?'Detonazione elettrica e segnale consumato':current.kind==='probe'?'Reticolo sul bersaglio colpito':'Primo fendente'): (s.mode==='weapon-blocked'?'Arma disabilitata: nessun lancio':'Pronto');label(ctx,phase,225,87,10.5,'#e5f5ff');
 ctx.fillStyle='#06101feb';ctx.fillRect(0,707,450,93);const reached=plan.hits.filter(h=>ms>=h.impactAt),damage=reached.reduce((n,h)=>n+h.actualDamage,0);label(ctx,`${reached.length} IMPATTI REALI · ${damage} HP EFFETTIVI`,225,729,11);
 label(ctx,s.who==='A'?'Tiri dal bordo giocatore':'Tiri dal bordo avversario',225,751,10,'#c8dff2');label(ctx,'Video di studio · eventi del motore reale',225,774,9.5,'#9eb7cb');
 const ids=[...new Set(s.frames.map(f=>f.cardId))];for(const [i,id]of ids.entries())if(assets.cards[id])ctx.drawImage(assets.cards[id],38+i*65,620,49,74);
 if(s.mode.includes('blocked')&&assets.defense){ctx.save();ctx.fillStyle='#0a2239';ctx.fillRect(361,335,42,63);ctx.drawImage(assets.defense,368,349,28,28);for(const h of plan.hits)if(h.blocked&&ms>=h.impactAt&&ms<h.impactAt+300)glow(ctx,{x:382,y:365},24,'#9bddff',.45);ctx.restore();label(ctx,'DEFENSE',382,392,7);}
}
