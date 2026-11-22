// Rasterizzatore 3D CPU per browser privi di WebGL. Usa geometrie, matrici e
// materiali dello stesso GLB: nessuno sprite o rotazione di un'immagine.
import {Matrix4,Matrix3,Vector3} from 'three';
const lights=[[-.46,.75,.48,1.08,.99,.88],[.64,.56,-.52,.55,.70,1.02],[0,.24,.97,.24,.25,.28]];
const unit=v=>{const n=Math.hypot(...v);return v.map(x=>x/n);};
const directions=lights.map(l=>unit(l.slice(0,3)));
const aces=x=>Math.pow(Math.max(0,Math.min(1,(x*(2.51*x+.03))/(x*(2.43*x+.59)+.14))),1/2.2)*255;
export class MaglioSoftwareRenderer{
 constructor(canvas=document.createElement('canvas')){
  this.domElement=canvas;this.context=this.domElement.getContext('2d',{alpha:true});
  if(!this.context)throw Error('Canvas 2D non disponibile');
  this.isSoftwareRenderer=true;this.shadowMap={};this.info={render:{calls:0}};this.ratio=1;this.cache=new WeakMap();
  this.mvp=new Matrix4();this.normal=new Matrix3();this.view=new Vector3();this.shadow=new Vector3();
 }
 setPixelRatio(r){this.ratio=r;}
 setSize(w,h){
  const width=Math.max(1,Math.round(w*this.ratio)),height=Math.max(1,Math.round(h*this.ratio));
  if(this.domElement.width===width&&this.domElement.height===height)return;
  this.domElement.width=width;this.domElement.height=height;
  this.pixels=this.context.createImageData(width,height);this.depth=new Float32Array(width*height);
 }
 setClearColor(){}
 setAnimationLoop(callback){
  if(this.callback===callback)return;this.callback=callback;
  if(this.raf){cancelAnimationFrame(this.raf);this.raf=0;}
  if(callback){const frame=()=>{if(!this.callback)return;this.callback();if(this.callback)this.raf=requestAnimationFrame(frame);};this.raf=requestAnimationFrame(frame);}
 }
 render(scene,camera){
  if(!this.pixels)return;const width=this.domElement.width,height=this.domElement.height,data=this.pixels.data;
  data.fill(0);this.depth.fill(Infinity);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  this.view.copy(camera.position).sub(camera.getWorldDirection(this.shadow).add(camera.position)).normalize();
  const half=directions.map(l=>unit([l[0]+this.view.x,l[1]+this.view.y,l[2]+this.view.z]));
  // Ombra di contatto trasparente sul piano del basamento.
  this.shadow.set(0,.03,0).project(camera);const sx=(this.shadow.x*.5+.5)*width,sy=(.5-this.shadow.y*.5)*height;
  const rx=width*.29,ry=height*.105;
  for(let y=Math.max(0,Math.floor(sy-ry*1.8));y<Math.min(height,sy+ry*1.8);y++)for(let x=Math.max(0,Math.floor(sx-rx*1.8));x<Math.min(width,sx+rx*1.8);x++){
   const fall=Math.exp(-2*((x-sx)**2/rx**2+(y-sy)**2/ry**2));data[(y*width+x)*4+3]=Math.round(fall*48);
  }
  this.info.render.calls=0;
  scene.traverse(mesh=>{
   if(!mesh.isMesh||!mesh.visible||mesh.material?.isShadowMaterial)return;
   const material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;if(!material?.color)return;
   const geometry=mesh.geometry,pos=geometry.attributes.position,norm=geometry.attributes.normal;if(!norm)return;
   let cache=this.cache.get(mesh);if(!cache||cache.screen.length!==pos.count*3){cache={screen:new Float32Array(pos.count*3),color:new Float32Array(pos.count*3)};this.cache.set(mesh,cache);}
   const screen=cache.screen,colors=cache.color;
   this.mvp.multiplyMatrices(camera.matrixWorldInverse,mesh.matrixWorld);this.mvp.premultiply(camera.projectionMatrix);
   this.normal.getNormalMatrix(mesh.matrixWorld);const e=this.mvp.elements,n=this.normal.elements;
   const base=material.color,em=material.emissive,emission=material.emissiveIntensity||0,metal=material.metalness||0,rough=material.roughness??.4;
   const exponent=Math.max(9,Math.min(85,4/(rough*rough))),specStrength=.12+metal*.42;
   for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),k=i*3,iw=1/(e[3]*x+e[7]*y+e[11]*z+e[15]);
    screen[k]=((e[0]*x+e[4]*y+e[8]*z+e[12])*iw*.5+.5)*width;
    screen[k+1]=(.5-(e[1]*x+e[5]*y+e[9]*z+e[13])*iw*.5)*height;
    screen[k+2]=(e[2]*x+e[6]*y+e[10]*z+e[14])*iw;
    const ax=norm.getX(i),ay=norm.getY(i),az=norm.getZ(i);
    let nx=n[0]*ax+n[3]*ay+n[6]*az,ny=n[1]*ax+n[4]*ay+n[7]*az,nz=n[2]*ax+n[5]*ay+n[8]*az;
    const inv=1/(Math.hypot(nx,ny,nz)||1);nx*=inv;ny*=inv;nz*=inv;
    const ambient=.18+.18*Math.max(0,ny)+.05*(nx+1);
    let r=base.r*ambient,g=base.g*ambient,b=base.b*ambient;
    for(let l=0;l<lights.length;l++){
     const d=directions[l],h=half[l],light=lights[l],diff=Math.max(0,nx*d[0]+ny*d[1]+nz*d[2]);
     const spec=Math.pow(Math.max(0,nx*h[0]+ny*h[1]+nz*h[2]),exponent)*specStrength;
     r+=(base.r*diff*.40+spec*(.55+base.r*metal))*light[3];
     g+=(base.g*diff*.40+spec*(.55+base.g*metal))*light[4];
     b+=(base.b*diff*.40+spec*(.55+base.b*metal))*light[5];
    }
    colors[k]=aces(r+(em?.r||0)*emission);colors[k+1]=aces(g+(em?.g||0)*emission);colors[k+2]=aces(b+(em?.b||0)*emission);
   }
   const indices=geometry.index?.array,count=indices?indices.length:pos.count;this.info.render.calls++;
   const texture=material.map?.image,uv=geometry.attributes.uv,repeat=material.map?.repeat;
   for(let i=0;i<count;i+=3){
    const ia=(indices?indices[i]:i)*3,ib=(indices?indices[i+1]:i+1)*3,ic=(indices?indices[i+2]:i+2)*3;
    const x0=screen[ia],y0=screen[ia+1],x1=screen[ib],y1=screen[ib+1],x2=screen[ic],y2=screen[ic+1];
    const a0=y1-y2,b0=x2-x1,c0=x1*y2-x2*y1,a1=y2-y0,b1=x0-x2,c1=x2*y0-x0*y2;
    const area=a0*x0+b0*y0+c0;if(area>=-.001)continue;
    const minX=Math.max(0,Math.floor(Math.min(x0,x1,x2))),maxX=Math.min(width-1,Math.ceil(Math.max(x0,x1,x2)));
    const minY=Math.max(0,Math.floor(Math.min(y0,y1,y2))),maxY=Math.min(height-1,Math.ceil(Math.max(y0,y1,y2)));
    if(maxX<minX||maxY<minY)continue;const inverse=1/area;
    const z0=screen[ia+2],z1=screen[ib+2],z2=screen[ic+2];
    const textured=texture?.data&&uv,tx0=textured?uv.getX(ia/3):0,tx1=textured?uv.getX(ib/3):0,tx2=textured?uv.getX(ic/3):0,
     ty0=textured?uv.getY(ia/3):0,ty1=textured?uv.getY(ib/3):0,ty2=textured?uv.getY(ic/3):0;
    for(let y=minY;y<=maxY;y++){
     let u=(a0*(minX+.5)+b0*(y+.5)+c0)*inverse,v=(a1*(minX+.5)+b1*(y+.5)+c1)*inverse;
     const du=a0*inverse,dv=a1*inverse;
     for(let x=minX;x<=maxX;x++,u+=du,v+=dv){
      const w=1-u-v;if(u<0||v<0||w<0)continue;const depth=u*z0+v*z1+w*z2,p=y*width+x;
      if(depth>=this.depth[p]||depth< -1||depth>1)continue;this.depth[p]=depth;const k=p*4;
      let tint=1;if(textured){
       const fx=(u*tx0+v*tx1+w*tx2)*(repeat?.x||1),fy=(u*ty0+v*ty1+w*ty2)*(repeat?.y||1);
       const tx=(((fx%1+1)%1)*texture.width)|0,ty=(((fy%1+1)%1)*texture.height)|0;
       tint=texture.data[(ty*texture.width+tx)*4]/255;
      }
      data[k]=(u*colors[ia]+v*colors[ib]+w*colors[ic])*tint;data[k+1]=(u*colors[ia+1]+v*colors[ib+1]+w*colors[ic+1])*tint;data[k+2]=(u*colors[ia+2]+v*colors[ib+2]+w*colors[ic+2])*tint;data[k+3]=255;
     }
    }
   }
  });
  this.context.putImageData(this.pixels,0,0);
 }
 dispose(){this.setAnimationLoop(null);this.pixels=null;this.depth=null;}
 forceContextLoss(){}
}
