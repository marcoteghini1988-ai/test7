import {Group,Mesh,MeshStandardMaterial,CylinderGeometry,TorusGeometry,
 BoxGeometry,OctahedronGeometry,Vector3} from 'three';
import {boardPointToWorld} from './maglioProjectile3D.js';

export function metalProjectileFlightFrame(from,to,progress,camera,frontZ){
 const a=boardPointToWorld(from,camera),b=boardPointToWorld(to,camera);
 const direction=b.clone().sub(a).normalize();
 const nose=a.clone().lerp(b,Math.max(0,Math.min(1,progress)));
 const center=nose.clone().addScaledVector(direction,frontZ);
 return {nose,center,direction,yaw:Math.atan2(-direction.x,-direction.z),
  visibleEnd:direction.dot(camera.position.clone().sub(center))>0?'front':'rear'};
}

// Due munizioni volumetriche diverse, ciascuna con fronte e retro reali.
// Il dardo della Slitta non è la testata del Maglio; il Recuperatore porta
// una capsula corta con tre dissipatori ispirati ai collettori della carta.
export function createMetalProjectile(kind,tier,chargeRatio=0){
 const root=new Group(),thermal=kind==='thermal-reclaimer';
 root.name=thermal?'Capsula termobalistica':'Dardo a slitta';
 const material=(name,color,emissive=null,strength=0)=>{
  const m=new MeshStandardMaterial({color,metalness:.86,roughness:.24,
   emissive:emissive||'#000000',emissiveIntensity:strength});m.name=name;return m;
 };
 const dark=material('Grafite lavorata','#29313b'),steel=material('Acciaio freddo','#8297a8'),
  bronze=material('Stabilizzatori bronzo','#b47e45'),silver=material('Argento','#c4d3df'),
  core=material('Tracciante caldo','#ffc080','#ff7222',.8+chargeRatio*.9),
  crystal=material('Cristallo prismatico','#bfcff5','#8f78dc',.25),
  cyan=material('Riflesso ciano','#a8e4f1','#72bbdd',.3),
  violet=material('Riflesso violetto','#e4c7fb','#b58df5',.3);
 const add=(name,g,m,pos=[0,0,0],rot=[0,0,0])=>{
  const mesh=new Mesh(g,m);mesh.name=name;mesh.position.set(...pos);mesh.rotation.set(...rot);root.add(mesh);return mesh;
 };
 const cylinder=(name,z,r,h,m,sides=20)=>add(name,new CylinderGeometry(r,r,h,sides),m,[0,0,z],[Math.PI/2,0,0]);
 const ring=(name,z,r,t,m)=>add(name,new TorusGeometry(r,t,5,24),m,[0,0,z]);
 const box=(name,pos,size,m,rot=[0,0,0])=>add(name,new BoxGeometry(...size),m,pos,rot);
 if(!thermal){
  cylinder('Corpo penetratore',-.04,.13,.72,dark,12);
  add('Ogiva acciaio',new CylinderGeometry(.012,.13,.40,12),steel,[0,0,-.60],[-Math.PI/2,0,0]);
  for(const z of [-.36,.08,.30])cylinder('Fascia guidata',z,.145,.05,steel,12);
  cylinder('Fondello',.355,.135,.08,dark,12);
  cylinder('Retro incandescente',.402,.095,.018,core,16);
  for(let i=0;i<4;i++){
   const a=i*Math.PI/2;
   box('Scanalatura del dardo',[Math.sin(a)*.132,Math.cos(a)*.132,-.08],
    [.027,.012,.47],steel,[0,0,-a]);
  }
  if(tier>=1)for(const x of [-1,1]){
   box('Pinna stabilizzatrice bronzo',[x*.19,0,.25],[.19,.035,.39],bronze,[0,x*.10,0]);
   box('Innesto pinna',[x*.13,0,.24],[.04,.075,.29],steel);
  }
  if(tier>=2){
   for(const z of [-.26,.15])ring('Collare di compressione argento',z,.163,.023,silver);
   for(const y of [-1,1])box('Guida argento',[0,y*.155,-.02],[.075,.035,.49],silver);
  }
  if(tier===3)for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3;
   const prism=add('Costa prismatica',new OctahedronGeometry(.11,0),[crystal,cyan,violet][i],
    [Math.sin(a)*.20,Math.cos(a)*.20,-.12]);
   prism.scale.set(.5,.7,2.7);prism.rotation.z=-a;
  }
  root.userData={kind,tier,frontZ:-.80,rearZ:.42,trailRadius:.11};
 }else{
  cylinder('Capsula in argento',.06,.205,.58,silver,18);
  cylinder('Alloggio lente frontale',-.25,.234,.09,dark,18);
  ring('Bordo lente frontale',-.302,.20,.025,silver);
  cylinder('Lente ambra',-.32,.174,.035,core,20);
  // Ogiva sfaccettata corta; la lente frontale resta distinguibile dal retro.
  const lens=add('Nucleo di conversione',new OctahedronGeometry(.17,1),core,[0,0,-.35]);
  lens.scale.set(1,1,.54);
  cylinder('Chiusura posteriore',.38,.195,.07,dark,18);
  ring('Anello di scarico posteriore',.424,.13,.022,core);
  cylinder('Centro posteriore scuro',.428,.093,.018,dark,16);
  for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3,x=Math.sin(a),y=Math.cos(a);
   box('Dissipatore del collettore',[x*.25,y*.25,.08],[.16,.052,.39],steel,[0,0,-a]);
   box('Condotto di recupero',[x*.214,y*.214,.04],[.044,.026,.32],core,[0,0,-a]);
   for(const z of [-.07,.05,.17])
    box('Lamella dissipatrice',[x*.265,y*.265,z],[.19,.024,.025],silver,[0,0,-a]);
   if(tier===3){
    const prism=add('Gabbia del condensatore',new OctahedronGeometry(.13,0),[crystal,cyan,violet][i],
     [x*.28,y*.28,-.12]);prism.scale.set(.56,.8,2.3);prism.rotation.z=-a;
   }
  }
  if(tier===3)for(const z of [-.22,.26])ring('Giunto prismatico',z,.26,.018,crystal);
  root.userData={kind,tier,frontZ:-.442,rearZ:.44,trailRadius:.18,chargeRatio};
 }
 return root;
}

export function metalTrailPoint(pose,distance,lateral=0,height=0){
 const right=new Vector3(pose.direction.z,0,-pose.direction.x);
 return pose.center.clone().addScaledVector(pose.direction,-distance)
  .addScaledVector(right,lateral).add(new Vector3(0,height,0));
}
