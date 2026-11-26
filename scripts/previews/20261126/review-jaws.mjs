// Storyboard grafico dei nuovi ganci. Nessun HP o parametro aperto viene applicato.
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {once} from 'node:events';
import {boardPointToWorld} from '../../../src/maglioProjectile3D.js';
import {weaponFlightFrame,applyWeaponFlightPose} from '../../../src/weaponKinematics.js';
import {drawMagneticChain} from '../../../src/chainWeaponCanvas.js';
import {drawCollisionExplosion} from '../../../src/collisionExplosion.js';
import {weaponEffectProfile} from '../../../src/maglioBattleVisuals.js';
import {newProjectile,clamp,kineticImpact,glow,hullPose} from './review-visuals.mjs';
export function jawCases(cards){
 const a=cards.filter(c=>c.kind==='magnetic-grapple'),b=cards.filter(c=>c.kind==='alloy-collision');
 return [...a.map(card=>({card,group:'ganasce',jaw:'a',caption:'A autonoma · aggancio, tensione, strappo al T3'})),
  ...b.map(card=>({card,group:'ganasce',jaw:'b',caption:'B autonoma · durata e danni da fissare'})),
  {card:b[0],group:'ganasce',jaw:'pair',caption:'A + B · due navi agganciate, un solo schianto'},
  {card:b[1],group:'ganasce',jaw:'floor',caption:'A + B · sola madre, uno schianto sul piano'}];
}
export async function drawJawsCase(env){
 const {c,index,offset,folder,stills,ctx,canvas,floor,air,floorCanvas,airCanvas,camera,scene,cpu,meshCanvas,hullImage,front,background,body,header}=env;
 const tier=['Comune','Rara','Epica','Leggendaria'].indexOf(c.card.rarity),who=tier===2?'B':'A',down=who==='A'?1:-1,combo=['pair','floor'].includes(c.jaw),single=c.jaw==='floor';
 const duration=combo?8.8:c.jaw==='a'?9.6:6.8,frames=Math.ceil(duration*30),start=760,fly=1450,first=start+fly,second=4050,boom=6000;
 const profile={...weaponEffectProfile(c.card.id),kind:'magnetic-grapple',tier,core:tier===3?'#e9f5ff':'#fff1ce',glow:tier===3?'#b9b9ff':'#ffc079',secondary:tier===3?'#b8e9ff':tier===2?'#d9e6f0':'#cf9a67',flightMs:1450,impactMs:1300};
 const rarity=['common','rare','epic','legendary'][tier],shot={cardId:c.card.id,who,salvoCount:1,salvoIndex:0,actualDamage:0,fires:true,salvoStyle:'opposed-jaws'};
 const targets=combo&&!single?[{p:{x:127,y:who==='A'?341:451,radius:25},size:92,image:await hullImage('C02',who),facing:who},{p:{x:323,y:who==='A'?341:451,radius:25},size:92,image:await hullImage('C03',who),facing:who}]:[{p:{x:225,y:who==='A'?292:516,radius:31},size:132,image:await hullImage('C01',who),facing:who}];
 const mother=combo&&!single?{p:{x:225,y:who==='A'?253:554},size:114,image:await hullImage('C01',who),facing:who}:null;
 const origins=[{x:who==='A'?41:409,y:who==='A'?812:-12,edge:who==='A'?'bottom-player':'top-opponent'},{x:who==='A'?398:52,y:who==='A'?812:-12,edge:who==='A'?'bottom-player':'top-opponent'}];
 const models=[newProjectile(c.jaw==='b'?'jaw-b':'jaw-a',tier),...(combo?[newProjectile('jaw-b',tier)]:[])];
 const ch={index,id:c.card.id,name:combo?'Ganasce A + B · '+(single?'madre contro il piano':'collisione fra navi'):c.card.name,group:'ganasce',kind:c.card.kind,rarity:c.card.rarity,who,caption:c.caption,jaw:c.jaw,projectiles:models.length,damage:null,parameterStatus:'storyboard: danni e parametri aperti non applicati',duration,frames,start:offset,origins:origins.slice(0,models.length),cues:[]};
 Object.defineProperty(ch,'cardImage',{value:await front(c.card),enumerable:false});
 const cue=(type,phase,ms,level=1,pan=0)=>ch.cues.push({type,phase,at:ms/1000,level,pan,timeScale:1,pitchSemitones:0});
 cue('grapple_fire_'+rarity,'fire',start,.7,-.65);cue('grapple_impact_'+rarity,'impact',first,.85,-.2);
 if(combo){cue('grapple_fire_'+rarity,'fire',second-fly,.7,.65);cue('grapple_impact_'+rarity,'impact',second,.85,.2);cue('collision_charge_'+rarity,'charge',4550,.8);cue('collision_impact_'+rarity,'impact',boom,1);cue('collision_release_'+rarity,'release',boom+125,.65);}
 else if(c.jaw==='a'){cue('grapple_charge_'+rarity,'charge',3800,.65);cue('grapple_impact_'+rarity,'impact',4300,.7);cue('grapple_charge_'+rarity,'charge',6580,.8);cue('grapple_release_'+rarity,'impact',7400,.9);}
 else{cue('grapple_charge_'+rarity,'charge',3500,.65);cue('grapple_release_'+rarity,'impact',4800,.9);}
 const encoder=stills?null:spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size','900x1600','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',path.join(folder,'video.mp4')],{stdio:['pipe','ignore','inherit']});
 const snapshots=new Set((combo?[1600,4800,boom+75,boom+300]:[1500,first+75,c.jaw==='a'?7460:4880]).map(ms=>Math.round(ms/1000*30)));
 for(let n=0;n<frames;n++){
  if(stills&&!snapshots.has(n))continue;const age=n/30*1000;background();floor.clearRect(0,0,450,800);air.clearRect(0,0,450,800);scene.clear();if(mother)body(mother,{},age);
  const poses=targets.map(()=>({x:0,y:0,roll:0,pitch:0,light:0}));
  if(combo){
   const pull=clamp((age-5000)/1000),rush=pull<.62?.07*(pull/.62)**2:.07+.93*((pull-.62)/.38)**2.7;
   const post=age-boom,rebound=post>0?Math.exp(-post/420):1;
   if(single){poses[0]={x:Math.sin(age*.08)*clamp((age-4550)/1500)*1.3,y:down*48*rush*rebound,roll:(who==='A'?1:-1)*rush*15*rebound,pitch:rush*43*rebound,light:post>=0?Math.exp(-post/130)*.8:0};}
   else for(let j=0;j<2;j++)poses[j]={x:(j===0?1:-1)*66*rush*rebound+(post>0?(j===0?-1:1)*(1-Math.exp(-post/18))*Math.exp(-post/270)*9:0),y:down*28*rush*rebound,roll:(j===0?1:-1)*rush*22*rebound,pitch:rush*8*rebound,light:post>=0?Math.exp(-post/130)*.8:0};
  }else{
   const cut=c.jaw==='a'?7400:4800;
   const h1=hullPose(age-first,'magnetic-grapple'),h2=hullPose(age-4300,'magnetic-grapple'),h3=hullPose(age-cut,'magnetic-grapple');
   poses[0]=age>=cut?{...h3,y:h3.y*1.7,roll:h3.roll*1.6}:c.jaw==='a'&&age>4300?h2:h1;
   if(age>3800&&age<4300)poses[0].roll=Math.sin(age*.065)*(age-3800)/500*3;
   if(age>cut-500&&age<cut)poses[0].y-=down*(age-(cut-500))/500*8;
  }
  targets.forEach((t,j)=>body(t,poses[j],age));
  const contacts=[];
  for(let j=0;j<models.length;j++){
   const target=targets[single?0:j]||targets[0],pose=poses[single?0:j]||poses[0],localX=single?(j?20:-20):0,localY=single?3:0,a=pose.roll*Math.PI/180;
   const contact={x:target.p.x+pose.x+localX*Math.cos(a)-localY*Math.sin(a),y:target.p.y+pose.y+localX*Math.sin(a)+localY*Math.cos(a)-3};contacts.push(contact);
   const launch=j?second-fly:start,t=clamp((age-launch)/fly),tear=combo?Infinity:c.jaw==='a'?7400:4800,visible=age>=launch&&(combo||age<tear+700);
   if(!visible)continue;
   const from=origins[j],model=models[j],flying=age<launch+fly;
   if(flying){const frame=weaponFlightFrame(from,contact,t,camera,model.userData.frontZ,{shot:{...shot,impactIndex:j},kind:'magnetic-grapple'});applyWeaponFlightPose(model,frame);const q=frame.nose.clone().project(camera);drawMagneticChain(floor,from,{x:(q.x+1)*225,y:(1-q.y)*400},profile,camera,age,.1);}
   else if(age<tear){
    const p=boardPointToWorld(contact,camera);model.position.copy(p);model.rotation.set(0,who==='A'?0:Math.PI,pose.roll*Math.PI/180,'YXZ');
    const tension=combo?clamp((age-4550)/1450):age>3800?.9:.4;
    drawMagneticChain(floor,from,contact,profile,camera,age,tension);
    if(combo&&age>4550&&age<boom)glow(air,contact,13,profile.glow,(age-4550)/1450*.4);
   }else{
    const returning=clamp((age-tear)/650),p=boardPointToWorld(contact,camera).lerp(boardPointToWorld(from,camera),returning);model.position.copy(p);model.rotation.set(returning*4,who==='A'?0:Math.PI,returning*2);
    const q=p.clone().project(camera);drawMagneticChain(floor,from,{x:(q.x+1)*225,y:(1-q.y)*400},profile,camera,age,.8,1-returning);
   }
   for(const jaw of model.userData.jaws||[])jaw.rotation.y=-(1-clamp((t-.82)/.18))*.65;scene.add(model);
   kineticImpact(air,contact,age-(launch+fly),{power:.65});
  }
  if(combo){const contact=single?{x:targets[0].p.x,y:targets[0].p.y+down*75}:{x:225,y:targets[0].p.y+down*28};
   const collisionProfile={...profile,kind:'alloy-collision',impactMs:1350,impactScale:1.15};
   drawCollisionExplosion(air,contact,collisionProfile,age-boom,camera,{});
   if(single)kineticImpact(floor,contact,age-boom,{power:1.6});
   // Solo uno schianto. Le due catene restano attaccate alla posa effettiva dello scafo.
  }else{
   const cut=c.jaw==='a'?7400:4800,p=contacts[0]||targets[0].p;
   if(c.jaw==='a')kineticImpact(air,p,age-4300,{power:.65});
   kineticImpact(air,p,age-cut,{power:1.35});
  }
  ctx.drawImage(floorCanvas,0,0,450,800);cpu.render(scene,camera);ctx.drawImage(meshCanvas,0,0,450,800);ctx.drawImage(airCanvas,0,0,450,800);
  header(ch,age);ctx.fillStyle='#e9dbc6';ctx.textAlign='center';ctx.font='600 11px Eclissi UI';
  const phase=combo?(age<second?'AGGANCIO DELLE DUE GANASCE':age<5000?'CATENE IN TENSIONE':age<boom?'TRAZIONE · ACCELERAZIONE FINALE':single?'UN SOLO IMPATTO CONTRO IL PIANO':'UN SOLO IMPATTO FRA I DUE SCAFI'):c.jaw==='a'?(age<3400?'T1 · AGGANCIO':age<6000?'T2 · TENSIONE':'T3 · STRAPPO FINALE — DANNO DA DEFINIRE'):(age<3400?'AGGANCIO AUTONOMO':'TRAZIONE E SGANCIO — DURATA DA DEFINIRE');
  ctx.fillText(phase,225,722);
  if(snapshots.has(n))fs.writeFileSync(path.join(folder,'frame-'+n+'.png'),canvas.toBuffer('image/png'));
  if(encoder){const px=ctx.getImageData(0,0,900,1600).data;if(!encoder.stdin.write(Buffer.from(px.buffer,px.byteOffset,px.byteLength)))await once(encoder.stdin,'drain');}
 }
 if(encoder){encoder.stdin.end();const [code]=await once(encoder,'close');if(code)throw Error('ffmpeg '+code);}
 console.log('JAW_CASE_OK',index,c.jaw,duration);return ch;
}
