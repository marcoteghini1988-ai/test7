import React from 'react';
import {bossCharacterDefinition} from './bossCharacterCards.js';
import {ASSET_ROOT} from './ShipPresentation.jsx';

// Shared boss-character image renderer. A missing PNG must never break a card,
// change its size, or replace a real card with a fabricated image.
export default function BossCharacterPortrait({type,className=''}) {
 const character=bossCharacterDefinition(type);
 if(!character)return null;
 return <span className={'boss-character-portrait '+className} aria-hidden="true">
  <span className="boss-character-portrait-fallback">✦</span>
  <img src={character.imagePath} alt=""
   draggable={false}
   onError={event=>{event.currentTarget.hidden=true;}}/>
 </span>;
}
