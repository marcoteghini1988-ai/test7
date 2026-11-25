// Renderer study from REAL combat events. Not a browser/game recording.
// ECLISSI_CANVAS_MODULE=/.../@napi-rs/canvas/index.js node ... OUTPUT [--all] [--stills]
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {Scene} from 'three';
import {createMaglioReviewBattle} from './maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from '../src/fleetNext/combat.js';
import {APPROVED_WEAPON_SALVOS} from '../src/fleetNext/approvedWeaponSalvos.js';
import {fleetWeaponProjectiles,weaponEffectProfile} from '../src/maglioBattleVisuals.js';
import {weaponLaunchOrigin,weaponContactPoint,weaponFlightFrame,applyWeaponFlightPose} from '../src/weaponKinematics.js';
import {createProjectileCamera,createMaglioProjectile,MAGLIO_PROJECTILE_SCALE,MAGLIO_NOSE_Z,disposeProjectile} from '../src/maglioProjectile3D.js';
import {createMetalProjectile} from '../src/metalWeaponProjectile3D.js';
import {createChainWeaponModel,articulateChainWeapon} from '../src/chainWeaponProjectile3D.js';
import {createPrecisionProjectile,articulatePrecisionProjectile} from '../src/precisionWeaponProjectile3D.js';
import {prepareCinematicEntry,drawCinematicWeapon,drawCollisionConvergence} from '../src/weaponCinematicRenderer.js';
import {MaglioSoftwareRenderer} from '../src/maglioSoftwareRenderer.js';
import {MaglioPerspectiveRenderer} from '../src/maglioPerspectiveRenderer.js';
import {drawMagneticChain,drawLatch} from '../src/chainWeaponCanvas.js';
import {drawCollisionExplosion} from '../src/collisionExplosion.js';
import {collisionFrame,collisionMotionPlan,collisionHullFrame,collisionGroups,COLLISION_RELEASE_AFTER_MS} from '../src/chainWeaponBattleVisuals.js';
import {weaponHullFrame} from '../src/weaponCinematicStyle.js';
import {thermalChargeForShot} from '../src/metalWeaponBattleVisuals.js';
import {weaponSalvoAudioCue} from '../src/weaponSalvoAudio.js';
import {STUDY_SALVO_LABELS} from './weaponSalvoStudyLabels.mjs';

const {createCanvas,loadImage}=await import(process.env.ECLISSI_CANVAS_MODULE||'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const output=resolve(process.argv[2]);mkdirSync(output,{recursive:true});
const selected=process.argv.includes('--all')?APPROVED_WEAPON_SALVOS:
 [0,1,2,3,7,9,12,14,16,18,21].map(i=>APPROVED_WEAPON_SALVOS[i]);
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',').map(Number);
const stills=process.argv.includes('--stills'),camera=createProjectileCamera(),scene=new Scene();
const canvas=createCanvas(900,1600),ctx=canvas.getContext('2d');ctx.scale(2,2);
const fc=createCanvas(900,1600),ac=createCanvas(900,1600),floor=fc.getContext('2d'),air=ac.getContext('2d');floor.scale(2,2);air.scale(2,2);
const mesh=createCanvas(1,1),cpu=new MaglioSoftwareRenderer(mesh,{contactShadow:false});cpu.setPixelRatio(1.5);cpu.setSize(450,800);
const maulCanvas=createCanvas(1,1),viewImages=new Map();
for(let tier=0;tier<4;tier++)viewImages.set(tier,await loadImage(resolve(`public/assets/fleet-weapons/maglio/projectiles/perspective-${tier}.png`)));
const maul=new MaglioPerspectiveRenderer(maulCanvas,{viewImages});maul.setPixelRatio(2);maul.setSize(450,800);
const hullCache=new Map();
async function hullImage(model,who){
 const facing=who==='A'?'enemy_to_player':'player_to_enemy',key=model+facing;
 if(!hullCache.has(key)){
  const base=resolve('public/assets/mathfleet/views/'+facing+'/'+model+'_complete');
  const path=existsSync(base+'.webp')?base+'.webp':base+'.png';hullCache.set(key,await loadImage(path));
 }return hullCache.get(key);
}
const names={'gravity-maul':'MAGLIO FERROGRAVITAZIONALE','steel-rail':'CANNONE A SLITTA',
 'thermal-reclaimer':'RECUPERATORE TERMOBALISTICO','magnetic-grapple':'GANASCE MAGNETICHE',
 'alloy-collision':'COLLASSATORE DI LEGA',induction:'FRANTUMATORE A INDUZIONE',
 'cascade-piercer':'PERFORATORE A CASCATA','wandering-shrapnel':'SCHEGGE ERRANTI'};
const other=who=>who==='A'?'B':'A',order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
const fps=30,start=650,manifest={type:'offline-renderer-study',isStackBlitzRecording:false,fps,width:900,height:1600,cases:[]};
let offset=0;
function background(profile,who,count,style){
 const g=ctx.createLinearGradient(0,0,0,800);g.addColorStop(0,'#080f1a');g.addColorStop(.5,'#1a2935');g.addColorStop(1,'#070c16');ctx.fillStyle=g;ctx.fillRect(0,0,450,800);
 ctx.fillStyle='#21333f';ctx.beginPath();ctx.moveTo(67,156);ctx.lineTo(383,156);ctx.lineTo(446,724);ctx.lineTo(4,724);ctx.closePath();ctx.fill();ctx.strokeStyle='#9aaebe38';ctx.lineWidth=1;ctx.stroke();
 ctx.textAlign='center';ctx.fillStyle='#e6f0f5';ctx.font='600 12px sans-serif';ctx.fillText(names[profile.kind],225,40);
 ctx.fillStyle=profile.glow;ctx.font='12px sans-serif';ctx.fillText(profile.rarity+' · '+(who==='A'?'LATO GIOCATORE':'LATO AVVERSARIO'),225,65);
 ctx.fillStyle='#eff7ff';ctx.font='600 13px sans-serif';ctx.fillText(profile.kind==='alloy-collision'?'2 SCAFI · 1 SCHIANTO':count+' PROIETTILI REALI',225,95);
 ctx.fillStyle='#99b1c0';ctx.font='10px sans-serif';ctx.fillText(STUDY_SALVO_LABELS[style]||style,225,119);
 ctx.fillStyle='#bacbd5';ctx.font='10px sans-serif';ctx.fillText('SEQUENZE DAI VERI EVENTI DEL MOTORE',225,754);
 ctx.fillStyle='#8198a7';ctx.font='9px sans-serif';ctx.fillText('Studio offline · non è una registrazione StackBlitz',225,777);
}
function target(t,pose,opacity=1){
 ctx.save();ctx.globalAlpha=opacity;ctx.translate(t.p.x+(pose.x||0),t.p.y+(pose.y||0)+(pose.lift||0));
 ctx.rotate((pose.roll||0)*Math.PI/180);ctx.scale(1,Math.cos((pose.pitch||0)*Math.PI/180));
 ctx.fillStyle='#0007';ctx.beginPath();ctx.ellipse(0,10,t.size*.48,t.size*.17,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.filter=`brightness(${1+(pose.light||0)*.8})`;ctx.drawImage(t.image,-t.size/2,-t.size/2,t.size,t.size);ctx.restore();ctx.restore();
}
for(const [caseIndex,plan]of selected.entries()){
 let b=createMaglioReviewBattle({cardId:plan.cardId,supports:/ganasce|collassatore|cascata/.test(plan.cardId),
  energyCards:plan.cardId.includes('cascata')?2:0,cascadeMode:plan.cardId.includes('cascata')?'two':'none',nowMs:0});
 const who=caseIndex%2?'B':'A';if(who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1000).battle;
 const result=resolvePreparedFleetTurn(b,who,order,2000);if(!result.ok)throw Error(result.reason);
 const shots=fleetWeaponProjectiles(result.events).filter(s=>s.cardId===plan.cardId),profile=weaponEffectProfile(plan.cardId);
 const defender=b.sides[other(who)],after=result.battle.sides[other(who)],targets=[];
 const mother=defender.ships[0];targets.push({id:'weapons',kind:'part',unit:mother,p:{x:225,y:who==='A'?268:540,radius:28},size:112,image:await hullImage(mother.id,who)});
 for(const [index,escort]of defender.escorts.entries())targets.push({id:escort.id,kind:'escort',unit:escort,
  p:{x:index===0?130:320,y:who==='A'?350:450,radius:24},size:83,image:await hullImage(escort.shipModelId||escort.modelId||['C02','C03'][index],who)});
 const find=(kind,id)=>targets.find(t=>t.kind===kind&&t.id===id);
 const paths=shots.filter(s=>s.fires||s.defenseBlocked||profile.kind==='alloy-collision').map(shot=>{
  const target=find(shot.targetKind,shot.targetId);if(!target)throw Error('Missing real target '+shot.targetId);
  const source=shot.cascadeTransfer?find(shot.sourceTargetKind,shot.sourceTargetId):null;
  const from=source?{...source.p,edge:'previous-hull'}:weaponLaunchOrigin(shot),to=weaponContactPoint(target.p,shot);
  const p=weaponEffectProfile(shot.cardId,shot),entry=prepareCinematicEntry({shot,profile:p,from,to,start:start+(shot.delayMs||0)},camera);
  const model=p.kind==='alloy-collision'?null:p.kind==='gravity-maul'?createMaglioProjectile(p.tier):
   ['steel-rail','thermal-reclaimer'].includes(p.kind)?createMetalProjectile(p.kind,p.tier,thermalChargeForShot(shot).ratio):
   ['magnetic-grapple','induction'].includes(p.kind)?createChainWeaponModel(p.kind,p.tier):createPrecisionProjectile(p.kind,p.tier);
  if(model)model.scale.setScalar((p.kind==='gravity-maul'?MAGLIO_PROJECTILE_SCALE:1)*(shot.visualScale||1));
  return {...entry,model,target};
 });
 const groups=collisionGroups(shots).map(group=>{
  const pair=group.map(s=>paths.find(p=>p.shot===s));const centers=pair.map(p=>p.target.p),dx=centers[1].x-centers[0].x,dy=centers[1].y-centers[0].y,len=Math.hypot(dx,dy)||1;
  return {pair,centers,axis:{x:dx/len,y:dy/len},plan:collisionMotionPlan(...centers,{forward:who==='A'?78:-72})};
 });
 const end=Math.max(...paths.map(p=>p.start+p.profile.flightMs+p.profile.impactMs))+240,nframes=Math.ceil(end/1000*fps),duration=nframes/fps;
 maul.forceMesh=plan.count>1;
 const seenCollision=new Set(),cues=[];
 const cue=(entry,phase,ms)=>{const c=weaponSalvoAudioCue(entry.profile,entry.shot,phase);if(c.type)cues.push({...c,phase,at:ms/1000,
  pan:((phase==='impact'||phase==='block'?entry.to.x:entry.from.x)-225)/225});};
 for(const p of paths){
  if(p.profile.kind==='alloy-collision'){if(seenCollision.has(p.shot.visualGroupId))continue;seenCollision.add(p.shot.visualGroupId);}
  if(p.profile.sound.charge)cue(p,'charge',p.start-p.profile.chargeMs);
  cue(p,p.shot.cascadeTransfer?'transfer':'fire',p.start);cue(p,p.shot.defenseBlocked?'block':'impact',p.start+p.profile.flightMs);
  if(p.profile.kind==='alloy-collision')cue(p,'release',p.start+p.profile.flightMs+COLLISION_RELEASE_AFTER_MS);
 }
 const chapter={index:caseIndex,id:plan.cardId,kind:profile.kind,rarity:profile.rarity,who,projectiles:profile.kind==='alloy-collision'?0:paths.length,
  damage:shots.reduce((n,s)=>n+s.actualDamage,0),duration,frames:nframes,start:offset,style:plan.style,
  origins:paths.filter(p=>!p.shot.cascadeTransfer).map(p=>p.from),cues};manifest.cases.push(chapter);offset+=duration;
 writeFileSync(resolve(output,'salvo-study.json'),JSON.stringify({...manifest,duration:offset},null,2));
 if(only&&!only.includes(caseIndex)){paths.forEach(p=>p.model&&disposeProjectile(p.model));continue;}
 const folder=resolve(output,'case-'+String(caseIndex).padStart(2,'0'));mkdirSync(folder,{recursive:true});
 let encoder;
 if(!stills){encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size','900x1600','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',resolve(folder,'video.mp4')],{stdio:['pipe','ignore','inherit']});}
 const first=paths[0],snapshots=new Set([Math.floor((first.start+first.profile.flightMs*.48)/1000*fps),
  Math.floor((first.start+first.profile.flightMs+60)/1000*fps),Math.floor((end-500)/1000*fps)]);
 for(let frame=0;frame<nframes;frame++){
  if(stills&&!snapshots.has(frame))continue;
  const age=frame/fps*1000;background(profile,who,chapter.projectiles,plan.style);
  floor.clearRect(0,0,450,800);air.clearRect(0,0,450,800);scene.clear();
  for(const t of targets){
   let pose={x:0,y:0,roll:0,pitch:0,lift:0,light:0,thrust:0},display={...t,p:{...t.p}};
   const collision=groups.find(g=>g.pair.some(p=>p.target===t));
   if(collision){const index=collision.pair.findIndex(p=>p.target===t),entry=collision.pair[index],elapsed=age-entry.start,
    motion=collisionFrame(elapsed,entry.profile),body=collisionHullFrame(elapsed,entry.profile,{direction:index===0?1:-1}),off=collision.plan.offsets[index],kick=index===0?-body.recoil:body.recoil;
    display.p.x+=off.x*motion.pull+collision.axis.x*kick+body.shake;
    display.p.y+=(off.y-collision.plan.forward)*motion.pull+collision.plan.forward*motion.advance+collision.axis.y*kick-body.shake*.45;pose={...body,x:0,y:0};
   }else for(const p of paths.filter(p=>p.target===t)){
    const h=weaponHullFrame(p.profile.kind,age-p.start-p.profile.flightMs,p.profile.impactMs,{tier:p.profile.tier,direction:who==='A'?-1:1});
    if((p.shot.salvoCount||1)>1&&!p.shot.salvoLast){for(const k of ['x','y','roll','pitch','lift','thrust'])h[k]*=.5;h.light*=.7;}
    if(h.light>pose.light)pose=h;
   }
   target(display,pose);
  }
  for(const p of paths){
   const elapsed=age-p.start,t=elapsed/p.profile.flightMs;
   if(p.profile.kind==='alloy-collision')continue;
   drawCinematicWeapon(floor,air,p,age);
   if(t>=0&&t<1){
    const front=p.profile.kind==='gravity-maul'?MAGLIO_NOSE_Z*p.model.scale.z:p.model.userData.frontZ*p.model.scale.z;
    const pose=weaponFlightFrame(p.from,p.to,t,camera,front,{shot:p.shot,kind:p.profile.kind});applyWeaponFlightPose(p.model,pose);
    if(['induction','magnetic-grapple'].includes(p.profile.kind))articulateChainWeapon(p.model,Math.max(0,Math.min(1,(t-.8)/.2)));
    if(['cascade-piercer','wandering-shrapnel'].includes(p.profile.kind))articulatePrecisionProjectile(p.model,elapsed);
    scene.add(p.model);
    if(p.profile.kind==='magnetic-grapple'){const q=pose.nose.clone().project(camera);drawMagneticChain(floor,p.from,{x:(q.x+1)*225,y:(1-q.y)*400},p.profile,camera,age,0);}
   }else if(t>=1&&p.profile.kind==='magnetic-grapple'){
    drawMagneticChain(floor,p.from,p.to,p.profile,camera,age,.7);drawLatch(air,p.to,p.profile);
   }
  }
  for(const g of groups){const p=g.pair[0],elapsed=age-p.start;
   drawCollisionConvergence(floor,air,p,g.plan.contact,elapsed,false);
   drawCollisionExplosion(air,g.plan.contact,p.profile,elapsed-p.profile.flightMs,camera,{});
  }
  ctx.drawImage(fc,0,0,450,800);
  const renderer=profile.kind==='gravity-maul'?maul:cpu;renderer.render(scene,camera);
  ctx.drawImage(profile.kind==='gravity-maul'?maulCanvas:mesh,0,0,450,800);ctx.drawImage(ac,0,0,450,800);
  // Studio captions are outside the arena and stay above incoming rounds.
  ctx.save();ctx.beginPath();ctx.rect(0,0,450,140);ctx.clip();background(profile,who,chapter.projectiles,plan.style);ctx.restore();
  if(snapshots.has(frame))writeFileSync(resolve(folder,'frame-'+frame+'.png'),canvas.toBuffer('image/png'));
  if(encoder){const pixels=ctx.getImageData(0,0,900,1600).data;
   if(!encoder.stdin.write(Buffer.from(pixels.buffer,pixels.byteOffset,pixels.byteLength)))await once(encoder.stdin,'drain');}
 }
 if(encoder){encoder.stdin.end();const [code]=await once(encoder,'close');if(code)throw Error('ffmpeg '+code);}
 paths.forEach(p=>p.model&&disposeProjectile(p.model));console.log('CASE_OK',caseIndex,plan.cardId,chapter.projectiles,duration);
}
writeFileSync(resolve(output,'salvo-study.json'),JSON.stringify({...manifest,duration:offset},null,2));
