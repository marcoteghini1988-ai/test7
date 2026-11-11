// Non reinventa carte o disegni: corregge esclusivamente le etichette
// stampate negli SVG ufficiali usando gli ID e i nomi VERI del motore.
// Le versioni PNG vengono poi rigenerate dagli stessi SVG.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {SPECIAL_CARD_CATALOG} from '../src/specialCards.js';
import {officialSpecialVisualMeta} from '../src/officialSpecialVisualMeta.js';
import {isBossCharacterCard} from '../src/bossCharacterCards.js';
import {isPvpTerrain} from '../src/pvpTerrainCards.js';
import {isTacticalEpic} from '../src/tacticalEpicCards.js';

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;')
 .replaceAll('>','&gt;').replaceAll('"','&quot;');
const findTag=y=>new RegExp('(<text\\b[^>]*\\by="'+y+'"[^>]*>)([^<]*)(<\\/text>)');
let repaired=0,examined=0;
for(const [type,entry] of Object.entries(SPECIAL_CARD_CATALOG)){
 if(isPvpTerrain(type))continue; // Terreno: immagine ambiente, non una carta con testo.
 const folder=isBossCharacterCard(type)?'boss-characters':'special-cards';
 const file=resolve('public/assets',folder,type+'.svg');
 if(!existsSync(file))throw Error('SVG ufficiale mancante: '+type);
 let source=readFileSync(file,'utf8');
 const titleTag=findTag(619),roleTag=findTag(666);
 if(!titleTag.test(source)||!roleTag.test(source))
  throw Error('Etichette originali non riconosciute: '+type);
 const visual=officialSpecialVisualMeta(type);
 const title=isBossCharacterCard(type)?entry.name:entry.short||entry.name;
 const role=isBossCharacterCard(type)?'PERSONAGGIO BOSS':
  isTacticalEpic(type)?'OGGETTO EPICO':visual?.role||'SPECIALE';
 const font=title.length>23?15:title.length>19?17:20;
 const fixTag=(markup,replacement,y,fontSize)=>{
  const regex=findTag(y);
  return markup.replace(regex,(_whole,left,_old,right)=>
   left.replace(/font-size="\d+(?:\.\d+)?"/,'font-size="'+fontSize+'"')+
   esc(replacement.toLocaleUpperCase('it-IT'))+right);
 };
 const updated=fixTag(fixTag(source,title,619,font),role,666,role.length>16?16:20);
 examined++;
 if(updated!==source){writeFileSync(file,updated);repaired++;}
}
if(examined!==78)throw Error('Catalogo inatteso: '+examined+' carte con testo (attese 66+12)');
console.log('SVG etichette fedeli al catalogo: '+repaired+'/'+examined+' aggiornate');
