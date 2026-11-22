import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {maglioModelPath,maglioArtwork} from './maglioBattleVisuals.js';
import {solveMaglioAim,maglioRigPose} from './maglioRigPose.js';
import {MaglioSoftwareRenderer} from './maglioSoftwareRenderer.js';

const loader=new GLTFLoader(),models=new Map();
export function preloadMaglioModel(path){
 if(!models.has(path))models.set(path,loader.loadAsync(path).catch(error=>{models.delete(path);throw error;}));
 return models.get(path);
}
let brushedMetal,metalColor;
function metalColorDetail(){
 if(metalColor)return metalColor;
 const size=512,data=new Uint8Array(size*size*4);let seed=314159;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const grain=222+(seed%33),index=(y*size+x)*4;data.set([grain,grain,grain,255],index);
 }
 // Graffi sottili: dati di superficie procedurali, non un'immagine del modello.
 for(let i=0;i<230;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%size,y=(seed>>>10)%size,len=3+(seed%40);
  for(let j=0;j<len;j++){const k=(y*size+(x+j)%size)*4;data[k]=data[k+1]=data[k+2]=170+(i%40);}
 }
 metalColor=new THREE.DataTexture(data,size,size);metalColor.colorSpace=THREE.SRGBColorSpace;
 metalColor.wrapS=metalColor.wrapT=THREE.RepeatWrapping;metalColor.repeat.set(4,4);
 metalColor.magFilter=THREE.LinearFilter;metalColor.minFilter=THREE.LinearMipmapLinearFilter;
 metalColor.generateMipmaps=true;metalColor.anisotropy=4;metalColor.needsUpdate=true;return metalColor;
}
function metalDetail(){
 if(brushedMetal)return brushedMetal;
 const size=256,data=new Uint8Array(size*size*4);let seed=271828;
 for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const grain=213+(seed%37);data.set([grain,grain,grain,255],i*4);}
 brushedMetal=new THREE.DataTexture(data,size,size);brushedMetal.wrapS=brushedMetal.wrapT=THREE.RepeatWrapping;
 brushedMetal.repeat.set(5,5);brushedMetal.magFilter=THREE.LinearFilter;
 brushedMetal.minFilter=THREE.LinearMipmapLinearFilter;brushedMetal.generateMipmaps=true;
 brushedMetal.needsUpdate=true;return brushedMetal;
}

export default function MaglioArticulatedModel({cardId,side='player',shot,pending=false,onMuzzle,
 previewAim=null,cameraAzimuth=0,cameraElevation=55}){
 const host=useRef(null),engine=useRef(null),latest=useRef(null),[failed,setFailed]=useState(false);
 latest.current={shot,pending,onMuzzle,previewAim};
 const path=maglioModelPath(cardId);
 useEffect(()=>{
  const element=host.current;if(!element||!path)return;
  let disposed=false,renderer,envTarget,pmrem,scene,model,frame;
  const materials=[],pulse=[];const canvasReady=()=>{element.dataset.maglio3dReady='true';};
  const setup=async()=>{
   const asset=await preloadMaglioModel(path);if(disposed)return;
   try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}
   catch{renderer=new MaglioSoftwareRenderer();}
   element.dataset.renderer=renderer.isSoftwareRenderer?'cpu-3d':'webgl2';
   renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   renderer.toneMappingExposure=1.08;renderer.setClearColor(0x000000,0);
   renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
   const canvas=renderer.domElement;canvas.className='maglio-model-canvas';
   canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Maglio: modello 3D articolato');
   element.appendChild(canvas);scene=new THREE.Scene();
   if(!renderer.isSoftwareRenderer){
    pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();envTarget=pmrem.fromScene(room,.04);room.dispose();
    scene.environment=envTarget.texture;scene.environmentIntensity=.85;
   }
   scene.add(new THREE.HemisphereLight(0xe5eeff,0x353138,1.25));
   const key=new THREE.DirectionalLight(0xfff0d8,3.2);key.position.set(-3.7,7,4.1);key.castShadow=true;
   key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:1,far:20});
   key.shadow.bias=-.0005;key.shadow.normalBias=.02;scene.add(key);
   const rim=new THREE.DirectionalLight(0xa7c9ff,2.0);rim.position.set(4,4,-4);scene.add(rim);
   const fill=new THREE.DirectionalLight(0xffffff,.65);fill.position.set(0,1,5);scene.add(fill);
   model=asset.scene.clone(true);scene.add(model);
   model.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;
    const clone=m=>{const c=m.clone();materials.push(c);
     if(c.metalness>.3){c.map=metalColorDetail();c.roughnessMap=metalDetail();c.roughness=Math.max(.32,c.roughness);}
     if(/PulseCore|AmberIdle/.test(c.name)){pulse.push({material:c,core:c.name.includes('PulseCore')});c.emissiveIntensity=.24;}
     return c;};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);
   });
   const yaw=model.getObjectByName('TurretYaw'),pitch=model.getObjectByName('ArmPitch'),
    recoil=model.getObjectByName('PistonRecoil'),muzzle=model.getObjectByName('Muzzle'),base=model.getObjectByName('BaseFixed');
   if(!yaw||!pitch||!recoil||!muzzle||!base)throw Error('Snodi Maglio mancanti');
   const groundMat=new THREE.ShadowMaterial({opacity:.24}),groundGeo=new THREE.PlaneGeometry(5.6,4.7);
   const ground=new THREE.Mesh(groundGeo,groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=.025;ground.receiveShadow=true;scene.add(ground);
   const camera=new THREE.OrthographicCamera(-3,3,2.4,-2.4,.1,50);
   const elevation=THREE.MathUtils.degToRad(cameraElevation),azimuth=THREE.MathUtils.degToRad(cameraAzimuth);
   camera.position.set(Math.sin(azimuth)*8*Math.cos(elevation),1.40+8*Math.sin(elevation),Math.cos(azimuth)*8*Math.cos(elevation));
   camera.lookAt(0,1.40,0);camera.updateMatrixWorld();
   const projected=new THREE.Vector3(),pivotWorld=new THREE.Vector3(),rayOrigin=new THREE.Vector3(),rayDirection=new THREE.Vector3(),targetWorld=new THREE.Vector3();
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');let announced=null;
   const device=element.closest('.maglio-device');
   const aim=()=>{
    const current=latest.current;if(current.previewAim)return solveMaglioAim(side,current.previewAim,pitch.getWorldPosition(pivotWorld));
    if(!device||!device.hasAttribute('data-target-x'))return null;
    const board=device.closest('.f3d-approved-layout')?.getBoundingClientRect(),rect=element.getBoundingClientRect();
    if(!board||!rect.width||!rect.height)return null;
    const x=board.left+Number(device.dataset.targetX)*board.width/450,y=board.top+Number(device.dataset.targetY)*board.height/800;
    rayOrigin.set((x-rect.left)/rect.width*2-1,1-(y-rect.top)/rect.height*2,0).unproject(camera);
    camera.getWorldDirection(rayDirection);const depth=(1.10-rayOrigin.y)/rayDirection.y;
    targetWorld.copy(rayOrigin).addScaledVector(rayDirection,depth);
    return solveMaglioAim(side,targetWorld,pitch.getWorldPosition(pivotWorld));
   };
   const draw=()=>{
    if(disposed)return;const current=latest.current,s=current.shot;
    // Il tempo appartiene alla risoluzione ufficiale, anche se il modello arriva dalla cache.
    const age=s?Date.now()-s.visualNonce-(s.delayMs||0):0;
    const target=aim(),pose=maglioRigPose({side,ageMs:age,aim:target,fires:!!s?.fires,reducedMotion:reduced.matches});
    yaw.rotation.y=pose.yaw;pitch.rotation.x=pose.pitch;recoil.position.z=pose.recoil;
    for(const {material,core}of pulse)material.emissiveIntensity=.24+pose.charge*(core?5:2.0);
    model.updateMatrixWorld(true);muzzle.getWorldPosition(projected);projected.project(camera);
    const point={x:(projected.x*.5+.5)*100,y:(.5-projected.y*.5)*100};current.onMuzzle?.(point);
    element.dataset.yaw=pose.yaw.toFixed(5);element.dataset.pitch=pose.pitch.toFixed(5);element.dataset.recoil=pose.recoil.toFixed(5);
    element.dataset.basePosition=base.position.toArray().join(',');element.dataset.baseQuaternion=base.quaternion.toArray().join(',');
    element.dataset.muzzleX=point.x.toFixed(4);element.dataset.muzzleY=point.y.toFixed(4);
    renderer.render(scene,camera);element.dataset.drawCalls=String(renderer.info.render.calls);canvasReady();
    if(s?.fires&&age>=720&&announced!==s.visualNonce){announced=s.visualNonce;device?.dispatchEvent(new CustomEvent('maglio-muzzle-ready',{bubbles:true}));}
    if(!s?.fires||age>=2200+(s.delayMs||0))renderer.setAnimationLoop(null);
   };
   const wake=()=>{renderer.setAnimationLoop(draw);draw();};
   const resize=()=>{
    const width=element.clientWidth,height=element.clientHeight,rect=element.getBoundingClientRect();if(!width||!height)return;
    const ratio=width/height,viewHeight=Math.max(4.8,4.55/ratio);camera.left=-viewHeight*ratio/2;camera.right=viewHeight*ratio/2;
    camera.top=viewHeight/2;camera.bottom=-viewHeight/2;camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(3,Math.max(2,window.devicePixelRatio||1)*rect.width/width));
    renderer.setSize(width,height,false);element.dataset.bufferWidth=String(canvas.width);element.dataset.bufferHeight=String(canvas.height);wake();
   };
   const observer=new ResizeObserver(resize);observer.observe(element);window.addEventListener('resize',resize);
   device?.addEventListener('maglio-target-ready',wake);
   engine.current={wake,cleanup:()=>{observer.disconnect();window.removeEventListener('resize',resize);device?.removeEventListener('maglio-target-ready',wake);groundGeo.dispose();groundMat.dispose();}};
   resize();
  };
  setup().catch(error=>{if(!disposed){console.error('Maglio 3D',error);setFailed(true);}});
  return ()=>{disposed=true;engine.current?.cleanup();engine.current=null;
   renderer?.setAnimationLoop(null);for(const m of materials)m.dispose();envTarget?.dispose();pmrem?.dispose();renderer?.dispose();renderer?.forceContextLoss();
   if(renderer?.domElement.parentNode===element)element.removeChild(renderer.domElement);
  };
 },[path,side,cameraAzimuth,cameraElevation]);
 useEffect(()=>{engine.current?.wake();},[shot?.visualNonce,previewAim,pending]);
 return <span ref={host} className="maglio-model-viewer" data-model-path={path}>
  {failed&&<img className="maglio-model-fallback" src={maglioArtwork(cardId,side)} alt="Maglio Ferrogravitazionale"/>}
 </span>;
}
