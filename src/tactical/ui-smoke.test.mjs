import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import Core from './engine.js';
const require=createRequire(import.meta.url);
let ts;
try { ts=require('typescript'); } catch { ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'); }

function buildHarness(){
  const state=[];let cursor=0;
  const useState=(initial)=>{const index=cursor++;if(!(index in state))state[index]=typeof initial==='function'?initial():initial;return [state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];};
  const useRef=(init)=>{const idx=cursor++;if(!(idx in state))state[idx]={current:init};return state[idx];};
  const jsx=(type,props)=>typeof type==='function'?type(props):{type,props:props||{}};
  const mockReact={useState,useRef,useEffect:()=>{}};
  const source=fs.readFileSync(new URL('./TacticalStellarApp.jsx',import.meta.url),'utf8');
  const transformed=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  const context={module:mod,exports:mod.exports,require:(name)=>{
    if(name==='react')return {...mockReact,default:mockReact};
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx,Fragment:({children})=>children};
    if(name==='./engine.js')return Core;
    if(name==='../DeepSpaceUniverseCanvas.jsx')return ()=>jsx('canvas',{role:'presentation'});
    throw Error('Import unavailable: '+name);
  },localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:()=>0,clearTimeout:()=>{},Date,Math,structuredClone,document:{hidden:false},console};
  vm.runInNewContext(transformed,context,{filename:'TacticalStellarApp.cjs'});
  const App=mod.exports.default;
  const render=()=>{cursor=0;return App();};
  const all=(node,predicate,acc=[])=>{if(node==null||typeof node==='boolean')return acc;if(Array.isArray(node)){node.forEach(n=>all(n,predicate,acc));return acc;}if(typeof node!=='object')return acc;if(predicate(node))acc.push(node);if(node.props?.children!=null)all(node.props.children,predicate,acc);return acc;};
  const text=(n)=>{if(n==null||typeof n==='boolean')return '';if(typeof n==='string'||typeof n==='number')return String(n);if(Array.isArray(n))return n.map(text).join(' ');return text(n.props?.children);};
  const click=(tree,needle)=>{const b=all(tree,n=>n.type==='button'&&text(n).includes(needle)&&!n.props?.disabled)[0];assert.ok(b,`Button '${needle}' not found, or disabled`);b.props.onClick();};
  return {render,click,all,text,state};
}
test('React: flussi navigazione, battaglia, carte, bersagli e hangar',()=>{
 const ui=buildHarness();let tree=ui.render();assert.ok(ui.text(tree).includes('ECLISSI'));
 ui.click(tree,'MAPPA');tree=ui.render();assert.ok(ui.text(tree).includes('Mappa galattica'));
 ui.click(tree,'HANGAR');tree=ui.render();assert.ok(ui.text(tree).includes('Hangar'));
 const old=ui.state[0].credits;ui.click(tree,'POTENZIA');tree=ui.render();assert.ok(ui.state[0].credits<old);
 ui.click(tree,'BASE');tree=ui.render();ui.click(tree,'INIZIA MISSIONE');tree=ui.render();assert.ok(ui.text(tree).includes('PUNTI VULNERABILI'));
 assert.equal(ui.all(tree,n=>n.type==='button'&&String(n.props?.className||'').includes('es-number-card')).length,7);
 const cards=ui.all(tree,n=>n.type==='button'&&String(n.props?.className||'').includes('es-number-card'));
 cards[0].props.onClick();tree=ui.render();assert.equal(ui.state[1].selected.length,1);
 ui.all(tree,n=>n.type==='button'&&String(n.props?.className||'').includes('es-number-card'))[1].props.onClick();tree=ui.render();assert.equal(ui.state[1].selected.length,2);
 const b=ui.state[1],selected=b.selected.map(id=>b.hand.find(c=>c.id===id));
 b.targets[0]={...b.targets[0],op:'+',value:selected[0].value+selected[1].value,id:'test_core'};
 b.selectedTarget=0;tree=ui.render();assert.ok(ui.text(tree).includes('BERSAGLIO CENTRATO'));
 ui.click(tree,'COLPISCI');tree=ui.render();assert.equal(ui.state[1].phase,'enemy');
});
