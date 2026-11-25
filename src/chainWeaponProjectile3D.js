import {Group,Mesh,MeshStandardMaterial,BoxGeometry,CylinderGeometry,TorusGeometry,OctahedronGeometry} from 'three';

export function createChainWeaponModel(kind,tier=2){
 const root=new Group(),jaws=[],plates=[];
 const mat=(color,emissive='#000000',emissiveIntensity=0)=>new MeshStandardMaterial({
  color,emissive,emissiveIntensity,metalness:.88,roughness:.25});
 const bronze=mat('#bd8750'),dark=mat('#29323c'),silver=mat('#d3e1ed'),
  amber=mat('#ffe1a1','#ff9d37',.9),crystal=mat('#cce1ff','#9c91ef',.35);
 const add=(parent,name,geometry,material,pos=[0,0,0],rotation=[0,0,0])=>{
  const mesh=new Mesh(geometry,material);mesh.name=name;
  mesh.position.set(...pos);mesh.rotation.set(...rotation);parent.add(mesh);return mesh;
 };
 const box=(parent,name,pos,size,material,rotation)=>add(parent,name,new BoxGeometry(...size),material,pos,rotation);
 const cylinder=(name,z,radius,length,material)=>add(root,name,
  new CylinderGeometry(radius,radius,length,16),material,[0,0,z],[Math.PI/2,0,0]);
 const ring=(name,z,radius,material)=>add(root,name,new TorusGeometry(radius,.025,5,20),material,[0,0,z]);
 if(kind==='magnetic-grapple'){
  cylinder('Corpo di aggancio grafite',.07,.18,.43,dark);
  cylinder('Tamburo bronzeo e cavo posteriore',.30,.15,.13,bronze);
  for(const z of [.25,.29,.33])ring('Spire del tamburo',z,.16,bronze);
  cylinder('Giunto frontale',-.17,.20,.09,bronze);
  for(const a of [0,Math.PI]){
   const turn=new Group();turn.rotation.z=a;root.add(turn);
   const pivot=new Group();pivot.position.set(.15,0,-.18);turn.add(pivot);jaws.push(pivot);
   box(pivot,'Braccio articolato della ganascia',[0,0,-.16],[.09,.10,.36],bronze);
   box(pivot,'Uncino rivolto verso lo scafo',[-.055,0,-.37],[.20,.11,.10],bronze,[0,-.3,0]);
   add(turn,'Perno meccanico',new CylinderGeometry(.065,.065,.14,12),silver,[.15,0,-.18],[Math.PI/2,0,0]);
   if(tier>=2)box(pivot,'Collare di bloccaggio argento',[0,0,-.26],[.13,.14,.07],silver);
   if(tier===3){const prism=add(pivot,'Cappuccio prismatico',new OctahedronGeometry(.10),crystal,[.03,0,-.26]);prism.scale.set(.65,.85,1.25);}
  }
  if(tier>=2){ring('Collare argento',-.07,.21,silver);
   for(const x of [-1,1])box(root,'Guida argento',[0,x*.18,.03],[.07,.04,.31],silver);}
  if(tier===3)for(let i=0;i<4;i++){
   const a=i*Math.PI/2,prism=add(root,'Gabbia prismatica',new OctahedronGeometry(.095),crystal,[Math.cos(a)*.21,Math.sin(a)*.21,.02]);
   prism.scale.set(.7,.7,1.65);
  }
  root.userData={kind,tier,frontZ:-.64,rearZ:.40,jaws};
 }else{
  cylinder('Nucleo induttivo compresso',0,.10,.43,amber);
  for(let i=0;i<3;i++){
   const plate=box(root,'Piastra induttiva argento '+(i+1),[(i-1)*.13,0,(i-1)*.12],
    [.08,.28,.38],silver);plates.push(plate);
   box(plate,'Avvolgimento in rame',[0,.16,0],[.10,.04,.27],bronze);
   box(plate,'Fessura di campo',[0,-.02,-.20],[.10,.09,.018],amber);
   if(tier===3){
    box(plate,'Bordo diamantato della piastra',[0,0,-.207],[.096,.30,.025],crystal);
    box(plate,'Guardia prismatica articolata',[0,.20,.05],[.11,.035,.29],crystal);
   }
  }
  for(const z of [-.27,0,.27])ring('Anello del campo induttivo',z,.25,amber);
  if(tier===3){
   box(root,'Traversa prismatica posteriore',[0,.28,.22],[.54,.04,.07],crystal);
   for(const s of [-1,1])box(root,'Braccio del ponte articolato',[s*.25,.18,.22],[.035,.20,.07],crystal);
  }
  root.userData={kind,tier,frontZ:-.42,rearZ:.31,plates};
 }
 return root;
}
export function articulateChainWeapon(model,closure){
 const c=Math.max(0,Math.min(1,closure));
 for(const jaw of model.userData.jaws||[])jaw.rotation.y=-(1-c)*.68;
 (model.userData.plates||[]).forEach((p,i)=>{
  p.position.x=(i-1)*(.13+(1-c)*.12);
  p.position.z=(i-1)*(.12+(1-c)*.15);
  p.rotation.z=(i-1)*(1-c)*.22;
 });
}
