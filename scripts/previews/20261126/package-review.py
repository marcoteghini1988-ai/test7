"""Tavole leggibili e pacchetti PNG senza modificare gli asset del gioco."""
import json,sys,hashlib,zipfile,textwrap
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageChops
root,out=map(Path,sys.argv[1:3]);manifest=json.loads((out/'manifest-carte.json').read_text());cards=manifest['cards']
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';F=lambda n:ImageFont.truetype(font,n)
roles={
'gravity-maul':'Una sequenza di 2 / 3 / 5 / 7 martelli rotanti. Un solo bersaglio, danno totale ripartito.',
'steel-rail':'Una sola palla per attivazione in ogni rarità. Cambiano danno, finiture e dettagli fisici.',
'thermal-reclaimer':'Due turni propri. 3 granate di base, 6 se potenziata dagli HP realmente persi dopo la posa.',
'magnetic-grapple':'Ganascia A: aggancio e tensione, strappo finale al terzo turno proprio. Valore dello strappo da fissare.',
'alloy-collision':'Ganascia B autonoma. Con A: scontro fra due navi oppure madre contro il piano. Danni e durata da fissare.',
'induction':'Lame rotanti. 1 Energia supera una Difesa, 2 la rimuovono; non si consumano. Bonus senza Difese da fissare.',
'cascade-piercer':'Tre turni propri. Dal relitto nasce un nuovo residuo; solo eccesso valido e 1 Energia per ogni trasferimento.',
'wandering-shrapnel':'3 / 6 / 9 schegge su un bersaglio. Due turni propri, sceglie un altro bersaglio vivo quando possibile.',
'ionic-comb':'Cinque archetti si uniscono in una sola scarica. Impatto elettrico con griglia sottile.',
'ionic-dart':'Un dardo blu e violetto avvolto da due spirali di scintille. Un solo impatto.',
'ionic-whip':'Una frustata elettrica a zig-zag che si chiude sulla corazza. Un solo impatto.',
'ionic-flash':'Un lampo bianco rettilineo molto rapido. La famiglia parte dalla Rara.'}
rarities=['Comune','Rara','Epica','Leggendaria'];skip='--packages-only' in sys.argv;validation=json.loads((out/'verifica-fronti.json').read_text())['cards'] if skip else []
for c in ([] if skip else cards):
 p=out/'carte-hd'/f"{c['id']}.png";im=Image.open(p);base=Image.open(root/'docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24'/f"{c['raritySlug']}.png")
 assert im.size==(3072,4608) and im.mode=='RGBA',(p,im.size,im.mode)
 a=im.getchannel('A');b=base.getchannel('A')
 for box in [(0,0,60,4608),(3012,0,3072,4608),(0,0,3072,30),(0,4578,3072,4608)]:assert ImageChops.difference(a.crop(box),b.crop(box)).getbbox() is None,('bordo esterno',p)
 validation.append({'id':c['id'],'size':[3072,4608],'rgba':True,'outerAlphaMatchesOriginal':True,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size,'mechanicsPending':c['mechanicsPending']})
families=list(dict.fromkeys(c['familyId'] for c in cards))
for element,title,filename in ([] if skip else [('ionic','FULMINE · 15 VARIANTI','Carte_Fulmine_15_varianti.png'),('metallic','METALLO · 22 VARIANTI','Carte_Metallo_22_varianti.png')]):
 chosen=[f for f in families if any(c['familyId']==f and c['elementId']==element for c in cards)]
 W=1600;row=650;image=Image.new('RGB',(W,140+row*len(chosen)),'#0c1420');draw=ImageDraw.Draw(image)
 draw.text((32,22),title,font=F(34),fill='#eff6fb');draw.text((32,73),'ANTEPRIME DA APPROVARE · cornici originali · PNG completi 3072 × 4608',font=F(21),fill='#9ab2c8')
 for j,f in enumerate(chosen):
  cs=[c for c in cards if c['familyId']==f];top=140+j*row
  draw.text((32,top),cs[0]['name'],font=F(26),fill='#e6c99a')
  for k,line in enumerate(textwrap.wrap(roles[cs[0]['kind']],115)):draw.text((32,top+36+k*23),line,font=F(18),fill='#b8ccdc')
  for c in cs:
   col=rarities.index(c['rarity']);im=Image.open(out/'carte-hd'/f"{c['id']}.png");im.thumbnail((350,525),Image.Resampling.LANCZOS)
   image.paste(im,(col*400+25,top+91),im);draw.text((col*400+32,top+615),c['rarity'],font=F(19),fill='#c8d7e4')
 image.save(out/filename,compress_level=4)
notes='''ECLISSI STELLARE — ANTEPRIME 26 NOVEMBRE 2026

37 varianti, 12 famiglie: 22 Metallo e 15 Fulmine.
20 illustrazioni nuove o rifinite: le 15 Fulmine e le 5 varianti delle Ganasce A/B.
Gli altri disegni Metallo sono conservati e il pannello aggiornato alla nuova coreografia.
Tutti i fronti sono PNG RGBA 3072×4608; la risoluzione nativa delle illustrazioni centrali è 1448×1086 o 1536×1024, composta nelle cornici originali HD.

Questi file NON sono inseriti nel gioco. Serve conferma visiva di carte ed effetti.
I video sono animazioni offline a 30 fps con audio sincronizzato, NON registrazioni StackBlitz. La vibrazione fisica non è verificata; i pattern sono definiti per la successiva integrazione.
Gli effetti Metallo/Fulmine usano gli eventi del motore con coreografie candidate. Le Ganasce sono storyboard espliciti: non applicano danni inventati.

PARAMETRI ANCORA APERTI
- Ganasce: nomi e rarità definitivi, danno T3 di A, durata di B, finestra e danno della combo, stato dei ganci dopo l'urto.
- Frantumatore: valore e limite del bonus danno quando non ci sono Difese. La relativa prova mostra il danno base e segnala il bonus da fissare.
- Nella prova isolata è corretto il bypass del Frantumatore: la Difesa superata resta, quella rimossa va agli scarti. Questa correzione NON è nel gioco attivo.

RIMANENTI FULMINE DA RICONCILIARE
Il catalogo contiene Cannone a Nucleo di Folgore Crescente, Sonda Ionica d’Assalto, Martello del Tuono, Lancia del Comando Ionico, Cannone Condensatore della Tempesta Stellare e Cannone del Giudizio Temporale. Nove nomi diversi compaiono nelle proposte parlate: non sono stati trasformati in carte nuove né associati arbitrariamente a queste sei meccaniche. Sono inoltre presenti tre Acceleratori Trifase nella sezione di sequenza: non appartengono a questo primo gruppo visivo e non sono stati confusi con le nove proposte parlate.

Prima dell'inserimento: conferma delle immagini e dei video, chiusura dei parametri aperti, integrazione nel solo test7/main e collaudo visivo nel gioco.
'''
(out/'LEGGIMI_anteprime.txt').write_text(notes)
(out/'verifica-fronti.json').write_text(json.dumps({'cards':validation,'count':len(cards),'activeGameAssetsChanged':False},indent=2))
groups={
 'Metallo_Salve_10_carte_HD.zip':['gravity-maul','steel-rail','thermal-reclaimer'],
 'Metallo_Speciali_7_carte_HD.zip':['induction','cascade-piercer','wandering-shrapnel'],
 'Ganasce_A_B_5_carte_HD.zip':['magnetic-grapple','alloy-collision'],
 'Fulmine_Pettine_Tesla_8_carte_HD.zip':['ionic-comb','ionic-dart'],
 'Fulmine_Sferzatore_Lampo_7_carte_HD.zip':['ionic-whip','ionic-flash']}
for filename,kinds in groups.items():
 chosen=[c for c in cards if c['kind'] in kinds];package=[]
 with zipfile.ZipFile(out/filename,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=2,allowZip64=True)as z:
  z.write(out/'LEGGIMI_anteprime.txt','LEGGIMI_anteprime.txt')
  for c in chosen:
   z.write(out/'carte-hd'/f"{c['id']}.png",f"carte-hd/{c['id']}.png")
   item={k:v for k,v in c.items() if k!='artPath'};item['artPath']=None
   if not c['existingFront']:
    name=Path(c['artPath']).name;z.write(c['artPath'],'illustrazioni/'+name);item['artPath']='illustrazioni/'+name
   package.append(item)
  z.writestr('manifest.json',json.dumps({'status':'in attesa di conferma visiva','cards':package,'hashes':[v for v in validation if any(c['id']==v['id'] for c in chosen)]},ensure_ascii=False,indent=2))
 print(filename,round((out/filename).stat().st_size/1048576,1),'MiB',flush=True)
print('VALIDATED',len(cards),'fronti, cornici esterne invariate',flush=True)
