// Aggiunge soltanto una pagina di revisione: nessun fronte entra nel gioco.
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const source='docs/collaudi/sonda-martello-2026-11-27/sonda-martello-b-anteprima.html';
const pack='docs/collaudi/sonda-martello-2026-11-27/preview-html-parts.json';
export async function prepareProbeHammerReview(){
 if(existsSync(source)){writeFileSync('.probe-hammer-review.html',readFileSync(source));return true;}
 if(!existsSync('.env.local'))return false;
 const env=readFileSync('.env.local','utf8');
 const ref=/^VITE_ASSET_ROOT\s*=\s*https:\/\/raw\.githubusercontent\.com\/marcoteghini1988-ai\/test7\/([a-f0-9]{40}|main)\/public\/assets\/?\s*$/m.exec(env)?.[1];
 if(!ref)return false;
 const remote='https://raw.githubusercontent.com/marcoteghini1988-ai/test7/'+ref+'/';
 const response=existsSync(pack)?null:await fetch(remote+pack,{signal:AbortSignal.timeout(20000)});
 if(response&&!response.ok)return false;
 const manifest=existsSync(pack)?JSON.parse(readFileSync(pack,'utf8')):await response.json();
 const pieces=await Promise.all(manifest.parts.map(async p=>{
  if(!/^asset-sources\/weapon-previews\/sonda-martello-2026-11-27\/review-html\.part-\d{3}$/.test(p.path))throw Error('Percorso anteprima non valido');
  const r=await fetch(remote+p.path,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Parte anteprima non disponibile');
  const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length!==p.bytes||createHash('sha256').update(bytes).digest('hex')!==p.sha256)throw Error('Parte anteprima non integra');return bytes;
 }));
 const bytes=Buffer.concat(pieces);if(bytes.length!==manifest.bytes||createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('Anteprima non integra');
 const html=bytes.toString('utf8');if(!html.includes('PROBE_HAMMER_REVIEW'))throw Error('Anteprima Sonda/Martello non valida');
 writeFileSync('.probe-hammer-review.html',html);return true;
}
