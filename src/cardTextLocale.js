// La lingua cambia soltanto la presentazione; nessun dato di combattimento.
export const CARD_TEXT_LOCALES=Object.freeze(['en','it']);
export const CARD_TEXT_DEFAULT_LOCALE='en';
const listeners=new Set();let locale=CARD_TEXT_DEFAULT_LOCALE;
export const normalizeCardTextLocale=value=>CARD_TEXT_LOCALES.includes(value)?value:CARD_TEXT_DEFAULT_LOCALE;
export const getCardTextLocale=()=>locale;
export const subscribeCardTextLocale=listener=>{listeners.add(listener);return ()=>listeners.delete(listener);};
export function setCardTextLocale(value){
 const next=normalizeCardTextLocale(value);if(next===locale)return locale;
 locale=next;for(const listener of listeners)listener();return locale;
}
