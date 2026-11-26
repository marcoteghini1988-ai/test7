"""Inserisce solo i 32 fronti confermati; conserva arte/alpha del Metallo attivo.
Input: cartella delle anteprime recuperate, composizioni e maschere del testo.
Le nuove Ganasce restano escluse. Nessun parametro di combattimento viene scelto.
"""
from pathlib import Path
import hashlib,json,sys
import numpy as np
from PIL import Image,ImageFilter
ROOT=Path(__file__).resolve().parent.parent
BOX=(300,3050,2772,4140)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    work=Path(sys.argv[1]);manifest=json.loads((work/'manifest-carte.json').read_text());rows=[]
    for c in manifest['cards']:
        assert c['kind'] not in ('magnetic-grapple','alloy-collision')
        name=c['id']+'.png';metal=c['elementId']=='metallic'
        if metal:source=work/'fronti-arancio'/name
        else:
            matches=list((work/'approvate').glob('*/carte-hd/'+name));assert len(matches)==1
            source=matches[0]
        im=Image.open(source).convert('RGBA');assert im.size==(3072,4608)
        a=np.array(im);x0,y0,x1,y1=BOX;panel=a[y0:y1,x0:x1];rgb=panel[:,:,:3].astype(np.int16);red,green,blue=[rgb[:,:,i]for i in range(3)]
        chroma=red-blue;orange=(red>=green)&(green>blue+3)&(chroma>=15)&(green-blue>=chroma*.14)&(green-blue<=chroma*.92)&(chroma>=red*.18)&(panel[:,:,3]>=248)
        ink=Image.open(work/'maschere-testo'/name).convert('L').point(lambda x:255 if x>1 else 0).filter(ImageFilter.MaxFilter(7));protected=np.array(ink)[y0:y1,x0:x1]>0
        # Il simbolo elemento è un PNG separato dal livello SVG del testo.
        protected[3260-y0:3445-y0,600-x0:800-x0]=True
        change=orange&~protected
        already_red=int(((red>blue+15)&(green-blue<(red-blue)*.14)).sum())>500000
        assert change.sum()>1000 or already_red,(c['id'],int(change.sum()))
        if already_red:change[:]=False
        out=a.copy();out[y0:y1,x0:x1,1][change]=np.round(blue+.16*(green-blue))[change].astype(np.uint8)
        assert np.array_equal(a[y0:y1,x0:x1][protected],out[y0:y1,x0:x1][protected])
        relative=Path('public/assets')/('fleet-weapon-fronts-red'if metal else'fleet-weapon-fronts')/name
        dest=ROOT/relative;dest.parent.mkdir(parents=True,exist_ok=True)
        before=None
        if metal:
            before=np.array(Image.open(dest).convert('RGBA'));before_hash=sha(dest)
            # Fuori dal pannello: ogni pixel della carta già in gioco resta identico.
            final=before.copy();final[y0:y1,x0:x1]=out[y0:y1,x0:x1];final[:,:,3]=before[:,:,3];out=final
        else:before_hash=None
        Image.fromarray(out,'RGBA').save(dest,format='PNG',compress_level=6)
        check=np.array(Image.open(dest).convert('RGBA'));assert np.array_equal(out,check)
        if metal:
            diff=np.any(check!=before,axis=2);assert not diff[:y0].any()and not diff[y1:].any()and not diff[:,:x0].any()and not diff[:,x1:].any()
            assert np.array_equal(check[:,:,3],before[:,:,3])
        else:
            diff=np.any(check!=a,axis=2);assert not diff[:y0].any()and not diff[y1:].any()and not diff[:,:x0].any()and not diff[:,x1:].any()
            assert np.array_equal(check[:,:,3],a[:,:,3])
        rows.append({'id':c['id'],'familyId':c['familyId'],'rarity':c['rarity'],'elementId':c['elementId'],'kind':c['kind'],'path':str(relative),'sha256':sha(dest),'bytes':dest.stat().st_size,'dimensions':[3072,4608],'sourceApprovalSha256':sha(source),'previousActiveSha256':before_hash,'outsidePanelUnchanged':True,'alphaUnchanged':True,'protectedTextAndSymbolsUnchanged':True})
        print(c['id'],dest.stat().st_size,flush=True)
    assert len(rows)==32
    (work/'asset-manifest.json').write_text(json.dumps(rows,indent=2))
    print('32 fronti completi inseriti e verificati',flush=True)
if __name__=='__main__':main()
