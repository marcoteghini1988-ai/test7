"""24 viste fisiche per rarità, stessi volumi del renderer in partita."""
import sys,json,math
from pathlib import Path

if '--pack' in sys.argv:
 from PIL import Image
 work,dest=map(Path,sys.argv[-2:]);dest.mkdir(parents=True,exist_ok=True)
 for tier in range(4):
  atlas=Image.new('RGBA',(384*3,480*8))
  for end in range(2):
   for level in range(4):
    row=end*4+level
    for col in range(3):
     source=work/f'{tier}-{end*3+level}-{col}.png' if level<3 else work/f'extra-{tier}-{end}-{col}.png'
     atlas.paste(Image.open(source),(col*384,row*480))
  atlas.save(dest/f'perspective-{tier}.png',optimize=True)
  print('ATLAS_OK',tier,(dest/f'perspective-{tier}.png').stat().st_size,flush=True)
 (dest/'perspective-manifest.json').write_text(json.dumps({
  'generator':'scripts/build-maglio-projectile-atlas.mjs','renderer':'Blender Cycles CPU',
  'model':'src/maglioProjectile3D.js','tileWidth':384,'tileHeight':480,'orthographicHeight':3,
  'columns':[-24,0,24],'rows':[
   {'end':end,'elevation':e} for end in ['rear','front'] for e in [28,42,56,70]],
  'files':[f'perspective-{tier}.png' for tier in range(4)],
  'cameraUp':[0,1,0],'modelForward':[0,0,-1]
 },indent=2)+'\n')
 sys.exit(0)

import bpy
from mathutils import Matrix,Vector
work,dest=map(Path,sys.argv[-2:]);extra='--extra' in sys.argv
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False
scene.render.resolution_x=384;scene.render.resolution_y=480;scene.render.resolution_percentage=100
scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.world.color=(.23,.23,.23);scene.view_settings.view_transform='AgX'
def linear(h):
 c=int(h,16)/255;return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def rgb(h):return tuple(linear(h[i:i+2]) for i in [0,2,4])
materials={}
def material(d):
 if d['name'] in materials:return materials[d['name']]
 m=bpy.data.materials.new(d['name']);m.use_nodes=True;n=m.node_tree.nodes;p=n.get('Principled BSDF')
 p.inputs['Base Color'].default_value=(*rgb(d['color']),1)
 p.inputs['Metallic'].default_value=d['metalness'];p.inputs['Roughness'].default_value=d['roughness']
 p.inputs['Emission Color'].default_value=(*rgb(d['emissive']),1);p.inputs['Emission Strength'].default_value=d['intensity']
 if d['intensity']==0:
  noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=95;noise.inputs['Detail'].default_value=2
  ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].color=(.22,.22,.22,1);ramp.color_ramp.elements[1].color=(.48,.48,.48,1)
  m.node_tree.links.new(noise.outputs['Fac'],ramp.inputs[0]);m.node_tree.links.new(ramp.outputs['Color'],p.inputs['Roughness'])
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.14;bump.inputs['Distance'].default_value=.012
  m.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],p.inputs['Normal'])
 materials[d['name']]=m;return m
collections=[]
for tier in range(4):
 collection=bpy.data.collections.new('Rarita'+str(tier));scene.collection.children.link(collection);collections.append(collection)
 for obj in json.loads((work/f'model-{tier}.json').read_text()):
  pos=obj['position'];vs=[pos[i:i+3] for i in range(0,len(pos),3)];idx=obj['index'] or list(range(len(vs)))
  mesh=bpy.data.meshes.new(obj['name']);mesh.from_pydata(vs,[],[idx[i:i+3] for i in range(0,len(idx),3)]);mesh.update()
  normal=obj['normal'];ns=[normal[i:i+3] for i in range(0,len(normal),3)]
  for p in mesh.polygons:p.use_smooth=True
  mesh.normals_split_custom_set([ns[i] for i in idx])
  o=bpy.data.objects.new(obj['name'],mesh);collection.objects.link(o)
  a=obj['matrix'];o.matrix_world=Matrix([[a[col*4+row] for col in range(4)] for row in range(4)])
  o.data.materials.append(material(obj['material']))
 collection.hide_render=True
for loc,power,size,color in [((-3,5,4),850,4,(1,.91,.79)),((4,2,-4),1000,3,(.68,.81,1)),
 ((-4,-1,-1),400,2,(1,.75,.48)),((0,5,-.5),650,3,(1,1,1))]:
 data=bpy.data.lights.new('Studio','AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
 o=bpy.data.objects.new('Studio',data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
c=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',c);scene.collection.objects.link(cam);scene.camera=cam;c.type='ORTHO';c.ortho_scale=3.0
for tier in range(4):
 collections[tier].hide_render=False
 for end in range(2):
  for level,elevation in enumerate([70] if extra else [28,42,56]):
   for col,offset in enumerate([-24,0,24]):
    az=math.radians(end*180+offset);el=math.radians(elevation)
    cam.location=(6*math.sin(az)*math.cos(el),6*math.sin(el),6*math.cos(az)*math.cos(el))
    right=Vector((math.cos(az),0,-math.sin(az)));back=cam.location.normalized();up=back.cross(right)
    cam.rotation_euler=Matrix((right,up,back)).transposed().to_euler()
    name=f'extra-{tier}-{end}-{col}.png' if extra else f'{tier}-{end*3+level}-{col}.png'
    scene.render.filepath=str(work/name);bpy.ops.render.render(write_still=True)
    print('VIEW_OK',tier,end,level,col,flush=True)
 collections[tier].hide_render=True
