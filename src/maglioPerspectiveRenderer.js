import {Vector3} from 'three';
import {MaglioSoftwareRenderer} from './maglioSoftwareRenderer.js';
import {worldPointToBoard,MAGLIO_NOSE_Z} from './maglioProjectile3D.js';

const root=(import.meta.env?.VITE_ASSET_ROOT||'/assets').replace(/\/+$/,'');
export const projectileViewPath=tier=>root+'/fleet-weapons/maglio/projectiles/perspective-'+tier+'.png';
const images=new Map();
export function preloadProjectileViews(){
 if(typeof Image==='undefined')return;
 for(let tier=0;tier<4;tier++)if(!images.has(tier)){
  const image=new Image();image.decoding='async';image.src=projectileViewPath(tier);images.set(tier,image);
 }
}
const bracket=(v,values)=>{
 if(v<=values[0])return [[0,1]];
 for(let i=1;i<values.length;i++)if(v<=values[i]){
  const t=(v-values[i-1])/(values[i]-values[i-1]);return [[i-1,1-t],[i,t]].filter(([,w])=>w>1e-6);
 }
 return [[values.length-1,1]];
};
export function projectileViewSamples(model,camera){
 const view=camera.position.clone().sub(model.position).applyAxisAngle(new Vector3(0,1,0),-model.rotation.y);
 const az=Math.atan2(view.x,view.z),front=Math.cos(az)<0;
 const center=front?Math.PI:0,offset=Math.atan2(Math.sin(az-center),Math.cos(az-center))*180/Math.PI;
 const elevation=Math.atan2(view.y,Math.hypot(view.x,view.z))*180/Math.PI;
 return bracket(elevation,[28,42,56,70]).flatMap(([row,a])=>
  bracket(offset,[-24,0,24]).map(([col,b])=>({
   row:(front?4:0)+row,col,weight:a*b,azimuth:((front?180:0)+[-24,0,24][col])*Math.PI/180,
   elevation:[28,42,56,70][row]*Math.PI/180,end:front?'front':'rear'
  })));
}

// Ogni fotogramma sceglie e interpola viste del VERO volume renderizzate con
// Cycles. Naso, scala e orientamento vengono dalla camera 3D della partita.
// Questo conserva riflessi e occlusioni sui dispositivi senza accelerazione.
export class MaglioPerspectiveRenderer{
 constructor(canvas){
  this.domElement=canvas;this.context=canvas.getContext('2d',{alpha:true});
  this.blendCanvas=document.createElement('canvas');this.blend=this.blendCanvas.getContext('2d',{alpha:true});
  this.isPerspectiveRenderer=true;this.ratio=1;
  this.fallback=new MaglioSoftwareRenderer(canvas,{contactShadow:false});preloadProjectileViews();
 }
 setPixelRatio(r){this.ratio=r;this.fallback.setPixelRatio(r);}
 setSize(w,h){this.fallback.setSize(w,h);this.blendCanvas.width=this.domElement.width;this.blendCanvas.height=this.domElement.height;}
 render(scene,camera){
  const models=scene.children.filter(o=>o.isGroup).sort((a,b)=>
   camera.position.distanceToSquared(b.position)-camera.position.distanceToSquared(a.position));
  const output=this.context,ctx=this.blend;
  if(models.some(model=>!images.get(model.userData.tier)?.complete||!images.get(model.userData.tier)?.naturalWidth)){
   this.lastMethod='cpu-mesh';this.lastSamples=[];
   this.fallback.render(scene,camera);return;
  }
  this.lastMethod='cycles-views';this.lastSamples=[];
  output.clearRect(0,0,this.domElement.width,this.domElement.height);
  for(const model of models){
   ctx.clearRect(0,0,this.blendCanvas.width,this.blendCanvas.height);
   ctx.save();ctx.scale(this.ratio,this.ratio);
   const image=images.get(model.userData.tier),center=worldPointToBoard(model.position,camera);
   const forward=new Vector3(0,0,-1).applyAxisAngle(new Vector3(0,1,0),model.rotation.y);
   const nose=worldPointToBoard(model.position.clone().addScaledVector(forward,-MAGLIO_NOSE_Z),camera);
   const dx=nose.x-center.x,dy=nose.y-center.y;
   const samples=projectileViewSamples(model,camera);
   this.lastSamples=samples.map(v=>({row:v.row,col:v.col,end:v.end,weight:Math.round(v.weight*1000)/1000}));
   // Somma premoltiplicata delle viste su una superficie trasparente. La
   // composizione additiva evita bordi doppi e aloni scuri nella transizione.
   ctx.globalCompositeOperation='lighter';
   for(const sample of samples){
    const bx=Math.sin(sample.azimuth),by=-Math.sin(sample.elevation)*Math.cos(sample.azimuth);
    const pixelsPerUnit=160;
    const scale=Math.hypot(dx,dy)/(-MAGLIO_NOSE_Z*Math.hypot(bx,by)*pixelsPerUnit);
    const rotation=Math.atan2(dy,dx)-Math.atan2(by,bx);
    ctx.save();ctx.translate(center.x,center.y);ctx.rotate(rotation);ctx.globalAlpha=sample.weight;
    ctx.drawImage(image,sample.col*384,sample.row*480,384,480,-192*scale,-240*scale,384*scale,480*scale);
    ctx.restore();
   }
   ctx.globalCompositeOperation='source-over';
   ctx.restore();output.drawImage(this.blendCanvas,0,0);
  }
 }
 dispose(){this.fallback.dispose();}
}
