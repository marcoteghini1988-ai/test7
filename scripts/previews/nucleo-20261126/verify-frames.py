"""Verifica i fronti e i pixel della cornice ufficiale rimasti immutati."""
import sys,json,hashlib,subprocess
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
root,out=map(Path,sys.argv[1:3])
manifest=json.loads((out/'manifest-carte.json').read_text())
slots=json.loads((root/'docs/riferimenti-carte/adesivi-slot-2026-11-24/manifest.json').read_text())['rendering']['centersPxAt3072Frame']
report=[]
for c in manifest['cards']:
    source=root/'docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24/arma-rosso'/f"{c['raritySlug']}.png"
    target=out/'carte-hd'/f"{c['id']}.png"
    base=Image.open(source).convert('RGBA');front=Image.open(target)
    assert front.size==(3072,4608) and front.mode=='RGBA'
    original=np.asarray(base);actual=np.asarray(front)
    allowed=np.asarray(Image.open(out/'maschere'/f"{c['raritySlug']}.png").getchannel('A'))>0
    for x1,y1,x2,y2 in [(690,365,2380,545),(1100,2870,1972,2980),(450,3160,2620,4050),(1120,4195,1952,4305)]:allowed[y1:y2+1,x1:x2+1]=True
    yy,xx=np.ogrid[:4608,:3072]
    for p in slots[c['raritySlug']].values():allowed|=(xx-p[0])**2+(yy-p[1])**2<185**2
    protected=(original[:,:,3]==255)&~allowed
    changed=int(np.count_nonzero(np.any(original!=actual,axis=2)&protected))
    assert changed==0,('Pixel cornice modificati',c['id'],changed)
    outside=base.getchannel('A').point(lambda x:0 if x<128 else 255)
    ImageDraw.floodfill(outside,(0,0),77)
    exterior=np.asarray(outside)==77
    assert np.array_equal(actual[:,:,3][exterior],original[:,:,3][exterior]),'Alfa esterna diversa dalla cornice originale'
    assert not np.any((actual[:,:,3]>0)&(original[:,:,3]==0)&exterior),'Compaiono nuovi pixel esterni alla cornice'
    art=Image.open(c['artPath'])
    report.append({'id':c['id'],'rarity':c['rarity'],'width':3072,'height':4608,'format':front.format,'mode':front.mode,
      'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,
      'originalIllustrationSize':list(art.size),'originalIllustrationSha256':hashlib.sha256(Path(c['artPath']).read_bytes()).hexdigest(),
      'frameGitBlob':subprocess.check_output(['git','hash-object',str(source)],cwd=root,text=True).strip(),
      'protectedFramePixelsVerified':int(np.count_nonzero(protected)),'changedProtectedFramePixels':changed,'outerAlphaMatchesOfficial':True,'newExteriorPixels':0})
(out/'verifica-fronti.json').write_text(json.dumps({'cards':report,'inGame':False,'finalVisualApproval':False},indent=2)+'\n')
print(json.dumps({'cards':len(report),'protectedFramePixelsUnchanged':True,'outerAlphaMatchesOfficial':True,'newExteriorPixels':0}))
