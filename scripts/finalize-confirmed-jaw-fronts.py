"""Aggiorna i sette pannelli confermati conservando i PNG approvati fuori dal pannello.
Le cinque Ganasce usano i fronti approvati con i nuovi disegni; l'Induzione
mantiene i due disegni già attivi. Nessuna rigenerazione delle illustrazioni.
"""
from pathlib import Path
import hashlib,json,sys
from PIL import Image,ImageChops
ROOT=Path(__file__).resolve().parent.parent
BOX=(300,3050,2772,4140)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    work=Path(sys.argv[1]);cards=json.loads((work/'manifest-carte.json').read_text())['cards'];rows=[]
    assert len(cards)==7
    for c in cards:
        relative=Path('public/assets/fleet-weapon-fronts-red')/(c['id']+'.png');dest=ROOT/relative
        approved=Path(c.get('approvedFrontPath') or dest)
        before=Image.open(approved).convert('RGBA');candidate=Image.open(work/'fronti-arancio'/(c['id']+'.png')).convert('RGBA')
        assert before.size==candidate.size==(3072,4608)
        previous=sha(dest);approval_hash=sha(approved)
        result=before.copy();result.paste(candidate.crop(BOX),BOX);result.putalpha(before.getchannel('A'))
        delta=ImageChops.difference(result,before).convert('RGB');box=delta.getbbox()
        assert box is None or (box[0]>=BOX[0] and box[1]>=BOX[1] and box[2]<=BOX[2] and box[3]<=BOX[3])
        assert ImageChops.difference(result.getchannel('A'),before.getchannel('A')).getbbox() is None
        result.save(dest,format='PNG',compress_level=6)
        assert ImageChops.difference(Image.open(dest).convert('RGBA'),result).getbbox() is None
        rows.append({'id':c['id'],'familyId':c['familyId'],'rarity':c['rarity'],'elementId':'metallic','kind':c['kind'],
         'path':str(relative),'sha256':sha(dest),'bytes':dest.stat().st_size,'dimensions':[3072,4608],
         'sourceApprovalSha256':approval_hash,'previousActiveSha256':previous,'outsidePanelUnchanged':True,
         'alphaUnchanged':True,'protectedTextAndSymbolsUnchanged':True,'mechanicsConfirmed':'3 own turns A/B; induction 20/40 cap'})
        print(c['id'],dest.stat().st_size,flush=True)
    (work/'asset-manifest.json').write_text(json.dumps(rows,indent=2))
if __name__=='__main__':main()
