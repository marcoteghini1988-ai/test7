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

def warning(parent,loc,count=5,spacing=.083):
 # Marcature arancio fisiche, presenti sulle piastre navali della carta.
 x,y,z=loc
 for i in range(count):
  box('Tratto segnaletica inclinato',parent,(x+(i-(count-1)/2)*spacing,y,z),(.037,.104,.008),M['caution'],.002,rotation=(0,0,-.36))

def armored_ring(parent,y,r,mat,segments=12,width=.20):
 # Corona segmentata: le giunture nere evitano la silhouette di un tubo liscio.
 for i in range(segments):
  a=(i+.5)*math.tau/segments
  x,z=r*math.sin(a),r*math.cos(a)
  box('Settore corazzato anulare',parent,(x,y,z),(width,.22,.20),mat,.024,rotation=(0,a,0))
  bolt(parent,((r+.035)*math.sin(a),y+.116,(r+.035)*math.cos(a)),'Y',.020)

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
 # La carta mostra acciaio grafite, giunti quasi neri e luce arancio intenso.
 # Le rarita' aggiungono pezzi fisici; non tingono l'intera arma di blu/viola/oro.
 M={'steel':material('Acciaio grafite',(.108,.117,.138),.85,.40),'edge':material('Spigoli titanio',(.205,.218,.251),.84,.32),'armor':material('Piastre brunite',(.076,.086,.109),.76,.48),'dark':material('Scafo grafite',(.016,.021,.031),.68,.52),'joint':material('Giunti meccanici',(.041,.050,.068),.83,.37),'caution':material('Marcature ocra',(.46,.16,.014),.58,.42),'amber':material('AmberIdle',(.98,.19,.008),.08,.29,1.8),'pulse':material('PulseCore',(1,.29,.018),.04,.22,2.4)}
 # Otto slot PBR al massimo per snodo; cavi, bulloni e rame condividono
 # finiture compatibili per mantenere i draw call della battaglia sotto 32.
 M['rubber']=M['bolt']=M['dark'];M['copper']=M['caution']
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
  box('Scudo inclinato base',base,(x,-.45,.48),(.55,.93,.09),M['steel'],.045,rotation=(0,0,x*.07))
  for y in [-.61,-.39,-.17]:
   box('Striscia segnaletica',base,(x,y,.533),(.14,.045,.012),M['amber'],.004,rotation=(0,0,-.28))
 for y in [-1.19,1.19]:
  box('Fascia corazzata longitudinale',base,(0,y,.43),(2.15,.20,.10),M['steel'],.03)
  for x in [-.80,-.48,-.16,.16,.48,.80]:
   box('Feritoia longitudinale',base,(x,y,.49),(.16,.035,.012),M['dark'],.003)
 # Il basamento della carta e' una piattaforma navale stratificata, non una
 # mattonella: pannelli rastremati, giunzioni incassate e segnaletica.
 for side in [-1,1]:
  for y in [-1.02,-.38,.32,1.03]:
   box('Piastra corazzata longitudinale',base,(side*1.72,y,.39),(.32,.52,.13),M['armor'],.043,rotation=(0,0,side*.045))
   box('Inserto metallico frontale',base,(side*1.72,y-.21,.471),(.25,.036,.014),M['edge'],.004)
  box('Rientranza longherone scafo',base,(side*1.37,.05,.503),(.042,1.93,.015),M['dark'],.004)
  box('Linea ambra longherone',base,(side*1.37,-.38,.514),(.022,.80,.012),M['amber'],.003)
 for x in [-1.60,-.99,-.38,.38,.99,1.60]:
  box('Piastra bordo anteriore',base,(x,1.39,.36),(.50,.16,.13),M['armor'],.022)
  box('Finestra luminosa bordo anteriore',base,(x,1.481,.38),(.32,.012,.038),M['amber'],.002)
 warning(base,(0,1.36,.49),7)
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
  box('Corazza laterale del sostegno',yaw,(side*.84,.21,.64),(.10,.64,.35),M['edge'],.035,rotation=(side*.12,0,0))
  box('Incavo laterale del sostegno',yaw,(side*.90,.17,.65),(.016,.43,.13),M['dark'],.006)
  beam('Nervatura diagonale a vista',yaw,(side*.65,.67,.32),(side*.65,-.35,.97),.15,.13,M['armor'])
  box('Piastra esterna pilone',yaw,(side*.87,-.27,.71),(.14,.55,.42),M['steel'],.038,rotation=(side*.08,0,0))
  box('Gola pannello pilone',yaw,(side*.946,-.22,.78),(.012,.30,.13),M['dark'],.002)
  box('Led pilone',yaw,(side*.954,-.16,.78),(.008,.20,.035),M['amber'],.002)
  warning(yaw,(side*.71,.19,.408),3,.072)
 # Corpo inclinabile, asse lungo Y. Il basamento e i sostegni restano fuori da questo snodo.
 box('Otturatore posteriore',pitch,(0,-.66,0),(1.02,.91,.82),M['dark'],.10)
 for x in [-.37,.37]:
  box('Guancia otturatore',pitch,(x,-.66,.035),(.26,.87,.79),M['steel'],.065)
  for z in [-.23,.27]:bolt(pitch,(x,-1.125,z),'Y')
 box('Piastra superiore otturatore',pitch,(0,-.65,.47),(.78,.75,.13),M['edge'])
 grille(pitch,(0,-1.135,0),.29,.40)
 for side in [-1,1]:
  box('Pannello a cassetta posteriore',pitch,(side*.495,-.73,.10),(.035,.60,.53),M['armor'],.016)
  for y in [-.95,-.67,-.39]:
   box('Giuntura pannello posteriore',pitch,(side*.518,y,.10),(.013,.012,.40),M['dark'],.003)
  box('Bordo otturatore',pitch,(side*.55,-.63,.34),(.06,.75,.058),M['edge'],.015)
 cyl('Sede posteriore pistone',pitch,(0,-.31,0),.355,.34,M['joint'],'Y')
 cyl('Nucleo interno',pitch,(0,.46,0),.255,1.89,M['dark'],'Y')
 # Due guide illuminate lungo il pistone sono visibili anche dalla vista
 # obliqua della carta. Restano montate sullo snodo ArmPitch.
 for side in [-1,1]:
  cyl('Condotto gravitazionale',pitch,(side*.21,.48,.15),.080,1.73,M['pulse'],'Y',24)
  cyl('Guaina condotto inferiore',pitch,(side*.21,.48,-.11),.065,1.67,M['joint'],'Y',24)
  box('Lama di protezione longitudinale',pitch,(side*.37,.55,.21),(.13,1.72,.20),M['steel'],.045)
  box('Incavo lama',pitch,(side*.449,.53,.21),(.018,1.30,.035),M['dark'],.005)
  box('Guida nera profonda',pitch,(side*.45,.56,-.23),(.11,1.65,.14),M['dark'],.020)
  box('Binario inferiore titanio',pitch,(side*.45,.56,-.30),(.055,1.63,.058),M['edge'],.013)
  for y in [-.23,.34,.92]:
   box('Morsetto condotto',pitch,(side*.22,y,.15),(.28,.15,.34),M['edge'],.025)
 for y in [-.28,.30,.90,1.35]:
  cyl('Collare pistone',pitch,(0,y,0),.41,.17,M['steel'],'Y')
  for x in [-.35,.35]:box('Piastra collare',pitch,(x,y,.05),(.17,.27,.49),M['edge'],.035)
 for x in [-.31,.31]:
  box('Longherone corpo',pitch,(x,.44,.30),(.16,1.65,.14),M['steel'])
  for y in [-.23,.36,.93]:
   box('Piastra longherone',pitch,(x,y,.395),(.25,.29,.05),M['edge'],.018)
   bolt(pitch,(x,y,.428),r=.023)
 # Finestra di potenza dietro l'armatura: il bagliore segue fisicamente il
 # braccio quando questo ruota, come i condotti nell'immagine originale.
 for side in [-1,1]:
  box('Telaio finestra gravitazionale',pitch,(side*.30,.65,.415),(.17,.73,.058),M['dark'],.017)
  box('Cella gravitazionale',pitch,(side*.30,.65,.449),(.075,.53,.011),M['amber'],.004)
  for y in [.42,.62,.82]:box('Gabbia cella gravitazionale',pitch,(side*.30,y,.459),(.16,.035,.026),M['steel'],.004)
 for side in [-1,1]:
  tube('Cavo flessibile corpo',pitch,[(side*.35,-.80,.35),(side*.46,-.35,.64),(side*.42,.36,.56),(side*.37,1.24,.29)],.061,M['rubber'])
  for y in [-.48,.10,.68]:torus('Fascetta cavo',pitch,(side*.425,y,.51),.071,.012,M['joint'],'Y')
 # Testa e pistone mobile: scorrimento nel solo braccio, mai della base.
 cyl('Slitta cromata',recoil,(0,1.45,0),.31,.56,M['edge'],'Y')
 cyl('Aggancio testa',recoil,(0,1.65,0),.56,.25,M['dark'],'Y')
 torus('Fessura termica dietro la testa',recoil,(0,1.57,0),.61,.034,M['amber'],'Y')
 torus('Paratia gravitazionale esterna',recoil,(0,1.59,0),.75,.052,M['copper'],'Y')
 torus('Anello gravitazionale',recoil,(0,1.70,0),.61,.043,M['pulse'],'Y')
 torus('Collare esterno',recoil,(0,1.72,0),.72,.065,M['joint'],'Y')
 torus('Cintura luminosa corona',recoil,(0,1.748,0),.68,.023,M['amber'],'Y')
 armored_ring(recoil,1.77,.68,M['steel'],12,.14)
 for i in range(12):
  a=i*math.tau/12
  box('Rinforzo anello',recoil,(.69*math.cos(a),1.72,.69*math.sin(a)),(.16,.20,.12),M['edge'],.018,rotation=(0,-a,0))
 if level<3:
  box('Nucleo quadrangolare testata',recoil,(0,1.96,0),(1.38,.48,1.27),M['dark'],.12)
  for z in [-.46,.46]:
   box('Placca superiore e inferiore testata',recoil,(0,1.95,z),(1.43,.52,.37),M['steel'],.095)
   box('Rilievo della placca',recoil,(0,2.08,z*1.45),(1.16,.23,.045),M['edge'],.018)
   for x in [-.46,.46]:bolt(recoil,(x,2.222,z),'Y',.028)
  for side in [-1,1]:
   box('Mascella laterale testata',recoil,(side*.58,1.95,0),(.32,.51,1.01),M['edge'],.075)
   box('Pannello incassato testa',recoil,(side*.755,1.95,.06),(.022,.30,.56),M['dark'],.008)
   box('Luce laterale testata',recoil,(side*.774,2.02,.04),(.012,.14,.31),M['amber'],.004)
   for z in [-.32,.34]:
    box('Piastretta esagonale testata',recoil,(side*.774,1.92,z),(.025,.29,.16),M['armor'],.009)
    bolt(recoil,(side*.795,2.04,z),'X',.019)
   warning(recoil,(side*.785,1.81,-.28),3,.058)
  box('Fronte d impatto scuro',recoil,(0,2.215,0),(1.05,.042,.64),M['joint'],.035)
  box('Fessura centrale ambra',recoil,(0,2.240,0),(.98,.014,.060),M['pulse'],.005)
  for z in [-.28,.28]:box('Costa frontale',recoil,(0,2.250,z),(.90,.026,.055),M['steel'],.012)
  for side in [-1,1]:
   box('Spalla diagonale impatto',recoil,(side*.52,2.219,.28),(.27,.11,.35),M['armor'],.035,rotation=(0,side*.17,0))
   box('Piastra frontale superiore',recoil,(side*.36,2.278,.455),(.43,.034,.16),M['steel'],.016)
   box('Piastra frontale inferiore',recoil,(side*.36,2.278,-.455),(.43,.034,.16),M['armor'],.016)
  box('Fenditura frontale verticale',recoil,(0,2.274,.28),(.045,.018,.22),M['dark'],.004)
  if level==2:
   # La carta Epica mostra un maglio corazzato con feritoie luminose
   # sull'impatto, sopra e su entrambi i fianchi.
   for x in [-.34,.34]:
    box('Modulo urto epico',recoil,(x,2.265,0),(.34,.075,.50),M['steel'],.025)
    for z in [-.15,0,.15]:box('Feritoia urto epico',recoil,(x,2.307,z),(.23,.013,.046),M['amber'],.004)
   for side in [-1,1]:
    box('Carter laterale epico',recoil,(side*.785,1.94,0),(.10,.55,.76),M['steel'],.030)
    for z in [-.22,0,.22]:box('Cella laterale epica',recoil,(side*.844,2.02,z),(.012,.23,.08),M['amber'],.004)
   for x in [-.44,0,.44]:box('Condotto apicale epico',recoil,(x,1.94,.685),(.16,.40,.045),M['amber'],.018)
  muzzle.location.y=2.265
 else:
  cyl('Camera anulare',recoil,(0,1.90,0),.75,.43,M['dark'],'Y',64)
  torus('Cerchio esterno testa',recoil,(0,2.10,0),.74,.070,M['edge'],'Y')
  torus('Traccia nucleo',recoil,(0,2.169,0),.52,.045,M['pulse'],'Y')
  torus('Secondo avvolgimento',recoil,(0,2.175,0),.37,.020,M['amber'],'Y')
  cyl('Iride scura',recoil,(0,2.145,0),.46,.038,M['dark'],'Y',64)
  cyl('Pozzo energia',recoil,(0,2.185,0),.35,.035,M['joint'],'Y',64)
  torus('Orbita iride interna',recoil,(0,2.212,0),.29,.016,M['pulse'],'Y')
  torus('Orbita iride mediana',recoil,(0,2.215,0),.17,.012,M['amber'],'Y')
  cyl('Nucleo radiante',recoil,(0,2.223,0),.088,.027,M['pulse'],'Y',32)
  for i in range(12):
   a=i*math.tau/12
   box('Raggio energia iride',recoil,(.235*math.sin(a),2.227,.235*math.cos(a)),(.025,.012,.12),M['pulse'],.004,rotation=(0,a,0))
  for phase in [0,math.pi]:
   pts=[]
   for j in range(15):
    t=j/14;r=.04+.28*t;a=phase+t*math.tau*.86
    pts.append((r*math.sin(a),2.242+.004*t,r*math.cos(a)))
   tube('Spirale campo gravitazionale',recoil,pts,.012,M['pulse'])
  for i in range(6):
   a=i*math.pi/3;x,z=.72*math.sin(a),.72*math.cos(a)
   box('Artiglio testa',recoil,(x,2.00,z),(.44,.50,.42),M['steel'],.075,rotation=(0,a,0))
   box('Inserto artiglio',recoil,(x,2.264,z),(.27,.030,.24),M['dark'],.018,rotation=(0,a,0))
   for j in [-1,0,1]:
    xx=x+j*.047*math.cos(a);zz=z-j*.047*math.sin(a)
    box('Griglia artiglio',recoil,(xx,2.286,zz),(.021,.012,.15),M['amber'],.003,rotation=(0,a,0))
   # Segmenti della chiusura dell'iride, disegno geometrico sul metallo scuro.
   pts=[]
   for rr,aa in [(.03,a+.35),(.42,a),(.42,a+.93),(.19,a+1.20)]:pts.append((rr*math.sin(aa),2.099,rr*math.cos(aa)))
   mesh=bpy.data.meshes.new('Lamina iride');mesh.from_pydata(pts,[],[(0,1,2,3)]);mesh.update();o=bpy.data.objects.new('Lamina iride',mesh);bpy.context.collection.objects.link(o);finish(o,'Lamina iride',recoil,(0,0,0),M['joint'])
  muzzle.location.y=2.305
 if level>=1:
  box('Modulo posteriore raro',pitch,(0,-.77,.70),(.84,.80,.32),M['steel'],.065)
  grille(pitch,(0,-.77,.872),.55,.44,'Z',3)
  box('Cappello corazzato modulo',pitch,(0,-.83,.88),(.98,.67,.11),M['armor'],.040)
  for side in [-1,1]:
   box('Cornice luminosa modulo',pitch,(side*.40,-.83,.938),(.052,.44,.013),M['amber'],.003)
   box('Carter laterale modulo',pitch,(side*.53,-.69,.67),(.10,.68,.25),M['edge'],.025)
  cyl('Condensatore laterale',pitch,(.82,.25,-.25),.205,.96,M['joint'],'Y')
  for y in [-.19,.03,.25,.47,.69]:torus('Rivestimento condensatore',pitch,(.82,y,-.25),.208,.024,M['edge'],'Y')
  for z in [-.34,-.22]:box('Bobina a vista',pitch,(1.025,.25,z),(.018,.68,.055),M['amber'],.004)
  torus('Corona condensatore',pitch,(.82,.743,-.25),.17,.034,M['pulse'],'Y')
  cyl('Lente condensatore',pitch,(.82,.747,-.25),.10,.028,M['pulse'],'Y',32)
  box('Culla inferiore condensatore',pitch,(.81,.20,-.48),(.40,.82,.11),M['armor'],.020)
  for y in [-.02,.18,.38]:box('Striscia alimentazione condensatore',pitch,(.82,y,-.542),(.20,.050,.012),M['amber'],.002)
 if level>=2:
  for x in [-.25,0,.25]:
   cyl('Condotto epico',pitch,(x,.40,.43),.056,1.61,M['pulse'],'Y')
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
  # L'iride leggendaria della carta e' circondata da moduli separati, con
  # finestre luminose e parti scure in profondita' fra una ganascia e l'altra.
  armored_ring(recoil,1.95,.79,M['armor'],12,.12)
  torus('Alone periferico interno',recoil,(0,2.19,0),.61,.036,M['amber'],'Y')
  for i in range(6):
   a=i*math.tau/6;x,z=.84*math.sin(a),.84*math.cos(a)
   box('Luce radiale iride',recoil,(x,2.20,z),(.17,.038,.062),M['amber'],.004,rotation=(0,a,0))
   bolt(recoil,(.77*math.sin(a),2.309,.77*math.cos(a)),'Y',.022)
 for parent in [base,yaw,pitch,recoil]:merge_children(parent)
 # La posa di riposo e' applicata dal runtime; questi sono veri snodi locali.
 bpy.ops.object.select_all(action='DESELECT')
 for o in list(bpy.context.scene.objects):o.select_set(True)
 filename=DEST/(slug+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(filename),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_extras=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
 manifest.append({'rarity':slug,'file':str(filename.relative_to(ROOT)),'bytes':filename.stat().st_size,'joints':['BaseFixed','TurretYaw','ArmPitch','PistonRecoil','Muzzle']})
 print('MAGLIO_MODEL_OK',slug,filename.stat().st_size,flush=True)
(DEST/'manifest.json').write_text(json.dumps({'generator':'scripts/build-maglio-3d.py','units':'metri artistici','forward':'-Z in glTF','assets':manifest},indent=2)+'\n')
