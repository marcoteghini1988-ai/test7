// Audit non distruttivo: elenca file sorgente non raggiunti dall'ingresso Vite.
// I candidati NON vanno eliminati automaticamente: possono essere usati da script,
// asset pipeline o accessi dinamici. Il check strutturale verifica gli import mancanti.
import {readdirSync,readFileSync,statSync} from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const src=path.join(root,'src');
function walk(directory,out=[]){
 for(const name of readdirSync(directory)){
  const full=path.join(directory,name);
  if(statSync(full).isDirectory())walk(full,out);
  else if(/\.(?:js|jsx|ts|tsx|css)$/.test(name))
   out.push(path.relative(root,full).replaceAll('\\','/'));
 }
 return out;
}
const sources=walk(src);
const sourceSet=new Set(sources);
function targetOf(source,raw){
 const clean=raw.split(/[?#]/)[0];
 const base=path.posix.normalize(path.posix.join(path.posix.dirname(source),clean));
 return [base,base+'.js',base+'.jsx',base+'.ts',base+'.tsx',base+'.css',
  base+'/index.js',base+'/index.ts'].find(p=>sourceSet.has(p));
}
const edges=new Map(),incoming=new Map();
for(const file of sources){
 const text=readFileSync(path.join(root,file),'utf8');
 // Una scansione conservativa di stringhe relative: include import/export,
 // dynamic import, CSS e alcune citazioni nei commenti per evitare falsi orfani.
 const deps=new Set();
 for(const match of text.matchAll(/['"`](\.\.?\/[^'"`\n]+)['"`]/g)){
  const target=targetOf(file,match[1]);
  if(target)deps.add(target);
 }
 edges.set(file,[...deps]);
 for(const dep of deps)incoming.set(dep,(incoming.get(dep)||0)+1);
}
function reachable(roots){
 const visited=new Set(),todo=[...roots];
 while(todo.length){
  const file=todo.pop();
  if(!sourceSet.has(file)||visited.has(file))continue;
  visited.add(file);
  for(const next of edges.get(file)||[])todo.push(next);
 }
 return visited;
}
const app=reachable(['src/main.tsx']);
const tests=reachable(sources.filter(p=>/\.test\.(?:js|jsx|ts|tsx)$/.test(p)));
const candidates=sources.filter(p=>!app.has(p)&&!/\.test\./.test(p)).sort();
const noIncoming=candidates.filter(p=>!incoming.has(p));
console.log('Audit moduli: '+sources.length+' sorgenti; '+app.size+
 ' raggiunti dalla app; '+tests.size+' raggiunti dai test.');
console.log('Candidati fuori dal percorso app ('+candidates.length+'):');
for(const p of candidates)
 console.log(' - '+p+(tests.has(p)?' [usato nei test]':'')+
  (incoming.has(p)?' [dipendenze interne: '+incoming.get(p)+']':' [nessun riferimento statico]'));
console.log('Senza riferimenti statici ('+noIncoming.length+'): '+noIncoming.join(', '));
// Nelle simulazioni newCombat un import nominato inutilizzato va eliminato.
// Conta i riferimenti locali (import incluso); non cambia i moduli di gioco.
const unusedNamedImports=[];
for(const file of sources.filter(p=>p.startsWith('src/newCombat/')&&p.endsWith('.js'))){
 const code=readFileSync(path.join(root,file),'utf8');
 for(const matched of code.matchAll(/\bimport\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/g)){
  for(const imported of matched[1].split(',')){
   const local=imported.trim().split(/\s+as\s+/).at(-1);
   if(!/^[A-Za-z_$][\w$]*$/.test(local))continue;
   const escaped=local.replace(/[^A-Za-z0-9_]/g,'\\$&');
   const mentions=(code.match(new RegExp('\\b'+escaped+'\\b','g'))||[]).length;
   if(mentions===1)unusedNamedImports.push(file+': '+local);
  }
 }
}
if(unusedNamedImports.length){
 console.error('Import nominati non utilizzati in newCombat: '+unusedNamedImports.join(', '));
 process.exitCode=1;
}

if(noIncoming.length){
 console.error('Preflight fallito: sorgenti isolati senza riferimenti, verificare e integrare o rimuovere:');
 for(const file of noIncoming)console.error(' - '+file);
 process.exitCode=1;
}

