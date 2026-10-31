import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const critical=['index.html','package.json','src/main.tsx','src/App.tsx','src/ClassicBattleView.jsx','src/mathCombatEngine.js'];
const missing=critical.filter(f=>!existsSync(path.join(root,f)));
if(missing.length){console.error('Mancano file necessari:',missing.join(', '));process.exit(1);}
const refs=[];
function walk(dir){for(const name of readdirSync(dir)){const full=path.join(dir,name);if(statSync(full).isDirectory()){walk(full);continue;}if(!/\.(jsx?|tsx?)$/.test(name))continue;const content=readFileSync(full,'utf8');for(const m of content.matchAll(/(?:from\s*|import\s*\(|import\s*)['"](\.[^'"]+)['"]/g)){
 const abs=path.resolve(path.dirname(full),m[1]);
 if(![abs,abs+'.js',abs+'.jsx',abs+'.ts',abs+'.tsx',abs+'.css',abs+'.json',path.join(abs,'index.js')].some(existsSync))refs.push(`${path.relative(root,full)} -> ${m[1]}`);
}}}
walk(path.join(root,'src'));
if(refs.length){console.error('Riferimenti locali non risolti:',refs.join('\n'));process.exit(1)}
console.log('Struttura React/Vite OK: file fondamentali e import locali presenti.');
