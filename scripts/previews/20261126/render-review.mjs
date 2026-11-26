// Previsualizzazioni isolate a velocità nativa. NON registrazioni del gioco.
// node --import ./candidate-loader.mjs render-review.mjs OUTPUT [--stills] [--group=fulmine]
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {Scene} from 'three';
import {FAMILIES,RARITIES,reviewOrigin,SOURCE_COMMIT} from './review-spec.mjs';
import {createMaglioReviewBattle} from '../../maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from '../../../src/fleetNext/combat.js';
import {fleetWeaponProjectiles,weaponEffectProfile} from '../../../src/maglioBattleVisuals.js';
import {createProjectileCamera,createMaglioProjectile,MAGLIO_PROJECTILE_SCALE,disposeProjectile} from '../../../src/maglioProjectile3D.js';
import {weaponContactPoint,weaponFlightFrame,applyWeaponFlightPose} from '../../../src/weaponKinematics.js';
import {createMetalProjectile} from '../../../src/metalWeaponProjectile3D.js';
import {createChainWeaponModel,articulateChainWeapon} from '../../../src/chainWeaponProjectile3D.js';
import {createPrecisionProjectile,articulatePrecisionProjectile} from '../../../src/precisionWeaponProjectile3D.js';
import {prepareCinematicEntry,drawCinematicWeapon} from '../../../src/weaponCinematicRenderer.js';
import {MaglioSoftwareRenderer} from '../../../src/maglioSoftwareRenderer.js';
import {weaponImpactHullFrame} from '../../../src/weaponHullImpacts.js';
import {thermalChargeForShot} from '../../../src/metalWeaponBattleVisuals.js';
import {weaponSalvoAudioCue} from '../../../src/weaponSalvoAudio.js';
import {drawJawsCase,jawCases} from './review-jaws.mjs';
import {clamp,stroke,glow,newProjectile,electricFlight,electricImpact,kineticImpact,hullPose} from './review-visuals.mjs';
const {createCanvas,loadImage,GlobalFonts}=await import(process.env.ECLISSI_CANVAS_MODULE||'@napi-rs/canvas');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','Eclissi UI');
globalThis.document={createElement:()=>createCanvas(1,1)};
const out=path.resolve(process.argv[2]),groupArg=process.argv.find(x=>x.startsWith('--group='))?.slice(8),stills=process.argv.includes('--stills');
const cards=JSON.parse(fs.readFileSync(path.join(out,'manifest-carte.json'))).cards;
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7).split(',').map(Number);
const selected=cards.filter(c=>!c.kind.includes('grapple')&&!c.kind.includes('collision'));
const cases=selected.map(c=>({card:c,group:c.elementId==='ionic'?'fulmine':'metallo',who:RARITIES.indexOf(c.rarity)%2?'B':'A',
 supports:['cascade-piercer','induction','wandering-shrapnel'].includes(c.kind),
 cascadeMode:c.kind==='cascade-piercer'?'two':'none',energyCards:c.kind==='cascade-piercer'?2:0,
 caption:c.kind==='thermal-reclaimer'?'3 granate · danno base':c.kind==='gravity-maul'?c.panel.action.split(' ')[0]+' martelli in sequenza':c.kind==='steel-rail'?'Una sola palla · massa e impatto metallico':c.kind==='ionic-comb'?'Cinque archetti confluiscono in una sola scarica':c.kind==='ionic-dart'?'Un dardo · due spirali di scintille':c.kind==='ionic-whip'?'Una frustata elettrica · un impatto':c.kind==='ionic-flash'?'Un lampo bianco rettilineo':c.kind==='cascade-piercer'?'Nuovo residuo dall’esplosione · trasferimenti pagati':c.kind==='induction'?'Lame rotanti · tagli e frammenti':'Schegge convergenti · un bersaglio per turno'}));
for(const c of selected.filter(c=>c.kind==='thermal-reclaimer'))cases.push({card:c,group:'metallo',who:'A',secondTurn:true,energyCards:0,caption:'6 granate · potenziata dagli HP realmente persi'});
const indu=selected.find(c=>c.kind==='induction');
for(const energyCards of [0,1,2])cases.push({card:indu,group:'metallo',who:'A',supports:true,withDefense:true,energyCards,caption:energyCards===0?'Senza Energia · la Difesa intercetta l’attacco':energyCards===1?'1 Energia conteggiata · supera una Difesa':'2 Energie conteggiate · rimuove una Difesa'});
for(const c of selected.filter(c=>c.kind==='cascade-piercer'))cases.push({card:c,group:'metallo',who:'B',supports:true,cascadeMode:'none',energyCards:0,caption:'Senza Energia · nessun trasferimento gratuito'});
cases.push({card:indu,group:'metallo',who:'A',supports:true,energyCards:2,damagePending:true,caption:'2 Energie senza Difese · bonus danno da definire'});
cases.push({card:selected.find(c=>c.kind==='wandering-shrapnel'&&c.rarity==='Leggendaria'),group:'metallo',who:'B',supports:true,ownStage:2,energyCards:0,caption:'Secondo turno · sceglie un altro bersaglio vivo'});
cases.push(...jawCases(cards));
const active=cases.filter(c=>!groupArg||c.group===groupArg),camera=createProjectileCamera(),scene=new Scene();
const canvas=createCanvas(900,1600),ctx=canvas.getContext('2d');ctx.scale(2,2);
const floorCanvas=createCanvas(900,1600),airCanvas=createCanvas(900,1600),floor=floorCanvas.getContext('2d'),air=airCanvas.getContext('2d');floor.scale(2,2);air.scale(2,2);
const meshCanvas=createCanvas(1,1),cpu=new MaglioSoftwareRenderer(meshCanvas,{contactShadow:false});cpu.setPixelRatio(1.5);cpu.setSize(450,800);
const arena=await loadImage(path.resolve('public/assets/mathduel/arena_titanio_9x16.webp'));
const iconDefense=await loadImage(path.resolve('docs/riferimenti-carte/adesivi-slot-2026-11-24/categorie/difesa.png'));
const iconEnergy=await loadImage(path.resolve('docs/riferimenti-carte/adesivi-slot-2026-11-24/elementi/metallo.png'));
const hullCache=new Map(),cardCache=new Map();
async function hullImage(model,who){const facing=who==='A'?'player_to_enemy':'enemy_to_player',key=model+facing;
 if(!hullCache.has(key)){const p=path.resolve('public/assets/mathfleet/views',facing,model+'_complete');hullCache.set(key,await loadImage(fs.existsSync(p+'.webp')?p+'.webp':p+'.png'));}return hullCache.get(key);}
async function front(c){if(!cardCache.has(c.id))cardCache.set(c.id,await loadImage(path.join(out,'carte-hd',c.id+'.png')));return cardCache.get(c.id);}
function body(t,pose={},age=0,alpha=1){
 const p=t.p,size=t.size,shift={x:pose.x||0,y:pose.y||0},roll=(pose.roll||0)*Math.PI/180;
 ctx.save();ctx.globalAlpha=alpha;
 ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(p.x,p.y+size*.23,size*.40,size*.14,0,0,Math.PI*2);ctx.fill();
 const reactor={x:p.x+shift.x,y:p.y+shift.y+(t.facing==='A'?1:-1)*size*.25};
 glow(ctx,reactor,8+Math.sin(age*.012)*2,'#62c4ff',.34);glow(ctx,{x:reactor.x,y:reactor.y+(t.facing==='A'?1:-1)*(5+Math.sin(age*.018)*2)},5,'#bfeaff',.50);
 ctx.translate(p.x+shift.x,p.y+shift.y-5);ctx.rotate(roll);ctx.scale(1,Math.cos((pose.pitch||0)*Math.PI/180));
 ctx.filter='brightness('+(1+(pose.light||0))+')';ctx.drawImage(t.image,-size/2,-size/2,size,size);ctx.restore();
}
function header(chapter,age){
 ctx.fillStyle='#07101bed';ctx.fillRect(0,0,450,136);ctx.textAlign='left';ctx.fillStyle='#f1f5f9';ctx.font='600 12px Eclissi UI';
 const title=chapter.name.split(' ');let line='',row=0;for(const word of title){if(ctx.measureText(line+word).width>325){ctx.fillText(line.trim(),15,25+row*18);line='';row++;}line+=word+' ';}ctx.fillText(line.trim(),15,25+row*18);
 ctx.font='11px Eclissi UI';ctx.fillStyle='#e7bd84';ctx.fillText(chapter.rarity+' · '+(chapter.who==='B'?'dal lato avversario':'dal lato giocatore'),15,70);
 ctx.fillStyle='#cbdae5';ctx.font='10px Eclissi UI';const cap=chapter.caption;ctx.fillText(cap.length>63?cap.slice(0,62)+'…':cap,15,92);
 ctx.fillStyle='#9cb2c2';ctx.font='9px Eclissi UI';ctx.fillText(chapter.jaw?'Studio della meccanica · danni finali da definire':chapter.damage+' HP effettivi · '+chapter.projectiles+' munizioni / attacchi visivi',15,114);
 if(chapter.cardImage)ctx.drawImage(chapter.cardImage,356,7,79,118.5);
 ctx.fillStyle='#07101bec';ctx.fillRect(0,752,450,48);ctx.textAlign='center';ctx.fillStyle='#bed0dd';ctx.font='9px Eclissi UI';ctx.fillText('ANTEPRIMA DA APPROVARE · animazione offline, non ripresa StackBlitz',225,771);
 ctx.fillStyle='#8fa8bb';ctx.font='8px Eclissi UI';ctx.fillText('Prospettiva 3D · audio sincronizzato · vibrazione fisica non verificata',225,788);
 const pulse=chapter.cues?.some(c=>['impact','block'].includes(c.phase)&&Math.abs(age/1000-c.at)<.075);
 if(pulse){ctx.strokeStyle='#e8f5ff';ctx.lineWidth=1.5;ctx.strokeRect(14,719,9,17);stroke(ctx,[{x:10,y:721},{x:8,y:727},{x:10,y:733}],'#d2e8ff',1);stroke(ctx,[{x:27,y:721},{x:29,y:727},{x:27,y:733}],'#d2e8ff',1);}
}
function resources(c,age,chapter){
 const first=chapter.firstImpact||2300,spent=chapter.energySpent||0,count=c.energyCards||0,ey=c.who==='B'?166:646;
 for(let i=0;i<count;i++){
  const consumed=i<spent&&age>(chapter.transferTimes[i]??Infinity),active=spent?Math.abs(age-(chapter.transferTimes[i]??Infinity))<180:Math.abs(age-first)<240;
  if(consumed&&age-(chapter.transferTimes[i]??0)>180){ctx.strokeStyle='#52636f';ctx.lineWidth=1;ctx.strokeRect(20+i*34,ey,29,44);continue;}
  ctx.save();ctx.globalAlpha=consumed?1-clamp((age-chapter.transferTimes[i])/180):1;ctx.fillStyle=active?'#435a57':'#152a3c';ctx.strokeStyle=active?'#fff1b6':'#8b9fae';ctx.lineWidth=active?2:1;
  ctx.fillRect(20+i*34,ey,29,44);ctx.strokeRect(20+i*34,ey,29,44);ctx.drawImage(iconEnergy,22+i*34,ey+3,25,25);ctx.fillStyle='#e4e9eb';ctx.font='8px Eclissi UI';ctx.textAlign='center';ctx.fillText(consumed?'0':'1',34+i*34,ey+36);ctx.restore();
 }
 if(count){ctx.fillStyle='#d3dfe5';ctx.font='8px Eclissi UI';ctx.textAlign='left';ctx.fillText(spent?'Cariche consumate nei trasferimenti':'Energie conteggiate · restano negli slot',20,ey+59);}
 if(c.withDefense){
  const removed=chapter.defenseRemoved,used=chapter.defenseRemovalCause==='used',progress=clamp((age-(used?first+90:first-420))/600),motion=removed?progress:0;
  ctx.save();ctx.globalAlpha=1-motion;ctx.translate(350+motion*55,174+motion*18);ctx.rotate(motion*.30);ctx.fillStyle='#102b41';ctx.fillRect(-20,-28,40,56);ctx.strokeStyle=age>first-500&&age<first+160?'#e1f5ff':'#50a5e2';ctx.lineWidth=2;ctx.strokeRect(-20,-28,40,56);ctx.drawImage(iconDefense,-18,-25,36,36);ctx.fillStyle='#c9e5f7';ctx.textAlign='center';ctx.font='7px Eclissi UI';ctx.fillText('DIFESA',0,19);ctx.restore();
  if(progress>0&&!removed&&age<first+250)stroke(ctx,[{x:327,y:181},{x:349,y:191},{x:372,y:180}],'#f4e9bc',1.4,1-progress*.6);
  if(removed&&progress===1){ctx.fillStyle='#263441';ctx.strokeStyle='#9eabb7';ctx.fillRect(395,197,30,42);ctx.strokeRect(395,197,30,42);ctx.drawImage(iconDefense,397,199,26,26);ctx.fillStyle='#b7c7d1';ctx.font='7px Eclissi UI';ctx.textAlign='center';ctx.fillText('SCARTI',410,250);}
  if(removed&&!used&&progress>0&&progress<1)kineticImpact(ctx,{x:350,y:176},progress*550,{power:.45});
 }
}
function background(){ctx.drawImage(arena,0,0,450,800);ctx.fillStyle='#07101b30';ctx.fillRect(0,136,450,616);}
const other=who=>who==='A'?'B':'A',order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
const manifest={sourceCommit:SOURCE_COMMIT,type:'approval-only-offline-previsualization',isStackBlitzRecording:false,timeScaling:1,fps:30,width:900,height:1600,cases:[]};let offset=0;
for(const [index,c]of active.entries()){
 const folder=path.join(out,'fx-'+(groupArg||'all'),'case-'+String(index).padStart(2,'0'));fs.mkdirSync(folder,{recursive:true});
 if(c.jaw){
  if(only&&!only.includes(index)){const previous=JSON.parse(fs.readFileSync(path.join(out,'fx-'+(groupArg||'all'),'review-fx.json'))).cases[index];manifest.cases.push({...previous,start:offset});offset+=previous.duration;continue;}
  const ch=await drawJawsCase({c,index,offset,folder,stills,ctx,canvas,floor,air,floorCanvas,airCanvas,camera,scene,cpu,meshCanvas,hullImage,front,background,body,header});
  manifest.cases.push(ch);offset+=ch.duration;continue;
 }
 let b=createMaglioReviewBattle({...c,cardId:c.card.id,nowMs:0});
 if(c.who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1000).battle;
 const action=c.secondTurn||c.ownStage>1?{...order,cards:[],pass:true}:order;
 const result=resolvePreparedFleetTurn(b,c.who,action,2000);if(!result.ok)throw Error(result.reason);
 const shots=fleetWeaponProjectiles(result.events).filter(s=>s.cardId===c.card.id);
 const defender=b.sides[other(c.who)],after=result.battle.sides[other(c.who)],targets=[];
 targets.push({id:'weapons',kind:'part',p:{x:225,y:c.who==='A'?282:532,radius:29},size:119,image:await hullImage(defender.ships[0].id,c.who),facing:c.who,beforeHp:defender.ships[0].hp});
 for(const [j,t]of defender.escorts.entries())targets.push({id:t.id,kind:'escort',p:{x:j?323:127,y:c.who==='A'?352:452,radius:24},size:87,image:await hullImage(t.shipModelId||t.modelId||['C02','C03'][j],c.who),facing:c.who,beforeHp:t.hp,dead:after.escorts[j].hp<=0});
 const own={p:{x:225,y:c.who==='A'?569:249},size:119,image:await hullImage(b.sides[c.who].ships[0].id,other(c.who)),facing:other(c.who)};
 const paths=shots.filter(s=>s.fires||s.defenseBlocked).map((shot,j)=>{
  const target=targets.find(t=>t.kind===shot.targetKind&&t.id===shot.targetId);if(!target)throw Error('Bersaglio assente');
  const source=shot.cascadeTransfer?targets.find(t=>t.kind===shot.sourceTargetKind&&t.id===shot.sourceTargetId):null;
  const ionic=c.card.elementId==='ionic';let profile=weaponEffectProfile(shot.cardId,shot);
  if(ionic)profile={...profile,kind:c.card.kind,tier:RARITIES.indexOf(c.card.rarity),flightMs:c.card.kind==='ionic-flash'?180:c.card.kind==='ionic-whip'?930:c.card.kind==='ionic-comb'?770:1130,impactMs:900,core:'#eaf8ff',glow:'#84cfff',secondary:'#ad99ff',sound:{}};
  if(c.card.kind==='steel-rail')profile={...profile,flightMs:1030,impactMs:1100};
  const from=source?{...source.p,edge:'previous-destroyed-hull'}:reviewOrigin(shot,j),to=weaponContactPoint(target.p,shot),start=720+(shot.delayMs||0);
  const entry=ionic?{shot,profile,from,to,start,camera}:prepareCinematicEntry({shot,profile,from,to,start},camera);
  let model=ionic?(profile.kind==='ionic-dart'?newProjectile('ionic-dart',profile.tier):null):profile.kind==='gravity-maul'?createMaglioProjectile(profile.tier):profile.kind==='steel-rail'?newProjectile('cannonball',profile.tier):profile.kind==='thermal-reclaimer'?createMetalProjectile(profile.kind,profile.tier,thermalChargeForShot(shot).ratio):profile.kind==='induction'?createChainWeaponModel(profile.kind,profile.tier):shot.cascadeTransfer?newProjectile('residual',profile.tier):createPrecisionProjectile(profile.kind,profile.tier);
  if(model)model.scale.setScalar((profile.kind==='gravity-maul'?MAGLIO_PROJECTILE_SCALE:1)*(shot.visualScale||1));
  return {...entry,model,target,source,ionic};
 });
 if(!paths.length)throw Error('Nessuna traiettoria reale '+c.card.id);
 const end=Math.max(...paths.map(p=>p.start+p.profile.flightMs+p.profile.impactMs))+300,frames=Math.ceil(end/1000*30),duration=frames/30;
 const ch={index,id:c.card.id,name:c.card.name,group:c.group,kind:c.card.kind,rarity:c.card.rarity,who:c.who,caption:c.caption,projectiles:paths.length,damage:shots.reduce((n,s)=>n+s.actualDamage,0),duration,frames,start:offset,cues:[],origins:paths.filter(p=>!p.source).map(p=>p.from),events:result.events,energyBefore:b.sides[c.who].energyPile,energyAfter:result.battle.sides[c.who].energyPile,energySpent:result.events.filter(e=>e.kind==='weapon-cascade'&&e.cardId===c.card.id).reduce((n,e)=>n+(e.energySpent||0),0),transferTimes:[...new Set(paths.filter(p=>p.source&&!p.shot.salvoIndex).map(p=>p.start))],defenseRemoved:defender.defenses.some(d=>!after.defenses.some(a=>a.source===d.source)),defenseRemovalCause:result.events.some(e=>e.kind==='weapon-break-defense'&&e.cardId===c.card.id)?'destroyed':defender.defenses.some(d=>!after.defenses.some(a=>a.source===d.source))?'used':null,firstImpact:Math.min(...paths.map(p=>p.start+p.profile.flightMs))};
 const image=await front(c.card);Object.defineProperty(ch,'cardImage',{value:image,enumerable:false});
 for(const p of paths){for(const phase of ['charge','fire','impact']){
  if(phase==='charge'&&(!p.profile.sound?.charge||!p.profile.chargeMs))continue;
  const actualPhase=phase==='impact'&&p.shot.defenseBlocked?'block':phase;const cue=weaponSalvoAudioCue(p.profile,p.shot,actualPhase);ch.cues.push({...cue,...(p.ionic?{type:p.profile.kind+'-'+phase,level:.6,timeScale:1,pitchSemitones:0}:{}),phase:actualPhase,at:(p.start+(phase==='impact'?p.profile.flightMs:phase==='charge'?-p.profile.chargeMs:0))/1000,pan:((phase==='impact'?p.to.x:p.from.x)-225)/225});
 }}
 manifest.cases.push(ch);offset+=duration;
 if(only&&!only.includes(index)){paths.forEach(p=>p.model&&disposeProjectile(p.model));continue;}
 const encoder=stills?null:spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size','900x1600','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19','-pix_fmt','yuv420p',path.join(folder,'video.mp4')],{stdio:['pipe','ignore','inherit']});
 const snapshots=new Set([Math.round((paths[0].start+paths[0].profile.flightMs*.53)/1000*30),Math.round((ch.firstImpact+70)/1000*30),Math.round((paths.at(-1).start+paths.at(-1).profile.flightMs+140)/1000*30)]);
 for(let n=0;n<frames;n++){
  if(stills&&!snapshots.has(n))continue;const age=n/30*1000;background();floor.clearRect(0,0,450,800);air.clearRect(0,0,450,800);scene.clear();body(own,{},age);
  const poses=new Map();
  for(const t of targets){
   const impacts=paths.filter(p=>p.target===t),first=Math.min(...impacts.map(p=>p.start+p.profile.flightMs));
   let pose={};for(const p of impacts){const h=p.ionic||p.profile.kind==='steel-rail'?hullPose(age-p.start-p.profile.flightMs,p.profile.kind):weaponImpactHullFrame(p.profile,p.shot,age-p.start-p.profile.flightMs);if((h.light||0)>(pose.light||0)||!Object.keys(pose).length)pose=h;}
   poses.set(t,pose);const death=t.dead?Math.max(first,...impacts.map(p=>p.start+p.profile.flightMs)):Infinity,fade=t.dead?1-clamp((age-death)/320):1;
   body(t,pose,age,fade);if(t.dead)kineticImpact(air,{x:t.p.x+(pose.x||0),y:t.p.y+(pose.y||0)},age-death,{power:1.5,destroy:true});
  }
  for(const p of paths){const elapsed=age-p.start,t=elapsed/p.profile.flightMs,poseHull=poses.get(p.target)||{},contact={...p.to,x:p.to.x+(poseHull.x||0),y:p.to.y+(poseHull.y||0)};
   if(p.ionic){electricFlight(air,p,elapsed,camera);electricImpact(air,contact,p.profile.kind,elapsed-p.profile.flightMs,p.profile.tier);}
   else if(p.profile.kind==='steel-rail'){
    if(t>=0&&t<1){const pos=weaponFlightFrame(p.from,p.to,t,camera,0,{shot:p.shot,kind:p.profile.kind}).nose;const q=pos.clone().project(camera),point={x:(q.x+1)*225,y:(1-q.y)*400};glow(floor,{x:point.x,y:point.y+7},7,'#ffc28b',.12);}
    kineticImpact(air,contact,elapsed-p.profile.flightMs,{power:1+p.profile.tier*.08});
   }else drawCinematicWeapon(floor,air,p,age,{contactPose:poseHull});
   if(p.model&&t>=0&&t<1){
    const fz=p.profile.kind==='gravity-maul'?-.88*p.model.scale.z:p.model.userData.frontZ*p.model.scale.z;
    const pose=weaponFlightFrame(p.from,p.to,t,camera,fz,{shot:p.shot,kind:p.profile.kind});applyWeaponFlightPose(p.model,pose);
    if(p.profile.kind==='gravity-maul')p.model.rotation.x+=t*Math.PI*4;
    if(p.profile.kind==='steel-rail')p.model.rotation.z+=t*Math.PI*2;
    if(p.profile.kind==='induction')articulateChainWeapon(p.model,clamp((t-.80)/.2));
    if(['cascade-piercer','wandering-shrapnel'].includes(p.profile.kind)&&!p.shot.cascadeTransfer)articulatePrecisionProjectile(p.model,elapsed);
    scene.add(p.model);
   }
  }
  ctx.drawImage(floorCanvas,0,0,450,800);cpu.render(scene,camera);ctx.drawImage(meshCanvas,0,0,450,800);ctx.drawImage(airCanvas,0,0,450,800);resources(c,age,ch);header(ch,age);
  if(snapshots.has(n))fs.writeFileSync(path.join(folder,'frame-'+n+'.png'),canvas.toBuffer('image/png'));
  if(encoder){const px=ctx.getImageData(0,0,900,1600).data;if(!encoder.stdin.write(Buffer.from(px.buffer,px.byteOffset,px.byteLength)))await once(encoder.stdin,'drain');}
 }
 if(encoder){encoder.stdin.end();const [code]=await once(encoder,'close');if(code)throw Error('ffmpeg '+code);}
 paths.forEach(p=>p.model&&disposeProjectile(p.model));console.log('CASE_OK',index,c.card.id,paths.length,duration);
}
manifest.duration=offset;fs.mkdirSync(path.join(out,'fx-'+(groupArg||'all')),{recursive:true});fs.writeFileSync(path.join(out,'fx-'+(groupArg||'all'),'review-fx.json'),JSON.stringify(manifest,null,2));
