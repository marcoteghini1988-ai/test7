import {cardTextSvgContents,hasCardTextLayer} from './cardTextPresentation.js';
import {getCardTextLocale,subscribeCardTextLocale} from './cardTextLocale.js';
// Per le copie DOM delle carte nelle animazioni di scadenza. Stessa grafica
// e stesso dizionario usati dal componente React, con rimozione del listener.
export function appendCardTextLayer(host,id,document=globalThis.document){
 if(!hasCardTextLayer(id))return ()=>{};
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 3072 4608');svg.setAttribute('preserveAspectRatio','none');
 svg.setAttribute('aria-hidden','true');svg.setAttribute('class','weapon-salvo-marks card-text-layer');
 svg.dataset.cardTextId=id;
 const words=document.createElementNS(ns,'g');words.dataset.cardTranslatableText='true';
 const update=()=>{svg.dataset.cardTextLocale=getCardTextLocale();words.innerHTML=cardTextSvgContents(id,getCardTextLocale(),id+'-state');};
 svg.append(words);host.append(svg);update();
 const unsubscribe=subscribeCardTextLocale(update);return ()=>{unsubscribe();svg.remove();};
}
