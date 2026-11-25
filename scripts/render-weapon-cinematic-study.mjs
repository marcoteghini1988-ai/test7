// Offline renderer study, explicitly NOT a recording of a StackBlitz battle.
// Optional dependency: @napi-rs/canvas, supplied via ECLISSI_CANVAS_MODULE.
// node scripts/render-weapon-cinematic-study.mjs /absolute/output [--frames]
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Scene} from 'three';
import {weaponEffectProfile,weaponPortalOrigin,MAGLIO_VARIANTS} from '../src/maglioBattleVisuals.js';
import {METAL_WEAPON_VARIANTS} from '../src/metalWeaponBattleVisuals.js';
import {CHAIN_WEAPON_VARIANTS,collisionFrame,collisionHullFrame} from '../src/chainWeaponBattleVisuals.js';
import {PRECISION_WEAPON_VARIANTS} from '../src/precisionWeaponBattleVisuals.js';
import {createProjectileCamera,createMaglioProjectile,projectileFlightFrame,MAGLIO_PROJECTILE_SCALE} from '../src/maglioProjectile3D.js';
import {createMetalProjectile,metalProjectileFlightFrame} from '../src/metalWeaponProjectile3D.js';
import {createChainWeaponModel,articulateChainWeapon} from '../src/chainWeaponProjectile3D.js';
import {createPrecisionProjectile,articulatePrecisionProjectile} from '../src/precisionWeaponProjectile3D.js';
import {prepareCinematicEntry,drawCinematicWeapon,drawCollisionConvergence} from '../src/weaponCinematicRenderer.js';
import {drawCollisionExplosion} from '../src/collisionExplosion.js';
import {drawMagneticChain,drawLatch} from '../src/chainWeaponCanvas.js';
import {MaglioSoftwareRenderer} from '../src/maglioSoftwareRenderer.js';
import {weaponHullFrame,weaponTravelProgress} from '../src/weaponCinematicStyle.js';

const {createCanvas,loadImage}=await import(process.env.ECLISSI_CANVAS_MODULE||'@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(96,96)};
const output=resolve(process.argv[2]||'/tmp/weapon-study');mkdirSync(output,{recursive:true});
const variants=[...MAGLIO_VARIANTS,...METAL_WEAPON_VARIANTS,...CHAIN_WEAPON_VARIANTS,...PRECISION_WEAPON_VARIANTS];
const names={'gravity-maul':'MAGLIO FERROGRAVITAZIONALE','steel-rail':'CANNONE A SLITTA',
 'thermal-reclaimer':'RECUPERATORE TERMOBALISTICO','magnetic-grapple':'GANASCE MAGNETICHE',
 'alloy-collision':'COLLASSATORE DI LEGA',induction:'FRANTUMATORE A INDUZIONE',
 'cascade-piercer':'PERFORATORE A CASCATA','wandering-shrapnel':'ARTIGLIERIA DELLE SCHEGGE'};
const descriptions={'gravity-maul':'Compressione • massa • contraccolpo','steel-rail':'Taglio • cono di pressione • scintille direzionali',
 'thermal-reclaimer':'Tre flussi • capsula • calore in risalita','magnetic-grapple':'Verricello • ganasce • catena in tensione',
 'alloy-collision':'Convergenza • accelerazione • un solo BOOM',induction:'Tre piani • interferenza • frattura metallica',
 'cascade-piercer':'Rotazione • perforazione • nucleo residuo','wandering-shrapnel':'Carrello • frammento singolo • rottura asimmetrica'};
const camera=createProjectileCamera(),scene=new Scene();
const image=createCanvas(900,1600),ctx=image.getContext('2d');ctx.scale(2,2);
const floorCanvas=createCanvas(900,1600),airCanvas=createCanvas(900,1600);
const floor=floorCanvas.getContext('2d'),air=airCanvas.getContext('2d');floor.scale(2,2);air.scale(2,2);
const meshCanvas=createCanvas(1,1),renderer=new MaglioSoftwareRenderer(meshCanvas,{contactShadow:false});
renderer.setPixelRatio(2);renderer.setSize(450,800);
// The approved hull asset is a scale reference, not a reconstructed game UI.
const hulls={
 A:await loadImage(resolve('public/assets/mathfleet/views/enemy_to_player/C02_complete.png')).catch(()=>null),
 B:await loadImage(resolve('public/assets/mathfleet/views/player_to_enemy/C02_complete.png')).catch(()=>null)
};
const frames=process.argv.includes('--frames');
const onlyArgument=process.argv.find(a=>a.startsWith('--only='));
const only=onlyArgument?new Set(onlyArgument.slice(7).split(',').map(Number)):null;
const stats=[];
function background(profile,who){
 const g=ctx.createLinearGradient(0,0,450,800);g.addColorStop(0,'#0b1320');g.addColorStop(.45,'#192734');g.addColorStop(1,'#090e19');
 ctx.fillStyle=g;ctx.fillRect(0,0,450,800);
 // A quiet metal plane with perspective edges, no grid or simulated game HUD.
 ctx.fillStyle='#23333f';ctx.beginPath();ctx.moveTo(73,155);ctx.lineTo(377,155);ctx.lineTo(446,719);ctx.lineTo(4,719);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#7894a337';ctx.lineWidth=1;ctx.stroke();
 for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(225+s*153,156);ctx.lineTo(225+s*219,719);ctx.strokeStyle='#9caebc29';ctx.stroke();}
 const light=ctx.createRadialGradient(225,420,0,225,420,260);light.addColorStop(0,'#afc9da0a');light.addColorStop(1,'#afc9da00');ctx.fillStyle=light;ctx.fillRect(0,150,450,575);
 ctx.textAlign='center';ctx.fillStyle='#d4e5f0';ctx.font='600 12px sans-serif';ctx.fillText(names[profile.kind],225,51);
 ctx.fillStyle=profile.glow;ctx.font='12px sans-serif';ctx.fillText(profile.rarity+' · '+(who==='A'?'bordo basso → alto':'bordo alto → basso'),225,76);
 ctx.fillStyle='#9fb6c4';ctx.font='10px sans-serif';ctx.fillText(descriptions[profile.kind],225,104);
 ctx.fillStyle='#bbcbd4';ctx.font='10px sans-serif';ctx.fillText('STUDIO DEL RENDERER · VELOCITÀ NATIVA',225,755);
 ctx.fillStyle='#7b929f';ctx.font='9px sans-serif';ctx.fillText('Anteprima tecnica · non è una registrazione StackBlitz',225,778);
}
function target(p,profile,elapsed,who,size=47,override=null){
 const smallHull=hulls[who];
 const pose=override||weaponHullFrame(profile.kind,elapsed-profile.flightMs,profile.impactMs,{tier:profile.tier,direction:who==='A'?-1:1});
 ctx.save();ctx.translate(p.x+pose.x,p.y+pose.y+pose.lift);ctx.rotate(pose.roll*Math.PI/180);
 ctx.scale(1,Math.cos(pose.pitch*Math.PI/180));
 ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(0,9,size*.53,size*.18,0,0,Math.PI*2);ctx.fill();
 if(smallHull){ctx.save();ctx.globalAlpha=1;ctx.filter=`brightness(${1+pose.light*.8})`;ctx.drawImage(smallHull,-size*.75,-size*.75,size*1.5,size*1.5);ctx.restore();}
 else{ctx.fillStyle='#718999';ctx.beginPath();ctx.moveTo(0,-size*.7);ctx.lineTo(size*.48,size*.42);ctx.lineTo(0,size*.25);ctx.lineTo(-size*.48,size*.42);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#e0e8ee';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#78d9fb';ctx.fillRect(-3,size*.25,6,10+pose.thrust*12);}
 ctx.restore();
}
for(const [variantIndex,v] of variants.entries()){
 const p=weaponEffectProfile(v.id),who=variantIndex%2?'B':'A';
 const from=weaponPortalOrigin(who),to={x:who==='A'?183:270,y:who==='A'?300:510};
 const shot={cardId:v.id,who,targetKind:'escort',targetId:'reference',fires:true,actualDamage:18,nominalDamage:p.kind==='thermal-reclaimer'?100:18,stage:2};
 const entry=prepareCinematicEntry({shot,profile:p,from,to,start:650},camera);
 const maglio=p.kind==='gravity-maul',collision=p.kind==='alloy-collision';
 const model=maglio?createMaglioProjectile(p.tier):['steel-rail','thermal-reclaimer'].includes(p.kind)?createMetalProjectile(p.kind,p.tier,entry.thermal.ratio):
  ['magnetic-grapple','induction'].includes(p.kind)?createChainWeaponModel(p.kind,p.tier):collision?null:createPrecisionProjectile(p.kind,p.tier);
 if(maglio)model.scale.setScalar(MAGLIO_PROJECTILE_SCALE);
 const nframes=frames?Math.ceil((650+p.flightMs+p.impactMs+220)/1000*30):2;
 const dir=resolve(output,'frames-'+String(variantIndex).padStart(2,'0'));if(frames)mkdirSync(dir,{recursive:true});
 for(let frame=0;frame<nframes;frame++){
  if(only&&!only.has(variantIndex))break;
  const age=frames?frame/30*1000:frame===0?650+p.flightMs*.66:650+p.flightMs+130,elapsed=age-entry.start;
  const t=elapsed/p.flightMs;
  background(p,who);floor.clearRect(0,0,450,800);air.clearRect(0,0,450,800);scene.clear();
  if(collision){
   const motion=collisionFrame(elapsed,p),poses=[1,-1].map(direction=>collisionHullFrame(elapsed,p,{direction}));
   const a={x:135+70*motion.pull-poses[0].recoil+poses[0].shake,y:400},
    b={x:315-70*motion.pull+poses[1].recoil+poses[1].shake,y:400};
   target(a,p,elapsed,who,47,{...poses[0],x:0,y:0});target(b,p,elapsed,who,47,{...poses[1],x:0,y:0});
   drawCollisionConvergence(floor,air,entry,{x:225,y:400},elapsed,false);
   drawCollisionExplosion(air,{x:225,y:400},p,elapsed-p.flightMs,camera,{});
  }else{
   target(to,p,elapsed,who);drawCinematicWeapon(floor,air,entry,age);
   if(t>=0&&t<1){
    const travel=weaponTravelProgress(p.kind,t);
    const pose=maglio?projectileFlightFrame(from,to,travel,camera):metalProjectileFlightFrame(from,to,travel,camera,model.userData.frontZ);
    model.position.copy(pose.center);model.rotation.y=pose.yaw;
    if(p.kind==='wandering-shrapnel')model.rotation.z=elapsed*.008;
    if(p.kind==='thermal-reclaimer')model.rotation.z=Math.sin(age*.009)*.12;
    if(p.kind==='steel-rail'&&p.tier>=1)model.rotation.z=age*.004;
    if(['magnetic-grapple','induction'].includes(p.kind))articulateChainWeapon(model,Math.max(0,Math.min(1,(t-.8)/.2)));
    if(['cascade-piercer','wandering-shrapnel'].includes(p.kind))articulatePrecisionProjectile(model,elapsed);
    scene.add(model);
    if(p.kind==='magnetic-grapple')drawMagneticChain(floor,from,{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t},p,camera,elapsed,0);
   }else if(t>=1&&p.kind==='magnetic-grapple'){
    drawMagneticChain(floor,from,to,p,camera,elapsed,.7);drawLatch(air,to,p);
   }
  }
  renderer.render(scene,camera);ctx.drawImage(floorCanvas,0,0,450,800);ctx.drawImage(meshCanvas,0,0,450,800);ctx.drawImage(airCanvas,0,0,450,800);
  writeFileSync(frames?resolve(dir,String(frame).padStart(4,'0')+'.png'):resolve(output,String(variantIndex).padStart(2,'0')+'-'+(frame?'contact':'flight')+'.png'),image.toBuffer('image/png'));
 }
 stats.push({id:v.id,kind:p.kind,tier:p.tier,who,frames:nframes,durationMs:650+p.flightMs+p.impactMs+220,motif:entry.style.motif});
 console.log(v.id,nframes);
}
writeFileSync(resolve(output,'study.json'),JSON.stringify({type:'offline-renderer-study',notStackBlitz:true,variants:stats},null,2));
