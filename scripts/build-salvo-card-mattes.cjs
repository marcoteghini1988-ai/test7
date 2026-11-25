// Copies only the clean statistics backgrounds from the four official HD
// frames. Runtime vector labels replace 1 SHOT / BASE DAMAGE without
// changing the approved illustration, symbols or frame.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'public/assets/fleet-card-marks');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 for(const rarity of ['comune','rara','epica','leggendaria']){
  const base=path.join(root,'docs/riferimenti-carte/basi-rarita-ufficiali-2026-11-24',rarity+'.png');
  const damage=await sharp(base).extract({left:640,top:3488,width:800,height:130}).png().toBuffer();
  const shots=await sharp(base).extract({left:1850,top:3850,width:640,height:170}).png().toBuffer();
  await sharp({create:{width:1440,height:170,channels:4,background:'#00000000'}})
   .composite([{input:damage,left:0,top:0},{input:shots,left:800,top:0}])
   .png({compressionLevel:9}).toFile(path.join(out,'salvo-'+rarity+'.png'));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
