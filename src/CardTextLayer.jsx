import React,{useId,useSyncExternalStore} from 'react';
import {getCardTextLocale,subscribeCardTextLocale} from './cardTextLocale.js';
import {cardTextSvgContents} from './cardTextPresentation.js';
import './CardTextLayer.css';
export const useCardTextLocale=()=>useSyncExternalStore(subscribeCardTextLocale,getCardTextLocale,()=> 'en');
export default function CardTextLayer({cardId,className='',style}){
 const locale=useCardTextLocale(),unique=useId();
 return <svg className={'weapon-salvo-marks card-text-layer '+className} style={style}
  viewBox="0 0 3072 4608" preserveAspectRatio="none" aria-hidden="true" focusable="false"
  data-card-text-id={cardId} data-card-text-locale={locale}>
  <g data-card-translatable-text="true" dangerouslySetInnerHTML={{__html:cardTextSvgContents(cardId,locale,unique)}}/>
 </svg>;
}
