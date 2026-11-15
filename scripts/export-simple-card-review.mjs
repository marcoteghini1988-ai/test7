// Esporta un catalogo leggibile offline; le descrizioni arrivano dalle regole reali.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,cardRole} from '../src/fleetNext/rules.js';
import {describeEffect,SIMPLE_RULES} from '../src/fleetNext/simpleEffects.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const destination=process.argv[2];
if(!destination)throw new Error('Indica il percorso HTML di destinazione.');
const read=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const general=read('docs/card-simplification-general.json');
const exclusive=read('docs/card-simplification-exclusive.json');
const original=new Map([...general.cards.map(c=>[c.id,c.before]),...exclusive.cards.map(c=>[c.id,c.before.effect])]);
const cards=[...Object.values(GENERAL_CARDS),...Object.values(EXCLUSIVE_CARDS),...Object.values(BOSS_CARDS)].map(c=>({
 id:c.id,name:c.nome||c.name,rarity:c.rarita||c.rarityDraft,
 pool:c.pool==='boss'?'boss':c.shipId?'exclusive':'general',
 ship:c.shipName||'',role:cardRole(c.id),action:c.effectSpec.type,
 before:original.get(c.id)||c.previousEffect,
 after:describeEffect(c),grades:[1,2,3].map(level=>describeEffect(c,level))
}));
const words=s=>s.trim().split(/\s+/).length;
const stats={cards:cards.length,beforeWords:cards.reduce((s,c)=>s+words(c.before),0),
 afterWords:cards.reduce((s,c)=>s+words(c.after),0),maxWords:Math.max(...cards.map(c=>words(c.after)))};
if(cards.length!==391||cards.some(c=>!c.before||!c.after))throw new Error('Catalogo incompleto');
stats.reductionPercent=Math.round(100*(1-stats.afterWords/stats.beforeWords));
const data=JSON.stringify({cards,rules:SIMPLE_RULES,stats,commit:process.env.ECLISSI_REVIEW_COMMIT||'main'}).replaceAll('<','\\u003c');
const html=String.raw`<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Eclissi Stellare · 391 carte semplificate</title>
<style>
:root{color-scheme:dark;--bg:#07111e;--panel:#101e30;--line:#2d415a;--text:#edf5ff;--muted:#a8bad1;--accent:#75d9ed}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif}main{max-width:1240px;margin:auto;padding:34px 24px 70px}header{padding-bottom:24px;border-bottom:1px solid var(--line)}.eyebrow{color:var(--accent);font-weight:750;letter-spacing:.14em;font-size:12px}h1{font-size:clamp(30px,5vw,48px);line-height:1.15;max-width:850px;margin:13px 0 18px}header p{max-width:850px;color:var(--muted);margin:8px 0}.stats{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}.stat{padding:13px 18px;background:var(--panel);border:1px solid var(--line);border-radius:10px;min-width:165px}.stat b{font-size:25px;display:block}.stat span{color:var(--muted);font-size:12px}details.rules{margin:24px 0;padding:14px 18px;border:1px solid var(--line);border-radius:10px;background:#0b1929}summary{cursor:pointer;font-weight:650}li{margin:7px 0}.filters{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:12px;margin:26px 0 10px}label{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--muted)}input,select{background:#0d1d30;color:var(--text);padding:11px 12px;border:1px solid #42617f;border-radius:7px;font:inherit;font-size:14px;width:100%}input:focus,select:focus{outline:2px solid var(--accent);outline-offset:2px}.options{display:flex;gap:15px;flex-wrap:wrap;align-items:end;margin:14px 0 24px}.options label{min-width:190px}.options .check{flex-direction:row;align-items:center;margin-left:auto}.check input{width:18px;height:18px}#count{margin:0 0 18px;color:var(--muted);font-size:14px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.card{border:1px solid var(--line);border-top:3px solid var(--role);background:var(--panel);border-radius:10px;padding:18px;min-width:0}.meta{display:flex;gap:8px;justify-content:space-between;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.04em}.card h2{font-size:19px;line-height:1.3;margin:12px 0 7px}.ship{font-size:12px;color:var(--muted);min-height:19px}.effect{font-size:17px;line-height:1.5;margin:15px 0 18px;color:#fff}.tag{font-size:11px;color:var(--role);border:1px solid var(--line);padding:4px 8px;border-radius:12px;display:inline-block}.before{border-top:1px solid var(--line);margin-top:15px;padding-top:12px;font-size:13px;color:var(--muted)}.before summary{font-size:12px}.before p{margin:10px 0 0}.empty{padding:35px;text-align:center;color:var(--muted)}footer{border-top:1px solid var(--line);margin-top:35px;padding-top:18px;color:var(--muted);font-size:12px}a{color:var(--accent)}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.filters{grid-template-columns:1fr 1fr}}
@media(max-width:560px){main{padding:24px 16px 45px}.grid{grid-template-columns:1fr}.filters{grid-template-columns:1fr 1fr}.filters label:first-child{grid-column:1/-1}.options .check{margin:0}.stat{flex:1;min-width:130px}.effect{font-size:17px}}
@media print{body{background:white;color:black}.filters,.options{display:none}.grid{grid-template-columns:1fr 1fr}.card{background:white;color:black;break-inside:avoid}.effect{color:black}.meta,.ship,.before,footer,header p{color:#444}.rules{display:none}.stat{background:white}.tag{color:#333}a{color:#222}}
</style></head><body><main>
<header><div class="eyebrow">ECLISSI STELLARE · REVISIONE DELLE CARTE</div><h1>Effetti brevi, bersagli chiari.</h1>
<p>Tutte le 391 carte: 250 generali, 129 esclusive delle navicelle e 12 Personaggi Boss. Ogni testo corrisponde a un effetto eseguito dal gioco. Le carte mantengono nomi, identità e rarità; due fusioni di cura sono ora classificate come Supporto.</p>
<div class="stats"><div class="stat"><b>391 / 391</b><span>CARTE INCLUSE</span></div><div class="stat"><b id="reduction"></b><span>PAROLE IN MENO</span></div><div class="stat"><b id="maximum"></b><span>PAROLE NEL TESTO PIÙ LUNGO</span></div><div class="stat"><b>15 azioni</b><span>REGOLE COMUNI</span></div></div></header>
<details class="rules"><summary>Le regole comuni, in poche frasi</summary><ul id="rules"></ul></details>
<section aria-label="Filtri del catalogo"><div class="filters">
<label>Cerca per nome, ID o effetto<input id="query" type="search" placeholder="Es. protegge, ripara, Fenice…"></label>
<label>Catalogo<select id="pool"><option value="">Tutte le carte</option value="general">250 generali</option><option value="exclusive">129 esclusive</option><option value="boss">12 Personaggi Boss</option></select></label>
<label>Ruolo<select id="role"><option value="">Tutti i ruoli</option value="attack">Attacco</option><option value="defense">Difesa</option><option value="support">Supporto e Controllo</option><option value="character">Personaggio</option><option value="terrain">Terreno</option></select></label>
<label>Navicella<select id="ship"><option value="">Tutte le navicelle</option></select></label></div>
<div class="options"><label>Testi delle esclusive<select id="grade"><option value="1">Grado 1</option><option value="2">Grado 2</option><option value="3">Grado 3</option></select></label><label class="check"><input type="checkbox" id="showBefore">Apri tutti i testi precedenti</label></div></section>
<p id="count" role="status" aria-live="polite"></p><section id="cards" class="grid" aria-label="Carte ed effetti"></section>
<footer>Revisione del 15 novembre 2026. I Personaggi Boss restano premi delle rispettive vittorie; le esclusive mantengono i requisiti della navicella. Le 39 nuove illustrazioni Difesa restano in attesa di approvazione. <a id="source" target="_blank" rel="noopener">Codice del progetto</a>.</footer>
</main><script type="application/json" id="data">__DATA__</script><script>
const data=JSON.parse(document.getElementById('data').textContent),$=id=>document.getElementById(id);
const labels={power:'Potenzia l’attacco',pierce:'Ignora protezioni',multishot:'Più bersagli',protect:'Protegge',dodge:'Evita un colpo',repair:'Ripara',regenerate:'Rigenera',counter:'Contrattacca',weaken:'Indebolisce',disarm:'Blocca un attacco',cleanse:'Rimuove disturbi',exchange:'Cambia carte',recover:'Recupera una carta',charge:'Prepara un attacco',terrain:'Cambia il terreno'};
const roles={attack:'Attacco',defense:'Difesa',support:'Supporto / Controllo',character:'Personaggio',terrain:'Terreno'},colors={attack:'#ff8278',defense:'#65d9ff',support:'#ffd089',character:'#efa4e8',terrain:'#70edb4'};
$('reduction').textContent='−'+data.stats.reductionPercent+'%';$('maximum').textContent=data.stats.maxWords;
$('source').href='https://github.com/marcoteghini1988-ai/test7/tree/'+data.commit;
for(const text of data.rules){const li=document.createElement('li');li.textContent=text;$('rules').append(li);}
for(const ship of [...new Set(data.cards.map(c=>c.ship).filter(Boolean))].sort()){const option=document.createElement('option');option.value=ship;option.textContent=ship;$('ship').append(option);}
const textElement=(tag,text,className)=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
function render(){
 const query=$('query').value.trim().toLocaleLowerCase('it'),pool=$('pool').value,role=$('role').value,ship=$('ship').value,grade=Number($('grade').value);
 const filtered=data.cards.filter(c=>(!pool||c.pool===pool)&&(!role||c.role===role)&&(!ship||c.ship===ship)&&(!query||[c.id,c.name,c.after,c.ship,c.before].join(' ').toLocaleLowerCase('it').includes(query)));
 $('count').textContent=filtered.length+' carte mostrate su 391';const fragment=document.createDocumentFragment();
 for(const c of filtered){
  const article=document.createElement('article');article.className='card';article.style.setProperty('--role',colors[c.role]);
  const meta=document.createElement('div');meta.className='meta';meta.append(textElement('span',roles[c.role]),textElement('span',c.rarity));article.append(meta,textElement('h2',c.name));
  article.append(textElement('div',c.id+(c.ship?' · '+c.ship:c.pool==='boss'?' · Premio vittoria Boss':' · Generale'),'ship'));
  article.append(textElement('p',c.pool==='exclusive'?c.grades[grade-1]:c.after,'effect'),textElement('span',labels[c.action],'tag'));
  const details=document.createElement('details');details.className='before';details.open=$('showBefore').checked;details.append(textElement('summary','Testo precedente'),textElement('p',c.before));article.append(details);fragment.append(article);
 }
 $('cards').replaceChildren(fragment);if(!filtered.length)$('cards').append(textElement('p','Nessuna carta corrisponde ai filtri.','empty'));
}
for(const id of ['query','pool','role','ship','grade','showBefore'])$(id).addEventListener(id==='query'?'input':'change',render);render();
</script></body></html>`;
const path=resolve(destination);mkdirSync(dirname(path),{recursive:true});
writeFileSync(path,html.replace('__DATA__',data));
console.log(JSON.stringify({file:path,...stats},null,2));
