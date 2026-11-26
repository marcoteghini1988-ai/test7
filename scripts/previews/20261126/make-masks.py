"""Fori delle cornici originali, senza modificare il bordo esterno."""
import sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter
root,out=map(Path,sys.argv[1:3]);(out/'maschere').mkdir(exist_ok=True)
for rarity in ['comune','rara','epica','leggendaria']:
    im=Image.open(root/'docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24'/f'{rarity}.png').convert('RGBA')
    a=im.getchannel('A');regions=a.point(lambda x:0 if x<128 else 255)
    ImageDraw.floodfill(regions,(1536,1745),128,thresh=0)
    region=regions.point(lambda x:255 if x==128 else 0).filter(ImageFilter.MaxFilter(7))
    import PIL.ImageChops as C
    mask=C.multiply(region,a.point(lambda x:255-x))
    # Il foro trasparente centrale è pieno nell'immagine, il bordo conserva l'antialias.
    layer=Image.new('RGBA',im.size,'white');layer.putalpha(mask);layer.save(out/'maschere'/f'{rarity}.png')
    print(rarity,mask.getbbox())
