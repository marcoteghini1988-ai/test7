import {Group,Mesh,MeshStandardMaterial,CylinderGeometry,TorusGeometry,
 OctahedronGeometry,PerspectiveCamera,Plane,Raycaster,Vector2,Vector3,DataTexture,
 RepeatWrapping,SRGBColorSpace} from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Una camera fissa sopra il tavolo. Origine e bersaglio sono misurati nel DOM
// e riproiettati su questo piano: il naso arriva esattamente al punto colpito.
export const MAGLIO_NOSE_Z=-.88;
export function createProjectileCamera(){
 const camera=new PerspectiveCamera(42,450/800,.1,100);
 camera.position.set(0,12,12);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
 return camera;
}
export function boardPointToWorld(point,camera){
 const ray=new Raycaster();ray.setFromCamera(new Vector2(point.x/225-1,1-point.y/400),camera);
 return ray.ray.intersectPlane(new Plane(new Vector3(0,1,0),0),new Vector3());
}
export function worldPointToBoard(point,camera){
 const p=point.clone().project(camera);return {x:(p.x+1)*225,y:(1-p.y)*400};
}
export function projectileFlightFrame(from,to,progress,camera){
 const a=boardPointToWorld(from,camera),b=boardPointToWorld(to,camera);
 const direction=b.clone().sub(a).normalize();
 const nose=a.clone().lerp(b,Math.max(0,Math.min(1,progress)));
 const center=nose.clone().addScaledVector(direction,MAGLIO_NOSE_Z);
 return {nose,center,direction,yaw:Math.atan2(-direction.x,-direction.z),
  visibleEnd:direction.dot(camera.position.clone().sub(center))>0?'front':'rear'};
}

// Modello volumetrico della munizione approvata: testa smussata, scocca
// segmentata, bobina arancione e vero retro. Nessuna faccia è una billboard.
export function createMaglioProjectile(tier=0){
 const root=new Group();root.name='MaglioProjectile'+tier;
 const mat=(name,color,metalness=.85,roughness=.3,emissive=null,intensity=0)=>{
  const m=new MeshStandardMaterial({color,metalness,roughness,
   emissive:emissive||'#000000',emissiveIntensity:intensity});m.name=name;return m;
 };
 const m={dark:mat('Scafo brunito','#1c232c'),steel:mat('Acciaio spazzolato','#555e6b'),
  edge:mat('Smussi lavorati','#8995a3',.9,.24),black:mat('Incassi e guarnizioni','#080e15',.4,.6),
  bronze:mat('Giroscopi bronzo','#b37a3d',.88,.25),
  orange:mat('Bobina gravitazionale','#ff6b12',.4,.25,'#ff3902',1.4),
  violet:mat('Nucleo bianco violetto','#e9e7ff',.25,.18,'#9771ff',2.7),
  crystal:mat('Prismi iridescenti','#b6c5ea',.7,.15,'#8e78d3',.18)};
 const grain=new Uint8Array(128*128*4);
 let seed=4837;
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const value=205+(seed%37)+(y%13===0?8:0)-(x%41===0?23:0),i=(y*128+x)*4;
  grain[i]=grain[i+1]=grain[i+2]=value;grain[i+3]=255;
 }
 const texture=new DataTexture(grain,128,128);texture.wrapS=texture.wrapT=RepeatWrapping;
 texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;
 for(const name of ['dark','steel','edge','bronze'])m[name].map=texture;
 const mesh=(name,geo,material,position=[0,0,0],rotation=[0,0,0],parent=root)=>{
  const o=new Mesh(geo,material);o.name=name;o.position.set(...position);o.rotation.set(...rotation);parent.add(o);return o;
 };
 const box=(name,pos,size,material=m.steel,bevel=.025,rotation=[0,0,0])=>
  mesh(name,new RoundedBoxGeometry(...size,1,Math.min(bevel,...size.map(v=>v*.3))),material,pos,rotation);
 const cyl=(name,z,r,depth,material=m.steel,sides=24,x=0,y=0)=>
  mesh(name,new CylinderGeometry(r,r,depth,sides),material,[x,y,z],[Math.PI/2,0,0]);
 const ring=(name,z,r,tube,material=m.edge,pos=[0,0],rotation=[0,0,0])=>
  mesh(name,new TorusGeometry(r,tube,6,32),material,[pos[0],pos[1],z],rotation);
 const bolt=(x,y,z)=>{
  cyl('Bullone esagonale',z,.022,.018,m.edge,6,x,y);
  box('Taglio bullone',[x,y,z-.012],[.024,.005,.003],m.black,.001);
 };
 // Corpo posteriore ottagonale, cinghie e ugello incassato: visibili nel tiro A.
 cyl('Corpo corazzato',.29,.405,1.10,m.dark,12);
 for(const z of [-.18,.18,.52,.78]){
  cyl('Cintura scocca',z,.433,.085,m.edge,12);
  ring('Giunto cintura',z-.048,.413,.014,m.black);
 }
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,x=Math.sin(a),y=Math.cos(a);
  box('Piastra longitudinale',[x*.4,y*.4,.3],[.25,.07,.78],m.steel,.022,[0,0,-a]);
  box('Incavo longitudinale',[x*.441,y*.441,.3],[.15,.014,.57],m.black,.005,[0,0,-a]);
  box('Canale energia',[x*.452,y*.452,.31],[.115,.012,.34],m.orange,.004,[0,0,-a]);
 }
 cyl('Piastra posteriore',.854,.40,.095,m.steel,12);
 cyl('Pozzo posteriore',.91,.275,.025,m.black,32);
 ring('Bobina posteriore',.929,.252,.022,tier===3?m.violet:m.orange);
 cyl('Ugello interno',.936,.173,.016,m.dark,24);
 ring('Ugello radiante',.951,.121,.018,tier===3?m.violet:m.orange);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4;bolt(Math.sin(a)*.335,Math.cos(a)*.335,.91);
 }
 // Flangia anulare dietro la testa: mantiene l'identità meccanica del Maglio.
 cyl('Collare gravitazionale',-.33,.51,.23,m.black,32);
 for(const z of [-.25,-.37,-.45])ring('Avvolgimento arancione',z,.47,.024,m.orange);
 ring('Bordo flangia',-.18,.514,.035,tier===1?m.bronze:m.edge);
 ring('Bordo anteriore flangia',-.49,.515,.032,m.edge);
 // Testa a quattro ganasce, con apertura centrale e piastre frontali separate.
 for(const side of [-1,1]){
  box('Piastra orizzontale',[0,side*.49,-.63],[1.18,.29,.43],m.steel,.055);
  box('Smusso piastra',[0,side*.59,-.67],[1.02,.058,.31],m.edge,.018);
  for(const x of [-.42,-.14,.14,.42]){
   box('Pannello superiore testata',[x,side*.64,-.63],[.255,.035,.27],m.dark,.012);
   const o=cyl('Rivetto superiore',-.68,.016,.012,m.edge,6,x,side*.665);
   o.rotation.x=side>0?0:Math.PI;
  }
  box('Giunto piastra',[0,side*.49,-.858],[.85,.046,.018],m.black,.005);
  box('Fessura luminosa',[0,side*.49,-.871],[.76,.027,.016],m.orange,.004);
  box('Mascella laterale',[side*.49,0,-.62],[.29,.73,.42],m.dark,.05);
  box('Piastra laterale',[side*.608,0,-.64],[.05,.60,.32],m.edge,.015);
  for(const y of [-.2,0,.2]){
   box('Griglia laterale',[side*.637,y,-.65],[.012,.044,.22],m.black,.003);
  }
  for(const x of [-.44,-.20,.20,.44])bolt(x,side*.56,-.86);
  for(const y of [-.26,.26])bolt(side*.56,y,-.84);
 }
 cyl('Recesso del nucleo',-.57,.26,.07,m.black,32);
 ring('Anello frontale',-.617,.24,.021,tier===3?m.violet:m.orange);
 cyl('Nucleo frontale',-.626,.11,.022,tier===3?m.violet:m.dark,24);
 if(tier===1){
  for(const side of [-1,1]){
   box('Braccio giroscopio',[0,side*.63,.09],[.14,.44,.12],m.bronze,.022);
   const gyro=new Group();gyro.name='Giroscopio';gyro.position.set(0,side*.91,.05);root.add(gyro);
   mesh('Orbita giroscopica',new TorusGeometry(.23,.018,6,28),m.bronze,[0,0,0],[.27,.48,0],gyro);
   mesh('Seconda orbita',new TorusGeometry(.20,.015,6,28),m.bronze,[0,0,0],[Math.PI/2,0,.3],gyro);
   mesh('Asse giroscopico',new CylinderGeometry(.025,.025,.48,8),m.edge,[0,0,0],[Math.PI/2,0,0],gyro);
   mesh('Centro giroscopico',new CylinderGeometry(.065,.065,.14,16),m.orange,[0,0,0],[Math.PI/2,0,0],gyro);
  }
 }
 if(tier>=2){
  for(let i=0;i<9;i++)box('Aletta apicale',[-.5+i*.125,.715,-.53],
   [.035,.24,.56],m.edge,.008);
  for(const side of [-1,1])for(let i=0;i<7;i++){
   box('Aletta dissipatrice',[side*(.53+i*.014),side*.65,-.68+i*.095],
    [.05,.25-i*.012,.035],m.edge,.009);
  }
  for(const z of [-.12,.04,.2])ring('Manicotto argentato',z,.46,.025,m.edge);
 }
 if(tier===3){
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,x=Math.sin(a),y=Math.cos(a);
   const prism=mesh('Prisma sfaccettato',new OctahedronGeometry(.22,0),m.crystal,[x*.56,y*.56,-.21]);
   prism.scale.set(.67,.67,2.4);prism.rotation.z=-a;
   box('Incastonatura prisma',[x*.57,y*.57,.22],[.18,.11,.12],m.edge,.018,[0,0,-a]);
  }
  for(const z of [-.35,-.17,.02])ring('Campo prismatico',z,.49,.014,m.violet);
 }
 root.userData={tier,forward:[0,0,-1],frontZ:MAGLIO_NOSE_Z,rearZ:.96};
 return root;
}

export function disposeProjectile(model){
 const materials=new Set(),textures=new Set();model.traverse(o=>{if(o.isMesh){o.geometry.dispose();materials.add(o.material);}});
 materials.forEach(m=>{if(m.map)textures.add(m.map);m.dispose();});textures.forEach(t=>t.dispose());
}
