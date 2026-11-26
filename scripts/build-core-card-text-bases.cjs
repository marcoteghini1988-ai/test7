// Recupera i fondi originali dietro le scritte; non rigenera le illustrazioni.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('sharp');sharp.cache(false);sharp.concurrency(2);
const root=path.resolve(__dirname,'..'),family='weapon-designed-ionic-nucleo-folgore';
const source=path.join(root,'asset-sources/card-text/nucleo-folgore');
const out=path.join(root,'public/assets/fleet-weapon-fronts');fs.mkdirSync(out,{recursive:true});
const rects=[{left:680,top:350,width:1710,height:210},{left:1090,top:2855,width:892,height:140},
 {left:440,top:3140,width:2195,height:930},{left:1110,top:4180,width:852,height:140}];
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const gitHash=bytes=>crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
(async()=>{
 const report=[];
 for(const [slug,suffix]of [['rara',''],['epica','-rarity-e'],['leggendaria','-rarity-l']]){
  const id=family+suffix,legacy=fs.readFileSync(path.join(source,'legacy-text',id+'.svg'));
  const decoration=Buffer.from(legacy.toString().replace(/<text\b[^>]*>[\s\S]*?<\/text>/g,''));
  if(/<text\b/.test(decoration.toString()))throw Error('Testo rimasto nella base');
  const stat=await sharp(path.join(root,'docs/riferimenti-carte/adesivi-slot-2026-11-24/elementi/fulmine.png')).resize(170,170).toBuffer();
  const clean=await sharp(path.join(root,'docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24/arma-rosso',slug+'.png'))
   .composite([{input:decoration,left:0,top:0},{input:stat,left:612,top:3267}]).png().toBuffer();
  const original=await sharp(path.join(out,id+'.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const background=await sharp(clean).ensureAlpha().raw().toBuffer();
  // Sostituzione RGBA, non sovrapposizione: conserva le semitrasparenze
  // originali ed evita un rettangolo più opaco dietro alle nuove scritte.
  for(const r of rects)for(let y=r.top;y<r.top+r.height;y++){
   const start=(y*3072+r.left)*4; background.copy(original.data,start,start,start+r.width*4);
  }
  const base=await sharp(original.data,{raw:original.info}).png({compressionLevel:9,adaptiveFiltering:true}).toBuffer();
  fs.writeFileSync(path.join(out,id+'-text-base.png'),base);
  const parts=[];for(let offset=0;offset<base.length;offset+=6000000){
   const data=base.subarray(offset,offset+6000000),name=id+'-text-base.part-'+String(parts.length+1).padStart(3,'0');
   fs.writeFileSync(path.join(source,name),data);parts.push({name,offset,bytes:data.length,sha256:hash(data),blobSha:gitHash(data)});
  }
  report.push({id,rarity:slug,path:'public/assets/fleet-weapon-fronts/'+id+'-text-base.png',bytes:base.length,sha256:hash(base),blobSha:gitHash(base),parts,dimensions:[3072,4608],
   originalFrontSha256:hash(fs.readFileSync(path.join(root,'public/assets/fleet-weapon-fronts',id+'.png'))),regions:rects});
 }
 fs.writeFileSync(path.join(source,'manifest.json'),JSON.stringify({familyId:family,method:'original-frame-background-and-original-vector-decoration',artworkRegenerated:false,defaultLocale:'en',cards:report},null,2)+'\n');
 console.log(JSON.stringify(report.map(c=>({id:c.id,bytes:c.bytes,sha256:c.sha256}))));
})().catch(e=>{console.error(e);process.exitCode=1;});
