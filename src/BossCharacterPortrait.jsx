import React from 'react';
import {bossCharacterDefinition} from './bossCharacterCards.js';
// Le carte Personaggio Boss complete non sono ancora state composte e approvate.
export default function BossCharacterPortrait({type,className=''}) {
 const character=bossCharacterDefinition(type);
 if(!character)return null;
 return <span className={'boss-character-portrait '+className} aria-hidden="true">
  <span className="boss-character-portrait-fallback">CARTA IN PREPARAZIONE</span>
 </span>;
}
