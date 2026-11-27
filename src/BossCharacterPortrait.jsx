import React from 'react';
import {bossCharacterDefinition} from './bossCharacterCards.js';
// Le carte Personaggio Boss non hanno ancora un'illustrazione approvata.
export default function BossCharacterPortrait({type,className=''}) {
 const character=bossCharacterDefinition(type);
 if(!character)return null;
 return <span className={'boss-character-portrait '+className} aria-hidden="true">
  <span className="boss-character-portrait-fallback">ILLUSTRAZIONE DA CREARE</span>
 </span>;
}
