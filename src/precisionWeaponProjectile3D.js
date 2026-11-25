import {Group,Mesh,MeshStandardMaterial,CylinderGeometry,TorusGeometry,
 BoxGeometry,OctahedronGeometry} from 'three';

// Volumi reali: ogiva lunga guidata dagli anelli / scheggia corta dal carrello.
// Nessuna illustrazione obliqua ruotata per simulare le due facce.
export function createPrecisionProjectile(kind,tier){
 const root=new Group(),cascade=kind==='cascade-piercer',collars=[];
 const material=(name,color,emissive='#000000',intensity=0)=>{
  const m=new MeshStandardMaterial({color,emissive,emissiveIntensity:intensity,
   roughness:.23,metalness:.87});m.name=name;return m;
 };
 const dark=material('Grafite','#25313b'),bronze=material('Rame e bronzo','#b97c46'),
  silver=material('Argento lavorato','#c9d9e6'),steel=material('Acciaio','#8398a7'),
  glow=material('Nucleo caldo','#ffe0a1','#ff982d',.8),
  prism=[material('Cristallo ciano','#badcfa','#80d9f4',.24),
   material('Cristallo violetto','#dfc9fb','#b59bea',.26)];
 const add=(name,geometry,mat,pos=[0,0,0],rot=[0,0,0],parent=root)=>{
  const mesh=new Mesh(geometry,mat);mesh.name=name;mesh.position.set(...pos);
  mesh.rotation.set(...rot);parent.add(mesh);return mesh;
 };
 const box=(name,pos,size,mat,parent=root)=>add(name,new BoxGeometry(...size),mat,pos,[0,0,0],parent);
 const cylinder=(name,z,r,h,mat)=>add(name,new CylinderGeometry(r,r,h,16),mat,[0,0,z],[Math.PI/2,0,0]);
 if(cascade){
  cylinder('Penetratore assiale',-.04,.115,.88,dark);
  add('Ogiva perforante',new CylinderGeometry(.008,.13,.43,12),silver,[0,0,-.69],[-Math.PI/2,0,0]);
  for(const z of [-.29,.04,.33]){
   const collar=add('Collare guida assiale',new TorusGeometry(.155,.026,5,20),silver,[0,0,z]);
   collars.push(collar);
   for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3;
    const shoe=box('Pattino degli anelli',[Math.cos(a)*.16,Math.sin(a)*.16,z],[.06,.035,.09],bronze);
    shoe.rotation.z=a;
   }
  }
  cylinder('Fondello chiuso',.43,.14,.07,steel);
  cylinder('Ricircolo posteriore',.475,.09,.02,glow);
  if(tier===3)for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3;
   const rail=add('Guida prismatica di ritorno',new OctahedronGeometry(.095),prism[i%2],
    [Math.cos(a)*.18,Math.sin(a)*.18,.02]);rail.scale.set(.55,.7,3.5);rail.rotation.z=a;
  }
  root.userData={kind,tier,frontZ:-.905,rearZ:.485,collars};
 }else{
  box('Corpo della scheggia',[0,0,0],[.29,.17,.54],dark);
  const tip=add('Testa a cuneo compatta',new CylinderGeometry(.014,.19,.32,4),steel,[0,0,-.41],[-Math.PI/2,0,Math.PI/4]);
  tip.scale.z=.68;
  for(const x of [-1,1])box('Guida bronzea della cassetta',[x*.16,0,.02],[.045,.20,.45],bronze);
  box('Fondello della scheggia',[0,0,.29],[.31,.19,.06],bronze);
  box('Tracciante sul retro',[0,0,.327],[.19,.09,.018],glow);
  if(tier>=2){
   for(const y of [-1,1])box('Rinforzo argento del carrello',[0,y*.105,-.02],[.22,.035,.43],silver);
   for(const x of [-1,1])box('Aletta di rinculo argento',[x*.23,0,.19],[.13,.035,.18],silver);
  }
  if(tier===3){
   for(const x of [-1,1]){
    const cap=add('Guscio prismatico articolato',new OctahedronGeometry(.13),prism[x===1?1:0],[x*.19,0,-.11]);
    cap.scale.set(.5,.75,2.2);
   }
   box('Ponte prismatico della scheggia',[0,.145,.05],[.33,.025,.28],prism[0]);
  }
  root.userData={kind,tier,frontZ:-.57,rearZ:.336,collars};
 }
 root.name=cascade?'Penetratore a cascata':'Scheggia errante';return root;
}
export function articulatePrecisionProjectile(model,elapsed){
 (model.userData.collars||[]).forEach((collar,i)=>{collar.rotation.z=elapsed*.006+i*Math.PI/3;});
}
