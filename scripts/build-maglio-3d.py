"""Modelli artistici del Maglio dalle quattro carte ufficiali. Blender 4.3+.
blender -b --python scripts/build-maglio-3d.py
Assi Blender: X destra, Y avanti, Z alto; glTF: X destra, -Z avanti, Y alto.
Gerarchia: BaseFixed / TurretYaw / ArmPitch / PistonRecoil / Muzzle.
"""
import bpy,math,os,json
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/'public/assets/fleet-weapons/maglio/models'
DEST.mkdir(parents=True,exist_ok=True)

def material(name,color,metal=.8,rough=.34,glow=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
 if glow:p.inputs['Emission Color'].default_value=(*color,1);p.inputs['Emission Strength'].default_value=glow
 return m

def empty(name,parent=None,loc=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=loc;return o

def finish(o,name,parent,loc,mat,bevel=0):
 o.name=name;o.parent=parent;o.location=loc;o.data.materials.append(mat)
 if bevel:
  mod=o.modifiers.new('Bordi lavorati','BEVEL');mod.width=bevel;mod.segments=2;mod.affect='EDGES'
 return o

def box(name,parent,loc,size,mat,bevel=.035,rotation=(0,0,0)):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 finish(o,name,parent,loc,mat,bevel);o.rotation_euler=rotation;return o

def cyl(name,parent,loc,radius,depth,mat,axis='Z',vertices=48):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth);o=bpy.context.object
 finish(o,name,parent,loc,mat,.012)
 if axis=='Y':o.rotation_euler[0]=math.pi/2
 if axis=='X':o.rotation_euler[1]=math.pi/2
 for f in o.data.polygons:f.use_smooth=len(f.vertices)==4
 return o

def torus(name,parent,loc,radius,minor,mat,axis='Z'):
 bpy.ops.mesh.primitive_torus_add(major_segments=48,minor_segments=8,major_radius=radius,minor_radius=minor)
 o=bpy.context.object;finish(o,name,parent,loc,mat)
 if axis=='Y':o.rotation_euler[0]=math.pi/2
 if axis=='X':o.rotation_euler[1]=math.pi/2
 for f in o.data.polygons:f.use_smooth=True
 return o

def beam(name,parent,a,b,width,depth,mat):
 a,b=Vector(a),Vector(b);o=box(name,parent,(a+b)/2,(width,depth,(b-a).length),mat,.035)
 o.rotation_mode='QUATERNION';o.rotation_quaternion=(b-a).to_track_quat('Z','Y');return o

def tube(name,parent,pts,radius,mat):
 curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=12;curve.bevel_depth=radius;curve.bevel_resolution=3
 s=curve.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for pt,co in zip(s.bezier_points,pts):pt.co=co;pt.handle_left_type='AUTO';pt.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(mat);return o

def plate(name,parent,w,l,z0,z1,top,mat):
 def ring(w,l,z):
  c=.24;return[(-w/2+c,-l/2,z),(w/2-c,-l/2,z),(w/2,-l/2+c,z),(w/2,l/2-c,z),(w/2-c,l/2,z),(-w/2+c,l/2,z),(-w/2,l/2-c,z),(-w/2,-l/2+c,z)]
 vs=ring(w,l,z0)+ring(w*top,l*top,z1);faces=[tuple(range(7,-1,-1)),tuple(range(8,16))]+[(i,(i+1)%8,(i+1)%8+8,i+8)for i in range(8)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(vs,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);finish(o,name,parent,(0,0,0),mat,.028);return o

def bolt(parent,loc,axis='Z',r=.045):
 cyl('Vite esagonale',parent,loc,r,.027,M['bolt'],axis,6)

def grille(parent,loc,w,h,axis='Y',count=5):
 x,y,z=loc
 if axis=='Y':
  box('Alloggiamento griglia',parent,(x,y,z),(w+.055,.025,h+.05),M['dark'],.009)
  for i in range(count):box('Feritoia ambra',parent,(x,y-.016,z-h/2+(i+.5)*h/count),(w,.015,h/count*.48),M['amber'],.004)
 else:
  box('Alloggiamento griglia',parent,(x,y,z),(w+.055,h+.05,.024),M['dark'],.009)
  for i in range(count):box('Feritoia ambra',parent,(x,y-h/2+(i+.5)*h/count,z+.016),(w,h/count*.48,.015),M['amber'],.004)

def merge_children(parent):
 # Batch per snodo: i materiali restano distinti, senza un draw call per vite.
 children=[o for o in list(parent.children)if o.type in {'MESH','CURVE'}]
 if not children:return
 bpy.ops.object.select_all(action='DESELECT')
 for o in children:o.select_set(True)
 bpy.context.view_layer.objects.active=children[0]
 bpy.ops.object.convert(target='MESH')
 # Convert applica anche i bevel prima dell'unione, mantenendo i volumi.
 bpy.ops.object.join();o=bpy.context.object;o.name=parent.name+'_Surface'
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=o.modifiers.new('Normali metallo','WEIGHTED_NORMAL');mod.keep_sharp=True;mod.weight=50
 bpy.ops.object.modifier_apply(modifier=mod.name)
 # UV per il dettaglio di rugosita' del renderer.
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.015);bpy.ops.object.mode_set(mode='OBJECT')

manifest=[]
for level,slug in enumerate(['comune','rara','epica','leggendaria']):
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for block in list(bpy.data.materials):bpy.data.materials.remove(block)
 M={'steel':material('Acciaio satinato',(.24,.28,.31),.82,.34),'edge':material('Titanio bordi',(.36,.40,.43),.88,.30),'dark':material('Scafo grafite',(.045,.065,.085),.75,.44),'joint':material('Giunti meccanici',(.115,.145,.175),.85,.34),'rubber':material('Guaina cavi',(.018,.024,.030),.08,.52),'bolt':material('Viti nere',(.04,.05,.06),.8,.32),'amber':material('AmberIdle',(.72,.19,.025),.15,.32,1.7),'pulse':material('PulseCore',(.95,.30,.035),.05,.25,2.4)}
 root=empty('Maglio_'+slug);base=empty('BaseFixed',root);yaw=empty('TurretYaw',root,(0,0,.51));pitch=empty('ArmPitch',yaw,(0,-.12,1.06));recoil=empty('PistonRecoil',pitch);muzzle=empty('Muzzle',recoil,(0,2.065,0))
 root['rarity']=slug;root['card_reference']='weapon-confirmed-metallic-maglio'+['','-rarity-r','-rarity-e','-rarity-l'][level]
 plate('Scafo inferiore',base,3.8,3.05,.04,.20,.98,M['dark']);plate('Corazza bassa',base,3.72,3.0,.20,.43,.87,M['steel'])
 for x in [-1.45,1.45]:
  for y in [-.88,0,.88]:
   box('Piastra laterale',base,(x,y,.43),(.48,.76,.16),M['edge'],.055)
   for yy in [y-.23,y+.23]:bolt(base,(x,yy,.52))
 for y in [-1.35,1.35]:
  for x in [-1.05,0,1.05]:
   box('Piastra bordo',base,(x,y,.29),(.82,.17,.19),M['dark'],.03)
   box('Luce di stato base',base,(x,y+(-.091 if y<0 else .091),.30),(.57,.016,.033),M['amber'],.006)
 for x in [-1.07,1.07]:
  box('Scatola base',base,(x,-.84,.62),(.43,.50,.32),M['dark'])
  grille(base,(x,-1.098,.63),.22,.17)
 cyl('Ralla fissa',base,(0,0,.48),1.28,.16,M['joint']);torus('Gola ralla',base,(0,0,.565),1.17,.035,M['dark'])
 cyl('Ralla rotante',yaw,(0,0,.10),1.12,.18,M['steel']);torus('Bordo ralla',yaw,(0,0,.20),1.09,.043,M['edge'])
 for i in range(12):
  a=2*math.pi*i/12;x,y=1.04*math.cos(a),1.04*math.sin(a)
  bolt(yaw,(x,y,.245));box('Tacca ralla',yaw,(.98*math.cos(a),.98*math.sin(a),.17),(.12,.045,.045),M['amber'],.005,rotation=(0,0,a+math.pi/2))
 for side in [-1,1]:
  x=side*.68
  for y in [-.88,.72]:
   beam('Braccio sostegno',yaw,(x,y,.20),(x,-.12,1.06),.22,.28,M['steel'])
   beam('Inserto braccio',yaw,(x+side*.116,y*.78,.39),(x+side*.116,-.12,.96),.022,.16,M['dark'])
  box('Piede sostegno',yaw,(x,-.05,.22),(.40,1.75,.16),M['dark'])
  cyl('Snodo braccio',yaw,(x,-.12,1.06),.265,.24,M['joint'],'X')
  torus('Flangia snodo',yaw,(x+side*.13,-.12,1.06),.203,.026,M['edge'],'X')
  for i in range(6):
   a=i*math.pi/3;bolt(yaw,(x+side*.145,-.12+.16*math.cos(a),1.06+.16*math.sin(a)),'X',.032)
 # Corpo inclinabile, asse lungo Y. Il basamento e i sostegni restano fuori da questo snodo.
 box('Otturatore posteriore',pitch,(0,-.66,0),(1.02,.91,.82),M['dark'],.10)
 for x in [-.37,.37]:
  box('Guancia otturatore',pitch,(x,-.66,.035),(.26,.87,.79),M['steel'],.065)
  for z in [-.23,.27]:bolt(pitch,(x,-1.125,z),'Y')
 box('Piastra superiore otturatore',pitch,(0,-.65,.47),(.78,.75,.13),M['edge'])
 grille(pitch,(0,-1.135,0),.29,.40)
 cyl('Sede posteriore pistone',pitch,(0,-.31,0),.355,.34,M['joint'],'Y')
 cyl('Nucleo interno',pitch,(0,.46,0),.285,1.89,M['pulse'],'Y')
 for y in [-.28,.30,.90,1.35]:
  cyl('Collare pistone',pitch,(0,y,0),.41,.17,M['steel'],'Y')
  for x in [-.35,.35]:box('Piastra collare',pitch,(x,y,.05),(.17,.27,.49),M['edge'],.035)
 for x in [-.31,.31]:
  box('Longherone corpo',pitch,(x,.44,.30),(.16,1.65,.14),M['steel'])
 for side in [-1,1]:
  tube('Cavo flessibile corpo',pitch,[(side*.35,-.80,.35),(side*.46,-.35,.64),(side*.42,.36,.56),(side*.37,1.24,.29)],.061,M['rubber'])
  for y in [-.48,.10,.68]:torus('Fascetta cavo',pitch,(side*.425,y,.51),.071,.012,M['joint'],'Y')
 # Testa e pistone mobile: scorrimento nel solo braccio, mai della base.
 cyl('Slitta cromata',recoil,(0,1.45,0),.31,.56,M['edge'],'Y')
 cyl('Aggancio testa',recoil,(0,1.65,0),.56,.25,M['dark'],'Y')
 torus('Anello gravitazionale',recoil,(0,1.70,0),.59,.033,M['pulse'],'Y')
 if level<3:
  for z in [-.30,.30]:
   box('Testa impatto corazzata',recoil,(0,1.90,z),(1.23,.36,.56),M['steel'],.085)
   box('Piastra frontale testa',recoil,(0,2.086,z),(1.07,.040,.42),M['edge'],.045)
   for x in [-.43,.43]:bolt(recoil,(x,2.112,z),'Y',.035)
  box('Fessura centrale ambra',recoil,(0,2.112,0),(1.02,.017,.024),M['pulse'],.004)
  for x in [-.60,.60]:box('Blocchi testa laterali',recoil,(x,1.92,0),(.15,.42,.38),M['dark'],.055)
 else:
  cyl('Camera anulare',recoil,(0,1.87,0),.70,.40,M['dark'],'Y',64)
  torus('Cerchio esterno testa',recoil,(0,2.06,0),.68,.045,M['edge'],'Y')
  torus('Traccia nucleo',recoil,(0,2.115,0),.46,.018,M['pulse'],'Y')
  cyl('Iride scura',recoil,(0,2.075,0),.44,.033,M['dark'],'Y',64)
  for i in range(6):
   a=i*math.pi/3;x,z=.67*math.sin(a),.67*math.cos(a)
   box('Artiglio testa',recoil,(x,1.98,z),(.35,.44,.40),M['steel'],.055,rotation=(0,a,0))
   box('Inserto artiglio',recoil,(x,2.213,z),(.21,.026,.22),M['dark'],.015,rotation=(0,a,0))
   for j in [-1,0,1]:
    xx=x+j*.047*math.cos(a);zz=z-j*.047*math.sin(a)
    box('Griglia artiglio',recoil,(xx,2.23,zz),(.021,.012,.15),M['amber'],.003,rotation=(0,a,0))
   # Segmenti della chiusura dell'iride, disegno geometrico sul metallo scuro.
   pts=[]
   for rr,aa in [(.03,a+.35),(.42,a),(.42,a+.93),(.19,a+1.20)]:pts.append((rr*math.sin(aa),2.099,rr*math.cos(aa)))
   mesh=bpy.data.meshes.new('Lamina iride');mesh.from_pydata(pts,[],[(0,1,2,3)]);mesh.update();o=bpy.data.objects.new('Lamina iride',mesh);bpy.context.collection.objects.link(o);finish(o,'Lamina iride',recoil,(0,0,0),M['joint'])
  muzzle.location.y=2.245
 if level>=1:
  box('Modulo posteriore raro',pitch,(0,-.77,.70),(.84,.80,.32),M['steel'],.065)
  grille(pitch,(0,-.77,.872),.55,.44,'Z',3)
  cyl('Condensatore laterale',pitch,(.70,.16,-.20),.18,.88,M['joint'],'Y')
  cyl('Spira condensatore',pitch,(.70,.16,-.20),.144,.68,M['pulse'],'Y')
  for y in [-.27,-.06,.16,.38,.60]:torus('Rivestimento condensatore',pitch,(.70,y,-.20),.171,.024,M['edge'],'Y')
 if level>=2:
  for x in [-.25,0,.25]:
   cyl('Condotto epico',pitch,(x,.40,.43),.073,1.61,M['pulse'],'Y')
   for y in [-.37,.13,.64,1.15]:cyl('Anello condotto epico',pitch,(x,y,.43),.091,.085,M['steel'],'Y',24)
  for side in [-1,1]:
   tube('Cavo potenziato',pitch,[(side*.48,-.83,.50),(side*.64,-.13,.78),(side*.55,.58,.69),(side*.43,1.34,.38)],.065,M['rubber'])
  box('Alimentatore basso',yaw,(0,-1.0,.41),(.67,.43,.29),M['dark']);grille(yaw,(0,-1.225,.41),.40,.15)
  if level==2:
   for z in [-.45,.45]:
    box('Rinforzo testa epico',recoil,(0,1.94,z),(.69,.49,.26),M['steel'],.05)
    grille(recoil,(0,2.195,z),.40,.12)
 if level>=3:
  for side in [-1,1]:
   box('Scocca leggendaria',pitch,(side*.52,-.66,.08),(.23,.96,.88),M['steel'],.08)
   tube('Fascio cavi leggendario',pitch,[(side*.45,-.84,.65),(side*.72,-.12,.84),(side*.65,.81,.72),(side*.45,1.49,.45)],.073,M['rubber'])
 for parent in [base,yaw,pitch,recoil]:merge_children(parent)
 # La posa di riposo e' applicata dal runtime; questi sono veri snodi locali.
 bpy.ops.object.select_all(action='DESELECT')
 for o in list(bpy.context.scene.objects):o.select_set(True)
 filename=DEST/(slug+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(filename),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_extras=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
 manifest.append({'rarity':slug,'file':str(filename.relative_to(ROOT)),'bytes':filename.stat().st_size,'joints':['BaseFixed','TurretYaw','ArmPitch','PistonRecoil','Muzzle']})
 print('MAGLIO_MODEL_OK',slug,filename.stat().st_size,flush=True)
(DEST/'manifest.json').write_text(json.dumps({'generator':'scripts/build-maglio-3d.py','units':'metri artistici','forward':'-Z in glTF','assets':manifest},indent=2)+'\n')
