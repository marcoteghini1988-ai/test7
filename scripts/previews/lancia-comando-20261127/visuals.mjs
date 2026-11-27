import {commandLanceTimeline,commandLanceHullPose} from '../../../src/commandLanceSpec.js';
import {drawCommandLanceProjectile,drawCommandLanceContact,drawCommandLanceSignal,lanceGlow as glow} from '../../../src/commandLanceRenderer.js';
const TAU=Math.PI*2;
const label=(ctx,text,x,y,size=11,color='#eaf4ff')=>{ctx.fillStyle=color;ctx.font=`600 ${size}px "Eclissi Preview",sans-serif`;ctx.textAlign='center';ctx.fillText(text,x,y);};
const other=who=>who==='A'?'B':'A';
const motherPos=who=>({x:225,y:who==='A'?557:253});
const escortPos=(who,index)=>({x:index?322:128,y:who==='A'?478:333});
export const caseNames={active:'Personaggio attivo', 'same-turn':'Personaggio e Arma nello stesso turno',missing:'Personaggio assente',expired:'Personaggio scaduto',disabled:'Arma disabilitata',defense:'Colpo intercettato dalla Difesa'};
export function drawLanceReview(ctx,s,ms,assets,{reducedMotion=false}={}){
 const plan=commandLanceTimeline(s),positions={};ctx.clearRect(0,0,450,800);ctx.drawImage(assets.arena,0,0,450,800);
 for(const who of ['B','A']){
  const side=s.initial.sides[who],units=[{unit:side.ships[0],mother:true},...side.escorts.map((unit,index)=>({unit,index,mother:false}))];
  for(const {unit,index,mother}of units){
   const hits=plan.hits.filter(h=>h.who!==who&&(mother?h.targetKind!=='escort':h.targetId===unit.id)),p=mother?motherPos(who):escortPos(who,index);
   const pose=hits.map(h=>commandLanceHullPose(h,ms-h.impactAt,reducedMotion)).reduce((a,v)=>({dx:a.dx+v.dx,dy:a.dy+v.dy,roll:a.roll+v.roll,light:a.light+v.light}),{dx:0,dy:0,roll:0,light:0}),q={x:p.x+pose.dx,y:p.y+pose.dy};
   positions[who+':'+(mother?'mother':unit.id)]=q;
   const size=mother?137:88,img=assets.hulls[who+':'+(mother?unit.id:unit.shipModelId)];
   ctx.save();ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(q.x,q.y+size*.25,size*.35,size*.08,0,0,TAU);ctx.fill();
   ctx.translate(q.x,q.y);ctx.rotate(pose.roll);ctx.filter=`brightness(${1+pose.light})`;ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();
   const lost=hits.filter(h=>ms>=h.impactAt).reduce((n,h)=>n+h.actualDamage,0),hp=Math.max(0,unit.hp-lost),width=mother?94:64;
   ctx.fillStyle='#071c2bdd';ctx.fillRect(p.x-width/2,p.y+size*.40,width,5);ctx.fillStyle=who==='A'?'#75d9db':'#e998ab';ctx.fillRect(p.x-width/2,p.y+size*.40,width*hp/unit.maxHp,5);
   label(ctx,`${hp} / ${unit.maxHp}`,p.x,p.y+size*.40+16,8,'#dcecf7');
  }
 }
 const cp={x:384,y:s.who==='A'?638:154};
 if(s.initial.sides[s.who].commander?.untilPly>s.initial.ply||s.mode==='same-turn'){
  ctx.fillStyle='#321a36';ctx.fillRect(cp.x-23,cp.y-32,46,64);ctx.strokeStyle='#ce86c6';ctx.strokeRect(cp.x-23,cp.y-32,46,64);
  if(assets.character)ctx.drawImage(assets.character,cp.x-21,cp.y-29,42,58);
  if(plan.signal)drawCommandLanceSignal(ctx,cp,ms-plan.signal.at);
  label(ctx,'CHARACTER',cp.x,cp.y+43,6.5,'#f1c5e9');
 }
 for(const h of plan.hits){
  const defender=other(h.who),base=h.targetKind==='escort'?escortPos(defender,s.initial.sides[defender].escorts.findIndex(e=>e.id===h.targetId)):motherPos(defender);
  const p=positions[defender+':'+(h.targetKind==='escort'?h.targetId:'mother')]||base;
  if(!reducedMotion)drawCommandLanceProjectile(ctx,h,ms-h.launchAt,base);
  drawCommandLanceContact(ctx,h,reducedMotion&&ms>=h.impactAt?(ms-h.impactAt<250?80:1100):ms-h.impactAt,p,{reduced:reducedMotion});
  if(h.blocked){
   const dp={x:383,y:defender==='B'?335:478};ctx.fillStyle='#082f48';ctx.fillRect(dp.x-21,dp.y-30,42,60);if(assets.defense)ctx.drawImage(assets.defense,dp.x-16,dp.y-16,32,32);
   if(ms>=h.impactAt&&ms<h.impactAt+400)glow(ctx,dp,27,'#89dfff',Math.exp(-(ms-h.impactAt)/170)*.7);
   label(ctx,'DEFENSE',dp.x,dp.y+41,7,'#b0e6ff');
  }
 }
 if(assets.cards[s.cardId])ctx.drawImage(assets.cards[s.cardId],24,s.who==='A'?624:134,52,78);
 ctx.fillStyle='#07111ff5';ctx.fillRect(0,0,450,108);label(ctx,'IONIC COMMAND LANCE',225,28,17);label(ctx,s.rarity.toUpperCase()+' · '+caseNames[s.mode],225,51,9.6,'#beddf5');
 const h=plan.hits[0],phase=h?(ms<450?'Personaggio pronto':ms<1050?'Segnale del Personaggio':ms<h.impactAt?'Lancia elettrica in volo':h.blocked?'Intercettazione sullo scudo':'Scariche sulla corazza'):s.mode==='disabled'?'Arma disabilitata: nessun lancio':'Manca un Personaggio attivo: nessun lancio';
 label(ctx,phase,225,79,11,'#f0d9a3');
 ctx.fillStyle='#07111ff5';ctx.fillRect(0,708,450,92);const reached=plan.hits.filter(h=>ms>=h.impactAt),damage=reached.reduce((n,h)=>n+h.actualDamage,0);
 label(ctx,`${reached.length} CONTATTI · ${damage} HP EFFETTIVI`,225,735,12);label(ctx,s.who==='A'?'Ingresso dal bordo inferiore':'Ingresso dal bordo superiore',225,757,10,'#c3dff3');label(ctx,'Studio dell’effetto · eventi del motore reale',225,781,9,'#9fb9d2');
}
